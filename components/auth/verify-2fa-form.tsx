'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export function Verify2FAForm() {
    const t = useTranslations('RegisterLogin.login.twoFactor');
    const router = useRouter();

    const [useBackupCode, setUseBackupCode] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
                const result = useBackupCode
                    ? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
                    : await authClient.twoFactor.verifyTotp({ code: code.trim() });

                if (result?.error) {
                    setError(t('error'));
                } else {
                    router.push('/gameserver');
                }
            } catch {
                setError(t('error'));
            } finally {
                setLoading(false);
            }
        },
        [code, useBackupCode, t, router],
    );

    return (
        <div className="flex flex-col items-center justify-center sm:px-6 md:p-10">
            <div className="w-full sm:max-w-md">
                <div className="flex flex-col gap-6 w-full">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-xl">{t('title')}</CardTitle>
                            <CardDescription>{t('subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="two-factor-code">
                                            {useBackupCode ? t('backupLabel') : t('codeLabel')}
                                        </Label>
                                        <Input
                                            id="two-factor-code"
                                            placeholder={
                                                useBackupCode
                                                    ? t('backupPlaceholder')
                                                    : t('codePlaceholder')
                                            }
                                            value={code}
                                            onChange={(e) =>
                                                setCode(
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
                                            (!useBackupCode && code.length !== 6) ||
                                            (useBackupCode && code.trim().length < 6)
                                        }
                                    >
                                        {loading ? t('verifying') : t('verify')}
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
                                            setCode('');
                                            setError(null);
                                        }}
                                    >
                                        {useBackupCode ? t('totpLink') : t('backupLink')}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
