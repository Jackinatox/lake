import { prisma } from "@/prisma";
import { CheckoutParams } from "./checkout";
import { env } from "next-runtime-env";
import { calculateNew } from "@/lib/GlobalFunctions/paymentLogic";
import { User } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export default async function upgradeToPayed(params: CheckoutParams, user: User): Promise<string> {
    if (params.type !== 'TO_PAYED') {
        throw new Error('Invalid checkout type for upgradeToPayed');
    }

    const { ptServerId, hardwareConfig } = params;
    const { ramMb, cpuPercent, diskMb, durationsDays } = hardwareConfig;

    // if (!creationServerConfig) throw new Error('No Serverconfigration given');
    const location = await prisma.location.findFirstOrThrow({
        where: { id: hardwareConfig.pfGroupId },
        include: { cpu: true, ram: true },
    });

    const price = calculateNew(location, cpuPercent, ramMb, durationsDays);

    // 1. Create the ServerOrder
    const order = await prisma.gameServerOrder.create({
        data: {
            type: params.type,
            gameServerId: ptServerId,
            userId: user.id,
            ramMB: ramMb,
            cpuPercent,
            diskMB: diskMb,
            price: price.totalCents,
            expiresAt: new Date(Date.now() + durationsDays * 24 * 60 * 60 * 1000),
            status: 'PENDING',
            creationGameDataId: null,
            creationLocationId: hardwareConfig.pfGroupId,
            gameConfig: {},
        },
    });

    // 2. Create Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
        locale: 'auto',
        mode: 'payment',
        ui_mode: 'embedded',
        invoice_creation: {
            enabled: true,
        },
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: { name: `${params.type} Game Server` }, // TODO: translation maybe
                    unit_amount: Math.round(price.totalCents),
                },
                quantity: 1,
            },
        ],
        metadata: {
            orderId: String(order.id),
        },
        customer: user.stripeUserId!,
        return_url: `${env('NEXT_PUBLIC_APP_URL')}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,

        // success_url: `${env('NEXT_PUBLIC_APP_URL')}/success`,
        // cancel_url: `${env('NEXT_PUBLIC_APP_URL')}/cancel`
    });

    if (!stripeSession.id || !stripeSession.client_secret) {
        logger.error('Failed to create Stripe session', "FREE_SERVER_EXTEND", { details: { orderId: order.id } });
        throw new Error('Failed to create Stripe session');
    }

    // 3. Save Stripe Session ID
    await prisma.gameServerOrder.update({
        where: { id: order.id },
        data: { stripeSessionId: stripeSession.id },
    });

    return stripeSession.client_secret;
}