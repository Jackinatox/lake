import nodemailer from 'nodemailer';
import { logger } from '../logger';
import { prisma } from '@/prisma';
import { EmailType } from '@prisma/client';

const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
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

    try {
        const res = await mailer.sendMail({
            from: `"Scyed" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
    } catch (error) {
        await prisma.email
            .update({
                where: { id: email.id },
                data: { status: 'FAILED' },
            })
            .catch(() => {
                /* ignore */
            });
        console.error(`Error sending: ${subject}`, error);
        await logger.error(`Failed to send: ${subject}`, 'EMAIL', {
            details: { error: (error as Error)?.message, to },
        });
    }
}
