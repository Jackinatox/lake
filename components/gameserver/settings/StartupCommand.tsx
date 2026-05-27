'use client';

import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
        <div className="space-y-1">
            <Label htmlFor="startup-command">{t('label')}</Label>
            <div className="flex items-end justify-between gap-2 !mt-1">
                <p className="text-xs text-muted-foreground flex-1 min-w-0">{t('description')}</p>
                {editable && (
                    <span
                        className={`text-xs shrink-0 ${tooLong ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                    >
                        {value.length}/{MAX_LENGTH}
                    </span>
                )}
            </div>
            <div className="relative">
                <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none font-mono text-sm text-muted-foreground/70"
                    aria-hidden="true"
                >
                    {'>'}
                </span>
                <Input
                    id="startup-command"
                    type="text"
                    value={value}
                    onChange={
                        editable
                            ? (e) => {
                                  setValue(e.target.value.replace(/[\r\n]+/g, ' '));
                                  setError('');
                              }
                            : undefined
                    }
                    readOnly={!editable}
                    className={`h-10 pl-7 font-mono text-sm ${!editable ? 'bg-muted/50' : ''}`}
                    autoCorrect="off"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                />
            </div>
            <Collapsible open={hasDefault && defaultOpen} onOpenChange={setDefaultOpen}>
                <div className="flex items-center justify-between gap-2 min-h-7 pt-1">
                    {hasDefault ? (
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
                    ) : (
                        <span />
                    )}
                    {editable && isDirty && (
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
                {hasDefault && (
                    <CollapsibleContent className="mt-2">
                        <ButtonGroup className="w-full">
                            <ButtonGroupText className="flex-1 min-w-0 bg-muted/50 px-2 py-2 font-mono text-xs whitespace-pre-wrap break-all">
                                {defaultCommand}
                            </ButtonGroupText>
                            {editable && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleUseDefault}
                                    disabled={!canUseDefault || isSaving}
                                    title={t('useDefault')}
                                    aria-label={t('useDefault')}
                                    className="px-3 flex items-center gap-1 text-xs"
                                >
                                    <Undo2 className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">{t('useDefault')}</span>
                                </Button>
                            )}
                        </ButtonGroup>
                    </CollapsibleContent>
                )}
            </Collapsible>
            {isEmpty && isDirty && <p className="text-xs text-destructive">{t('required')}</p>}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

export default StartupCommand;
