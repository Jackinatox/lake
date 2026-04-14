import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { headers } from 'next/headers';
import AccountTab from './AccountTab';
import SecurityTab from './SecurityTab';
import PaymentsTab from './PaymentsTab';
import ProfileTabs from './ProfileTabs';

const VALID_TABS = ['account', 'security', 'payments'] as const;
type TabValue = (typeof VALID_TABS)[number];

function normalizeTab(tab: string | undefined): TabValue {
    return VALID_TABS.includes(tab as TabValue) ? (tab as TabValue) : 'account';
}

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const [params, session] = await Promise.all([
        searchParams,
        auth.api.getSession({ headers: await headers() }),
    ]);

    if (!session) {
        return <NotLoggedIn />;
    }

    const defaultTab = normalizeTab(params.tab);

    return (
        <div className="min-h-screen bg-background p-0 pt-1 md:p-8">
            <div className="mx-auto max-w-2xl">
                <ProfileTabs
                    defaultTab={defaultTab}
                    accountTab={<AccountTab />}
                    securityTab={<SecurityTab />}
                    paymentsTab={<PaymentsTab />}
                />
            </div>
        </div>
    );
}
