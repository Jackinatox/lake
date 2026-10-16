import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Info } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import HelpComponent from './HelpComponent';
import { createPrivateMetadata, getMetadataCopy } from '@/lib/metadata';
import type { Metadata } from 'next';

// Duplicate of /support/tickets until it is removed, so it is kept out of the index.
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return createPrivateMetadata({ title: getMetadataCopy(locale).supportTitle });
}

// Legacy contact form, superseded by /support/tickets; to be removed (see docs/support-tickets.md).
async function page() {
    const t = await getTranslations('getHelp');
    return (
        <section className="w-full">
            <div className="mx-auto max-w-6xl px-0 md:px-8 pt-6 md:pt-10">
                <div className="mb-8 flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-50 p-4 dark:bg-amber-950/30 sm:flex-row sm:items-center">
                    <Info className="hidden h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 sm:block" />
                    <div className="min-w-0 flex-1 space-y-0.5 text-sm">
                        <p className="font-medium">{t('legacyTitle')}</p>
                        <p className="text-muted-foreground">{t('legacyText')}</p>
                    </div>
                    <Button
                        asChild
                        size="sm"
                        className="shrink-0 gap-1.5 self-start sm:self-center"
                    >
                        <Link href="/support/tickets">
                            {t('legacyLink')}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                <div className="text-center space-y-4 md:space-y-6">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight animate-in fade-in slide-in-from-top-4">
                        {t('title1')}{' '}
                        <span className="text-primary drop-shadow-sm">{t('title2')}</span>{' '}
                        {t('title3')}
                    </h1>
                </div>
                <HelpComponent />
            </div>
        </section>
    );
}

export default page;
