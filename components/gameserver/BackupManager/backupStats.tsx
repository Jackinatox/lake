"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HardDrive } from "lucide-react"
import { BackupLimits } from "./BackupManager"


interface BackupStatsProps {
    limits: BackupLimits
    totalSize?: string
}

export function BackupStats({ limits, totalSize = "0 GB" }: BackupStatsProps) {
    return (
        <div>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Backup Storage
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                            {limits.current} of {limits.maximum} backups used
                        </p>
                        <div className="flex gap-4 text-sm">
                            <span>
                                Remaining: <strong>{limits.maximum - limits.current}</strong>
                            </span>
                            <span>
                                Total Size: <strong>{totalSize}</strong>
                            </span>
                        </div>
                    </div>
                    <div className="w-32">
                        <div className="bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${(limits.current / limits.maximum) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </div>
    )
}
