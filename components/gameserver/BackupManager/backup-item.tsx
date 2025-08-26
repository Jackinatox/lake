"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Download, Trash2, RotateCcw, Loader2, HardDrive, Calendar, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatBytes } from "@/lib/GlobalFunctions/ptResourceLogic"
import { Backup } from "./BackupManager"

interface BackupItemProps {
  serverId: string,
  backup: Backup
  onBackupDeleted: () => void
  onBackupRestored: () => void
}

export function BackupItem({ backup, onBackupDeleted, onBackupRestored, serverId }: BackupItemProps) {
  const [operating, setOperating] = useState(false)
  const { toast } = useToast()

  const deleteBackup = async () => {
    setOperating(true)
    try {
      const response = await fetch(`/api/servers/${serverId}/backups?backupId=${backup.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete backup")
      }

      toast({
        title: "Success",
        description: `Backup "${backup.name}" has been deleted.`,
      })

      onBackupDeleted()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete backup",
        variant: "destructive",
      })
    } finally {
      setOperating(false)
    }
  }

  const restoreBackup = async () => {
    setOperating(true)
    try {
      const response = await fetch(
        `/api/servers/${encodeURIComponent(serverId)}/backups/restore`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            backupId: backup.id,
            truncate: true,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to restore backup")
      }

      toast({
        title: "Restore Complete",
        description: `Server has been restored from backup "${backup.name}".`,
      })

      onBackupRestored()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore backup",
        variant: "destructive",
      })
    } finally {
      setOperating(false)
    }
  }

  const downloadBackup = async () => {
    setOperating(true)
    try {
      const response = await fetch(`/api/backups/${backup.id}/download`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to get download URL")
      }

      const data = await response.json()

      // Open download URL in new tab
      window.open(data.downloadUrl, "_blank")

      toast({
        title: "Download Started",
        description: `Download for backup "${backup.name}" has been initiated.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start download",
        variant: "destructive",
      })
    } finally {
      setOperating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: Backup["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            Completed
          </Badge>
        )
      case "creating":
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white">
            Creating
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-medium">{backup.name}</h3>
          {getStatusBadge(backup.status)}
          {backup.status === "creating" && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {formatBytes(backup.size)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(backup.createdAt)}
          </span>
          {backup.checksum && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {backup.checksum.substring(0, 16)}...
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={operating || backup.status === "creating"}>
            {operating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={downloadBackup} disabled={backup.status !== "completed"}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={backup.status !== "completed"}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restore Backup</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to restore from "{backup.name}"? This will overwrite your current server data
                  and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={restoreBackup}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Restore
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{backup.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteBackup}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
