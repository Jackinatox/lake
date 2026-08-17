import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ActiveSuspension } from '@/lib/gameserver/suspension';
import formatDate from '@/lib/formatDate';
import { ShieldAlert } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface ServerSuspendedProps {
    serverName: string;
    suspension: ActiveSuspension;
}

export default async function ServerSuspended({ serverName, suspension }: ServerSuspendedProps) {
    const t = await getTranslations('ServerSuspended');
    const until = formatDate(suspension.expiresAt, true);
    const supportHref = `/support?category=SUSPENSION&subject=${encodeURIComponent(
        t('ticketSubject', { serverName }),
    )}`;

    return (
        <div className="flex justify-center items-center min-h-screen p-4">
            <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg text-center shadow-lg">
                <CardHeader>
                    <div className="flex justify-center mb-2">
                        <ShieldAlert className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-xl font-semibold">{t('title')}</h2>
                </CardHeader>

                <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-sm sm:text-base">
                        {t('description', { serverName })}
                    </p>

                    <div className="rounded-lg border bg-muted/40 p-3 text-left">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                            {t('reasonLabel')}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{suspension.reason}</p>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {t('suspendedUntil', { date: until })}
                    </p>

                    {suspension.deleteAfterExpiry && (
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                            {t('deletionWarning', { date: until })}
                        </p>
                    )}

                    <p className="text-sm text-muted-foreground">{t('appealHint')}</p>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild>
                        <a href={supportHref}>{t('contactSupport')}</a>
                    </Button>
                    <Button variant="outline" asChild>
                        <a href="/">{t('home')}</a>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
