import { auth } from '@/auth';
import prisma from '@/lib/prisma';

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sendTicketCreatedEmail } from '@/lib/email/sendEmailEmailsFromLake';
import { logger } from '@/lib/logger';
import { TicketCategory } from '@/app/client/generated/enums';
import { sendSupportTicketNotification } from '@/lib/Notifications/telegram';
import { env } from 'next-runtime-env';
import { supportTicketSchema } from '@/lib/validation/order';
import { getValidationMessage } from '@/lib/validation/common';

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(), // you need to pass the headers object.
        });

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const parsed = supportTicketSchema.safeParse({
            description: data?.description,
            subject: data?.subject,
            category:
                typeof data?.category === 'string' ? data.category.toUpperCase() : data?.category,
        });

        if (!parsed.success) {
            return NextResponse.json(
                { error: getValidationMessage(parsed.error) },
                { status: 400 },
            );
        }

        const { description, subject, category = TicketCategory.GENERAL } = parsed.data;

        const ticket = await prisma.supportTicket.create({
            data: {
                userId: session.user.id,
                title: subject ?? null,
                message: description,
                category,
                status: 'OPEN',
            },
        });

        sendTicketCreatedEmail(session.user.email, ticket).catch((error) => {
            logger.error('Failed to send support ticket created email', 'EMAIL', {
                userId: session.user.id,
                details: {
                    ticketId: ticket.ticketId,
                    error: error instanceof Error ? error.message : String(error),
                },
            });
        });

        sendSupportTicketNotification({
            category: ticket.category,
            userEmail: session.user.email,
            subject: ticket.title,
            message: ticket.message,
            ticketUrl: `${env('NEXT_PUBLIC_APP_URL')}/admin/tickets/${ticket.id}`,
        });

        return NextResponse.json({ ticket: ticket }, { status: 201 });
    } catch (error) {
        logger
            .logError(error as Error, 'SUPPORT_TICKET', {
                method: 'POST',
                path: '/api/tickets',
            })
            .catch(() => {
                /* swallow logging errors */
            });
        return NextResponse.json({ error: JSON.stringify(error) }, { status: 400 });
    }
}
