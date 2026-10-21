'use server';

import { auth } from '@/auth';
import { getUserDisplayName } from '@/lib/auth/getUserDisplayName';
import { sendTicketOpenedEmail } from '@/lib/email/sendEmailEmailsFromLake';
import { logger } from '@/lib/logger';
import {
    sendSupportTicketNotification,
    sendTicketReplyNotification,
} from '@/lib/Notifications/telegram';
import prisma from '@/lib/prisma';
import {
    MAX_MESSAGES_PER_USER_PER_HOUR,
    MAX_OPEN_TICKETS_PER_USER,
    MAX_TICKETS_PER_USER_PER_DAY,
} from '@/lib/tickets/constants';
import type { TicketActionError, TicketActionResult } from '@/lib/tickets/types';
import { adminTicketUrl, customerTicketUrl } from '@/lib/tickets/urls';
import { getValidationMessage } from '@/lib/validation/common';
import {
    createTicketSchema,
    ticketIdInputSchema,
    ticketReplySchema,
    type CreateTicketInput,
} from '@/lib/validation/tickets';
import { headers } from 'next/headers';

function fail(error: TicketActionError, message?: string) {
    return { success: false as const, error, message };
}

async function getSession() {
    return auth.api.getSession({ headers: await headers() });
}

/** Telegram rejects messages over 4096 characters; ticket messages may be up to 5000. */
function truncateForTelegram(message: string) {
    return message.length > 1500 ? `${message.slice(0, 1500)}…` : message;
}

async function messagesSentInLastHour(userId: string) {
    return prisma.ticketMessage.count({
        where: { authorId: userId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
}

export async function createTicketAction(
    input: CreateTicketInput,
): Promise<TicketActionResult<{ ticketId: string }>> {
    const session = await getSession();
    if (!session?.user) return fail('unauthorized');

    const parsed = createTicketSchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { category, subject, message, gameServerId } = parsed.data;
    const userId = session.user.id;

    try {
        const [openCount, todayCount, recentMessages, server] = await Promise.all([
            prisma.ticket.count({ where: { userId, status: { not: 'CLOSED' } } }),
            prisma.ticket.count({
                where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
            }),
            messagesSentInLastHour(userId),
            gameServerId
                ? prisma.gameServer.findFirst({
                      where: { id: gameServerId, userId },
                      select: { id: true },
                  })
                : null,
        ]);
        if (openCount >= MAX_OPEN_TICKETS_PER_USER) return fail('openLimit');
        if (todayCount >= MAX_TICKETS_PER_USER_PER_DAY) return fail('dailyLimit');
        if (recentMessages >= MAX_MESSAGES_PER_USER_PER_HOUR) return fail('messageLimit');
        if (gameServerId && !server) return fail('serverNotFound');

        const now = new Date();
        const ticket = await prisma.ticket.create({
            data: {
                userId,
                subject,
                category,
                gameServerId: server?.id ?? null,
                status: 'OPEN',
                statusChangedAt: now,
                lastMessageAt: now,
                lastCustomerMessageAt: now,
                messages: {
                    create: {
                        authorId: userId,
                        authorRole: 'CUSTOMER',
                        body: message,
                        createdAt: now,
                    },
                },
                events: { create: { actorId: userId, type: 'CREATED', createdAt: now } },
            },
            select: { id: true, number: true, gameServerId: true },
        });

        sendTicketOpenedEmail({
            to: session.user.email,
            userName: getUserDisplayName(session.user),
            ticketNumber: ticket.number,
            subject,
            category,
            message,
            createdAt: now,
            ticketUrl: customerTicketUrl(ticket.id),
            gameServerId: ticket.gameServerId,
        }).catch((error) => {
            logger.logError(error, 'EMAIL', {
                userId,
                details: { context: 'ticket opened email', ticketNumber: ticket.number },
            });
        });

        sendSupportTicketNotification({
            category,
            userEmail: session.user.email,
            subject: `#${ticket.number} ${subject}`,
            message: truncateForTelegram(message),
            ticketUrl: adminTicketUrl(ticket.number),
        });

        return { success: true, ticketId: ticket.id };
    } catch (error) {
        await logger.logError(error, 'SUPPORT_TICKET', {
            userId,
            details: { action: 'createTicketAction' },
        });
        return fail('unknown');
    }
}

export async function replyToTicketAction(input: {
    ticketId: string;
    message: string;
}): Promise<TicketActionResult> {
    const session = await getSession();
    if (!session?.user) return fail('unauthorized');

    const parsed = ticketReplySchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { ticketId, message } = parsed.data;
    const userId = session.user.id;

    try {
        if ((await messagesSentInLastHour(userId)) >= MAX_MESSAGES_PER_USER_PER_HOUR) {
            return fail('messageLimit');
        }

        const result = await prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.findFirst({
                where: { id: ticketId, userId },
                select: { id: true, number: true, subject: true, status: true },
            });
            if (!ticket) return fail('notFound');
            if (ticket.status === 'CLOSED') return fail('closed');

            const now = new Date();
            const statusChanged = ticket.status !== 'OPEN';
            await tx.ticketMessage.create({
                data: {
                    ticketId,
                    authorId: userId,
                    authorRole: 'CUSTOMER',
                    body: message,
                    createdAt: now,
                },
            });
            // Any customer message puts the ticket back into the reply queue — including a
            // RESOLVED one, which this reopens.
            await tx.ticket.update({
                where: { id: ticketId },
                data: {
                    lastMessageAt: now,
                    lastCustomerMessageAt: now,
                    ...(statusChanged
                        ? {
                              status: 'OPEN',
                              statusChangedAt: now,
                              events: {
                                  create: {
                                      actorId: userId,
                                      type: 'STATUS_CHANGED',
                                      fromValue: ticket.status,
                                      toValue: 'OPEN',
                                      createdAt: now,
                                  },
                              },
                          }
                        : {}),
                },
            });
            return { success: true as const, ticket };
        });

        if (!result.success) return result;

        sendTicketReplyNotification({
            ticketNumber: result.ticket.number,
            subject: result.ticket.subject,
            userEmail: session.user.email,
            message: truncateForTelegram(message),
            reopened: result.ticket.status === 'RESOLVED',
            ticketUrl: adminTicketUrl(result.ticket.number),
        });

        return { success: true };
    } catch (error) {
        await logger.logError(error, 'SUPPORT_TICKET', {
            userId,
            details: { action: 'replyToTicketAction', ticketId },
        });
        return fail('unknown');
    }
}

/** The customer marks their own ticket as solved. Closing is final for them. */
export async function closeTicketAction(input: { ticketId: string }): Promise<TicketActionResult> {
    const session = await getSession();
    if (!session?.user) return fail('unauthorized');

    const parsed = ticketIdInputSchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { ticketId } = parsed.data;
    const userId = session.user.id;

    try {
        const ticket = await prisma.ticket.findFirst({
            where: { id: ticketId, userId },
            select: { status: true },
        });
        if (!ticket) return fail('notFound');
        if (ticket.status === 'CLOSED') return { success: true };

        const now = new Date();
        await prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: 'CLOSED',
                statusChangedAt: now,
                events: {
                    create: {
                        actorId: userId,
                        type: 'STATUS_CHANGED',
                        fromValue: ticket.status,
                        toValue: 'CLOSED',
                        createdAt: now,
                    },
                },
            },
        });
        return { success: true };
    } catch (error) {
        await logger.logError(error, 'SUPPORT_TICKET', {
            userId,
            details: { action: 'closeTicketAction', ticketId },
        });
        return fail('unknown');
    }
}

/** Records that the signed-in user (the ticket's customer or an admin) has seen the ticket. */
export async function markTicketReadAction(input: {
    ticketId: string;
}): Promise<TicketActionResult> {
    const session = await getSession();
    if (!session?.user) return fail('unauthorized');

    const parsed = ticketIdInputSchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { ticketId } = parsed.data;
    const userId = session.user.id;

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { userId: true },
    });
    if (!ticket || (ticket.userId !== userId && session.user.role !== 'admin')) {
        return fail('notFound');
    }

    const now = new Date();
    await prisma.ticketReadState.upsert({
        where: { ticketId_userId: { ticketId, userId } },
        create: { ticketId, userId, lastReadAt: now },
        update: { lastReadAt: now },
    });
    return { success: true };
}
