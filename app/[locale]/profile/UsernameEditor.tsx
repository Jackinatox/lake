'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Loader2, Pencil, X, XCircle } from 'lucide-react';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged';

export default function UsernameEditor({ currentUsername }: { currentUsername: string }) {
    const t = useTranslations('profile');

    const [editing, setEditing] = useState(false);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState<UsernameStatus>('idle');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startEditing = useCallback(() => {
        setInput(currentUsername);
        setStatus('unchanged');
        setSaveError(null);
        setEditing(true);
    }, [currentUsername]);

    const cancelEditing = useCallback(() => {
        setEditing(false);
        setStatus('idle');
        setSaveError(null);
        if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    }, []);

    useEffect(() => {
        if (!editing) return;
        if (checkTimerRef.current) clearTimeout(checkTimerRef.current);

        if (!input) {
            setStatus('idle');
            return;
        }
        if (input.includes('@')) {
            setStatus('invalid');
            return;
        }
        if (input.length < 3) {
            setStatus('idle');
            return;
        }
        if (input === currentUsername) {
            setStatus('unchanged');
            return;
        }

        setStatus('checking');
        checkTimerRef.current = setTimeout(async () => {
            try {
                const { data } = await authClient.isUsernameAvailable({ username: input });
                setStatus(data?.available ? 'available' : 'taken');
            } catch {
                setStatus('idle');
            }
        }, 500);

        return () => {
            if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
        };
    }, [input, editing, currentUsername]);

    const save = useCallback(async () => {
        if (status !== 'available') return;
        setSaving(true);
        setSaveError(null);
        try {
            const { error } = await authClient.updateUser({ username: input } as Parameters<
                typeof authClient.updateUser
            >[0]);
            if (error) {
                setSaveError(error.message || t('account.usernameSaveError'));
            } else {
                setEditing(false);
                setStatus('idle');
            }
        } catch {
            setSaveError(t('account.usernameSaveError'));
        } finally {
            setSaving(false);
        }
    }, [status, input, t]);

    if (!editing) {
        return (
            <div className="flex items-center gap-1.5">
                <p className="text-sm text-muted-foreground truncate">@{currentUsername}</p>
                <button
                    type="button"
                    onClick={startEditing}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    aria-label={t('account.editUsername')}
                >
                    <Pencil className="h-3.5 w-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value.replace(/\s/g, ''))}
                        autoComplete="username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="h-8 text-sm pr-8"
                        disabled={saving}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                        {status === 'checking' && (
                            <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                        )}
                        {status === 'available' && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                        {(status === 'taken' || status === 'invalid') && (
                            <XCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                    </span>
                </div>
                <Button
                    size="sm"
                    className="h-8 px-3 text-xs shrink-0"
                    onClick={save}
                    disabled={status !== 'available' || saving}
                >
                    {saving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        t('account.saveUsername')
                    )}
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={cancelEditing}
                    disabled={saving}
                    aria-label={t('account.cancelEdit')}
                >
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>
            {status === 'available' && (
                <p className="text-xs text-green-600">{t('account.usernameAvailable')}</p>
            )}
            {status === 'taken' && (
                <p className="text-xs text-destructive">{t('account.usernameTaken')}</p>
            )}
            {status === 'invalid' && (
                <p className="text-xs text-destructive">{t('account.usernameNoAt')}</p>
            )}
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
        </div>
    );
}
