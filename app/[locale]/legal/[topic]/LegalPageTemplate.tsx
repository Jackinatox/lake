import {
    LEGAL_AGB_DE,
    LEGAL_AGB_EN,
    LEGAL_DATENSCHUTZ_DE,
    LEGAL_DATENSCHUTZ_EN,
    LEGAL_IMPRESSUM_DE,
    LEGAL_IMPRESSUM_EN,
    LEGAL_PAYMENTS_DE,
    LEGAL_PAYMENTS_EN,
    LEGAL_RETURNS_DE,
    LEGAL_RETURNS_EN,
} from '@/app/GlobalConstants';
import { renderToHtml } from '@/components/legal/renderLegalMarkdown';
import { Card, CardContent } from '@/components/ui/card';
import { LegalTopic } from './page';
import { getKeyValueString } from '@/lib/keyValue';

const LEGAL_CONSTANTS_MAP: Record<LegalTopic, { de: string; en: string }> = {
    tos: { de: LEGAL_AGB_DE, en: LEGAL_AGB_EN },
    privacy: { de: LEGAL_DATENSCHUTZ_DE, en: LEGAL_DATENSCHUTZ_EN },
    imprint: { de: LEGAL_IMPRESSUM_DE, en: LEGAL_IMPRESSUM_EN },
    payments: { de: LEGAL_PAYMENTS_DE, en: LEGAL_PAYMENTS_EN },
    returns: { de: LEGAL_RETURNS_DE, en: LEGAL_RETURNS_EN },
};


interface LegalPageTemplateProps {
    pageType: LegalTopic;
    locale: string;
}

async function LegalPageTemplate({ pageType, locale }: LegalPageTemplateProps) {
    const content = await getLegalContent(locale, pageType);
    const htmlContent = renderToHtml(content);

    return (
        <div className="w-full max-w-4xl mx-auto">
            <Card>
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

export default LegalPageTemplate;

async function getLegalContent(locale: string, topic: LegalTopic): Promise<string> {
    const contentKey =
        locale === 'de' ? LEGAL_CONSTANTS_MAP[topic].de : LEGAL_CONSTANTS_MAP[topic].en;
    const content = await getKeyValueString(contentKey);
    return content || `Content for ${topic} not available yet.`;
}
