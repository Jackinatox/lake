import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { isMaintenanceMode } from '@/lib/maintenance';
import { ShieldAlert } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    const t = await getTranslations('Maintenance');
    return { title: t('title') };
}

export default async function MaintenancePage() {
    if (!isMaintenanceMode()) redirect('/');

    const t = await getTranslations('Maintenance');

    return (
        <div className="flex justify-center items-center min-h-[60vh] p-4">
            <Card className="w-full max-w-sm sm:max-w-md md:max-w-xl text-center shadow-lg">
                <CardHeader>
                    <div className="flex justify-center mb-2">
                        <ShieldAlert className="w-12 h-12 text-amber-500" />
                    </div>
                    <h1 className="text-xl font-semibold">{t('title')}</h1>
                </CardHeader>

                <CardContent className="space-y-4 text-left">
                    <p className="text-sm sm:text-base">{t('description')}</p>
                    <p className="text-sm text-muted-foreground">{t('impact')}</p>
                    <p className="text-sm text-muted-foreground">{t('next')}</p>
                    <p className="text-sm text-muted-foreground">{t('apology')}</p>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild>
                        <a href="/support">{t('contactSupport')}</a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a href="/">{t('home')}</a>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
