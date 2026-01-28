'use server';

import { getTranslations } from 'next-intl/server';
import HelpComponent from './HelpComponent';

async function page() {
    const t = await getTranslations('getHelp');
    return (
        <section className="w-full">
            <div className="mx-auto max-w-6xl px-0 md:px-8 pt-6 md:pt-10">
                <div className="text-center space-y-4 md:space-y-6">
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight animate-in fade-in slide-in-from-top-4">
                        {t('title1')}{' '}
                        <span className="text-primary drop-shadow-sm">{t('title2')}</span>{' '}
                        {t('title3')}
                    </h1>
                </div>
                <HelpComponent />
            </div>
        </section>
    );
}

export default page;
