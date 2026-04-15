'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { authClient } from '@/lib/auth-client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    ShieldCheck,
    ShieldOff,
    Copy,
    Check,
    Loader2,
    Smartphone,
    CheckCircle2,
    RefreshCw,
    AlertTriangle,
    Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type Step = 'idle' | 'setup-qr' | 'setup-verify' | 'setup-backup';

export default function TwoFactorSetup() {
    const { data: session, isPending } = authClient.useSession();
    const t = useTranslations('profile');
    const router = useRouter();

    const [step, setStep] = useState<Step>('idle');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [totpUri, setTotpUri] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [verifyCode, setVerifyCode] = useState('');
    const [enablePassword, setEnablePassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDisableDialog, setShowDisableDialog] = useState(false);
    const [disablePassword, setDisablePassword] = useState('');
    const [copied, setCopied] = useState(false);
    const [savedConfirmed, setSavedConfirmed] = useState(false);

    const twoFactorEnabled = session?.user?.twoFactorEnabled ?? false;

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
                <CardContent>
                    <div className="h-14 w-full rounded-lg bg-muted animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    const openSetup = () => {
        setStep('setup-qr');
        setError(null);
        setEnablePassword('');
        setVerifyCode('');
        setTotpUri('');
        setBackupCodes([]);
        setSavedConfirmed(false);
        setDialogOpen(true);
    };

    const handleEnable = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (twoFactorEnabled) {
                const disableResult = await authClient.twoFactor.disable({
                    password: enablePassword,
                });
                if (disableResult?.error) {
                    setError(t('twoFactor.setupError'));
                    return;
                }
            }

            const result = await authClient.twoFactor.enable({
                ...(enablePassword ? { password: enablePassword } : {}),
            });
            if (result?.error) {
                setError(t('twoFactor.setupError'));
                return;
            }
            const data = result?.data;
            if (data?.method === 'totp' && data.totpURI) {
                setTotpUri(data.totpURI);
                setBackupCodes(data.backupCodes ?? []);
                setStep('setup-verify');
            } else {
                setError(t('twoFactor.setupError'));
            }
        } catch {
            setError(t('twoFactor.setupError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (verifyCode.length !== 6) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await authClient.twoFactor.verifyTotp({ code: verifyCode });
            if (result?.error) {
                setError(t('twoFactor.verifyError'));
                return;
            }
            setStep('setup-backup');
        } catch {
            setError(t('twoFactor.verifyError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDone = () => {
        setDialogOpen(false);
        setStep('idle');
        router.refresh();
    };

    const handleDisable = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await authClient.twoFactor.disable({
                password: disablePassword,
            });
            if (result?.error) {
                setError(t('twoFactor.disableError'));
                return;
            }
            setShowDisableDialog(false);
            setDisablePassword('');
            router.refresh();
        } catch {
            setError(t('twoFactor.disableError'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyBackupCodes = async () => {
        await navigator.clipboard.writeText(backupCodes.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const extractSecret = (uri: string) => {
        const match = uri.match(/secret=([^&]+)/);
        return match?.[1] ?? '';
    };

    return (
        <>
            {twoFactorEnabled ? (
                <Card className="border-green-200 dark:border-green-900/40">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">
                                        {t('twoFactor.title')}
                                    </CardTitle>
                                    <CardDescription className="mt-0.5">
                                        {t('twoFactor.description')}
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge
                                variant="outline"
                                className="shrink-0 border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                            >
                                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                                {t('twoFactor.enabled')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-none">
                                    {t('twoFactor.methodTitle')}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('twoFactor.methodDescription')}
                                </p>
                            </div>
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto sm:mr-auto"
                                onClick={openSetup}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {t('twoFactor.reconfigureButton')}
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    setError(null);
                                    setDisablePassword('');
                                    setShowDisableDialog(true);
                                }}
                            >
                                <ShieldOff className="h-4 w-4 mr-2" />
                                {t('twoFactor.disableButton')}
                            </Button>
                        </div>
                        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            {t('twoFactor.oauthDisclaimer')}
                        </p>
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
                                <CardTitle className="text-base">{t('twoFactor.title')}</CardTitle>
                                <CardDescription className="mt-0.5">
                                    {t('twoFactor.description')}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-dashed p-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                                <p className="text-sm text-muted-foreground">
                                    {t('twoFactor.notEnabledMessage')}
                                </p>
                            </div>
                            <Button size="sm" className="w-full sm:w-auto" onClick={openSetup}>
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                {t('twoFactor.enableButton')}
                            </Button>
                        </div>
                        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            {t('twoFactor.oauthDisclaimer')}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Enable 2FA Dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) handleDone();
                }}
            >
                <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md overflow-y-auto max-h-[90dvh]">
                    {step === 'setup-qr' && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{t('twoFactor.setupTitle')}</DialogTitle>
                                <DialogDescription>{t('twoFactor.description')}</DialogDescription>
                            </DialogHeader>
                            {!totpUri && (
                                <div className="space-y-2">
                                    <Label htmlFor="enable-password">
                                        {t('twoFactor.disablePassword')}
                                    </Label>
                                    <Input
                                        id="enable-password"
                                        type="password"
                                        placeholder={t('twoFactor.disablePasswordPlaceholder')}
                                        value={enablePassword}
                                        onChange={(e) => setEnablePassword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleEnable()}
                                    />
                                </div>
                            )}
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    {t('twoFactor.close')}
                                </Button>
                                <Button onClick={handleEnable} disabled={isLoading}>
                                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Next
                                </Button>
                            </DialogFooter>
                        </>
                    )}

                    {step === 'setup-verify' && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{t('twoFactor.setupStep1Title')}</DialogTitle>
                                <DialogDescription>
                                    {t('twoFactor.setupStep1Description')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                {totpUri && (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-3 bg-white rounded-lg">
                                            <QRCodeSVG value={totpUri} size={180} />
                                        </div>
                                        <div className="w-full">
                                            <p className="text-xs text-muted-foreground mb-1">
                                                {t('twoFactor.manualCode')}
                                            </p>
                                            <code className="block text-xs bg-muted px-2 py-1.5 rounded break-all select-all">
                                                {extractSecret(totpUri)}
                                            </code>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="verify-code">
                                        {t('twoFactor.verificationCode')}
                                    </Label>
                                    <Input
                                        id="verify-code"
                                        placeholder={t('twoFactor.verificationCodePlaceholder')}
                                        value={verifyCode}
                                        onChange={(e) =>
                                            setVerifyCode(
                                                e.target.value.replace(/\D/g, '').slice(0, 6),
                                            )
                                        }
                                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                        maxLength={6}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        className="tracking-widest text-center text-lg"
                                    />
                                </div>
                                {error && <p className="text-sm text-destructive">{error}</p>}
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleVerify}
                                    disabled={isLoading || verifyCode.length !== 6}
                                    className="w-full"
                                >
                                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    {t('twoFactor.verifyButton')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}

                    {step === 'setup-backup' && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{t('twoFactor.backupCodesTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('twoFactor.backupCodesDescription')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                                    {backupCodes.map((code) => (
                                        <code key={code} className="text-sm font-mono text-center">
                                            {code}
                                        </code>
                                    ))}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleCopyBackupCodes}
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 mr-2 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4 mr-2" />
                                    )}
                                    {copied
                                        ? t('twoFactor.copied')
                                        : t('twoFactor.copyBackupCodes')}
                                </Button>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={savedConfirmed}
                                        onChange={(e) => setSavedConfirmed(e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm">{t('twoFactor.savedConfirm')}</span>
                                </label>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleDone}
                                    disabled={!savedConfirmed}
                                    className="w-full"
                                >
                                    {t('twoFactor.close')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Disable 2FA Dialog */}
            <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('twoFactor.disableTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('twoFactor.disableDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2 px-1">
                        <Label htmlFor="disable-password">{t('twoFactor.disablePassword')}</Label>
                        <Input
                            id="disable-password"
                            type="password"
                            placeholder={t('twoFactor.disablePasswordPlaceholder')}
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDisable()}
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setError(null)}>
                            {t('twoFactor.disableCancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDisable}
                            disabled={isLoading || !disablePassword}
                            className={buttonVariants({ variant: 'destructive' })}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t('twoFactor.disableConfirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
