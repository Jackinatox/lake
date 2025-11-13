import { prisma } from "../prisma";
import {
    sendInvoiceEmail,
    sendServerBookingConfirmationEmail,
} from "../lib/email/sendEmailEmailsFromLake";

async function main() {
    const serverId = process.argv[2];

    if (!serverId) {
        console.error("Usage: bun run scripts/send-server-emails.ts <gameServerId>");
        process.exit(1);
    }

    const server = await prisma.gameServer.findUnique({
        where: { id: serverId },
        include: {
            user: true,
            gameData: true,
            location: true,
        },
    });

    if (!server) {
        console.error(`No game server found for id: ${serverId}`);
        process.exit(1);
    }

    const latestPaidOrder = await prisma.gameServerOrder.findFirst({
        where: {
            gameServerId: serverId,
            status: "PAID",
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            user: true,
            creationGameData: true,
            creationLocation: true,
        },
    });

    if (!latestPaidOrder) {
        console.error(`No paid order found for game server ${serverId}. Cannot build invoice data.`);
        process.exit(1);
    }

    const user = latestPaidOrder.user ?? server.user;
    const userName = user?.name || "Spieler";
    const userEmail = user?.email;

    if (!userEmail) {
        console.error(`User email missing for game server ${serverId}`);
        process.exit(1);
    }

    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.LAKE_URL ||
        "http://localhost:3000";

    const gameName =
        latestPaidOrder.creationGameData?.name ||
        server.gameData?.name ||
        "Gameserver";

    const gameImageUrl = `${appUrl}/images/light/games/icons/${gameName.toLowerCase()}.webp`;

    const serverName = server.name;
    const serverUrl = `${appUrl}/gameserver/${server.ptServerId || server.id}`;

    const ramMB = latestPaidOrder.ramMB ?? server.ramMB;
    const cpuPercent = latestPaidOrder.cpuPercent ?? server.cpuPercent;
    const diskMB = latestPaidOrder.diskMB ?? server.diskMB;
    const location =
        latestPaidOrder.creationLocation?.name ||
        server.location?.name ||
        "Unknown";

    const orderType =
        latestPaidOrder.type === "DOWNGRADE"
            ? "RENEW"
            : (latestPaidOrder.type as "NEW" | "UPGRADE" | "RENEW");

    const price = latestPaidOrder.price;
    const expiresAt = latestPaidOrder.expiresAt ?? server.expires;
    const receiptUrl = latestPaidOrder.receipt_url ?? undefined;
    const invoiceNumber = `INV-${latestPaidOrder.id.toString().padStart(8, "0")}`;

    console.log(
        `Sending booking confirmation and invoice emails for server ${serverId} to ${userEmail}`,
    );

    await sendServerBookingConfirmationEmail({
        userName,
        userEmail,
        gameName,
        gameImageUrl,
        serverName,
        ramMB,
        cpuPercent,
        diskMB,
        location,
        price,
        expiresAt,
        serverUrl,
    });

    await sendInvoiceEmail({
        userName,
        userEmail,
        invoiceNumber,
        invoiceDate: new Date(),
        gameName,
        gameImageUrl,
        serverName,
        orderType,
        ramMB,
        cpuPercent,
        diskMB,
        location,
        price,
        expiresAt,
        receiptUrl,
    });

    console.log("Emails sent successfully.");
}

if (import.meta.main) {
    main()
        .catch((error) => {
            console.error("Failed to send emails:", error);
            process.exitCode = 1;
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

