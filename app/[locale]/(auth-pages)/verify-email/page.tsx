'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from '@/i18n/navigation';

export default function VerifyEmailPage() {
    const t = useTranslations('RegisterLogin.verifyEmail');
    const searchParams = useSearchParams();
    const session = authClient.useSession();
    const emailParam = searchParams.get('email')?.trim() ?? '';
    const sessionEmail = session.data?.user?.email?.trim() ?? '';
    const displayEmail = emailParam || sessionEmail;
    const isSessionPending = session.isPending;
    const isVerified = Boolean(session.data?.user?.emailVerified);
    const showVerifiedState = !isSessionPending && isVerified;
    const iconClasses = showVerifiedState
        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
        : 'bg-primary/10 text-primary';

    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleResend = async () => {
        try {
            setIsSubmitting(true);
            setStatus('idle');
            setStatusMessage(null);
            const targetEmail = emailParam || sessionEmail;
            if (!targetEmail) {
                setStatus('error');
                setStatusMessage(t('status.missingEmail'));
                return;
            }

            const { error } = await authClient.sendVerificationEmail({ email: targetEmail });
            if (error) {
                setStatus('error');
                setStatusMessage(error.message ?? t('status.error'));
                return;
            }
            setStatus('success');
            setStatusMessage(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : t('status.error');
            setStatus('error');
            setStatusMessage(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderLead = () => {
        if (showVerifiedState) {
            if (displayEmail) {
                return t.rich('status.alreadyVerified', {
                    email: displayEmail,
                    strong: (chunks) => <span className="font-semibold">{chunks}</span>,
                });
            }
            return t('status.verifiedInfo');
        }

        if (!displayEmail) {
            return t('subtitleFallback');
        }

        return t.rich('subtitle', {
            email: displayEmail,
            strong: (chunks) => <span className="font-semibold">{chunks}</span>,
        });
    };

    return (
        <div className="flex min-h-svh flex-col items-center justify-center p-0 md:p-10">
            <div className="w-full max-w-sm md:max-w-2xl">
                <Card>
                    <CardHeader className="text-center">
                        <div
                            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${iconClasses}`}
                        >
                            <MailCheck className="h-7 w-7" aria-hidden="true" />
                        </div>
                        <CardTitle className="text-2xl font-semibold">
                            {t(showVerifiedState ? 'titleVerified' : 'title')}
                        </CardTitle>
                        <CardDescription>
                            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                                <p>{renderLead()}</p>
                                {!showVerifiedState && <p>{t('description')}</p>}
                                {!showVerifiedState && !displayEmail && (
                                    <p>{t('status.missingEmail')}</p>
                                )}
                                {showVerifiedState && <p>{t('status.verifiedInfo')}</p>}
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {showVerifiedState ? (
                            <Alert className="border-emerald-500/60 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-50">
                                <AlertTitle>{t('titleVerified')}</AlertTitle>
                                <AlertDescription>{t('status.verifiedInfo')}</AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p>{t('tips.checkSpam')}</p>
                                    <p>{t('tips.typo')}</p>
                                    <p>{t('tips.contact')}</p>
                                </div>

                                {status !== 'idle' && (
                                    <Alert
                                        variant={status === 'error' ? 'destructive' : 'default'}
                                        className={
                                            status === 'success'
                                                ? 'border-green-500/60 bg-green-50 text-green-800 dark:border-green-500/40 dark:bg-green-950/40 dark:text-green-50'
                                                : undefined
                                        }
                                    >
                                        <AlertTitle>
                                            {status === 'success'
                                                ? t('status.sent')
                                                : t('status.error')}
                                        </AlertTitle>
                                        {statusMessage && (
                                            <AlertDescription>{statusMessage}</AlertDescription>
                                        )}
                                    </Alert>
                                )}
                            </>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        {showVerifiedState ? (
                            <Button asChild className="w-full">
                                <Link href="/">{t('cta.dashboard')}</Link>
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={handleResend}
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? t('resend.sending') : t('resend.button')}
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/login">{t('backToLogin')}</Link>
                                </Button>
                            </>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
