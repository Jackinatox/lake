import { TicketCategory, TicketPriority, TicketState } from '@/app/client/generated/enums';
import {
    TICKET_MESSAGE_MAX_LENGTH,
    TICKET_NOTE_MAX_LENGTH,
    TICKET_SUBJECT_MAX_LENGTH,
    TICKET_SUBJECT_MIN_LENGTH,
} from '@/lib/tickets/constants';
import { nonEmptyIdSchema, positiveIntSchema, requiredStringSchema, z } from './common';

const ticketIdSchema = requiredStringSchema('Ticket ID', 191);

const subjectSchema = z
    .string({ error: 'Subject is required' })
    .trim()
    .min(
        TICKET_SUBJECT_MIN_LENGTH,
        `Subject must be at least ${TICKET_SUBJECT_MIN_LENGTH} characters`,
    )
    .max(
        TICKET_SUBJECT_MAX_LENGTH,
        `Subject must be at most ${TICKET_SUBJECT_MAX_LENGTH} characters`,
    );

const messageSchema = requiredStringSchema('Message', TICKET_MESSAGE_MAX_LENGTH);
const noteSchema = requiredStringSchema('Note', TICKET_NOTE_MAX_LENGTH);

export const createTicketSchema = z.object({
    category: z.nativeEnum(TicketCategory),
    subject: subjectSchema,
    message: messageSchema,
    /** `GameServer.id` of one of the customer's own servers. */
    gameServerId: nonEmptyIdSchema.optional(),
});
export type CreateTicketInput = z.input<typeof createTicketSchema>;

export const ticketReplySchema = z.object({
    ticketId: ticketIdSchema,
    message: messageSchema,
});

export const ticketIdInputSchema = z.object({
    ticketId: ticketIdSchema,
});

export const adminTicketReplySchema = z.object({
    ticketId: ticketIdSchema,
    message: messageSchema,
    statusAfter: z.union([z.nativeEnum(TicketState), z.literal('KEEP')]),
    /** Newest message id the admin had on screen; a newer one aborts the send. */
    lastSeenMessageId: z.number().int().nonnegative(),
});
export type AdminTicketReplyInput = z.input<typeof adminTicketReplySchema>;

export const adminTicketUpdateSchema = z.object({
    ticketId: ticketIdSchema,
    status: z.nativeEnum(TicketState).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    category: z.nativeEnum(TicketCategory).optional(),
    subject: subjectSchema.optional(),
    /** `null` unassigns. */
    assigneeId: nonEmptyIdSchema.nullable().optional(),
    /** `null` unlinks. Must belong to the ticket's customer. */
    gameServerId: nonEmptyIdSchema.nullable().optional(),
});
export type AdminTicketUpdateInput = z.input<typeof adminTicketUpdateSchema>;

export const ticketNoteCreateSchema = z.object({
    ticketId: ticketIdSchema,
    body: noteSchema,
});

export const ticketNoteUpdateSchema = z.object({
    noteId: positiveIntSchema,
    body: noteSchema,
});

export const ticketNotePinSchema = z.object({
    noteId: positiveIntSchema,
    pinned: z.boolean(),
});

export const ticketNoteIdSchema = z.object({
    noteId: positiveIntSchema,
});

export const ADMIN_TICKET_VIEWS = [
    'needsReply',
    'mine',
    'unassigned',
    'waiting',
    'onHold',
    'resolved',
    'closed',
    'all',
] as const;
export type AdminTicketView = (typeof ADMIN_TICKET_VIEWS)[number];

export const ADMIN_TICKET_SORTS = ['activity', 'waiting', 'priority', 'created'] as const;
export type AdminTicketSort = (typeof ADMIN_TICKET_SORTS)[number];

/** Parses the admin inbox query string. Invalid values fall back to defaults instead of failing. */
export const adminTicketFiltersSchema = z.object({
    view: z.enum(ADMIN_TICKET_VIEWS).catch('needsReply'),
    category: z.nativeEnum(TicketCategory).optional().catch(undefined),
    priority: z.nativeEnum(TicketPriority).optional().catch(undefined),
    sort: z.enum(ADMIN_TICKET_SORTS).optional().catch(undefined),
    q: z.string().trim().max(200).optional().catch(undefined),
    userId: z.string().trim().max(191).optional().catch(undefined),
    serverId: z.string().trim().max(191).optional().catch(undefined),
    page: z.coerce.number().int().min(1).catch(1),
});
export type AdminTicketFilters = z.output<typeof adminTicketFiltersSchema>;
