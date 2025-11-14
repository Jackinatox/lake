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
                title: 'Password copied',
                description: 'Paste it into your FTP client to sign in.',
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to copy password.';
            toast({
                title: 'Unable to copy password',
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
                setPasswordError('Passwords do not match.');
                return;
            }
            if (trimmedPassword.length < FTP_PASSWORD_MIN_LENGTH) {
                setPasswordError(
                    `Password must be at least ${FTP_PASSWORD_MIN_LENGTH} characters.`,
                );
                return;
            }
            if (trimmedPassword.length > FTP_PASSWORD_MAX_LENGTH) {
                setPasswordError(`Password must not exceed ${FTP_PASSWORD_MAX_LENGTH} characters.`);
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
                    const errorMessage = result.error ?? 'Unable to change FTP password.';
                    setPasswordError(errorMessage);
                    toast({
                        title: 'Unable to update password',
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
                    title: 'FTP password updated',
                    description: 'Use the password below when connecting via SFTP.',
                });
            })();
        });
    }, [isUpdatingPassword, passwordInput, passwordConfirmInput, serverIdentifier, toast]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change FTP password</DialogTitle>
                    <DialogDescription>
                        {passwordResult
                            ? 'Copy the new password before closing this window.'
                            : `Enter a new password or leave the fields blank to let us generate one for you.`}
                    </DialogDescription>
                </DialogHeader>

                {passwordResult ? (
                    <div className="space-y-4">
                        <div className="rounded-md border bg-muted/40 p-4">
                            <div className="mb-2 flex items-center justify-between text-xs uppercase text-muted-foreground">
                                <span>New password</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={handlePasswordCopy}
                                >
                                    <Copy className="mr-1 h-3.5 w-3.5" />
                                    Copy
                                </Button>
                            </div>
                            <p
                                className="break-words font-mono text-sm"
                                data-testid="ftp-new-password"
                            >
                                {passwordResult}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            This password is only shown once. Store it somewhere safe before closing
                            the dialog.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ftp-password">New password</Label>
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
                            <Label htmlFor="ftp-password-confirm">Confirm password</Label>
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
                            Done
                        </Button>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isUpdatingPassword}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handlePasswordSubmit}
                                disabled={isUpdatingPassword}
                            >
                                {isUpdatingPassword && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                {passwordInput.trim() ? 'Set password' : 'Generate password'}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
