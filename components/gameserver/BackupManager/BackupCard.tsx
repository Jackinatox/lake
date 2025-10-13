"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Download, Loader2, Lock, RotateCcw, Trash2 } from "lucide-react"
import type { Backup } from "./types"
import { deriveStatusLabel, formatBytes, formatDateTime } from "./utils"
import { RestoreBackupDialog } from "./RestoreBackupDialog"
import { DeleteBackupDialog } from "./DeleteBackupDialog"

interface BackupCardProps {
    backup: Backup
    onDownload: (backup: Backup) => Promise<void>
    onRestore: (backup: Backup, options: { truncate: boolean }) => Promise<boolean>
    onDelete: (backup: Backup) => Promise<boolean>
    disabled?: boolean
    isDownloading?: boolean
}

export function BackupCard({
    backup,
    onDownload,
    onRestore,
    onDelete,
    disabled,
    isDownloading,
}: BackupCardProps) {
    const statusLabel = deriveStatusLabel(backup.status)
    const statusVariant = backup.status === "failed" ? "destructive" : backup.status === "creating" ? "secondary" : "default"
    const ignoredLabel = backup.ignoredFiles.length > 0 ? `${backup.ignoredFiles.length} pattern${backup.ignoredFiles.length === 1 ? "" : "s"}` : "All files"
    const checksum = backup.sha256Hash ? `${backup.sha256Hash.slice(0, 12)}…` : "Not available"

    const handleDownload = async () => {
        if (disabled) return
        await onDownload(backup)
    }

    const handleRestore = async (options: { truncate: boolean }) => onRestore(backup, options)
    const handleDelete = async () => onDelete(backup)

    return (
        <Card className="flex flex-col">
            <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle className="text-base font-semibold">
                            {backup.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Created {formatDateTime(backup.createdAt)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                        {backup.isLocked ? (
                            <Badge variant="outline" className="gap-1">
                                <Lock className="h-3.5 w-3.5" /> Locked
                            </Badge>
                        ) : null}
                    </div>
                </div>
            </CardHeader>

            <Separator />

            <CardContent className="flex-1 space-y-3 p-4">
                <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Backup size</span>
                        <span className="font-medium">{formatBytes(backup.bytes)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-medium">{formatDateTime(backup.completedAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Ignored</span>
                        <span className="font-medium">{ignoredLabel}</span>
                    </div>
                </div>
                <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                    <p className="font-medium uppercase tracking-wide text-muted-foreground/80">Checksum</p>
                    <p className="font-mono text-sm">{checksum}</p>
                </div>
            </CardContent>

            <CardFooter className="flex flex-wrap gap-2 p-4 pt-0">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    disabled={disabled || isDownloading}
                >
                    {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Download</span>
                    <span className="sm:hidden">Get</span>
                </Button>

                <RestoreBackupDialog
                    backup={backup}
                    trigger={
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-primary/40 text-primary hover:bg-primary/10"
                            disabled={disabled}
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Restore</span>
                            <span className="sm:hidden">Restore</span>
                        </Button>
                    }
                    onConfirm={handleRestore}
                />

                <DeleteBackupDialog
                    backup={backup}
                    trigger={
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/60 text-destructive hover:bg-destructive/10"
                            disabled={disabled || backup.isLocked}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">Delete</span>
                        </Button>
                    }
                    onConfirm={handleDelete}
                />
            </CardFooter>
        </Card>
    )
}
