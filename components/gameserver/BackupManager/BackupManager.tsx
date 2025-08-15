"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
// import { BackupStats } from "./backup-stats"
import { RotateCcw, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BackupList } from "./backup-list"
import { CreateBackupDialog } from "./backup-dialog"
import { FileManagerProps } from "@/models/file-manager"
import { formatBytes } from "@/lib/globalFunctions"
import { Card, CardHeader } from "@/components/ui/card"
import { BackupStats } from "./backupStats"

export interface Backup {
    id: string
    name: string
    size: number
    createdAt: string
    status: "completed" | "creating" | "failed"
    checksum?: string
}

export interface BackupLimits {
    current: number
    maximum: number
}

export function BackupManager({ server }: FileManagerProps) {
    const [backups, setBackups] = useState<Backup[]>([])
    const [limits, setLimits] = useState<BackupLimits>({ current: 0, maximum: 2 })
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    const fetchBackups = async () => {
        setLoading(true)
        try {
            const [response, limit] = await Promise.all([
                fetch(`/api/servers/${server.identifier}/backups`),
                fetch(`/api/servers/${server.identifier}/backups/total`),
            ]);

            if (!response.ok || !limit.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to fetch backups")
            }

            const limitData = await limit.json();
            const data = await response.json()

            setBackups(
                data.map((item: any) => ({
                    id: item.attributes.uuid,
                    name: item.attributes.name,
                    size: item.attributes.bytes,
                    createdAt: item.attributes.created_at,
                    status: item.attributes.completed_at === null ? 'creating' : (item.attributes.is_successful ? 'completed' : 'failed'),
                    checksum: item.attributes.checksum,
                }))
            )
            setLimits({ maximum: limitData.totalBackups, current: data.length })
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
        setTimeout(() => {
            fetchBackups()
        }, 7000)
        setTimeout(() => {
            fetchBackups()
        }, 15000)
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
        let totalSize = 0;
        backups.forEach((backu) => {
            totalSize += backu.size;
        })

        return formatBytes(totalSize)
    }

    useEffect(() => {
        fetchBackups()
    }, [])

    return (
        <Card className="space-y-6">
            <CardHeader className="pb-0">
                <Card className="flex items-center justify-between w-full pr-4">
                    <BackupStats limits={limits} totalSize={calculateTotalSize()} />
                    <div className="flex gap-2">
                        <CreateBackupDialog serverId={server.identifier} onBackupCreated={handleBackupCreated} canCreateBackup={limits.maximum - limits.current > 0} />
                        <Button onClick={fetchBackups} variant="outline" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                            Refresh
                        </Button>
                    </div>
                </Card>
            </CardHeader>
            {/* Backup Stats */}


            {/* Backup List */}
            <BackupList
                serverId={server.identifier}
                backups={backups}
                loading={loading}
                onBackupDeleted={handleBackupDeleted}
                onBackupRestored={handleBackupRestored}
            />
        </Card>
    )
}
