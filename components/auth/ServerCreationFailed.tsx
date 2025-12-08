import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface ServerCreationFailedProps {
    serverId: string;
}

export default async function ServerCreationFailed({ serverId }: ServerCreationFailedProps) {
    const t = await getTranslations('ServerCreationFailed');

    return (
        <div className="flex justify-center items-center min-h-screen p-4">
            <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg text-center shadow-lg">
                <CardHeader>
                    <div className="flex justify-center mb-2">
                        <Clock className="w-12 h-12 text-orange-500" />
                    </div>
                    <h2 className="text-xl font-semibold">{t('title')}</h2>
                </CardHeader>

                <CardContent>
                    <p className="text-muted-foreground text-sm sm:text-base">{t('description')}</p>
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
