'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ResetPasswordFormProps extends React.ComponentProps<'div'> {
    token?: string | null;
    initialError?: string | null;
}

export function ResetPasswordForm({
    className,
    token,
    initialError,
    ...props
}: ResetPasswordFormProps) {
    const t = useTranslations('RegisterLogin.resetPassword');
    const fieldsT = useTranslations('RegisterLogin.fields');
    const validationT = useTranslations('RegisterLogin.validation');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const passwordMinLength = 8;

    useEffect(() => {
        if (!initialError) {
            return;
        }
        const normalized = initialError.toLowerCase();
        if (normalized === 'invalid_token') {
            setError(t('errors.tokenInvalid'));
        } else {
            setError(t('errors.generic'));
        }
    }, [initialError, t]);

    const passwordsMatch = useMemo(
        () => newPassword === confirmPassword,
        [newPassword, confirmPassword],
    );
    const passwordTooShort = useMemo(
        () => newPassword.length > 0 && newPassword.length < passwordMinLength,
        [newPassword],
    );

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);

            if (!token) {
                setError(t('errors.tokenMissing'));
                return;
            }
            if (newPassword.length < passwordMinLength) {
                setError(validationT('passwordMin', { min: passwordMinLength }));
                return;
            }
            if (!passwordsMatch) {
                setError(validationT('passwordsDontMatch'));
                return;
            }

            setLoading(true);
            try {
                const { error } = await authClient.resetPassword({
                    newPassword,
                    token,
                });

                if (error) {
                    setError(error.message || t('errors.resetFailed'));
                } else {
                    setSuccess(t('success.reset'));
                    setNewPassword('');
                    setConfirmPassword('');
                }
            } catch (err: any) {
                setError(err?.message || t('errors.resetFailed'));
            } finally {
                setLoading(false);
            }
        },
        [token, newPassword, passwordMinLength, passwordsMatch, t, validationT],
    );

    return (
        <div className="flex justify-center">
            <div className={cn('flex flex-col gap-6', className)} {...props}>
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">{t('title')}</CardTitle>
                        <CardDescription>{t('subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="newPassword">{fieldsT('newPassword')}</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder={fieldsT('newPasswordPlaceholder')}
                                        required
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        autoComplete="new-password"
                                    />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="confirmPassword">
                                        {fieldsT('confirmPassword')}
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder={fieldsT('confirmPasswordPlaceholder')}
                                        required
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        autoComplete="new-password"
                                    />
                                </div>
                                {passwordTooShort && (
                                    <div className="text-red-500 text-xs text-center">
                                        {validationT('passwordMin', { min: passwordMinLength })}
                                    </div>
                                )}
                                {!passwordTooShort &&
                                    !passwordsMatch &&
                                    confirmPassword.length > 0 && (
                                        <div className="text-red-500 text-xs text-center">
                                            {validationT('passwordsDontMatch')}
                                        </div>
                                    )}
                                {error && (
                                    <div className="text-red-500 text-sm text-center mt-2">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="text-green-600 text-sm text-center mt-2">
                                        {success}
                                    </div>
                                )}
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? t('button.resetting') : t('button.reset')}
                                </Button>
                                <div className="text-center text-sm">
                                    <Link href="/login" className="underline underline-offset-4">
                                        {t('backToLogin')}
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
