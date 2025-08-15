"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateBackupDialogProps {
    onBackupCreated: () => void
    canCreateBackup: boolean
    serverId: string
}

export function CreateBackupDialog({ onBackupCreated, canCreateBackup, serverId }: CreateBackupDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false)
    const { toast } = useToast()

    const handleCreate = async () => {
        if (!name.trim()) {
            toast({
                title: "Error",
                description: "Please enter a backup name.",
                variant: "destructive",
            })
            return
        }

        setCreating(true)
        try {
            const response = await fetch(`/api/servers/${serverId}/backups`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: name.trim() }),
            })

            const data = await response.json()

            if (!response.ok) {
                let errorMsg = "Failed to create backup"
                errorMsg = data.error || errorMsg;
                setError(errorMsg);
                throw new Error();
            }


            toast({
                title: "Success",
                description: `Backup "${data.name}" creation started.`,
            })

            setName("")
            setOpen(false)
            onBackupCreated()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create backup",
                variant: "destructive",
            })
        } finally {
            setCreating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={!canCreateBackup}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Backup
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Backup</DialogTitle>
                    <DialogDescription>
                        Create a new backup of your current server state. This may take several minutes to complete.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="backup-name">Backup Name</Label>
                        <Input
                            id="backup-name"
                            placeholder="Enter backup name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={creating}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !creating && name.trim()) {
                                    handleCreate()
                                }
                            }}
                        />
                        {(error != '' ) && <div className="text-red-500"> {error}
                        </div> }
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={creating || !name.trim()}>
                        {creating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Backup"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
