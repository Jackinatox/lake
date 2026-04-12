'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldOff, Copy, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Step = 'idle' | 'setup-qr' | 'setup-verify' | 'setup-backup';

export default function TwoFactorSetup() {
    const { data: session } = authClient.useSession();
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
    const isEmailUser = authClient.isLastUsedLoginMethod('email');

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
            const result = await authClient.twoFactor.enable({
                ...(isEmailUser && enablePassword ? { password: enablePassword } : {}),
            });
            if (result?.error) {
                setError(t('twoFactor.setupError'));
                return;
            }
            const data = result?.data;
            if (data?.totpURI) {
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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                {twoFactorEnabled ? (
                                    <ShieldCheck className="h-5 w-5 text-green-500" />
                                ) : (
                                    <ShieldOff className="h-5 w-5 text-muted-foreground" />
                                )}
                                {t('twoFactor.title')}
                            </CardTitle>
                            <CardDescription>{t('twoFactor.description')}</CardDescription>
                        </div>
                        <span
                            className={cn(
                                'text-sm font-medium flex items-center gap-1.5',
                                twoFactorEnabled
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <span
                                className={cn(
                                    'h-2 w-2 rounded-full shrink-0',
                                    twoFactorEnabled ? 'bg-green-500' : 'bg-muted-foreground/40',
                                )}
                            />
                            {twoFactorEnabled ? t('twoFactor.enabled') : t('twoFactor.disabled')}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    {twoFactorEnabled ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                                setError(null);
                                setDisablePassword('');
                                setShowDisableDialog(true);
                            }}
                        >
                            <ShieldOff className="h-4 w-4 mr-2" />
                            {t('twoFactor.disableButton')}
                        </Button>
                    ) : (
                        <Button size="sm" onClick={openSetup}>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            {t('twoFactor.enableButton')}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Enable 2FA Dialog */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!open) handleDone();
                }}
            >
                <DialogContent className="sm:max-w-md">
                    {step === 'setup-qr' && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{t('twoFactor.setupTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('twoFactor.setupStep1Title')}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                {isEmailUser && !totpUri && (
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
                            </div>
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
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
