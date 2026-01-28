'use client';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslations } from 'next-intl';

interface StatusIndicatorProps {
    state: string | null;
    /** Show text label alongside the dot */
    showLabel?: boolean;
    /** Size of the dot: 'sm' = 8px, 'md' = 12px (default), 'lg' = 16px */
    size?: 'sm' | 'md' | 'lg';
    /** Show tooltip on hover (useful for mobile when label is hidden) */
    showTooltip?: boolean;
    className?: string;
}

const statusColors: Record<string, string> = {
    running: 'bg-green-500',
    offline: 'bg-red-500',
    starting: 'bg-yellow-500',
    stopping: 'bg-orange-500',
    installing: 'bg-blue-500',
    unknown: 'bg-gray-500',
};

const statusPulse: Record<string, boolean> = {
    running: false,
    offline: false,
    starting: true,
    stopping: true,
    installing: true,
    unknown: false,
};

const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
};

/**
 * StatusIndicator - A flexible status indicator component
 *
 * Use cases:
 * - Mobile: Just the dot with tooltip (showLabel=false, showTooltip=true)
 * - Desktop: Dot with text label (showLabel=true)
 * - Compact: Small dot in tight spaces (size='sm')
 */
export function StatusIndicator({
    state,
    showLabel = false,
    size = 'md',
    showTooltip = true,
    className,
}: StatusIndicatorProps) {
    const normalizedState = state?.toLowerCase() || 'unknown';
    const colorClass = statusColors[normalizedState] || statusColors.unknown;
    const shouldPulse = statusPulse[normalizedState] || false;
    const displayText = state || 'Loading';

    const dot = (
        <div
            className={cn(
                'rounded-full shrink-0',
                sizeClasses[size],
                colorClass,
                shouldPulse && 'animate-pulse',
                className,
            )}
            role="status"
            aria-label={displayText}
        />
    );

    const content = (
        <div className="flex items-center gap-2">
            {dot}
            {showLabel && <span className="font-medium capitalize text-sm">{displayText}</span>}
        </div>
    );

    if (showTooltip && !showLabel) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent>
                    <span className="capitalize">{displayText}</span>
                </TooltipContent>
            </Tooltip>
        );
    }

    return content;
}
