import { WorkerJobType, type Email } from '../../generated/client';
import { logError, logInfo } from '../../lib/logger';
import { prisma } from '../../prisma';
import nodemailer from 'nodemailer';

const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export default async function SendEmail(email: Email, jobRun: string) {
    try {
        const response = await mailer.sendMail({
            from: `"Scyed" <${process.env.SMTP_USER}>`,
            to: email.recipient,
            subject: email.subject,
            html: email.html,
        });

        await logInfo(
            WorkerJobType.SEND_EMAILS,
            `Email sent successfully`,
            {
                emailId: email.id,
                type: email.type,
                recipient: email.recipient,
                response,
            },
            { gameServerId: undefined, userId: undefined, jobRun },
        );
        console.log(`Email sent to ${email.recipient}:`, response);
    } catch (error) {
        await logError(
            WorkerJobType.SEND_EMAILS,
            `Failed to send email`,
            {
                emailId: email.id,
                type: email.type,
                recipient: email.recipient,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                retryCount: email.retries,
            },
            { gameServerId: undefined, userId: undefined, jobRun },
        );

        console.error(`Failed to send email to ${email.recipient}:`, error);

        await prisma.email.update({
            where: { id: email.id },
            data: { status: 'FAILED', retries: email.retries + 1, errorText: String(error) },
        });

        return;
    }

    await prisma.email.update({
        where: { id: email.id },
        data: { status: 'SENT', sentAt: new Date() },
    });
}
