'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCcw, Search, UploadCloud } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';

interface FileManagerToolbarProps {
    onRefresh: () => void;
    onUploadClick: () => void;
    onFilterChange: (value: string) => void;
    disabled?: boolean;
}

const FileManagerToolbarComponent = ({
    onRefresh,
    onUploadClick,
    onFilterChange,
    disabled,
}: FileManagerToolbarProps) => {
    const t = useTranslations('gameserver.fileManager.toolbar');
    const [filter, setFilter] = useState('');

    const handleFilterChange = (value: string) => {
        setFilter(value);
        onFilterChange(value);
    };

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* Search input - full width on mobile */}
            <div className="relative w-full sm:w-64 md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={filter}
                    onChange={(event) => handleFilterChange(event.target.value)}
                    placeholder={t('filterPlaceholder')}
                    className="pl-9 h-9 text-sm"
                    disabled={disabled}
                />
            </div>
            {/* Action buttons - responsive sizing */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={disabled}
                    className="flex-1 sm:flex-none"
                >
                    <RefreshCcw className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('refreshButton')}</span>
                </Button>
                <Button
                    size="sm"
                    onClick={onUploadClick}
                    disabled={disabled}
                    className="flex-1 sm:flex-none"
                >
                    <UploadCloud className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('uploadButton')}</span>
                </Button>
            </div>
        </div>
    );
};

export const FileManagerToolbar = memo(FileManagerToolbarComponent);
