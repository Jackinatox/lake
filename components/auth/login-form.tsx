'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Turnstile } from '@marsidev/react-turnstile';
import { env } from 'next-runtime-env';
import { ShieldCheck } from 'lucide-react';

type SignInEmailResult = Awaited<ReturnType<typeof authClient.signIn.email>>;
type SignInEmailData = SignInEmailResult['data'];

function getTwoFactorRedirect(data: SignInEmailData) {
    return (
        typeof data === 'object' &&
        data !== null &&
        'twoFactorRedirect' in data &&
        data.twoFactorRedirect === true
    );
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : null;
}

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
    const t = useTranslations('RegisterLogin.login');
    const tr = useTranslations('RegisterLogin');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');

    // 2FA state
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [useBackupCode, setUseBackupCode] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
                const trimmedEmail = email.trim();
                const { data, error } = await authClient.signIn.email({
                    email: trimmedEmail,
                    password,
                    callbackURL: '/gameserver',
                    fetchOptions: {
                        headers: {
                            'X-captcha-response': turnstileToken,
                        },
                    },
                });
                if (error) {
                    const message = error.message || t('errors.loginFailed');
                    const errorCode = (error as { code?: string | undefined }).code?.toLowerCase();
                    const shouldRedirectToVerification =
                        errorCode === 'email_not_verified' ||
                        errorCode === 'email-not-verified' ||
                        /verify/.test(message.toLowerCase());

                    if (shouldRedirectToVerification) {
                        router.push(`/verify-email?email=${encodeURIComponent(trimmedEmail)}`);
                        return;
                    }

                    setError(message);
                } else if (getTwoFactorRedirect(data)) {
                    // Better Auth signals that 2FA is required — show verification step
                    setShowTwoFactor(true);
                } else {
                    // Fully signed in — callbackURL handles redirect
                }
            } catch (error: unknown) {
                setError(getErrorMessage(error) || t('errors.unexpected'));
            } finally {
                setLoading(false);
            }
        },
        [email, password, router, t, turnstileToken],
    );

    const handleTwoFactorVerify = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
                const result = useBackupCode
                    ? await authClient.twoFactor.verifyBackupCode({
                          code: twoFactorCode.trim(),
                      })
                    : await authClient.twoFactor.verifyTotp({
                          code: twoFactorCode.trim(),
                      });

                if (result?.error) {
                    setError(t('twoFactor.error'));
                } else {
                    router.push('/gameserver');
                }
            } catch (error: unknown) {
                setError(getErrorMessage(error) || t('twoFactor.error'));
            } finally {
                setLoading(false);
            }
        },
        [twoFactorCode, useBackupCode, t, router],
    );

    // ── 2FA verification step ─────────────────────────────────────────────────
    if (showTwoFactor) {
        return (
            <div className="flex justify-center">
                <div className={cn('flex flex-col gap-6', className)} {...props}>
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-xl">{t('twoFactor.title')}</CardTitle>
                            <CardDescription>{t('twoFactor.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleTwoFactorVerify}>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="two-factor-code">
                                            {useBackupCode
                                                ? t('twoFactor.backupLabel')
                                                : t('twoFactor.codeLabel')}
                                        </Label>
                                        <Input
                                            id="two-factor-code"
                                            placeholder={
                                                useBackupCode
                                                    ? t('twoFactor.backupPlaceholder')
                                                    : t('twoFactor.codePlaceholder')
                                            }
                                            value={twoFactorCode}
                                            onChange={(e) =>
                                                setTwoFactorCode(
                                                    useBackupCode
                                                        ? e.target.value
                                                        : e.target.value
                                                              .replace(/\D/g, '')
                                                              .slice(0, 6),
                                                )
                                            }
                                            inputMode={useBackupCode ? 'text' : 'numeric'}
                                            autoComplete="one-time-code"
                                            maxLength={useBackupCode ? 32 : 6}
                                            className={cn(
                                                !useBackupCode &&
                                                    'tracking-widest text-center text-lg',
                                            )}
                                            autoFocus
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={
                                            loading ||
                                            (!useBackupCode && twoFactorCode.length !== 6) ||
                                            (useBackupCode && twoFactorCode.trim().length < 6)
                                        }
                                    >
                                        {loading ? t('twoFactor.verifying') : t('twoFactor.verify')}
                                    </Button>
                                    {error && (
                                        <p className="text-sm text-destructive text-center">
                                            {error}
                                        </p>
                                    )}
                                    <button
                                        type="button"
                                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 text-center"
                                        onClick={() => {
                                            setUseBackupCode((v) => !v);
                                            setTwoFactorCode('');
                                            setError(null);
                                        }}
                                    >
                                        {useBackupCode
                                            ? t('twoFactor.totpLink')
                                            : t('twoFactor.backupLink')}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

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
                                <div className="flex flex-col gap-4">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        type="button"
                                        onClick={() =>
                                            authClient.signIn.social({
                                                provider: 'discord',
                                                callbackURL: '/gameserver',
                                            })
                                        }
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="mr-2 h-4 w-4"
                                            fill="currentColor"
                                        >
                                            <path d="M18.942 5.556a16.299 16.299 0 0 0-4.126-1.297c-.178.321-.385.754-.529 1.097a15.175 15.175 0 0 0-4.573 0 11.583 11.583 0 0 0-.535-1.097 16.274 16.274 0 0 0-4.129 1.3c-2.611 3.946-3.319 7.794-2.965 11.587a16.494 16.494 0 0 0 5.061 2.593 12.65 12.65 0 0 0 1.084-1.785 10.689 10.689 0 0 1-1.707-.831c.143-.106.283-.217.418-.331 3.291 1.539 6.866 1.539 10.118 0 .137.114.277.225.418.331-.541.326-1.114.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595c.415-4.396-.709-8.209-2.973-11.589zM8.678 14.813c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c.001 1.123-.793 2.045-1.798 2.045zm6.644 0c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c0 1.123-.793 2.045-1.798 2.045z" />
                                        </svg>
                                        {t('oauthDiscord')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        type="button"
                                        onClick={() =>
                                            authClient.signIn.social({
                                                provider: 'google',
                                                callbackURL: '/gameserver',
                                            })
                                        }
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="mr-2 h-4 w-4"
                                        >
                                            <path
                                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        {t('oauthGoogle')}
                                    </Button>
                                </div>
                                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                                        {t('orContinueWith')}
                                    </span>
                                </div>
                                <div className="grid gap-6">
                                    <div className="grid gap-3">
                                        <Label htmlFor="email">{t('fields.email')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder={t('fields.emailPlaceholder')}
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            autoComplete="email"
                                        />
                                    </div>
                                    <div className="grid gap-3">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">{t('fields.password')}</Label>
                                            <Link
                                                href="/forgot-password"
                                                className="ml-auto text-sm underline-offset-4 hover:underline"
                                            >
                                                {t('fields.forgot')}
                                            </Link>
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            placeholder={tr('fields.passwordPlaceholder')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="current-password"
                                        />
                                    </div>
                                    <Turnstile
                                        siteKey={env('NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY')!}
                                        onSuccess={setTurnstileToken}
                                        onError={() => setTurnstileToken('')}
                                        onExpire={() => setTurnstileToken('')}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={loading || !turnstileToken}
                                    >
                                        {loading ? t('button.loggingIn') : t('button.login')}
                                    </Button>
                                    {error && (
                                        <div className="text-red-500 text-sm text-center mt-2">
                                            {error}
                                        </div>
                                    )}
                                </div>
                                <div className="text-center text-sm">
                                    {tr('login.noAccount.text')}{' '}
                                    <Link href="/register" className="underline underline-offset-4">
                                        {tr('login.noAccount.signUp')}
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
                <div className="text-muted-foreground text-center text-xs text-balance">
                    {tr.rich('disclaimer', {
                        terms: (chunks) => (
                            <Link
                                href="/legal/tos"
                                className="underline underline-offset-4 hover:text-primary"
                            >
                                {chunks}
                            </Link>
                        ),
                        privacy: (chunks) => (
                            <Link
                                href="/legal/privacy"
                                className="underline underline-offset-4 hover:text-primary"
                            >
                                {chunks}
                            </Link>
                        ),
                    })}
                </div>
            </div>
        </div>
    );
}
