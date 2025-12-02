import { render } from '@react-email/render';
import ExpiredServerTemplate from '../../email/templates/ExpiersInXDays';
import { prisma } from '../../prisma';
import { DELETE_GAMESERVER_AFTER_DAYS } from '../../WorkerConstants';
import { EmailType } from '../../client/generated/enums';

export const handleServer = async (
    serverId: string,
    days: 1 | 7,
    jobRun: string,
    expiresAt: Date,
) => {
    const server = await prisma.gameServer.findUnique({
        where: { id: serverId, ptServerId: { not: null } },
        include: { user: true },
    });

    if (!server) throw new Error('Couold not find Server to generate Email for');

    const deleteDate = new Date(server.expires);
    deleteDate.setDate(deleteDate.getDate() + DELETE_GAMESERVER_AFTER_DAYS);

    let emailType: EmailType;
    if (days === 1) {
        emailType = EmailType.GAME_SERVER_EXPIRING_1_DAY;
    } else if (days === 7) {
        emailType = EmailType.GAME_SERVER_EXPIRING_7_DAYS;
    } else {
        throw new Error(`Invalid days value: ${days}. Expected 1 or 7.`);
    }

    const html = await render(
        ExpiredServerTemplate({
            username: server.user.name,
            serverName: server.name,
            expirationDate: server.expires,
            deleteDate: deleteDate,
            expirationDays: days,
            serverId: server.ptServerId!,
            isFreeServer: server.freeServer,
        }),
    );
    await createEmailJob(
        emailType,
        server.user.email,
        'Dein Server läuft bald ab',
        html,
        server.id,
        expiresAt,
    );
};

async function createEmailJob(
    type: EmailType,
    recipient: string,
    subject: string,
    html: string,
    GameServerId: string,
    expiresAt: Date,
) {
    await prisma.email.create({
        data: {
            recipient,
            subject,
            html,
            type,
            GameServerId,
            expiresAt,
        },
    });
}
