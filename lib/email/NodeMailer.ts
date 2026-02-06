import { EmailType } from '@/app/client/generated/enums';
import prisma from '@/lib/prisma';
import { env } from 'next-runtime-env';
import nodemailer from 'nodemailer';
import { logger } from '../logger';

const noReplyMailer = nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port: 465,
    secure: true,
    auth: {
        user: env('SMTP_USER'),
        pass: env('SMTP_PASS'),
    },
});

const supportMailer = nodemailer.createTransport({
    host: env('SUPPORT_SMTP_HOST'),
    port: Number(env('SUPPORT_SMTP_PORT')),
    secure: true,
    auth: {
        user: env('SUPPORT_SMTP_USER'),
        pass: env('SUPPORT_SMTP_PASS'),
    },
});

export async function sendMail(to: string, subject: string, html: string, type: EmailType) {
    const email = await prisma.email.create({
        data: {
            recipient: to,
            subject: subject,
            html: html,
            type: type,
            status: 'SENT',
        },
    });

    // TODO: Setup all credentials tto properly send mails from support and no-reply and use the correct one based on the type
    // const mailer = type === 'SUPPORT_TICKET_CREATED' ? supportMailer : noReplyMailer;
    const mailer = noReplyMailer;

    try {
        const res = await mailer.sendMail({
            from: `"Scyed" <${env('SMTP_USER')}>`,
            to,
            subject: subject,
            html: html,
        });

        // save everything for now - Debugging purposes
        await prisma.email
            .update({
                where: { id: email.id },
                data: { nodeMailerResponse: res as any },
            })
            .catch(() => {});
    } catch (error) {
        await prisma.email
            .update({
                where: { id: email.id },
                data: { status: 'FAILED' },
            })
            .catch(() => {});

        await logger.error(`Failed to send: ${subject}`, 'EMAIL', {
            details: { error: (error as Error)?.message, to },
        });
    }
}
