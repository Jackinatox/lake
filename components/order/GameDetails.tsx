import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { FaqSection } from '@/components/faq/FaqSection';
import { DOCS_URL } from '@/lib/metadata';

type GameDetailsProps = {
    game: { name: string; slug: string };
    hasFreeServers: boolean;
};

/**
 * Plain-text part of a game's order page, below the configurator: the per-game intro
 * (`gameDetails.intro.<slug>`, optional), links and the game's FAQ. Server types, versions and
 * hardware recommendations are not repeated here, the configurator above already shows them.
 * See docs/content-placement.md.
 */
export async function GameDetails({ game, hasFreeServers }: GameDetailsProps) {
    const t = await getTranslations('gameDetails');
    const intro = t.has(`intro.${game.slug}`) ? (t.raw(`intro.${game.slug}`) as string[]) : [];

    return (
        <section className="w-full max-w-7xl mx-auto px-1 pb-8 flex flex-col gap-6 border-t pt-6">
            {/* Games without written intro (yet) get no heading over an empty block */}
            {intro.length > 0 && (
                <div className="max-w-3xl">
                    <h2 className="text-lg md:text-xl font-semibold">
                        {t('heading', { game: game.name })}
                    </h2>
                    <div className="mt-2 space-y-3 text-sm text-muted-foreground">
                        {intro.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            )}

            <ul className="text-sm space-y-1">
                {hasFreeServers && (
                    <li>
                        <Link
                            href={`/order/free/${game.slug}`}
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            {t('freeServerLink', { game: game.name })}
                        </Link>
                    </li>
                )}
                <li>
                    {/* Plain <a>: the docs live outside lake's locale routing */}
                    <a
                        href={`${DOCS_URL}/server/hardware-und-leistung/`}
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        {t('docsHardwareLink')}
                    </a>
                </li>
            </ul>

            <FaqSection
                categories={[`game_${game.slug}`]}
                heading={t('faqHeading', { game: game.name })}
                className="max-w-3xl"
            />
        </section>
    );
}
