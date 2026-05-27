'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { updateStartupCommand } from './serverSettingsActions';
import { Loader2, Save, RotateCcw } from 'lucide-react';

const MAX_LENGTH = 200;

interface StartupCommandProps {
    command: string;
    ptServerId: string;
}

function StartupCommand({ command, ptServerId }: StartupCommandProps) {
    const t = useTranslations('gameserver.settings.startupCommand');
    const [value, setValue] = useState(command);
    const [saved, setSaved] = useState(command);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const isDirty = value !== saved;
    const isEmpty = value.trim() === '';
    const tooLong = value.length > MAX_LENGTH;
    const canSave = isDirty && !isEmpty && !tooLong && !isSaving;

    const handleSave = async () => {
        if (!canSave) return;
        setIsSaving(true);
        setError('');
        const ok = await updateStartupCommand(ptServerId, value);
        setIsSaving(false);
        if (ok) {
            setSaved(value);
        } else {
            setError(t('saveFailed'));
        }
    };

    const handleReset = () => {
        setValue(saved);
        setError('');
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="startup-command">{t('label')}</Label>
            <Textarea
                id="startup-command"
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    setError('');
                }}
                className="font-mono text-sm resize-none"
                rows={3}
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
            />
            <div className="flex items-center justify-between gap-2">
                <span
                    className={`text-xs ${tooLong ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                >
                    {value.length}/{MAX_LENGTH}
                </span>
                {isDirty && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            disabled={isSaving}
                            className="h-7 px-2 text-xs"
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            {t('reset')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSave}
                            disabled={!canSave}
                            className="h-7 px-3 text-xs flex items-center gap-1"
                        >
                            {isSaving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Save className="h-3 w-3" />
                            )}
                            {isSaving ? t('saving') : t('save')}
                        </Button>
                    </div>
                )}
            </div>
            {isEmpty && isDirty && <p className="text-xs text-destructive">{t('required')}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">{t('description')}</p>
        </div>
    );
}

export default StartupCommand;
