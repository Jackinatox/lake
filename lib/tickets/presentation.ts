import type {
    TicketCategory,
    TicketEventType,
    TicketPriority,
    TicketState,
} from '@/app/client/generated/enums';

export const ticketStateStyles: Record<TicketState, string> = {
    OPEN: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    WAITING_FOR_CUSTOMER: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    ON_HOLD: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    RESOLVED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    CLOSED: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
};

export const ticketPriorityStyles: Record<TicketPriority, string> = {
    LOW: 'bg-slate-500/10 text-slate-500 dark:text-slate-400',
    NORMAL: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
    HIGH: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    URGENT: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

export const ticketCategoryStyles: Record<TicketCategory, string> = {
    GENERAL: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
    TECHNICAL: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    BILLING: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    ACCOUNT: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    SUSPENSION: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

// Admin UI is English-only; customer pages use `supportTickets.*` translations instead.
export const adminTicketStateLabels: Record<TicketState, string> = {
    OPEN: 'Open',
    WAITING_FOR_CUSTOMER: 'Waiting for customer',
    ON_HOLD: 'On hold',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
};

export const adminTicketPriorityLabels: Record<TicketPriority, string> = {
    LOW: 'Low',
    NORMAL: 'Normal',
    HIGH: 'High',
    URGENT: 'Urgent',
};

export const adminTicketCategoryLabels: Record<TicketCategory, string> = {
    GENERAL: 'General',
    TECHNICAL: 'Technical',
    BILLING: 'Billing',
    ACCOUNT: 'Account',
    SUSPENSION: 'Suspension',
};

export const adminTicketEventLabels: Record<TicketEventType, string> = {
    CREATED: 'opened the ticket',
    STATUS_CHANGED: 'changed the status',
    PRIORITY_CHANGED: 'changed the priority',
    CATEGORY_CHANGED: 'changed the category',
    SUBJECT_CHANGED: 'changed the subject',
    ASSIGNEE_CHANGED: 'changed the assignee',
    SERVER_CHANGED: 'changed the linked server',
};

/** Pretty-prints an event's `fromValue`/`toValue` snapshot for the admin timeline. */
export function formatTicketEventValue(type: TicketEventType, value: string | null): string {
    if (!value) return '—';
    switch (type) {
        case 'STATUS_CHANGED':
            return adminTicketStateLabels[value as TicketState] ?? value;
        case 'PRIORITY_CHANGED':
            return adminTicketPriorityLabels[value as TicketPriority] ?? value;
        case 'CATEGORY_CHANGED':
            return adminTicketCategoryLabels[value as TicketCategory] ?? value;
        default:
            return value;
    }
}

type StaffLike = {
    username?: string | null;
    displayUsername?: string | null;
    name?: string | null;
};

/**
 * Name of a staff member as shown to customers. Unlike `getUserDisplayName` this never falls
 * back to the email address, so an admin's email cannot leak into a customer's ticket.
 */
export function staffDisplayName(user: StaffLike | null | undefined): string | null {
    return user?.username?.trim() || user?.displayUsername?.trim() || user?.name?.trim() || null;
}

/** Formats a date in the shop's time zone so server and client render the same string. */
export function formatTicketDateTime(date: Date, locale: string) {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Berlin',
    }).format(date);
}

export function formatTicketTime(date: Date, locale: string) {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-DE', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Berlin',
    }).format(date);
}

export function formatTicketDay(date: Date, locale: string) {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'de-DE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Berlin',
    }).format(date);
}

/** Compact age such as "5m", "3h", "2d" — used for "waiting since" in the admin inbox. */
export function formatTicketAge(from: Date, now: Date = new Date()) {
    const minutes = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 60_000));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 48) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
}
