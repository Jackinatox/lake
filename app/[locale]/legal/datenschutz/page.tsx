import { marked } from 'marked';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';
import { LEGAL_DATENSCHUTZ_DE, LEGAL_DATENSCHUTZ_EN } from '@/app/GlobalConstants';
import { getKeyValueString } from '@/lib/keyValue';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'legal' });

    return {
        title: t('datenschutz'),
    };
}

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'legal' });

    // Fetch content from database using locale-specific key
    const contentKey = locale === 'de' ? LEGAL_DATENSCHUTZ_DE : LEGAL_DATENSCHUTZ_EN;
    const content = await getKeyValueString(contentKey);

    if (!content) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{t('datenschutz')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Failed to load {t('datenschutz')}. Content not available yet.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Parse markdown to HTML
    const htmlContent = await marked(content);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl">{t('datenschutz')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
