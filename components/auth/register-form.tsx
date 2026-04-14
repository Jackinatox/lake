'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    AUTH_EMAIL_MAX_LENGTH,
    AUTH_NAME_MAX_LENGTH,
    AUTH_PASSWORD_MAX_LENGTH,
    AUTH_PASSWORD_MIN_LENGTH,
    AUTH_USERNAME_MAX_LENGTH,
    authUsernameSchema,
    registerFormSchema,
} from '@/lib/validation/auth';
import { getValidationMessage } from '@/lib/validation/common';

import { authClient } from '@/lib/auth-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Turnstile } from '@marsidev/react-turnstile';
import { env } from 'next-runtime-env';
import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function RegisterForm({ className, ...props }: React.ComponentProps<'div'>) {
    const router = useRouter();
    const t = useTranslations('RegisterLogin');

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [turnstileToken, setTurnstileToken] = useState('');
    const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
    const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Live username availability check
    useEffect(() => {
        if (checkTimerRef.current) clearTimeout(checkTimerRef.current);

        if (!username) {
            setUsernameStatus('idle');
            return;
        }
        if (username.length < 3) {
            setUsernameStatus('idle');
            return;
        }
        if (!authUsernameSchema.safeParse(username).success) {
            setUsernameStatus('invalid');
            return;
        }

        setUsernameStatus('checking');
        checkTimerRef.current = setTimeout(async () => {
            try {
                const { data } = await authClient.isUsernameAvailable({ username });
                setUsernameStatus(data?.available ? 'available' : 'taken');
            } catch {
                setUsernameStatus('idle');
            }
        }, 500);

        return () => {
            if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
        };
    }, [username]);

    const passwordsMatch =
        password === confirmPassword && password.length >= AUTH_PASSWORD_MIN_LENGTH;
    const passwordTooShort = password.length > 0 && password.length < AUTH_PASSWORD_MIN_LENGTH;
    const usernameIsValid = username.length >= 3 && authUsernameSchema.safeParse(username).success;
    const emailValid = email.trim().length > 0;
    const nameValid = name.trim().length > 0;

    const canSubmit =
        !loading &&
        !!turnstileToken &&
        nameValid &&
        usernameIsValid &&
        usernameStatus === 'available' &&
        emailValid &&
        password.length >= AUTH_PASSWORD_MIN_LENGTH &&
        passwordsMatch;

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);

            try {
                const parsed = registerFormSchema.parse({
                    name,
                    username,
                    email,
                    password,
                    confirmPassword,
                    turnstileToken,
                });
                setLoading(true);
                const { data, error } = await authClient.signUp.email(
                    {
                        email: parsed.email,
                        password: parsed.password,
                        name: parsed.name,
                        username: parsed.username,
                        displayUsername: parsed.username,
                        image: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(parsed.username)}`,
                        callbackURL: '/verify-email',
                    } as Parameters<typeof authClient.signUp.email>[0],
                    {
                        headers: {
                            'X-captcha-response': parsed.turnstileToken,
                        },
                    },
                );

                if (error) {
                    setError(error.message || t('errors.registrationFailed'));
                } else if (data) {
                    router.push(`/verify-email?email=${encodeURIComponent(parsed.email)}`);
                }
            } catch (err: unknown) {
                setError(getValidationMessage(err) || t('errors.registrationFailed'));
            } finally {
                setLoading(false);
            }
        },
        [username, password, confirmPassword, email, name, t, turnstileToken, router],
    );

    return (
        <div className={cn('flex flex-col gap-5 w-full', className)} {...props}>
            <Card className="shadow-sm">
                <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-semibold">{t('title')}</CardTitle>
                    <CardDescription className="text-sm">{t('subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-5">
                            {/* OAuth buttons */}
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="outline"
                                    className="w-full h-11"
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
                                        className="mr-2 h-4 w-4 shrink-0"
                                        fill="currentColor"
                                    >
                                        <path d="M18.942 5.556a16.299 16.299 0 0 0-4.126-1.297c-.178.321-.385.754-.529 1.097a15.175 15.175 0 0 0-4.573 0 11.583 11.583 0 0 0-.535-1.097 16.274 16.274 0 0 0-4.129 1.3c-2.611 3.946-3.319 7.794-2.965 11.587a16.494 16.494 0 0 0 5.061 2.593 12.65 12.65 0 0 0 1.084-1.785 10.689 10.689 0 0 1-1.707-.831c.143-.106.283-.217.418-.331 3.291 1.539 6.866 1.539 10.118 0 .137.114.277.225.418.331-.541.326-1.114.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595c.415-4.396-.709-8.209-2.973-11.589zM8.678 14.813c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c.001 1.123-.793 2.045-1.798 2.045zm6.644 0c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c0 1.123-.793 2.045-1.798 2.045z" />
                                    </svg>
                                    {t('oauth.discord')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-11"
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
                                        className="mr-2 h-4 w-4 shrink-0"
                                    >
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    {t('oauth.google')}
                                </Button>
                            </div>

                            {/* Divider */}
                            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                                <span className="bg-card text-muted-foreground relative z-10 px-2">
                                    {t('orContinueWith')}
                                </span>
                            </div>

                            {/* Form fields */}
                            <div className="flex flex-col gap-4">
                                {/* Full name */}
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="name">{t('fields.name')}</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder={t('fields.namePlaceholder')}
                                        required
                                        maxLength={AUTH_NAME_MAX_LENGTH}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoComplete="name"
                                        className="h-11"
                                    />
                                </div>

                                {/* Username with live check */}
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="username">{t('fields.username')}</Label>
                                    <div className="relative">
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder={t('fields.usernamePlaceholder')}
                                            required
                                            maxLength={AUTH_USERNAME_MAX_LENGTH}
                                            value={username}
                                            onChange={(e) =>
                                                setUsername(e.target.value.replace(/\s/g, ''))
                                            }
                                            autoComplete="username"
                                            autoCapitalize="none"
                                            autoCorrect="off"
                                            spellCheck={false}
                                            className="h-11 pr-10"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                            {usernameStatus === 'checking' && (
                                                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                                            )}
                                            {usernameStatus === 'available' && (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            )}
                                            {(usernameStatus === 'taken' ||
                                                usernameStatus === 'invalid') && (
                                                <XCircle className="h-4 w-4 text-destructive" />
                                            )}
                                        </span>
                                    </div>
                                    {usernameStatus === 'available' && (
                                        <p className="text-xs text-green-600">
                                            {t('username.available')}
                                        </p>
                                    )}
                                    {usernameStatus === 'taken' && (
                                        <p className="text-xs text-destructive">
                                            {t('username.taken')}
                                        </p>
                                    )}
                                    {usernameStatus === 'invalid' && (
                                        <p className="text-xs text-destructive">
                                            {t('validation.usernameNoAt')}
                                        </p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="email">{t('fields.email')}</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder={t('fields.emailPlaceholder')}
                                        required
                                        maxLength={AUTH_EMAIL_MAX_LENGTH}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        className="h-11"
                                    />
                                </div>

                                {/* Password */}
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="password">{t('fields.password')}</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            maxLength={AUTH_PASSWORD_MAX_LENGTH}
                                            placeholder={t('fields.passwordPlaceholder')}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            autoComplete="new-password"
                                            className="h-11 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            tabIndex={-1}
                                            aria-label={
                                                showPassword ? 'Hide password' : 'Show password'
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {passwordTooShort && (
                                        <p className="text-xs text-destructive">
                                            {t('validation.passwordMin', {
                                                min: AUTH_PASSWORD_MIN_LENGTH,
                                            })}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="confirmPassword">
                                        {t('fields.confirmPassword')}
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder={t('fields.confirmPasswordPlaceholder')}
                                            required
                                            maxLength={AUTH_PASSWORD_MAX_LENGTH}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            autoComplete="new-password"
                                            className="h-11 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            tabIndex={-1}
                                            aria-label={
                                                showConfirmPassword
                                                    ? 'Hide password'
                                                    : 'Show password'
                                            }
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {!passwordTooShort &&
                                        !passwordsMatch &&
                                        confirmPassword.length > 0 && (
                                            <p className="text-xs text-destructive">
                                                {t('validation.passwordsDontMatch')}
                                            </p>
                                        )}
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive text-center">{error}</p>
                                )}

                                <Turnstile
                                    siteKey={env('NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY')!}
                                    onSuccess={setTurnstileToken}
                                    onError={() => setTurnstileToken('')}
                                    onExpire={() => setTurnstileToken('')}
                                />

                                <Button type="submit" className="w-full h-11" disabled={!canSubmit}>
                                    {loading ? t('button.registering') : t('button.register')}
                                </Button>
                            </div>

                            <div className="text-center text-sm">
                                {t('alreadyAccount.text')}{' '}
                                <Link
                                    href="/login"
                                    className="underline underline-offset-4 font-medium"
                                >
                                    {t('alreadyAccount.login')}
                                </Link>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <p className="text-muted-foreground text-center text-xs text-balance px-2">
                {t.rich('disclaimer', {
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
            </p>
        </div>
    );
}
