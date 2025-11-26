import { auth } from '@/auth';
import prisma from '@/lib/prisma';

import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { sendTicketCreatedEmail } from '@/lib/email/sendEmailEmailsFromLake';
import { logger } from '@/lib/logger';
import { TicketCategory } from '@/app/client/generated/enums';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_SUBJECT_LENGTH = 120;

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(), // you need to pass the headers object.
        });

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const rawDescription = typeof data.description === 'string' ? data.description.trim() : '';
        const rawSubject = typeof data.subject === 'string' ? data.subject.trim() : '';
        const rawCategory =
            typeof data.category === 'string' ? data.category.toUpperCase() : undefined;

        if (!rawDescription) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (rawDescription.length > MAX_MESSAGE_LENGTH) {
            return NextResponse.json({ error: 'Message too long' }, { status: 400 });
        }

        if (rawSubject.length > MAX_SUBJECT_LENGTH) {
            return NextResponse.json({ error: 'Subject too long' }, { status: 400 });
        }

        const availableCategories = new Set(Object.values(TicketCategory));
        const category =
            rawCategory && availableCategories.has(rawCategory as TicketCategory)
                ? (rawCategory as TicketCategory)
                : TicketCategory.GENERAL;

        const ticket = await prisma.supportTicket.create({
            data: {
                userId: session.user.id,
                title: rawSubject || null,
                message: rawDescription,
                category,
                status: 'OPEN',
            },
        });

        sendTicketCreatedEmail(session.user.email, ticket).catch((error) => {
            logger
                .email('Failed to send support ticket created email', 'ERROR', {
                    userId: session.user.id,
                    details: {
                        ticketId: ticket.ticketId,
                        error: error instanceof Error ? error.message : String(error),
                    },
                })
                .catch((logError) => {
                    console.error('Failed to record email send failure', logError);
                });
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
