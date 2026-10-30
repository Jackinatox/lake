import { Gift, LayoutGrid, SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';

interface GameNotFoundProps {
    linkBackTo: string;
}

export default function GameNotFound({ linkBackTo }: GameNotFoundProps) {
    const t = useTranslations('buyGameServer.errors.gameNotFound');

    return (
        <div className="flex min-h-[60vh] items-center justify-center py-8 md:py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="items-center space-y-0 px-5 pt-8 pb-6 text-center md:px-8 md:pt-10">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <SearchX className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-balance">
                        {t('title')}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground text-pretty sm:text-base">
                        {t('description')}
                    </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 px-5 pb-6 md:px-8 md:pt-0 md:pb-8">
                    <Button asChild size="lg" className="h-11 w-full">
                        <Link href={linkBackTo}>
                            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                            {t('browseGames')}
                        </Link>
                    </Button>
                    {linkBackTo !== '/order/free' && (
                        <Button asChild size="lg" variant="outline" className="h-11 w-full">
                            <Link href="/order/free">
                                <Gift className="h-4 w-4" aria-hidden="true" />
                                {t('freeServer')}
                            </Link>
                        </Button>
                    )}
                    <p className="mt-3 border-t pt-5 text-center text-sm text-muted-foreground">
                        {t.rich('missingGame', {
                            link: (chunks) => (
                                <Link
                                    href="/support/tickets"
                                    className="-my-3 inline-block py-3 font-medium text-foreground underline underline-offset-4 hover:text-primary"
                                >
                                    {chunks}
                                </Link>
                            ),
                        })}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
