import { Suspense } from 'react';
import PaymentList from './payments/PaymentList';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function PaymentsTab() {
    const t = await getTranslations('payments');

    return (
        <div className="space-y-4">
            <Suspense
                fallback={
                    <div className="py-8 text-center text-muted-foreground text-sm">
                        {t('loadingPayments')}
                    </div>
                }
            >
                <PaymentList />
            </Suspense>

            <Card className="border-dashed">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
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
                </CardContent>
            </Card>
        </div>
    );
}
