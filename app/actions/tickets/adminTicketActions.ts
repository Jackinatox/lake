'use server';

import type { Prisma } from '@/app/client/generated/client';
import { getUserDisplayName } from '@/lib/auth/getUserDisplayName';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { sendTicketReplyEmail, sendTicketResolvedEmail } from '@/lib/email/sendEmailEmailsFromLake';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { staffDisplayName } from '@/lib/tickets/presentation';
import type { TicketActionError, TicketActionResult } from '@/lib/tickets/types';
import { customerTicketUrl } from '@/lib/tickets/urls';
import { getValidationMessage } from '@/lib/validation/common';
import {
    adminTicketReplySchema,
    adminTicketUpdateSchema,
    ticketIdInputSchema,
    ticketNoteCreateSchema,
    ticketNoteIdSchema,
    ticketNotePinSchema,
    ticketNoteUpdateSchema,
    type AdminTicketReplyInput,
    type AdminTicketUpdateInput,
} from '@/lib/validation/tickets';

function fail(error: TicketActionError, message?: string) {
    return { success: false as const, error, message };
}

async function getAdminSession() {
    try {
        return await requireAdmin();
    } catch {
        return null;
    }
}

function logFailure(error: unknown, adminId: string, action: string, details: object) {
    return logger.logError(error, 'SUPPORT_TICKET', {
        userId: adminId,
        details: { action, ...details },
    });
}

const customerSelect = {
    email: true,
    username: true,
    displayUsername: true,
    name: true,
} as const;

/**
 * Sends a staff reply. Fails with `conflict` when a message newer than `lastSeenMessageId`
 * exists, so an admin never answers without having seen the customer's (or a colleague's)
 * latest message. An unassigned ticket is assigned to the replying admin.
 */
export async function adminReplyToTicketAction(
    input: AdminTicketReplyInput,
): Promise<TicketActionResult> {
    const session = await getAdminSession();
    if (!session) return fail('unauthorized');

    const parsed = adminTicketReplySchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { ticketId, message, statusAfter, lastSeenMessageId } = parsed.data;
    const adminId = session.user.id;
    const adminName = staffDisplayName(session.user) ?? 'Support';

    try {
        const result = await prisma.$transaction(async (tx) => {
            const ticket = await tx.ticket.findUnique({
                where: { id: ticketId },
                select: {
                    id: true,
                    number: true,
                    subject: true,
                    status: true,
                    assigneeId: true,
                    firstResponseAt: true,
                    gameServerId: true,
                    user: { select: customerSelect },
                },
            });
            if (!ticket) return fail('notFound');

            const latest = await tx.ticketMessage.findFirst({
                where: { ticketId },
                orderBy: { id: 'desc' },
                select: { id: true },
            });
            if (latest && latest.id > lastSeenMessageId) {
                return fail('conflict', 'A new message arrived while you were writing.');
            }

            const now = new Date();
            const nextStatus = statusAfter === 'KEEP' ? ticket.status : statusAfter;
            const events: Prisma.TicketEventCreateWithoutTicketInput[] = [];
            if (nextStatus !== ticket.status) {
                events.push({
                    actor: { connect: { id: adminId } },
                    type: 'STATUS_CHANGED',
                    fromValue: ticket.status,
                    toValue: nextStatus,
                    createdAt: now,
                });
            }
            if (!ticket.assigneeId) {
                events.push({
                    actor: { connect: { id: adminId } },
                    type: 'ASSIGNEE_CHANGED',
                    fromValue: null,
                    toValue: adminName,
                    createdAt: now,
                });
            }

            await tx.ticketMessage.create({
                data: {
                    ticketId,
                    authorId: adminId,
                    authorRole: 'STAFF',
                    body: message,
                    createdAt: now,
                },
            });
            await tx.ticket.update({
                where: { id: ticketId },
                data: {
                    lastMessageAt: now,
                    lastStaffMessageAt: now,
                    firstResponseAt: ticket.firstResponseAt ?? now,
                    ...(nextStatus !== ticket.status
                        ? { status: nextStatus, statusChangedAt: now }
                        : {}),
                    ...(!ticket.assigneeId ? { assigneeId: adminId } : {}),
                    events: { create: events },
                },
            });
            await tx.ticketReadState.upsert({
                where: { ticketId_userId: { ticketId, userId: adminId } },
                create: { ticketId, userId: adminId, lastReadAt: now },
                update: { lastReadAt: now },
            });

            return { success: true as const, ticket, nextStatus };
        });

        if (!result.success) return result;

        const { ticket, nextStatus } = result;
        if (ticket.user?.email) {
            sendTicketReplyEmail({
                to: ticket.user.email,
                userName: getUserDisplayName(ticket.user),
                ticketNumber: ticket.number,
                subject: ticket.subject,
                agentName: adminName,
                responseMessage: message,
                resolved: nextStatus === 'RESOLVED',
                ticketUrl: customerTicketUrl(ticket.id),
                gameServerId: ticket.gameServerId,
            }).catch((error) => {
                logger.logError(error, 'EMAIL', {
                    userId: adminId,
                    details: { context: 'ticket reply email', ticketNumber: ticket.number },
                });
            });
        }

        return { success: true };
    } catch (error) {
        await logFailure(error, adminId, 'adminReplyToTicketAction', { ticketId });
        return fail('unknown', 'Could not send the reply.');
    }
}

/**
 * Updates any subset of status, priority, category, subject, assignee and linked server,
 * writing one `TicketEvent` per field that actually changed.
 */
export async function adminUpdateTicketAction(
    input: AdminTicketUpdateInput,
): Promise<TicketActionResult> {
    const session = await getAdminSession();
    if (!session) return fail('unauthorized');

    const parsed = adminTicketUpdateSchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { ticketId, status, priority, category, subject, assigneeId, gameServerId } = parsed.data;
    const adminId = session.user.id;

    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: {
                id: true,
                number: true,
                userId: true,
                subject: true,
                status: true,
                priority: true,
                category: true,
                assigneeId: true,
                gameServerId: true,
                assignee: { select: { username: true, displayUsername: true, name: true } },
                gameServer: { select: { name: true } },
                user: { select: customerSelect },
            },
        });
        if (!ticket) return fail('notFound', 'Ticket not found.');

        const now = new Date();
        const data: Prisma.TicketUpdateInput = {};
        const events: Prisma.TicketEventCreateWithoutTicketInput[] = [];
        const addEvent = (
            type: Prisma.TicketEventCreateWithoutTicketInput['type'],
            fromValue: string | null,
            toValue: string | null,
        ) =>
            events.push({
                actor: { connect: { id: adminId } },
                type,
                fromValue,
                toValue,
                createdAt: now,
            });

        if (status && status !== ticket.status) {
            data.status = status;
            data.statusChangedAt = now;
            addEvent('STATUS_CHANGED', ticket.status, status);
        }
        if (priority && priority !== ticket.priority) {
            data.priority = priority;
            addEvent('PRIORITY_CHANGED', ticket.priority, priority);
        }
        if (category && category !== ticket.category) {
            data.category = category;
            addEvent('CATEGORY_CHANGED', ticket.category, category);
        }
        if (subject && subject !== ticket.subject) {
            data.subject = subject;
            addEvent('SUBJECT_CHANGED', ticket.subject, subject);
        }
        if (assigneeId !== undefined && assigneeId !== ticket.assigneeId) {
            const assignee = assigneeId
                ? await prisma.user.findFirst({
                      where: { id: assigneeId, role: 'admin' },
                      select: { id: true, username: true, displayUsername: true, name: true },
                  })
                : null;
            if (assigneeId && !assignee) return fail('invalid', 'Assignee must be an admin.');
            data.assignee = assignee ? { connect: { id: assignee.id } } : { disconnect: true };
            addEvent(
                'ASSIGNEE_CHANGED',
                ticket.assignee ? staffDisplayName(ticket.assignee) : null,
                assignee ? staffDisplayName(assignee) : null,
            );
        }
        if (gameServerId !== undefined && gameServerId !== ticket.gameServerId) {
            const server =
                gameServerId && ticket.userId
                    ? await prisma.gameServer.findFirst({
                          where: { id: gameServerId, userId: ticket.userId },
                          select: { id: true, name: true },
                      })
                    : null;
            if (gameServerId && !server) {
                return fail(
                    'serverNotFound',
                    "Server not found or not owned by the ticket's user.",
                );
            }
            data.gameServer = server ? { connect: { id: server.id } } : { disconnect: true };
            addEvent('SERVER_CHANGED', ticket.gameServer?.name ?? null, server?.name ?? null);
        }

        if (events.length === 0) return { success: true };

        await prisma.ticket.update({
            where: { id: ticketId },
            data: { ...data, events: { create: events } },
        });

        if (data.status === 'RESOLVED' && ticket.user?.email) {
            sendTicketResolvedEmail({
                to: ticket.user.email,
                userName: getUserDisplayName(ticket.user),
                ticketNumber: ticket.number,
                subject: subject ?? ticket.subject,
                ticketUrl: customerTicketUrl(ticket.id),
                gameServerId: gameServerId === undefined ? ticket.gameServerId : gameServerId,
            }).catch((error) => {
                logger.logError(error, 'EMAIL', {
                    userId: adminId,
                    details: { context: 'ticket resolved email', ticketNumber: ticket.number },
                });
            });
        }

        return { success: true };
    } catch (error) {
        await logFailure(error, adminId, 'adminUpdateTicketAction', { ticketId });
        return fail('unknown', 'Could not update the ticket.');
    }
}

/** Hard delete, e.g. for spam. Messages, notes, events and read states cascade. */
export async function adminDeleteTicketAction(input: {
    ticketId: string;
}): Promise<TicketActionResult> {
    const session = await getAdminSession();
    if (!session) return fail('unauthorized');

    const parsed = ticketIdInputSchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { ticketId } = parsed.data;
    const adminId = session.user.id;

    try {
        const deleted = await prisma.ticket.delete({
            where: { id: ticketId },
            select: { number: true, subject: true, userId: true },
        });
        await logger.info(`Ticket #${deleted.number} deleted`, 'SUPPORT_TICKET', {
            userId: adminId,
            details: { ticketId, ...deleted },
        });
        return { success: true };
    } catch (error) {
        await logFailure(error, adminId, 'adminDeleteTicketAction', { ticketId });
        return fail('unknown', 'Could not delete the ticket.');
    }
}

export async function addTicketNoteAction(input: {
    ticketId: string;
    body: string;
}): Promise<TicketActionResult> {
    const session = await getAdminSession();
    if (!session) return fail('unauthorized');

    const parsed = ticketNoteCreateSchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { ticketId, body } = parsed.data;
    const adminId = session.user.id;

    try {
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            select: { id: true },
        });
        if (!ticket) return fail('notFound', 'Ticket not found.');

        await prisma.ticketNote.create({ data: { ticketId, authorId: adminId, body } });
        return { success: true };
    } catch (error) {
        await logFailure(error, adminId, 'addTicketNoteAction', { ticketId });
        return fail('unknown', 'Could not add the note.');
    }
}

/** Notes can only be edited and deleted by their author. */
async function findOwnNote(noteId: number, adminId: string) {
    return prisma.ticketNote.findFirst({
        where: { id: noteId, authorId: adminId },
        select: { id: true },
    });
}

export async function updateTicketNoteAction(input: {
    noteId: number;
    body: string;
}): Promise<TicketActionResult> {
    const session = await getAdminSession();
    if (!session) return fail('unauthorized');

    const parsed = ticketNoteUpdateSchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { noteId, body } = parsed.data;
    const adminId = session.user.id;

    try {
        if (!(await findOwnNote(noteId, adminId))) {
            return fail('notFound', 'You can only edit your own notes.');
        }
        await prisma.ticketNote.update({ where: { id: noteId }, data: { body } });
        return { success: true };
    } catch (error) {
        await logFailure(error, adminId, 'updateTicketNoteAction', { noteId });
        return fail('unknown', 'Could not update the note.');
    }
}

export async function deleteTicketNoteAction(input: {
    noteId: number;
}): Promise<TicketActionResult> {
    const session = await getAdminSession();
    if (!session) return fail('unauthorized');

    const parsed = ticketNoteIdSchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { noteId } = parsed.data;
    const adminId = session.user.id;

    try {
        if (!(await findOwnNote(noteId, adminId))) {
            return fail('notFound', 'You can only delete your own notes.');
        }
        await prisma.ticketNote.delete({ where: { id: noteId } });
        return { success: true };
    } catch (error) {
        await logFailure(error, adminId, 'deleteTicketNoteAction', { noteId });
        return fail('unknown', 'Could not delete the note.');
    }
}

/** Any admin may pin or unpin a note. */
export async function setTicketNotePinnedAction(input: {
    noteId: number;
    pinned: boolean;
}): Promise<TicketActionResult> {
    const session = await getAdminSession();
    if (!session) return fail('unauthorized');

    const parsed = ticketNotePinSchema.safeParse(input);
    if (!parsed.success) return fail('invalid', getValidationMessage(parsed.error));
    const { noteId, pinned } = parsed.data;
    const adminId = session.user.id;

    try {
        await prisma.ticketNote.update({ where: { id: noteId }, data: { pinned } });
        return { success: true };
    } catch (error) {
        await logFailure(error, adminId, 'setTicketNotePinnedAction', { noteId });
        return fail('unknown', 'Could not update the note.');
    }
}
