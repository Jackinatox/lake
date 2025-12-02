import { render } from '@react-email/render';
import DeleteServerTemplate from '../../email/templates/DeleteInXDays';
import { prisma } from '../../prisma';
import { EmailType } from '../../client/generated/enums';



export const handleServer = async (
    serverId: string,
    days: 1 | 7,
    jobRun: string,
    deletionDate: Date,
) => {
    const server = await prisma.gameServer.findUnique({
        where: { id: serverId, ptServerId: { not: null } },
        include: { user: true },
    });

    if (!server) throw new Error('Could not find Server to generate Email for');

    let emailType: EmailType;
    if (days === 1) {
        emailType = EmailType.GAME_SERVER_DELETION_1_DAY;
    } else if (days === 7) {
        emailType = EmailType.GAME_SERVER_DELETION_7_DAYS;
    } else {
        throw new Error(`Invalid days value: ${days}. Expected 1 or 7.`);
    }

    const html = await render(
        DeleteServerTemplate({
            username: server.user.name,
            serverName: server.name,
            expirationDate: server.expires,
            deletionDate: deletionDate,
            deletionDays: days,
            serverId: server.ptServerId!,
        }),
    );
    await createEmailJob(
        emailType,
        server.user.email,
        'Dein Server wird bald gelöscht',
        html,
        server.id,
        deletionDate,
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
