"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Database, Loader2 } from "lucide-react"
import { BackupItem } from "./backup-item"
import { Backup } from "./BackupManager"



interface BackupListProps {
  backups: Backup[]
  serverId: string,
  loading: boolean
  onBackupDeleted: () => void
  onBackupRestored: () => void
}

export function BackupList({ backups, loading, onBackupDeleted, onBackupRestored, serverId }: BackupListProps) {
  return (
    <div>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading backups...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No backups found</p>
            <p className="text-sm">Create your first backup to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {backups.map((backup, index) => (
              <div key={backup.id}>
                <BackupItem serverId={serverId} backup={backup} onBackupDeleted={onBackupDeleted} onBackupRestored={onBackupRestored} />
                {index < backups.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  )
}
