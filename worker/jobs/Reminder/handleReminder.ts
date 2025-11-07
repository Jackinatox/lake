import { EmailType } from "../../generated/client";
import { render } from "@react-email/render";
import { prisma } from "../../prisma";
import { DELETE_GAMESERVER_AFTER_DAYS } from "../../WorkerConstants";
import ExpiredServerTemplate from "../../email/templates/ExpiersInXDays";


export const handleServer = async (serverId: string, days: 1 | 7, jobRun: string, expiresAt: Date) => {
    const server = await prisma.gameServer.findUnique({
        where: { id: serverId },
        include: { user: true }
    });

    if (!server) throw new Error("Couold not find Server to generate Email for");

    const deleteDate = new Date(server.expires);
    deleteDate.setDate(deleteDate.getDate() + DELETE_GAMESERVER_AFTER_DAYS);

    let emailType: EmailType;
    if (days === 1) {
        emailType = EmailType.DELETE_GAME_SERVER_1DAY;
    } else if (days === 7) {
        emailType = EmailType.DELETE_GAME_SERVER_7DAYS;
    } else {
        throw new Error(`Invalid days value: ${days}. Expected 1 or 7.`);
    }
    
    const html = await render(ExpiredServerTemplate({
        username: server.user.name,
        serverName: server.name,
        expirationDate: server.expires,
        deleteDate: deleteDate,
        expirationDays: days
    }));
    await createEmailJob(emailType, server.user.email, "Dein Server läuft bald ab", html, server.id, expiresAt);
}


async function createEmailJob(type: EmailType, recipient: string, subject: string, html: string, GameServerId: string, expiresAt: Date) {
    await prisma.email.create({
        data: {
            recipient,
            subject,
            html,
            type,
            GameServerId,
            expiresAt,
        }
    });
}