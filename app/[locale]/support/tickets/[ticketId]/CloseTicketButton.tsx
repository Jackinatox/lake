'use client';

import { closeTicketAction } from '@/app/actions/tickets/customerTicketActions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function CloseTicketButton({ ticketId }: { ticketId: string }) {
    const t = useTranslations('supportTickets');
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const close = () =>
        startTransition(async () => {
            const result = await closeTicketAction({ ticketId }).catch(() => null);
            if (!result?.success) {
                toast({
                    title: t(`errors.${result?.error ?? 'unknown'}`),
                    variant: 'destructive',
                });
                return;
            }
            router.refresh();
        });

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="shrink-0 sm:px-3"
                    disabled={isPending}
                    aria-label={t('detail.markSolved')}
                    title={t('detail.markSolved')}
                >
                    <CheckCircle2 className="h-4 w-4" />
                    {/* Icon-only on phones so the sticky header keeps room for the subject. */}
                    <span className="hidden sm:inline">{t('detail.markSolved')}</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('detail.markSolvedTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('detail.markSolvedDescription')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('detail.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={close}>
                        {t('detail.markSolvedConfirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
