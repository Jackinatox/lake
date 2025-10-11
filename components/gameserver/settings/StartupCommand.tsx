import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React from 'react'

interface StartupCommandProps {
    command: string
}

function StartupCommand({ command }: StartupCommandProps) {
    return (
        <div className="space-y-2">
            <Label htmlFor="startup-command">Startup Command</Label>
            <Textarea
                id="startup-command"
                value={command}
                readOnly
                className="font-mono text-sm bg-muted/50"
                rows={3}
            />
            <p className="text-xs text-muted-foreground">
                This command is automatically generated and cannot be modified.
            </p>
        </div>
    )
}

export default StartupCommand