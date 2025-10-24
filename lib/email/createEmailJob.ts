import { prisma } from "@/prisma";
import { EmailType } from "@prisma/client";
import { render } from "@react-email/render";
import ExpiredServerTemplate from "./templates/ExpiredServerTemplate";
import { DELETE_GAMESERVER_AFTER_DAYS } from "@/app/GlobalConstants";

export default async function createEmailExpiredServer(serverId: string) {
    const server = await prisma.gameServer.findUnique({
        where: { id: serverId },
        include: { user: true }
    });
    const deleteDate = new Date(server.expires);
    deleteDate.setDate(deleteDate.getDate() + DELETE_GAMESERVER_AFTER_DAYS);

    const html = await render(ExpiredServerTemplate({
        username: server.user.name,
        serverName: server.name,
        expirationDate: server.expires,
        deleteDate: deleteDate
    }));
    await createEmailJob(EmailType.EXPIRED_GAME_SERVER, server.user.email, "Dein Server ist abgelaufen", html);
}

async function createEmailJob(type: EmailType, recipient: string, subject: string, html: string) {

    await prisma.email.create({
        data: {
            recipient,
            subject,
            html,
            type,
        }
    });
}