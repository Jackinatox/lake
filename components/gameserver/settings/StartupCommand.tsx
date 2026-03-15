import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from 'next-intl';
import React from 'react';

interface StartupCommandProps {
    command: string;
}

function StartupCommand({ command }: StartupCommandProps) {
    const t = useTranslations('gameserver.settings.startupCommand');
    return (
        <div className="space-y-2">
            <Label htmlFor="startup-command">{t('label')}</Label>
            <Textarea
                id="startup-command"
                value={command}
                readOnly
                className="font-mono text-sm bg-muted/50"
                rows={3}
            />
            <p className="text-xs text-muted-foreground">{t('description')}</p>
        </div>
    );
}

export default StartupCommand;
