import { marked } from 'marked';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTranslations } from 'next-intl/server';
import {
    LEGAL_IMPRESSUM_DE,
    LEGAL_IMPRESSUM_EN,
    LEGAL_AGB_DE,
    LEGAL_AGB_EN,
    LEGAL_DATENSCHUTZ_DE,
    LEGAL_DATENSCHUTZ_EN,
} from '@/app/GlobalConstants';
import { getKeyValueString } from '@/lib/keyValue';

export type LegalPageType = 'agb' | 'datenschutz' | 'impressum';

const LEGAL_CONSTANTS_MAP: Record<LegalPageType, { de: string; en: string }> = {
    agb: { de: LEGAL_AGB_DE, en: LEGAL_AGB_EN },
    datenschutz: { de: LEGAL_DATENSCHUTZ_DE, en: LEGAL_DATENSCHUTZ_EN },
    impressum: { de: LEGAL_IMPRESSUM_DE, en: LEGAL_IMPRESSUM_EN },
};

interface LegalPageTemplateProps {
    pageType: LegalPageType;
    locale: string;
}

export async function LegalPageTemplate({ pageType, locale }: LegalPageTemplateProps) {
    const t = await getTranslations({ locale, namespace: 'legal' });

    // Fetch content from database using locale-specific key
    const contentKey =
        locale === 'de' ? LEGAL_CONSTANTS_MAP[pageType].de : LEGAL_CONSTANTS_MAP[pageType].en;
    const content = await getKeyValueString(contentKey);

    if (!content) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{t(pageType)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Failed to load {t(pageType)}. Content not available yet.
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
                    <CardTitle className="text-3xl">{t(pageType)}</CardTitle>
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
