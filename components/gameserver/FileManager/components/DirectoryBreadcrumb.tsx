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

    return (
        <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <button
                                type="button"
                                className="inline-flex items-center gap-1 text-sm font-medium"
                                onClick={() => onNavigate('/')}
                            >
                                <Folder className="h-4 w-4" />
                                {t('root')}
                            </button>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {segments.map((segment, index) => (
                        <Fragment key={`${segment}-${index}`}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {index === segments.length - 1 ? (
                                    <BreadcrumbPage>{segment}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <button
                                            type="button"
                                            className="text-sm capitalize"
                                            onClick={() => onNavigate(buildPath(index))}
                                        >
                                            {segment}
                                        </button>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
            {onRefresh && (
                <Button size="sm" variant="outline" onClick={onRefresh}>
                    Refresh
                </Button>
            )}
        </div>
    );
};

export const DirectoryBreadcrumb = memo(DirectoryBreadcrumbComponent);
