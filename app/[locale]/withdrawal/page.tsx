'use server';

import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { WithdrawalContent } from './WithdrawalContent';

export default async function WithdrawalPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const t = await getTranslations('withdrawalPage');

    if (!session) {
        return <NotLoggedIn />;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-0 md:p-4">
            <div>
                <h1 className="text-2xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
            </div>
            <WithdrawalContent userId={session.user.id} />
        </div>
    );
}
