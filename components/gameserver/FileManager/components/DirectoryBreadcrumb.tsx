'use client';

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Folder } from 'lucide-react';
import { Fragment, memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface DirectoryBreadcrumbProps {
    path: string;
    onNavigate: (path: string) => void;
    onRefresh?: () => void;
    className?: string;
}

function normalize(path: string) {
    if (!path || path === '/') {
        return [];
    }
    return path.split('/').filter(Boolean);
}

const DirectoryBreadcrumbComponent = ({
    path,
    onNavigate,
    onRefresh,
    className,
}: DirectoryBreadcrumbProps) => {
    const t = useTranslations('gameserver.fileManager.breadcrumb');
    const segments = useMemo(() => normalize(path), [path]);

    const buildPath = (index: number) => {
        if (index < 0) return '/';
        const joined = segments.slice(0, index + 1).join('/');
        return `/${joined}${segments.length > 0 ? '/' : ''}`;
    };

    // For mobile: show only the last 2 segments with ellipsis
    const visibleSegments = segments.length > 2 ? segments.slice(-2) : segments;
    const hasHiddenSegments = segments.length > 2;

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-2 overflow-hidden',
                className
            )}
        >
            <div className="min-w-0 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <Breadcrumb>
                    <BreadcrumbList className="flex-nowrap">
                        <BreadcrumbItem className="shrink-0">
                            <BreadcrumbLink asChild>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium hover:text-foreground transition-colors"
                                    onClick={() => onNavigate('/')}
                                >
                                    <Folder className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden xs:inline">{t('root')}</span>
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>

                        {/* Show ellipsis on mobile when there are hidden segments */}
                        {hasHiddenSegments && (
                            <>
                                <BreadcrumbSeparator className="shrink-0" />
                                <BreadcrumbItem className="shrink-0">
                                    <button
                                        type="button"
                                        className="text-xs sm:text-sm text-muted-foreground hover:text-foreground"
                                        onClick={() =>
                                            onNavigate(buildPath(segments.length - 3))
                                        }
                                    >
                                        ...
                                    </button>
                                </BreadcrumbItem>
                            </>
                        )}

                        {visibleSegments.map((segment, localIndex) => {
                            const actualIndex = hasHiddenSegments
                                ? segments.length - 2 + localIndex
                                : localIndex;
                            const isLast = actualIndex === segments.length - 1;

                            return (
                                <Fragment key={`${segment}-${actualIndex}`}>
                                    <BreadcrumbSeparator className="shrink-0" />
                                    <BreadcrumbItem className="min-w-0">
                                        {isLast ? (
                                            <BreadcrumbPage className="truncate max-w-[120px] sm:max-w-[200px] text-xs sm:text-sm">
                                                {segment}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <button
                                                    type="button"
                                                    className="truncate max-w-[80px] sm:max-w-[150px] text-xs sm:text-sm hover:text-foreground transition-colors"
                                                    onClick={() => onNavigate(buildPath(actualIndex))}
                                                >
                                                    {segment}
                                                </button>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            {onRefresh && (
                <Button size="sm" variant="outline" onClick={onRefresh} className="shrink-0">
                    Refresh
                </Button>
            )}
        </div>
    );
};

export const DirectoryBreadcrumb = memo(DirectoryBreadcrumbComponent);
