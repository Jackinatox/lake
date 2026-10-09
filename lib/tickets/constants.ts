import type { TicketCategory, TicketPriority, TicketState } from '@/app/client/generated/enums';

export const TICKET_SUBJECT_MIN_LENGTH = 3;
export const TICKET_SUBJECT_MAX_LENGTH = 120;
export const TICKET_MESSAGE_MAX_LENGTH = 5_000;
export const TICKET_NOTE_MAX_LENGTH = 5_000;

// Abuse limits. Deliberately generous and never shown in the UI — a customer only learns about
// one when an action is rejected. Staff actions are not limited.
export const MAX_OPEN_TICKETS_PER_USER = 25;
export const MAX_TICKETS_PER_USER_PER_DAY = 20;
export const MAX_MESSAGES_PER_USER_PER_HOUR = 60;

export const TICKET_CATEGORIES: TicketCategory[] = [
    'GENERAL',
    'TECHNICAL',
    'BILLING',
    'ACCOUNT',
    'SUSPENSION',
];

export const TICKET_STATES: TicketState[] = [
    'OPEN',
    'WAITING_FOR_CUSTOMER',
    'ON_HOLD',
    'RESOLVED',
    'CLOSED',
];

export const TICKET_PRIORITIES: TicketPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

/** Every state except CLOSED: the conversation can still continue. */
export const ACTIVE_TICKET_STATES: TicketState[] = [
    'OPEN',
    'WAITING_FOR_CUSTOMER',
    'ON_HOLD',
    'RESOLVED',
];

/**
 * Where the new support landing page lives until it replaces the legacy `/support` page.
 * Switching over means rendering `SupportLanding` from `/support` and changing this constant.
 */
export const SUPPORT_LANDING_PATH = '/support/v2';

/** Admin inbox page size. */
export const ADMIN_TICKETS_PAGE_SIZE = 50;

/** How often open ticket pages re-fetch while the tab is visible. */
export const TICKET_REFRESH_INTERVAL_MS = 30_000;
