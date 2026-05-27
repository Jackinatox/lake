'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { updateStartupCommand } from './serverSettingsActions';
import { Loader2, Save, RotateCcw, ChevronDown, Undo2 } from 'lucide-react';

const MAX_LENGTH = 200;

interface StartupCommandProps {
    command: string;
    ptServerId: string;
    defaultCommand?: string;
}

function StartupCommand({ command, ptServerId, defaultCommand }: StartupCommandProps) {
    const t = useTranslations('gameserver.settings.startupCommand');
    const editable = ptServerId !== undefined;
    const [value, setValue] = useState(command);
    const [saved, setSaved] = useState(command);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [defaultOpen, setDefaultOpen] = useState(false);

    const hasDefault = !!defaultCommand && defaultCommand.trim() !== '';
    const canUseDefault = hasDefault && defaultCommand !== value;

    const isDirty = value !== saved;
    const isEmpty = value.trim() === '';
    const tooLong = value.length > MAX_LENGTH;
    const canSave = isDirty && !isEmpty && !tooLong && !isSaving;

    const persist = async (next: string) => {
        if (!ptServerId || isSaving) return;
        setIsSaving(true);
        setError('');
        const ok = await updateStartupCommand(ptServerId, next);
        setIsSaving(false);
        if (ok) {
            setSaved(next);
        } else {
            setError(t('saveFailed'));
        }
    };

    const handleSave = async () => {
        if (!canSave) return;
        await persist(value);
    };

    const handleReset = () => {
        setValue(saved);
        setError('');
    };

    const handleUseDefault = async () => {
        if (!hasDefault || isSaving) return;
        const next = defaultCommand!;
        setValue(next);
        await persist(next);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="startup-command">{t('label')}</Label>
            <Textarea
                id="startup-command"
                value={value}
                onChange={
                    editable
                        ? (e) => {
                              setValue(e.target.value);
                              setError('');
                          }
                        : undefined
                }
                readOnly={!editable}
                className={`font-mono text-sm resize-none ${!editable ? 'bg-muted/50' : ''}`}
                rows={3}
                autoCorrect="off"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
            />
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground flex-1 min-w-0">
                    {t('description')}
                </p>
                {editable && (
                    <span
                        className={`text-xs shrink-0 ${tooLong ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                    >
                        {value.length}/{MAX_LENGTH}
                    </span>
                )}
            </div>
            {editable && isDirty && (
                <div className="flex items-center justify-end gap-2">
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
            {isEmpty && isDirty && <p className="text-xs text-destructive">{t('required')}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
            {hasDefault && (
                <Collapsible open={defaultOpen} onOpenChange={setDefaultOpen}>
                    <div className="flex items-center justify-between gap-2">
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground"
                            >
                                <ChevronDown
                                    className={`h-3 w-3 mr-1 transition-transform ${
                                        defaultOpen ? 'rotate-180' : ''
                                    }`}
                                />
                                {defaultOpen ? t('hideDefault') : t('showDefault')}
                            </Button>
                        </CollapsibleTrigger>
                        {editable && defaultOpen && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleUseDefault}
                                disabled={!canUseDefault || isSaving}
                                className="h-7 px-3 text-xs flex items-center gap-1"
                            >
                                <Undo2 className="h-3 w-3" />
                                {t('useDefault')}
                            </Button>
                        )}
                    </div>
                    <CollapsibleContent>
                        <pre className="mt-2 rounded-md border bg-muted/50 p-2 font-mono text-xs whitespace-pre-wrap break-all">
                            {defaultCommand}
                        </pre>
                    </CollapsibleContent>
                </Collapsible>
            )}
        </div>
    );
}

export default StartupCommand;
