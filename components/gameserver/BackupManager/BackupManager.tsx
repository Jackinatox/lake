"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
// import { BackupStats } from "./backup-stats"
import { RotateCcw, Loader2, Database } from "lucide-react"
import { useToast } from "@/components/hooks/use-toast"
import { BackupList } from "./backup-list"
import { CreateBackupDialog } from "./backup-dialog"
import { FileManagerProps } from "@/models/file-manager"
import { formatBytes } from "@/lib/globalFunctions"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Backup {
    id: string
    name: string
    size: string
    createdAt: string
    status: "completed" | "creating" | "failed"
    checksum?: string
}

interface BackupLimits {
    current: number
    maximum: number
    remaining: number
}

export function BackupManager({ server }: FileManagerProps) {
    const [backups, setBackups] = useState<Backup[]>([])
    const [limits, setLimits] = useState<BackupLimits>({ current: 0, maximum: 5, remaining: 5 })
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    const fetchBackups = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/servers/${server.identifier}/backups/list`)

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to fetch backups")
            }

            const data = await response.json()
            setBackups(
                data.map((item: any) => ({
                    id: item.attributes.id,
                    name: item.attributes.name,
                    size: formatBytes(item.attributes.bytes),
                    createdAt: item.attributes.created_at,
                    status: item.attributes.is_successful ? 'completed' : 'failed',
                    checksum: item.attributes.checksum,
                }))
            )
            //   setLimits(data.limits)
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to fetch backups",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleBackupCreated = () => {
        fetchBackups()
    }

    const handleBackupDeleted = () => {
        fetchBackups()
    }

    const handleBackupRestored = () => {
        // Optionally refresh data or show additional feedback
        toast({
            title: "Server Restored",
            description: "Your server has been successfully restored from the backup.",
        })
    }

    const calculateTotalSize = () => {
        const totalBytes = backups.reduce((total, backup) => {
            const sizeMatch = backup.size.match(/(\d+\.?\d*)\s*(GB|MB)/)
            if (sizeMatch) {
                const value = Number.parseFloat(sizeMatch[1])
                const unit = sizeMatch[2]
                return total + (unit === "GB" ? value : value / 1024)
            }
            return total
        }, 0)

        return `${totalBytes.toFixed(2)} GB`
    }

    useEffect(() => {
        fetchBackups()
    }, [])

    return (
        <Card className="space-y-6">
            <CardHeader className="pb-0">
                <div className="flex items-center justify-between w-full">
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Existing Backups
                    </CardTitle>
                    <div className="flex gap-2">
                        <CreateBackupDialog onBackupCreated={handleBackupCreated} canCreateBackup={limits.remaining > 0} />
                        <Button onClick={fetchBackups} variant="outline" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                            Refresh
                        </Button>
                    </div>
                </div>
                <CardDescription>Manage your server backups</CardDescription>
            </CardHeader>
            {/* Backup Stats */}
            {/* <BackupStats limits={limits} totalSize={calculateTotalSize()} /> */}

            {/* Backup List */}
            <BackupList
                backups={backups}
                loading={loading}
                onBackupDeleted={handleBackupDeleted}
                onBackupRestored={handleBackupRestored}
            />
        </Card>
    )
}
