import { Metadata } from 'next';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';
import { generateLegalMetadata } from '@/components/legal/generateLegalMetadata';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    return generateLegalMetadata('impressum', params);
}

export default async function ImpressumPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return <LegalPageTemplate pageType="impressum" locale={locale} />;
}
