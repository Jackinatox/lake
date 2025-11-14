'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface ForgotPasswordFormProps extends React.ComponentProps<'div'> {
    initialEmail?: string;
}

export function ForgotPasswordForm({ className, initialEmail, ...props }: ForgotPasswordFormProps) {
    const t = useTranslations('RegisterLogin.forgotPassword');
    const fieldsT = useTranslations('RegisterLogin.fields');
    const validationT = useTranslations('RegisterLogin.validation');

    const [email, setEmail] = useState(initialEmail || '');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);

            if (!email.trim()) {
                setError(validationT('emailRequired'));
                return;
            }

            setLoading(true);
            try {
                const redirectTo =
                    typeof window !== 'undefined'
                        ? (() => {
                              const url = new URL(window.location.href);
                              url.pathname = url.pathname.replace(
                                  'forgot-password',
                                  'reset-password',
                              );
                              url.search = '';
                              url.hash = '';
                              return url.toString();
                          })()
                        : undefined;

                const { error } = await authClient.requestPasswordReset({
                    email,
                    redirectTo,
                });

                if (error) {
                    setError(error.message || t('errors.requestFailed'));
                } else {
                    setSuccess(t('success.request'));
                    setEmail('');
                }
            } catch (err: any) {
                setError(err?.message || t('errors.requestFailed'));
            } finally {
                setLoading(false);
            }
        },
        [email, t, validationT],
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
                                    <Label htmlFor="email">{fieldsT('email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={fieldsT('emailPlaceholder')}
                                        required
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        autoComplete="email"
                                    />
                                </div>
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
                                    {loading ? t('button.sending') : t('button.send')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
