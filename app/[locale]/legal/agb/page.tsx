import { prisma } from '@/prisma';
import { marked } from 'marked';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';
import { cache } from 'react';
import { LEGAL_AGB_DE, LEGAL_AGB_EN } from '@/app/GlobalConstants';

const getKeyValueString = cache(async (key: string): Promise<string | null> => {
    try {
        const keyValue = await prisma.keyValue.findUnique({
            where: { key },
        });
        return keyValue?.string || null;
    } catch (error) {
        console.error('Failed to fetch legal content:', error);
        return null;
    }
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'legal' });

    return {
        title: t('agb'),
    };
}

export default async function AGBPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'legal' });

    // Fetch content from database using locale-specific key
    const contentKey = locale === 'de' ? LEGAL_AGB_DE : LEGAL_AGB_EN;
    const content = await getKeyValueString(contentKey);

    if (!content) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{t('agb')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Failed to load {t('agb')}. Content not available yet.
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
                    <CardTitle className="text-3xl">{t('agb')}</CardTitle>
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
