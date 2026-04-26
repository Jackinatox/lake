'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, File, Folder, Plus, RefreshCw, Search, UploadCloud } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';

interface FileManagerToolbarProps {
    onRefresh: () => void;
    onCreateFileClick: () => void;
    onCreateFolderClick: () => void;
    onUploadClick: () => void;
    onFilterChange: (value: string) => void;
    disabled?: boolean;
    loading: boolean;
}

const FileManagerToolbarComponent = ({
    onRefresh,
    onCreateFileClick,
    onCreateFolderClick,
    onUploadClick,
    onFilterChange,
    disabled,
    loading,
}: FileManagerToolbarProps) => {
    const t = useTranslations('gameserver.fileManager.toolbar');
    const [filter, setFilter] = useState('');

    const handleFilterChange = (value: string) => {
        setFilter(value);
        onFilterChange(value);
    };

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 relative w-full sm:order-1 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={filter}
                    onChange={(event) => handleFilterChange(event.target.value)}
                    placeholder={t('filterPlaceholder')}
                    className="pl-9"
                    disabled={disabled}
                />
            </div>
            <div className="order-1 grid w-full grid-cols-3 gap-2 sm:order-2 sm:flex sm:w-auto sm:items-center">
                <Button
                    variant="outline"
                    onClick={onRefresh}
                    disabled={disabled}
                    className="w-full sm:w-auto"
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    {t('refreshButton')}
                </Button>
                <div className="w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                disabled={disabled}
                                className="w-full sm:w-auto"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {t('createButton')}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={onCreateFileClick}>
                                <File className="mr-2 h-4 w-4" />
                                {t('newFileButton')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onCreateFolderClick}>
                                <Folder className="mr-2 h-4 w-4" />
                                {t('newFolderButton')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Button onClick={onUploadClick} disabled={disabled} className="w-full sm:w-auto">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {t('uploadButton')}
                </Button>
            </div>
        </div>
    );
};

export const FileManagerToolbar = memo(FileManagerToolbarComponent);
