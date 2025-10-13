"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface CreateBackupDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreate: (payload: {
        name?: string
        ignoredPatterns: string[]
        isLocked: boolean
    }) => Promise<boolean>
    isSubmitting: boolean
    disabled?: boolean
}

const ignoredPlaceholder = [
    "*.log",
    "cache/*",
    "temp/*",
].join("\n")

export function CreateBackupDialog({
    open,
    onOpenChange,
    onCreate,
    isSubmitting,
    disabled,
}: CreateBackupDialogProps) {
    const [name, setName] = useState("")
    const [ignored, setIgnored] = useState("")
    const [isLocked, setIsLocked] = useState(false)

    useEffect(() => {
        if (!open) {
            setName("")
            setIgnored("")
            setIsLocked(false)
        }
    }, [open])

    const handleSubmit = async () => {
        if (disabled) return false
        const wasCreated = await onCreate({
            name: name.trim() || undefined,
            ignoredPatterns: ignored
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            isLocked,
        })

        if (wasCreated) {
            onOpenChange(false)
        }

        return wasCreated
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Create backup</DialogTitle>
                    <DialogDescription>
                        Capture the server state. You can optionally name the backup,
                        lock it from accidental deletion, and exclude temporary files.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="backup-name">Backup name</Label>
                        <Input
                            id="backup-name"
                            placeholder="Pre-update backup"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="backup-ignored">Ignored files</Label>
                        <Textarea
                            id="backup-ignored"
                            placeholder={ignoredPlaceholder}
                            value={ignored}
                            onChange={(event) => setIgnored(event.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                            One pattern per line. Leave empty to include all files.
                        </p>
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <Label htmlFor="backup-lock" className="flex flex-col">
                                <span>Lock backup</span>
                                <span className="text-xs text-muted-foreground">
                                    Prevent this backup from being deleted until unlocked.
                                </span>
                            </Label>
                        </div>
                        <Switch
                            id="backup-lock"
                            checked={isLocked}
                            onCheckedChange={setIsLocked}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || disabled}
                    >
                        {isSubmitting ? "Creating..." : "Create backup"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
