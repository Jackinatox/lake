import { logger } from "@/lib/logger";
import { provisionServer } from "@/lib/Pterodactyl/createServers/provisionServer";
import upgradeGameServer from "@/lib/Pterodactyl/upgradeServer/upgradeServer";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";
import { Stripe } from "stripe";
import { sendInvoiceEmail, sendServerBookingConfirmationEmail } from "@/lib/email/sendEmailEmailsFromLake";

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

        // Fetch updated order with all relations after provisioning
        const updatedOrder = await prisma.gameServerOrder.findUniqueOrThrow({
            where: { id: serverOrderId },
            include: {
                user: true,
                creationGameData: true,
                creationLocation: true,
                gameServer: true,
            }
        });

        // Send emails only if we have a gameServer (successful provisioning)
        if (updatedOrder.gameServer && updatedOrder.creationGameData && updatedOrder.creationLocation) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.LAKE_URL || "http://localhost:3000";
            const gameName = updatedOrder.creationGameData.name;
            const gameImageUrl = `${appUrl}/images/light/games/icons/${gameName.toLowerCase()}.webp`;
            const serverUrl = `${appUrl}/gameserver/${updatedOrder.gameServer.ptServerId}`;

            try {
                // Send booking confirmation email
                await sendServerBookingConfirmationEmail({
                    userName: updatedOrder.user.name || "Spieler",
                    userEmail: updatedOrder.user.email,
                    gameName: gameName,
                    gameImageUrl: gameImageUrl,
                    serverName: updatedOrder.gameServer.name,
                    ramMB: updatedOrder.ramMB,
                    cpuPercent: updatedOrder.cpuPercent,
                    diskMB: updatedOrder.diskMB,
                    location: updatedOrder.creationLocation.name || "Unknown",
                    price: updatedOrder.price,
                    expiresAt: updatedOrder.expiresAt,
                    serverUrl: serverUrl,
                });

                // Send invoice email
                await sendInvoiceEmail({
                    userName: updatedOrder.user.name || "Spieler",
                    userEmail: updatedOrder.user.email,
                    invoiceNumber: `INV-${updatedOrder.id.toString().padStart(8, '0')}`,
                    invoiceDate: new Date(),
                    gameName: gameName,
                    gameImageUrl: gameImageUrl,
                    serverName: updatedOrder.gameServer.name,
                    orderType: updatedOrder.type as "NEW" | "UPGRADE" | "RENEW",
                    ramMB: updatedOrder.ramMB,
                    cpuPercent: updatedOrder.cpuPercent,
                    diskMB: updatedOrder.diskMB,
                    location: updatedOrder.creationLocation.name || "Unknown",
                    price: updatedOrder.price,
                    expiresAt: updatedOrder.expiresAt,
                    receiptUrl: receiptUrl || undefined,
                });

                logger.info("Sent booking confirmation and invoice emails", "EMAIL", {
                    details: {
                        serverOrderId: updatedOrder.id,
                        userEmail: updatedOrder.user.email,
                        gameName: gameName,
                    }
                });
            } catch (emailError) {
                logger.error("Failed to send booking/invoice emails", "EMAIL", {
                    details: {
                        error: emailError,
                        serverOrderId: updatedOrder.id,
                        userEmail: updatedOrder.user.email,
                    }
                });
            }
        }
    } catch (error) {
        logger.fatal("Error handling checkout.session.completed", "PAYMENT_LOG", { details: { error, checkoutSessionId: checkoutSession.id } });
    }
}