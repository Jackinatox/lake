'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Suspense } from 'react';

export default function ProfileTabs({
    defaultTab,
    accountTab,
    securityTab,
    paymentsTab,
}: {
    defaultTab: string;
    accountTab: React.ReactNode;
    securityTab: React.ReactNode;
    paymentsTab: React.ReactNode;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const t = useTranslations('profile');

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const currentTab = searchParams.get('tab') || defaultTab;

    return (
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account">{t('tabs.account')}</TabsTrigger>
                <TabsTrigger value="security">{t('tabs.security')}</TabsTrigger>
                <TabsTrigger value="payments">{t('tabs.payments')}</TabsTrigger>
            </TabsList>

            <TabsContent value="account">{accountTab}</TabsContent>
            <TabsContent value="security">{securityTab}</TabsContent>
            <TabsContent value="payments">
                <Suspense>{paymentsTab}</Suspense>
            </TabsContent>
        </Tabs>
    );
}
