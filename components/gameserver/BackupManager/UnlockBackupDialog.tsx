"use client"

import { useState, type ReactNode } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

import type { Backup } from "./types"

interface UnlockBackupDialogProps {
    backup: Backup
    trigger: ReactNode
    onConfirm: () => Promise<boolean>
}

export function UnlockBackupDialog({ backup, trigger, onConfirm }: UnlockBackupDialogProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen)
        if (!nextOpen) {
            setIsSubmitting(false)
        }
    }

    const handleUnlock = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        if (isSubmitting) return
        setIsSubmitting(true)
        const ok = await onConfirm()
        if (ok) {
            handleOpenChange(false)
        } else {
            setIsSubmitting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Unlock this backup?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Unlocking <span className="font-medium">{backup.name}</span> allows it to be deleted or updated.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleUnlock}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Unlocking
                            </span>
                        ) : (
                            "Unlock"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
