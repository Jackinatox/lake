'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export function ChangePasswordForm() {
    const t = useTranslations('RegisterLogin.changePassword');
    const fieldsT = useTranslations('RegisterLogin.fields');
    const validationT = useTranslations('RegisterLogin.validation');
    const router = useRouter();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOAuthUser, setIsOAuthUser] = useState(false);

    const passwordMinLength = 8;

    // Check if user is using OAuth login (client-side check as additional protection)
    useEffect(() => {
        try {
            const wasEmail = authClient.isLastUsedLoginMethod?.('email');
            if (wasEmail === false) {
                setIsOAuthUser(true);
            }
        } catch (error) {
            // If check fails, allow form to be shown (server-side check will catch OAuth users)
            console.error('Failed to check login method:', error);
        }
    }, []);

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

            if (!currentPassword.trim()) {
                setError(validationT('currentPasswordRequired'));
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
                const { error } = await authClient.changePassword({
                    currentPassword,
                    newPassword,
                    revokeOtherSessions: false,
                });

                if (error) {
                    // Handle specific error codes
                    if (error.status === 400) {
                        setError(validationT('invalidCurrentPassword'));
                    } else {
                        setError(error.message || t('errors.changeFailed'));
                    }
                } else {
                    setSuccess(t('success.changed'));
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    // Redirect to profile after successful password change
                    setTimeout(() => {
                        router.push('/profile');
                    }, 2000);
                }
            } catch (err: any) {
                setError(err?.message || t('errors.changeFailed'));
            } finally {
                setLoading(false);
            }
        },
        [currentPassword, newPassword, passwordMinLength, passwordsMatch, t, validationT, router],
    );

    // Show message for OAuth users (client-side fallback)
    if (isOAuthUser) {
        return (
            <div className="w-full">
                <div className="flex flex-col">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                                <ShieldAlert className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <CardTitle className="text-xl">
                                {t('oauthNotAvailable.title')}
                            </CardTitle>
                            <CardDescription>{t('oauthNotAvailable.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <p className="text-sm text-muted-foreground">
                                {t('oauthNotAvailable.description')}
                            </p>
                            <Button asChild variant="default">
                                <Link href="/profile">{t('oauthNotAvailable.backButton')}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex flex-col">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">{t('title')}</CardTitle>
                        <CardDescription>{t('subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="currentPassword">
                                        {fieldsT('currentPassword')}
                                    </Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        placeholder={fieldsT('currentPasswordPlaceholder')}
                                        required
                                        value={currentPassword}
                                        onChange={(event) => setCurrentPassword(event.target.value)}
                                        autoComplete="current-password"
                                    />
                                </div>
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
                                    {loading ? t('button.changing') : t('button.change')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
