import { Metadata } from 'next';
import { LegalPageTemplate } from '@/components/legal/LegalPageTemplate';
import { generateLegalMetadata } from '@/components/legal/generateLegalMetadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    return generateLegalMetadata('agb', params);
}

export default async function AGBPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return <LegalPageTemplate pageType="agb" locale={locale} />;
}
