'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** Low-key email fallback below the ticket list; tickets stay the preferred channel. */
export default function SupportEmailHint({ email }: { email: string }) {
    const t = useTranslations('supportTickets.landing');
    const tHelp = useTranslations('getHelp');
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(email);
            toast({ title: tHelp('copyEmailSuccess'), description: email });
        } catch {
            toast({ title: tHelp('copyEmailError'), variant: 'destructive' });
        }
    };

    return (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center">
            <Mail className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
            <div className="min-w-0 flex-1 space-y-0.5 text-sm">
                <p className="font-medium">{t('emailTitle')}</p>
                <p className="text-muted-foreground">
                    {t.rich('emailText', {
                        email: () => (
                            <a
                                href={`mailto:${email}`}
                                className="font-medium text-foreground underline underline-offset-4"
                            >
                                {email}
                            </a>
                        ),
                    })}
                </p>
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 gap-1.5 self-start sm:self-center"
            >
                <Copy className="h-3.5 w-3.5" />
                {tHelp('copyEmail')}
            </Button>
        </div>
    );
}
