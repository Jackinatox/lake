import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { createPrivateMetadata } from '@/lib/metadata';
import { resolveShareLink } from '@/lib/satisfactoryMap/shareLink';
import { buildMapUrl, verifyMapToken } from '@/lib/satisfactoryMap/token';
import { MapPinOff } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ locale: string; token: string }> };

export async function generateMetadata() {
    const t = await getTranslations('SatisfactoryMapShare');
    return createPrivateMetadata({ title: t('title') });
}

/**
 * The link a server owner shares with their players: checks the share link and forwards to the
 * hosted interactive map (in the visitor's language), which then loads the newest save through
 * `/api/satisfactory-map/<token>/save.sav`. Shows a message instead when the link is dead.
 * See docs/satisfactory-interactive-map.md.
 */
export default async function SatisfactoryMapSharePage({ params }: PageProps) {
    const { locale, token } = await params;
    const verified = verifyMapToken(token);

    let reason: 'invalid' | 'disabled' | 'unavailable' = 'invalid';
    if (verified.status === 'ok' && verified.kind === 'share') {
        const target = await resolveShareLink(verified.linkId);
        // Only ever to the fixed map URL built from the verified token, never to request input.
        if (target.status === 'ok') redirect(buildMapUrl(token, locale));
        if (target.status === 'disabled') reason = 'disabled';
        if (target.status === 'unavailable') reason = 'unavailable';
    }

    const t = await getTranslations('SatisfactoryMapShare');
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <div className="mb-2 flex justify-center">
                        <MapPinOff className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h1 className="text-xl font-semibold">{t(`${reason}.title`)}</h1>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{t(`${reason}.description`)}</p>
                </CardContent>
                <CardFooter className="justify-center">
                    <Button variant="outline" asChild>
                        <Link href="/">{t('home')}</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
