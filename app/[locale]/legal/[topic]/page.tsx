import { notFound } from 'next/navigation';
import LegalPageTemplate from './LegalPageTemplate';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

const topics = ['tos', 'privacy', 'imprint', 'returns', 'payments'] as const;
export type LegalTopic = (typeof topics)[number];

export default async function page({
    params,
}: {
    params: Promise<{ locale: string; topic: string }>;
}) {
    const { locale, topic } = await params;

    if (!topics.includes(topic as LegalTopic)) {
        notFound();
    }
    const castTopic: LegalTopic = topic as LegalTopic;

    return <LegalPageTemplate pageType={castTopic} locale={locale} />;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; topic: string }>;
}): Promise<Metadata> {
    const { locale, topic } = await params;
    const t = await getTranslations({ locale, namespace: 'legalOverview' });

    if (!topics.includes(topic as LegalTopic)) {
        notFound();
    }
    const castTopic: LegalTopic = topic as LegalTopic;

    return {
        title: `${castTopic.toUpperCase()} - Legal`,
        description: t(`topics.${topic}.description`),
    };
}
