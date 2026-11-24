import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { Wrench } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

/** Shown instead of the paid upgrade/extend configurator while `PAID_UPGRADE_DISABLED` is on. */
export default async function UpgradeUnavailable({ serverId }: { serverId: string }) {
    const t = await getTranslations('upgrade.unavailable');

    return (
        <div className="flex justify-center items-center w-full p-4 py-16">
            <Card className="w-full max-w-lg text-center shadow-lg">
                <CardHeader>
                    <div className="flex justify-center mb-2">
                        <Wrench className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold">{t('title')}</h2>
                </CardHeader>

                <CardContent className="space-y-3">
                    <p className="text-muted-foreground text-sm sm:text-base">{t('description')}</p>
                    <p className="text-muted-foreground text-sm sm:text-base">{t('support')}</p>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row justify-center gap-2">
                    <Button asChild variant="outline">
                        <Link href={`/gameserver/${serverId}`}>{t('back')}</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/support/tickets/new?category=BILLING">{t('contactSupport')}</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
