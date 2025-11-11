import { logger } from "@/lib/logger";
import { provisionServer } from "@/lib/Pterodactyl/createServers/provisionServer";
import upgradeGameServer from "@/lib/Pterodactyl/upgradeServer/upgradeServer";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";
import { Stripe } from "stripe";

export default async function handleCheckoutSessionCompleted(checkoutSession: Stripe.Checkout.Session) {
    try {
        const serverOrderId = parseInt(checkoutSession.metadata?.orderId || '0');

        const session = await stripe.checkout.sessions.retrieve(
            checkoutSession.id,
            {
                expand: ['payment_intent.latest_charge'],
            }
        );

        let receiptUrl: string | null = null;

        if (typeof session.payment_intent !== 'string' &&
            session.payment_intent?.latest_charge &&
            typeof session.payment_intent.latest_charge !== 'string') {

            receiptUrl = session.payment_intent.latest_charge.receipt_url;
            console.log('Receipt URL:', receiptUrl);
        }

        await prisma.gameServerOrder.update({
            where: {
                id: serverOrderId,
            },
            data: {
                stripeSessionId: checkoutSession.id,
                status: 'PAID',
                receipt_url: receiptUrl
            }
        })

        const serverOrder = await prisma.gameServerOrder.findUniqueOrThrow({ where: { id: serverOrderId } });
        switch (serverOrder.type) {
            case "NEW":
                await provisionServer(serverOrder);
                break;
            case "UPGRADE":
                await upgradeGameServer(serverOrder);
                break;
            default:
                console.error(`Unhandled server order type: ${serverOrder.type}`);
        }
    } catch (error) {
        logger.fatal("Error handling checkout.session.completed", "PAYMENT_LOG", { details: { error, checkoutSessionId: checkoutSession.id } });
    }
}