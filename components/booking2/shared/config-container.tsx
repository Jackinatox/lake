'use client';

import { CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface ConfigContainerProps {
    /** Header title - uses CardTitle for consistency */
    title?: string;
    /** Content items (ConfigSettingItem components) */
    children: ReactNode;
    /** Additional classes for the outer container */
    className?: string;
}

/**
 * A standardized container for game configuration settings.
 * Provides consistent spacing between items without adding borders.
 *
 * Border hierarchy: This component does NOT add borders.
 * Children (ConfigSettingItem) own their individual borders.
 */
export function ConfigContainer({ title, children, className }: ConfigContainerProps) {
    return (
        <div className={cn('space-y-4 md:space-y-6', className)}>
            {title && (
                <div className="space-y-2">
                    <CardTitle>{title}</CardTitle>
                </div>
            )}
            <div className="space-y-4 md:space-y-6">{children}</div>
        </div>
    );
}
