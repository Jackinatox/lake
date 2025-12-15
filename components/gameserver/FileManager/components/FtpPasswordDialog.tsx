'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Loader2 } from 'lucide-react';

import { updateFtpPassword } from '@/app/actions/gameservers/updateFtpPassword';
import { useToast } from '@/hooks/use-toast';
import { FTP_PASSWORD_MAX_LENGTH, FTP_PASSWORD_MIN_LENGTH } from '@/app/GlobalConstants';
import { useTranslations } from 'next-intl';

interface FtpPasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serverIdentifier: string;
}

export function FtpPasswordDialog({
    open,
    onOpenChange,
    serverIdentifier,
}: FtpPasswordDialogProps) {
    const { toast } = useToast();
    const t = useTranslations('gameserver.fileManager.ftpPassword');

    const [passwordInput, setPasswordInput] = useState('');
    const [passwordConfirmInput, setPasswordConfirmInput] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordResult, setPasswordResult] = useState<string | null>(null);
    const [isUpdatingPassword, startPasswordUpdate] = useTransition();

    const resetState = useCallback(() => {
        setPasswordInput('');
        setPasswordConfirmInput('');
        setPasswordError(null);
        setPasswordResult(null);
    }, []);

    useEffect(() => {
        if (!open) {
            resetState();
        }
    }, [open, resetState]);

    const generatePassword = useCallback(() => {
        const length = Math.max(FTP_PASSWORD_MIN_LENGTH, 24);
        const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%^&*()-_=+';

        if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
            const randomValues = new Uint32Array(length);
            window.crypto.getRandomValues(randomValues);
            let generated = '';
            for (let i = 0; i < randomValues.length; i += 1) {
                generated += charset[randomValues[i] % charset.length];
            }
            return generated;
        }

        let fallback = '';
        for (let i = 0; i < length; i += 1) {
            fallback += charset[Math.floor(Math.random() * charset.length)];
        }
        return fallback;
    }, []);

    const handlePasswordCopy = useCallback(async () => {
        if (!passwordResult) {
            return;
        }

        try {
            await navigator.clipboard.writeText(passwordResult);
            toast({
                title: t('toasts.passwordCopied'),
                description: t('toasts.passwordCopiedDescription'),
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : t('toasts.copyFailed');
            toast({
                title: t('toasts.copyFailed'),
                description: message,
                variant: 'destructive',
            });
        }
    }, [passwordResult, toast]);

    const handlePasswordSubmit = useCallback(() => {
        if (isUpdatingPassword) {
            return;
        }

        setPasswordError(null);

        const trimmedPassword = passwordInput.trim();
        const trimmedConfirm = passwordConfirmInput.trim();

        if (trimmedPassword.length > 0) {
            if (trimmedPassword !== trimmedConfirm) {
                setPasswordError(t('errors.passwordMismatch'));
                return;
            }
            if (trimmedPassword.length < FTP_PASSWORD_MIN_LENGTH) {
                setPasswordError(t('errors.passwordTooShort', { min: FTP_PASSWORD_MIN_LENGTH }));
                return;
            }
            if (trimmedPassword.length > FTP_PASSWORD_MAX_LENGTH) {
                setPasswordError(t('errors.passwordTooLong', { max: FTP_PASSWORD_MAX_LENGTH }));
                return;
            }
        }

        startPasswordUpdate(() => {
            void (async () => {
                const result = await updateFtpPassword({
                    serverIdentifier,
                    password: trimmedPassword.length > 0 ? trimmedPassword : undefined,
                });

                if (!result.success) {
                    const errorMessage = result.error ?? t('toasts.updateFailed');
                    setPasswordError(errorMessage);
                    toast({
                        title: t('toasts.updateFailed'),
                        description: errorMessage,
                        variant: 'destructive',
                    });
                    return;
                }

                const nextPassword = result.password ?? trimmedPassword;
                setPasswordResult(nextPassword || null);
                setPasswordInput(nextPassword || '');
                setPasswordConfirmInput(nextPassword || '');
                toast({
                    title: t('toasts.passwordUpdated'),
                    description: t('toasts.passwordUpdatedDescription'),
                });
            })();
        });
    }, [isUpdatingPassword, passwordInput, passwordConfirmInput, serverIdentifier, toast]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('dialogTitle')}</DialogTitle>
                    <DialogDescription>
                        {passwordResult ? t('dialogDescriptionResult') : t('dialogDescriptionSet')}
                    </DialogDescription>
                </DialogHeader>

                {passwordResult ? (
                    <div className="space-y-4">
                        <div className="rounded-md border bg-muted/40 p-4">
                            <div className="mb-2 flex items-center justify-between text-xs uppercase text-muted-foreground">
                                <span>{t('newPasswordLabel')}</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={handlePasswordCopy}
                                >
                                    <Copy className="mr-1 h-3.5 w-3.5" />
                                    {t('copyButton')}
                                </Button>
                            </div>
                            <p
                                className="wrap-break-word font-mono text-sm"
                                data-testid="ftp-new-password"
                            >
                                {passwordResult}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('warningText')}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ftp-password">{t('newPasswordLabel')}</Label>
                            <Input
                                id="ftp-password"
                                type="password"
                                autoComplete="new-password"
                                value={passwordInput}
                                onChange={(event) => setPasswordInput(event.target.value)}
                                disabled={isUpdatingPassword}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ftp-password-confirm">
                                {t('confirmPasswordLabel')}
                            </Label>
                            <Input
                                id="ftp-password-confirm"
                                type="password"
                                autoComplete="new-password"
                                value={passwordConfirmInput}
                                onChange={(event) => setPasswordConfirmInput(event.target.value)}
                                disabled={isUpdatingPassword || passwordInput.trim().length === 0}
                            />
                        </div>
                        {passwordError && (
                            <p className="text-sm text-destructive">{passwordError}</p>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {passwordResult ? (
                        <Button type="button" onClick={() => onOpenChange(false)}>
                            {t('doneButton')}
                        </Button>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isUpdatingPassword}
                            >
                                {t('cancelButton')}
                            </Button>
                            <Button
                                type="button"
                                onClick={handlePasswordSubmit}
                                disabled={isUpdatingPassword}
                            >
                                {isUpdatingPassword && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                {passwordInput.trim()
                                    ? t('setPasswordButton')
                                    : t('generatePasswordButton')}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
