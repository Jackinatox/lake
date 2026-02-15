'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Copy, Check, Star, Trash2, StickyNote } from 'lucide-react';
import type { Allocation } from './types';
import { useTranslations } from 'next-intl';

interface AllocationCardProps {
    allocation: Allocation;
    onSetPrimary: (id: number) => Promise<boolean>;
    onRemove: (id: number) => Promise<boolean>;
    onEditNotes: (allocation: Allocation) => void;
    totalAllocations: number;
}

export default function AllocationCard({
    allocation,
    onSetPrimary,
    onRemove,
    onEditNotes,
    totalAllocations,
}: AllocationCardProps) {
    const t = useTranslations('gameserver.networkManager');
    const [copied, setCopied] = useState(false);
    const [settingPrimary, setSettingPrimary] = useState(false);
    const [removing, setRemoving] = useState(false);

    const displayAddress = allocation.ip_alias
        ? `${allocation.ip_alias}:${allocation.port}`
        : `${allocation.ip}:${allocation.port}`;

    const copyAddress = async () => {
        await navigator.clipboard.writeText(displayAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSetPrimary = async () => {
        setSettingPrimary(true);
        await onSetPrimary(allocation.id);
        setSettingPrimary(false);
    };

    const handleRemove = async () => {
        setRemoving(true);
        const success = await onRemove(allocation.id);
        if (!success) setRemoving(false);
    };

    return (
        <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
            {/* Top Row: Address + Primary Badge */}
            <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                        onClick={copyAddress}
                        className="flex items-center gap-1.5 min-w-0 group text-left"
                    >
                        <code className="text-sm font-mono truncate">{displayAddress}</code>
                        {copied ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                        ) : (
                            <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </button>
                    {allocation.is_default && (
                        <Badge variant="default" className="shrink-0 text-[10px] px-1.5 py-0">
                            {t('primary')}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Notes */}
            <div className="rounded-md bg-muted/50 px-2.5 py-1.5 min-h-7 flex items-center">
                {allocation.notes ? (
                    <p className="text-xs text-foreground">{allocation.notes}</p>
                ) : (
                    <p className="text-xs text-muted-foreground italic">{t('notesPlaceholder')}</p>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => onEditNotes(allocation)}
                >
                    <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                    {t('notes')}
                </Button>

                {!allocation.is_default && (
                    <>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-3 text-xs"
                            onClick={handleSetPrimary}
                            disabled={settingPrimary}
                        >
                            <Star className="h-3.5 w-3.5 mr-1.5" />
                            {t('makePrimary')}
                        </Button>

                        {totalAllocations > 1 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 px-3 text-xs"
                                onClick={handleRemove}
                                disabled={removing}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                {t('remove')}
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
