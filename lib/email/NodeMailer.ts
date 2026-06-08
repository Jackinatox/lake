import { EmailType } from '@/app/client/generated/enums';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { logger } from '../logger';

const noReplyMailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const supportMailer = nodemailer.createTransport({
    host: process.env.SUPPORT_SMTP_HOST,
    port: Number(process.env.SUPPORT_SMTP_PORT),
    secure: true,
    auth: {
        user: process.env.SUPPORT_SMTP_USER,
        pass: process.env.SUPPORT_SMTP_PASS,
    },
});

export interface EmailAttachment {
    filename: string;
    data: Buffer;
    contentType: string;
}

export async function sendMail(
    to: string,
    subject: string,
    html: string,
    type: EmailType,
    attachments?: EmailAttachment[],
) {
    const email = await prisma.email.create({
        data: {
            recipient: to,
            subject: subject,
            html: html,
            type: type,
            status: 'SENT',
            attachments: attachments
                ? {
                      create: attachments.map((a) => ({
                          filename: a.filename,
                          contentType: a.contentType,
                          data: a.data as Buffer<ArrayBuffer>,
                      })),
                  }
                : undefined,
        },
    });

    // TODO: Setup all credentials tto properly send mails from support and no-reply and use the correct one based on the type
    // const mailer = type === 'SUPPORT_TICKET_CREATED' ? supportMailer : noReplyMailer;
    const mailer = noReplyMailer;

    try {
        const res = await mailer.sendMail({
            from: `"Scyed" <${process.env.SMTP_USER}>`,
            to,
            subject: subject,
            html: html,
            attachments: attachments?.map((a) => ({
                filename: a.filename,
                content: a.data,
                contentType: a.contentType,
            })),
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
