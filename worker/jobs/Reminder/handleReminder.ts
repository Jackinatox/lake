import { EmailType } from "../../generated/client";
import { render } from "@react-email/render";
import { prisma } from "../../prisma";
import { DELETE_GAMESERVER_AFTER_DAYS } from "../../WorkerConstants";
import ExpiredServerTemplate from "../../email/templates/ExpiersInXDays";


export const handleServer = async (serverId: string, days: 1 | 7, jobRun: string) => {
    const server = await prisma.gameServer.findUnique({
        where: { id: serverId },
        include: { user: true }
    });

    if (!server) throw new Error("Couold not find Server to generate Email for");

    const deleteDate = new Date(server.expires);
    deleteDate.setDate(deleteDate.getDate() + DELETE_GAMESERVER_AFTER_DAYS);

    const html = await render(ExpiredServerTemplate({
        username: server.user.name,
        serverName: server.name,
        expirationDate: server.expires,
        deleteDate: deleteDate,
        expirationDays: days
    }));
    await createEmailJob(EmailType.DELETE_GAME_SERVER_1DAY, server.user.email, "Dein Server läuft bald ab", html, server.id);
}


async function createEmailJob(type: EmailType, recipient: string, subject: string, html: string, GameServerId: string) {
    await prisma.email.create({
        data: {
            recipient,
            subject,
            html,
            type,
            GameServerId
        }
    });
}