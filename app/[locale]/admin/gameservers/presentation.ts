import type { GameServerStatus, GameServerType } from '@/app/client/generated/enums';

/**
 * Colour vocabulary of the panel, in one place so the status dot in a row, the KPI tile and the
 * distribution bar never disagree. Same idea as `LEVEL_STYLES` in the log viewer: colour carries
 * the meaning, badges are avoided unless a row really needs the extra weight.
 */
export const STATUS_META: Record<
    GameServerStatus,
    { label: string; short: string; dot: string; text: string; bar: string }
> = {
    ACTIVE: {
        label: 'Active',
        short: 'ACT',
        dot: 'bg-emerald-500',
        text: 'text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
    },
    CREATED: {
        label: 'Installing',
        short: 'NEW',
        dot: 'bg-sky-500',
        text: 'text-sky-600 dark:text-sky-400',
        bar: 'bg-sky-500',
    },
    EXPIRED: {
        label: 'Expired',
        short: 'EXP',
        dot: 'bg-amber-500',
        text: 'text-amber-600 dark:text-amber-400',
        bar: 'bg-amber-500',
    },
    CREATION_FAILED: {
        label: 'Creation failed',
        short: 'ERR',
        dot: 'bg-red-500',
        text: 'text-red-600 dark:text-red-400',
        bar: 'bg-red-500',
    },
    DELETED: {
        label: 'Deleted',
        short: 'DEL',
        dot: 'bg-muted-foreground/50',
        text: 'text-muted-foreground',
        bar: 'bg-muted-foreground/50',
    },
};

export const TYPE_META: Record<GameServerType, { label: string; text: string; bar: string }> = {
    FREE: {
        label: 'Free',
        text: 'text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
    },
    PACKAGE: { label: 'Package', text: 'text-sky-600 dark:text-sky-400', bar: 'bg-sky-500' },
    CUSTOM: { label: 'Custom', text: 'text-violet-600 dark:text-violet-400', bar: 'bg-violet-500' },
};

/** Colour for the expiry column: overdue is red, imminent amber, everything else neutral. */
export function expiryTone(expires: Date, warningHours: number, now = Date.now()): string {
    const diffMs = new Date(expires).getTime() - now;
    if (diffMs < 0) return 'text-red-600 dark:text-red-400';
    if (diffMs < warningHours * 60 * 60 * 1000) return 'text-amber-600 dark:text-amber-400';
    return 'text-muted-foreground';
}
