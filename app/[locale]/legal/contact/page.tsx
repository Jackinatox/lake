import { Card, CardContent } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'contact' });

    return (
        <div className="w-full max-w-xl mx-auto pb-40">
            <Card>
                <CardContent className="flex flex-col items-center text-center py-10 px-6 gap-4">
                    <Mail className="h-8 w-8 text-muted-foreground" />
                    <h1 className="text-2xl font-semibold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                    <a
                        href="mailto:info@scyed.com"
                        className="text-blue-500 underline hover:text-blue-400 transition-colors"
                    >
                        info@scyed.com
                    </a>
                </CardContent>
            </Card>
        </div>
    );
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'contact' });

    return {
        title: t('title'),
        description: t('description'),
    };
}
