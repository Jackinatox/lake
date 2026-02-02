import React from 'react';
import { cn } from '@/lib/utils';

interface ActionItemProps {
    title: string;
    description: string;
    children: React.ReactNode;
    className?: string;
}

/**
 * ActionItem component displays a management action with a description on the left
 * and an action button on the right. Used for server management operations.
 */
export default function ActionItem({ title, description, children, className }: ActionItemProps) {
    return (
        <div className={cn('flex flex-col sm:flex-row gap-3 sm:items-start', className)}>
            <div className="flex-1 space-y-1">
                <h4 className="text-sm font-medium leading-none">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="sm:w-48 shrink-0">{children}</div>
        </div>
    );
}
