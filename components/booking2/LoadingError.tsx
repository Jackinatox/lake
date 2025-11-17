import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoadingError() {
    const t = useTranslations('buyGameServer.errors');

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">{t('loadingError.title')}</CardTitle>
                    <CardDescription className="text-base">
                        {t('loadingError.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <Button onClick={() => window.location.reload()} className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('loadingError.retry')}
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            {t('loadingError.home')}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
