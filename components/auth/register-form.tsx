'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export function RegisterForm({ className, ...props }: React.ComponentProps<'div'>) {
    const t = useTranslations('RegisterLogin');

    return (
        <div className={cn('flex flex-col gap-5 w-full', className)} {...props}>
            <Card className="shadow-sm">
                <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-semibold">{t('title')}</CardTitle>
                    <CardDescription className="text-sm">{t('subtitle')}</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                    <div className="flex flex-col gap-5">
                        {/* Security notice */}
                        <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    {t('security.title')}
                                </p>
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    {t('security.description')}
                                </p>
                            </div>
                        </div>

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
                                    style={{ fill: '#5865F2' }}
                                    fillRule="evenodd"
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
