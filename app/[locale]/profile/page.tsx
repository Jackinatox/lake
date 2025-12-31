import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import PaymentList from './payments/PaymentList';
import ProfileInfo from './profile-info';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    const t = await getTranslations('payments');

    return (
        <div className="min-h-screen bg-background md:p-6">
            <div className="mx-auto max-w-2xl space-y-6">
                <ProfileInfo />

                <Suspense fallback={<div>{t('loadingPayments')}</div>}>
                    <PaymentList />
                </Suspense>

                {/* Support info */}
                <Card className="border-dashed">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-start gap-3">
                            <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="space-y-1 text-sm">
                                <p className="text-muted-foreground">
                                    {t('supportInfo.text')}{' '}
                                    <Link
                                        href="/support?category=BILLING"
                                        className="text-primary hover:underline font-medium"
                                    >
                                        {t('supportInfo.link')}
                                    </Link>
                                    .
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
