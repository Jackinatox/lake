import { Cog, Globe, type LucideIcon } from 'lucide-react';
import type { LogSource } from '@/app/client/generated/enums';

/**
 * How a row shows where it came from (lake or the worker): an icon at the start of the row
 * and a tint on the category text. No badges.
 */
export const SOURCE_STYLES: Record<
    LogSource,
    { icon: LucideIcon; iconColor: string; category: string }
> = {
    APP: {
        icon: Globe,
        iconColor: 'text-muted-foreground/70',
        category: 'text-muted-foreground',
    },
    WORKER: {
        icon: Cog,
        iconColor: 'text-violet-500 dark:text-violet-400',
        category: 'text-violet-600/90 dark:text-violet-400/90',
    },
};
