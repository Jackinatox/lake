'use client';

import { updateGameServer } from '@/app/actions/gameservers/updateGameServer';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';

interface EditServerDialogProps {
    server: {
        id: string;
        name: string;
        cpuPercent: number;
        ramMB: number;
        diskMB: number;
        backupCount: number;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditServerDialog({
    server,
    open,
    onOpenChange,
    onSuccess,
}: EditServerDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        cpuPercent: server.cpuPercent,
        ramMB: server.ramMB,
        diskMB: server.diskMB,
        backupCount: server.backupCount,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await updateGameServer({
            id: server.id,
            ...formData,
        });

        setLoading(false);

        if (result.success) {
            toast({
                title: 'Success',
                description: 'Server updated successfully',
            });
            onSuccess();
            onOpenChange(false);
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Server Resources</DialogTitle>
                    <DialogDescription>
                        Update resources for server: {server.name}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cpuPercent" className="text-right">
                                CPU %
                            </Label>
                            <Input
                                id="cpuPercent"
                                type="number"
                                value={formData.cpuPercent}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        cpuPercent: parseInt(e.target.value) || 0,
                                    }))
                                }
                                className="col-span-3"
                                min="1"
                                max="1600"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="ramMB" className="text-right">
                                RAM (MB)
                            </Label>
                            <Input
                                id="ramMB"
                                type="number"
                                value={formData.ramMB}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        ramMB: parseInt(e.target.value) || 0,
                                    }))
                                }
                                className="col-span-3"
                                min="512"
                                max="32768"
                                step="512"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="diskMB" className="text-right">
                                Disk (MB)
                            </Label>
                            <Input
                                id="diskMB"
                                type="number"
                                value={formData.diskMB}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        diskMB: parseInt(e.target.value) || 0,
                                    }))
                                }
                                className="col-span-3"
                                min="1024"
                                max="512000"
                                step="1024"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="backupCount" className="text-right">
                                Backups
                            </Label>
                            <Input
                                id="backupCount"
                                type="number"
                                value={formData.backupCount}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        backupCount: parseInt(e.target.value) || 0,
                                    }))
                                }
                                className="col-span-3"
                                min="0"
                                max="10"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
