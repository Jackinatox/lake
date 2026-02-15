'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Network, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { GameServer } from '@/models/gameServerModel';
import { useAllocations } from './useAllocations';
import AllocationCard from './AllocationCard';
import AllocationNotesDialog from './AllocationNotesDialog';
import type { Allocation } from './types';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';

interface NetworkManagerProps {
    server: GameServer;
    apiKey: string;
}

export default function NetworkManager({ server, apiKey }: NetworkManagerProps) {
    const t = useTranslations('gameserver.networkManager');
    const { toast } = useToast();
    const {
        allocations,
        loading,
        error,
        refetch,
        setPrimary,
        updateNotes,
        addAllocation,
        removeAllocation,
    } = useAllocations(server.identifier, apiKey);

    const [notesDialogOpen, setNotesDialogOpen] = useState(false);
    const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(null);
    const [adding, setAdding] = useState(false);

    const allocationLimit = server.feature_limits.allocations;
    const canAddMore = allocationLimit === 0 || allocations.length < allocationLimit;

    const handleSetPrimary = async (id: number) => {
        const success = await setPrimary(id);
        if (success) {
            toast({ title: t('primaryUpdated') });
        } else {
            toast({ title: t('primaryFailed'), variant: 'destructive' });
        }
        return success;
    };

    const handleRemove = async (id: number) => {
        const success = await removeAllocation(id);
        if (success) {
            toast({ title: t('allocationRemoved') });
        } else {
            toast({ title: t('removeFailed'), variant: 'destructive' });
        }
        return success;
    };

    const handleAdd = async () => {
        setAdding(true);
        const success = await addAllocation();
        if (success) {
            toast({ title: t('allocationAdded') });
        } else {
            toast({ title: t('addFailed'), variant: 'destructive' });
        }
        setAdding(false);
    };

    const handleEditNotes = (allocation: Allocation) => {
        setEditingAllocation(allocation);
        setNotesDialogOpen(true);
    };

    const handleSaveNotes = async (allocationId: number, notes: string) => {
        const success = await updateNotes(allocationId, notes);
        if (success) {
            toast({ title: t('notesUpdated') });
        } else {
            toast({ title: t('notesFailed'), variant: 'destructive' });
        }
        return success;
    };

    // Sort: primary first, then by port ascending
    const sorted = [...allocations].sort((a, b) => {
        if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
        return a.port - b.port;
    });

    return (
        <>
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-0 p-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Network className="h-5 w-5" />
                            {t('title')}
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={refetch}
                            disabled={loading}
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
                            />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('description')}</p>
                </CardHeader>

                <CardContent className="p-3 pt-2">
                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive" className="mb-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Loading skeleton */}
                    {loading && allocations.length === 0 && (
                        <div className="space-y-2">
                            <Skeleton className="h-24 w-full rounded-lg" />
                            <Skeleton className="h-24 w-full rounded-lg" />
                        </div>
                    )}

                    {/* Allocation cards */}
                    {!loading && allocations.length === 0 && !error && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            {t('noAllocations')}
                        </p>
                    )}

                    {sorted.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sorted.map((allocation) => (
                                <AllocationCard
                                    key={allocation.id}
                                    allocation={allocation}
                                    onSetPrimary={handleSetPrimary}
                                    onRemove={handleRemove}
                                    onEditNotes={handleEditNotes}
                                    totalAllocations={allocations.length}
                                />
                            ))}
                        </div>
                    )}

                    {/* Add allocation button */}
                    {canAddMore && (
                        <Button
                            variant="secondary"
                            size="default"
                            className="w-full mt-3"
                            onClick={handleAdd}
                            disabled={adding || loading}
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            {adding ? t('addingAllocation') : t('addAllocation')}
                        </Button>
                    )}

                    {/* Allocation limit info */}
                    {allocationLimit > 0 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            {t('allocationCount', {
                                current: allocations.length,
                                max: allocationLimit,
                            })}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Notes Dialog */}
            <AllocationNotesDialog
                allocation={editingAllocation}
                open={notesDialogOpen}
                onOpenChange={setNotesDialogOpen}
                onSave={handleSaveNotes}
            />
        </>
    );
}
