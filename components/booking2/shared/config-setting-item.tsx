'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ConfigSettingItemProps {
    /** Unique identifier for accessibility */
    id: string;
    /** Main label text */
    label: string;
    /** Optional description text shown below label */
    description?: string;
    /** The control element (Input, Switch, Select, etc.) */
    children: ReactNode;
    /** Additional classes for the container */
    className?: string;
    /** Whether to center items vertically (default) or align to start */
    alignStart?: boolean;
}

/**
 * A standardized setting item with consistent styling.
 * Provides bordered container with label + description on the left and control on the right.
 * 
 * Border hierarchy: This component owns the border for individual settings.
 * Parent should NOT add additional borders around this component.
 */
export function ConfigSettingItem({
    id,
    label,
    description,
    children,
    className,
    alignStart = false,
}: ConfigSettingItemProps) {
    return (
        <div
            className={cn(
                'flex flex-row justify-between gap-3',
                'p-3 md:p-4 border rounded-lg',
                alignStart ? 'items-start' : 'items-center',
                className,
            )}
        >
            <div className="space-y-1 flex-1">
                <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
                    {label}
                </Label>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}
