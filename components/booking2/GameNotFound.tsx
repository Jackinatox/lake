import { AlertCircle, Home, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GameNotFoundProps {
    linkBackTo: string;
}

export default function GameNotFound({ linkBackTo }: GameNotFoundProps) {
    const t = useTranslations('buyGameServer.errors');

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <Search className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">{t('gameNotFound.title')}</CardTitle>
                    <CardDescription className="text-base">
                        {t('gameNotFound.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <Button asChild className="w-full">
                        <Link href={linkBackTo}>
                            <Search className="mr-2 h-4 w-4" />
                            {t('gameNotFound.browseGames')}
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            {t('gameNotFound.home')}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
