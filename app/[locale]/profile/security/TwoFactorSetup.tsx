'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { authClient } from '@/lib/auth-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    Copy,
    Info,
    Loader2,
    Lock,
    ShieldCheck,
    ShieldOff,
    Smartphone,
} from 'lucide-react';

// Better Auth's twoFactor plugin only enforces 2FA on credential sign-ins
// (email/username) and requires a password to enable/disable it. OAuth-only
// sessions therefore can't manage 2FA, so we block the UI for them. These are
// the login methods recorded by the lastLoginMethod plugin for credentials;
// anything else (google, discord, ...) is treated as an OAuth session.
const CREDENTIAL_METHODS = ['email', 'username'];

type SetupStep = 'password' | 'scan' | 'backup';

function extractSecret(totpURI: string) {
    return totpURI.match(/secret=([^&]+)/)?.[1] ?? '';
}

export default function TwoFactorSetup() {
    const { data: session, isPending } = authClient.useSession();
    const t = useTranslations('profile.twoFactor');
    const router = useRouter();

    const twoFactorEnabled = session?.user?.twoFactorEnabled ?? false;
    const loginMethod = authClient.getLastUsedLoginMethod();
    const isOAuthSession = !!loginMethod && !CREDENTIAL_METHODS.includes(loginMethod);

    // Setup (enable) dialog
    const [setupOpen, setSetupOpen] = useState(false);
    const [step, setStep] = useState<SetupStep>('password');
    const [password, setPassword] = useState('');
    const [totpURI, setTotpURI] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [code, setCode] = useState('');
    const [savedConfirmed, setSavedConfirmed] = useState(false);
    const [copied, setCopied] = useState(false);

    // Disable dialog
    const [disableOpen, setDisableOpen] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetSetup = () => {
        setStep('password');
        setPassword('');
        setTotpURI('');
        setBackupCodes([]);
        setCode('');
        setSavedConfirmed(false);
        setError(null);
        setLoading(false);
    };

    const openSetup = () => {
        resetSetup();
        setSetupOpen(true);
    };

    const closeSetup = () => {
        setSetupOpen(false);
        resetSetup();
    };

    // Step 1: verify password and generate the TOTP secret + backup codes.
    const handleEnable = async () => {
        if (!password) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await authClient.twoFactor.enable({ password });
            if (error || !data?.totpURI) {
                setError(t('setupError'));
                return;
            }
            setTotpURI(data.totpURI);
            setBackupCodes(data.backupCodes ?? []);
            setStep('scan');
        } catch {
            setError(t('setupError'));
        } finally {
            setLoading(false);
        }
    };

    // Step 2: confirm the first TOTP code — this is what actually flips
    // twoFactorEnabled to true on the server.
    const handleVerify = async () => {
        if (code.length !== 6) return;
        setLoading(true);
        setError(null);
        try {
            const { error } = await authClient.twoFactor.verifyTotp({ code });
            if (error) {
                setError(t('verifyError'));
                return;
            }
            setStep('backup');
        } catch {
            setError(t('verifyError'));
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        closeSetup();
        router.refresh();
    };

    const handleDisable = async () => {
        if (!disablePassword) return;
        setLoading(true);
        setError(null);
        try {
            const { error } = await authClient.twoFactor.disable({ password: disablePassword });
            if (error) {
                setError(t('disableError'));
                return;
            }
            setDisableOpen(false);
            setDisablePassword('');
            router.refresh();
        } catch {
            setError(t('disableError'));
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = async () => {
        await navigator.clipboard.writeText(backupCodes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isPending) {
        return (
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-muted animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                            <div className="h-3 w-56 rounded bg-muted animate-pulse" />
                        </div>
                    </div>
                </CardHeader>
            </Card>
        );
    }

    // OAuth sessions can't manage 2FA (no password to confirm, and OAuth logins
    // aren't gated by 2FA anyway). Show an explanatory blocker instead.
    if (isOAuthSession) {
        const provider = loginMethod
            ? loginMethod.charAt(0).toUpperCase() + loginMethod.slice(1)
            : '';
        return (
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-base">{t('title')}</CardTitle>
                            <CardDescription className="mt-0.5">{t('description')}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-2 rounded-lg border border-dashed p-4">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                            {t('oauthBlockedMessage', { provider })}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {twoFactorEnabled ? (
                <Card className="border-green-200 dark:border-green-900/40">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{t('title')}</CardTitle>
                                <CardDescription className="mt-0.5">
                                    {t('description')}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-none">
                                    {t('methodTitle')}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('methodDescription')}
                                </p>
                            </div>
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => {
                                setError(null);
                                setDisablePassword('');
                                setDisableOpen(true);
                            }}
                        >
                            <ShieldOff className="mr-2 h-4 w-4" />
                            {t('disableButton')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                                <ShieldOff className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{t('title')}</CardTitle>
                                <CardDescription className="mt-0.5">
                                    {t('description')}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                                <p className="text-sm text-muted-foreground">
                                    {t('notEnabledMessage')}
                                </p>
                            </div>
                            <Button size="sm" className="w-full sm:w-auto" onClick={openSetup}>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                {t('enableButton')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Enable 2FA: password -> scan & verify -> backup codes */}
            <Dialog
                open={setupOpen}
                onOpenChange={(open) => {
                    if (!open) closeSetup();
                }}
            >
                <DialogContent className="max-h-[90dvh] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-md">
                    {step === 'password' && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{t('setupTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('passwordStepDescription')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="enable-password">{t('password')}</Label>
                                <Input
                                    id="enable-password"
                                    type="password"
                                    placeholder={t('passwordPlaceholder')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEnable()}
                                    autoComplete="current-password"
                                    autoFocus
                                />
                            </div>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <DialogFooter>
                                <Button variant="outline" onClick={closeSetup}>
                                    {t('close')}
                                </Button>
                                <Button onClick={handleEnable} disabled={loading || !password}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('continueButton')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}

                    {step === 'scan' && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{t('setupStep1Title')}</DialogTitle>
                                <DialogDescription>{t('setupStep1Description')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="rounded-lg bg-white p-3">
                                        <QRCodeSVG value={totpURI} size={180} />
                                    </div>
                                    <div className="w-full">
                                        <p className="mb-1 text-xs text-muted-foreground">
                                            {t('manualCode')}
                                        </p>
                                        <code className="block select-all break-all rounded bg-muted px-2 py-1.5 text-xs">
                                            {extractSecret(totpURI)}
                                        </code>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="verify-code">{t('verificationCode')}</Label>
                                    <Input
                                        id="verify-code"
                                        placeholder={t('verificationCodePlaceholder')}
                                        value={code}
                                        onChange={(e) =>
                                            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                                        }
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                        maxLength={6}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        className="text-center text-lg tracking-widest"
                                        autoFocus
                                    />
                                </div>
                                {error && <p className="text-sm text-destructive">{error}</p>}
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleVerify}
                                    disabled={loading || code.length !== 6}
                                    className="w-full"
                                >
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('verifyButton')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}

                    {step === 'backup' && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{t('backupCodesTitle')}</DialogTitle>
                                <DialogDescription>{t('backupCodesDescription')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3">
                                    {backupCodes.map((c) => (
                                        <code key={c} className="text-center font-mono text-sm">
                                            {c}
                                        </code>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={copyBackupCodes}
                                >
                                    {copied ? (
                                        <Check className="mr-2 h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="mr-2 h-4 w-4" />
                                    )}
                                    {copied ? t('copied') : t('copyBackupCodes')}
                                </Button>
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={savedConfirmed}
                                        onChange={(e) => setSavedConfirmed(e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm">{t('savedConfirm')}</span>
                                </label>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleFinish}
                                    disabled={!savedConfirmed}
                                    className="w-full"
                                >
                                    {t('close')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Disable 2FA */}
            <AlertDialog
                open={disableOpen}
                onOpenChange={(open) => {
                    setDisableOpen(open);
                    if (!open) {
                        setDisablePassword('');
                        setError(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('disableTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('disableDescription')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 px-1">
                        <Label htmlFor="disable-password">{t('disablePassword')}</Label>
                        <Input
                            id="disable-password"
                            type="password"
                            placeholder={t('disablePasswordPlaceholder')}
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDisable()}
                            autoComplete="current-password"
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('disableCancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDisable();
                            }}
                            disabled={loading || !disablePassword}
                            className={buttonVariants({ variant: 'destructive' })}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('disableConfirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
