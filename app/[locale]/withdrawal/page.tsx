import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { WithdrawalContent } from './WithdrawalContent';
import { FaqSection } from '@/components/faq/FaqSection';

export default async function WithdrawalPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const t = await getTranslations('withdrawalPage');

    if (!session) {
        return <NotLoggedIn />;
    }

    return (
        <div className="max-w-4xl mx-auto md:space-y-4 space-y-2">
            <div>
                <h1 className="md:text-3xl text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
            </div>
            <WithdrawalContent userId={session.user.id} />
            <FaqSection categories={['refunds']} heading={t('faqHeading')} className="px-1 pt-10" />
        </div>
    );
}
