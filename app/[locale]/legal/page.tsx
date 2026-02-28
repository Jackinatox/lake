import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, FileText } from 'lucide-react';

const topics = ['tos', 'privacy', 'imprint', 'returns', 'payments'] as const;

export default async function LegalOverviewPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'legalOverview' });

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground mt-2">{t('description')}</p>
            </div>

            <div className="grid gap-3">
                {topics.map((topic) => (
                    <Link key={topic} href={`/legal/${topic}`}>
                        <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
                            <CardHeader className="py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div>
                                            <CardTitle className="text-base">
                                                {t(`topics.${topic}.title`)}
                                            </CardTitle>
                                            <CardDescription className="text-sm mt-0.5">
                                                {t(`topics.${topic}.description`)}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
