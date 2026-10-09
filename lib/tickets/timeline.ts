import { formatTicketDay } from './presentation';

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' });

/** Calendar day in the shop's time zone, e.g. "2026-10-10". */
export function ticketDayKey(date: Date) {
    return dayKeyFormat.format(date);
}

/** "Today" / "Yesterday" / full date, for the day separators in a ticket timeline. */
export function ticketDayLabel(
    date: Date,
    locale: string,
    labels: { today: string; yesterday: string },
    now: Date = new Date(),
) {
    const key = ticketDayKey(date);
    if (key === ticketDayKey(now)) return labels.today;
    if (key === ticketDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) {
        return labels.yesterday;
    }
    return formatTicketDay(date, locale);
}

/** Merges timeline entries chronologically and inserts a day separator before each new day. */
export function withDaySeparators<T extends { createdAt: Date }>(items: T[]) {
    const sorted = [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const result: ({ type: 'day'; date: Date; key: string } | { type: 'item'; item: T })[] = [];
    let lastDay: string | null = null;
    for (const item of sorted) {
        const day = ticketDayKey(item.createdAt);
        if (day !== lastDay) {
            result.push({ type: 'day', date: item.createdAt, key: day });
            lastDay = day;
        }
        result.push({ type: 'item', item });
    }
    return result;
}
