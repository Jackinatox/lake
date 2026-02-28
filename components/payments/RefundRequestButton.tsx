'use client';

import { useState, useTransition } from 'react';
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
    checkWithdrawalEligibility,
    requestUserWithdrawal,
    WithdrawalEligibilityResult,
} from '@/app/actions/refunds/requestRefund';
import { Loader2, FileX2, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface RefundRequestButtonProps {
    orderId: string;
    orderAmount: number;
}

export function RefundRequestButton({ orderId, orderAmount }: RefundRequestButtonProps) {
    const t = useTranslations('payments.withdrawal');
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [eligibility, setEligibility] = useState<WithdrawalEligibilityResult | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleCheckEligibility = async () => {
        setIsChecking(true);
        try {
            const result = await checkWithdrawalEligibility(orderId);
            setEligibility(result);
            setDialogOpen(true);
        } catch {
            toast({
                title: t('errorTitle'),
                description: t('errorCheckingEligibility'),
                variant: 'destructive',
            });
        } finally {
            setIsChecking(false);
        }
    };

    const handleConfirmWithdrawal = () => {
        startTransition(async () => {
            try {
                const result = await requestUserWithdrawal(orderId);
                if (result.success) {
                    toast({
                        title: t('successTitle'),
                        description: result.message,
                    });
                    setDialogOpen(false);
                    router.refresh();
                } else {
                    toast({
                        title: t('errorTitle'),
                        description: result.message,
                        variant: 'destructive',
                    });
                }
            } catch {
                toast({
                    title: t('errorTitle'),
                    description: t('unexpectedError'),
                    variant: 'destructive',
                });
            }
        });
    };

    return (
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 md:h-9 md:w-9"
                onClick={handleCheckEligibility}
                disabled={isChecking}
                title={t('requestWithdrawal')}
            >
                {isChecking ? (
                    <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                ) : (
                    <FileX2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                )}
            </Button>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('dialogTitle')}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            {eligibility?.hasUpgradeOrders ? (
                                <div className="space-y-3">
                                    <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
                                        <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                                            {t('upgradeOrderExists')}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1.5">
                                            {t('upgradeOrderExistsDetail')}
                                        </p>
                                    </div>
                                    <Button variant="outline" className="w-full" asChild>
                                        <Link href="/support">
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            {t('openSupportTicket')}
                                        </Link>
                                    </Button>
                                </div>
                            ) : eligibility?.eligible ? (
                                <>
                                    <p>{t('eligible')}</p>
                                    <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span>{t('originalAmount')}:</span>
                                            <span className="font-medium">
                                                {(orderAmount / 100).toFixed(2)} €
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>{t('usedDays')}:</span>
                                            <span>
                                                {eligibility.usedDays} / {eligibility.totalDays}{' '}
                                                {t('days')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-medium text-green-600 dark:text-green-400">
                                            <span>{t('withdrawalAmount')}:</span>
                                            <span>
                                                {(eligibility.refundableAmountCents / 100).toFixed(2)} €
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1.5">
                                        {t('withdrawalNote')}
                                    </p>
                                </>
                            ) : (
                                <p className="text-destructive">
                                    {eligibility?.reason ?? t('notEligible')}
                                </p>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPending}>{t('cancel')}</AlertDialogCancel>
                    {eligibility?.eligible && !eligibility?.hasUpgradeOrders && (
                        <AlertDialogAction onClick={handleConfirmWithdrawal} disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            {t('confirm')}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
