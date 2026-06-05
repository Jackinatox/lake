'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, X } from 'lucide-react';
import {
    AUTH_USERNAME_MAX_LENGTH,
    AUTH_USERNAME_MIN_LENGTH,
    authUsernameSchema,
    usernameUpdateSchema,
} from '@/lib/validation/auth';
import { getValidationMessage } from '@/lib/validation/common';
import { ButtonGroup } from '@/components/ui/button-group';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged';

export default function UsernameEditor({
    currentUsername,
    displayName,
}: {
    currentUsername: string;
    displayName: string;
}) {
    const t = useTranslations('profile');
    const hasUsername = currentUsername.trim().length > 0;

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
        if (input.length < AUTH_USERNAME_MIN_LENGTH) {
            setStatus('idle');
            return;
        }
        if (!authUsernameSchema.safeParse(input).success) {
            setStatus('invalid');
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
            const parsed = usernameUpdateSchema.parse({ username: input });
            const { error } = await authClient.updateUser({
                username: parsed.username,
            } as Parameters<typeof authClient.updateUser>[0]);
            if (error) {
                setSaveError(error.message || t('account.usernameSaveError'));
            } else {
                setEditing(false);
                setStatus('idle');
            }
        } catch (error) {
            setSaveError(getValidationMessage(error) || t('account.usernameSaveError'));
        } finally {
            setSaving(false);
        }
    }, [status, input, t]);

    // Both view and edit modes are contained in h-8 — no layout shift in normal use.
    // Error text only appends below when there's actually an error, growing the card downward.
    return (
        <div className="min-w-0">
            <div className="min-h-8 flex items-center w-full">
                {!editing ? (
                    <button
                        type="button"
                        onClick={startEditing}
                        className="group flex items-center gap-1.5 max-w-full text-left transition-colors cursor-pointer"
                        aria-label={
                            hasUsername ? t('account.editUsername') : t('account.addUsername')
                        }
                    >
                        <span
                            className={
                                hasUsername
                                    ? 'font-semibold text-base leading-tight truncate'
                                    : 'font-semibold text-base leading-tight truncate text-muted-foreground'
                            }
                        >
                            {hasUsername ? displayName : t('account.addUsername')}
                        </span>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                ) : (
                    <ButtonGroup className="w-full">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value.replace(/\s/g, ''))}
                            maxLength={AUTH_USERNAME_MAX_LENGTH}
                            autoComplete="username"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            className="h-8 text-sm flex-1 min-w-0"
                            disabled={saving}
                            autoFocus
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs shrink-0"
                            onClick={save}
                            disabled={status !== 'available' || saving}
                        >
                            {t('account.saveUsername')}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={cancelEditing}
                            disabled={saving}
                            aria-label={t('account.cancelEdit')}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </ButtonGroup>
                )}
            </div>
            {editing && (status === 'taken' || status === 'invalid' || saveError) && (
                <p className="text-xs text-destructive mt-1">
                    {saveError ||
                        (status === 'taken'
                            ? t('account.usernameTaken')
                            : t('account.usernameNoAt'))}
                </p>
            )}
        </div>
    );
}
