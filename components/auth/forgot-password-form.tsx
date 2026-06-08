'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { AUTH_EMAIL_MAX_LENGTH, forgotPasswordSchema } from '@/lib/validation/auth';
import { getValidationMessage } from '@/lib/validation/common';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface ForgotPasswordFormProps extends React.ComponentProps<'div'> {
    initialEmail?: string;
}

export function ForgotPasswordForm({ className, initialEmail, ...props }: ForgotPasswordFormProps) {
    const t = useTranslations('RegisterLogin.forgotPassword');
    const fieldsT = useTranslations('RegisterLogin.fields');

    const [email, setEmail] = useState(initialEmail || '');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');
    const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setSuccess(null);

            try {
                const parsed = forgotPasswordSchema.parse({ email });
                setLoading(true);
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
                    email: parsed.email,
                    redirectTo,
                    fetchOptions: {
                        headers: { 'X-captcha-response': turnstileToken },
                    },
                });

                if (error) {
                    turnstileRef.current?.reset();
                    setTurnstileToken('');
                    setError(error.message || t('errors.requestFailed'));
                } else {
                    setSuccess(t('success.request'));
                    setEmail('');
                }
            } catch (err: any) {
                turnstileRef.current?.reset();
                setTurnstileToken('');
                setError(getValidationMessage(err) || t('errors.requestFailed'));
            } finally {
                setLoading(false);
            }
        },
        [email, t, turnstileToken],
    );

    return (
        <div className={cn('flex flex-col gap-6 w-full', className)} {...props}>
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
                                    maxLength={AUTH_EMAIL_MAX_LENGTH}
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                            {error && (
                                <div className="text-red-500 text-sm text-center mt-2">{error}</div>
                            )}
                            {success && (
                                <div className="text-green-600 text-sm text-center mt-2">
                                    {success}
                                </div>
                            )}
                            <Turnstile
                                ref={turnstileRef}
                                siteKey={process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY!}
                                onSuccess={setTurnstileToken}
                                onError={() => setTurnstileToken('')}
                                onExpire={() => setTurnstileToken('')}
                            />
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading || !turnstileToken}
                            >
                                {loading ? t('button.sending') : t('button.send')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
