import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalPageType } from './LegalPageTemplate';

export async function generateLegalMetadata(
    pageType: LegalPageType,
    params: Promise<{ locale: string }>,
): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'legal' });

    return {
        title: t(pageType),
    };
}
