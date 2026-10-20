import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { FaqSection } from '@/components/faq/FaqSection';
import { formatVCoresFromPercent } from '@/lib/GlobalFunctions/formatVCores';
import { formatMB } from '@/lib/GlobalFunctions/ptResourceLogic';
import type { HardwareRecommendationSlim } from '@/models/prisma';
import type { GameFlavor } from '@/types/gameData';

type GameDetailsProps = {
    game: { name: string; slug: string; data: unknown };
    hardwareRecommendations: HardwareRecommendationSlim[];
    hasFreeServers: boolean;
    modpacksEnabled: boolean;
};

/**
 * Plain-text part of a game's order page, below the configurator. Everything lake knows (server
 * types and versions, modpack support, hardware recommendations) is rendered from the game's
 * data; only the per-game intro is copy (`gameDetails.intro.<slug>`, optional). See
 * docs/content-placement.md.
 */
export async function GameDetails({
    game,
    hardwareRecommendations,
    hasFreeServers,
    modpacksEnabled,
}: GameDetailsProps) {
    const t = await getTranslations('gameDetails');
    const intro = t.has(`intro.${game.slug}`)
        ? (t.raw(`intro.${game.slug}`) as string[])
        : [];

    const data = (game.data ?? {}) as {
        flavors?: GameFlavor[];
        modpackPlatforms?: { modrinth?: unknown };
    };
    const flavors = data.flavors ?? [];
    const showModpacks = modpacksEnabled && !!data.modpackPlatforms?.modrinth;

    // Flavor versions are listed newest first
    const versionRange = (flavor: GameFlavor) => {
        const newest = flavor.versions[0]?.version;
        const oldest = flavor.versions[flavor.versions.length - 1]?.version;
        if (!newest) return '';
        return newest === oldest ? newest : t('versionRange', { oldest, newest });
    };
    const recommendationLabel = (rec: HardwareRecommendationSlim) =>
        flavors.find((flavor) => flavor.egg_id === rec.eggId)?.name ?? game.name;
    const hardware = (cpuPercent: number, ramMb: number) =>
        `${formatVCoresFromPercent(cpuPercent)}, ${formatMB(ramMb)}`;

    return (
        <section className="w-full max-w-7xl mx-auto px-1 pb-8 flex flex-col gap-6 border-t pt-6">
            {/* Games without written intro (yet) get no heading over an empty block */}
            {(intro.length > 0 || showModpacks) && (
                <div className="max-w-3xl">
                    <h2 className="text-lg md:text-xl font-semibold">
                        {t('heading', { game: game.name })}
                    </h2>
                    <div className="mt-2 space-y-3 text-sm text-muted-foreground">
                        {intro.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                        {showModpacks && <p>{t('modpacks')}</p>}
                    </div>
                </div>
            )}

            {flavors.length > 0 && (
                <DetailsTable
                    title={t('serverTypesTitle')}
                    headers={[t('colServerType'), t('colVersions')]}
                    rows={flavors.map((flavor) => [flavor.name, versionRange(flavor)])}
                />
            )}

            {hardwareRecommendations.length > 0 && (
                <DetailsTable
                    title={t('hardwareTitle')}
                    subtitle={t('hardwareSubtitle')}
                    headers={[t('colVariant'), t('colMinimum'), t('colRecommended')]}
                    rows={hardwareRecommendations.map((rec) => [
                        <>
                            {recommendationLabel(rec)}
                            {rec.note && (
                                <span className="block text-xs font-normal text-muted-foreground">
                                    {rec.note}
                                </span>
                            )}
                        </>,
                        hardware(rec.minCpuPercent, rec.minramMb),
                        hardware(rec.recCpuPercent, rec.recRamMb),
                    ])}
                />
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
                        href="/docs/server/hardware-und-leistung/"
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

function DetailsTable({
    title,
    subtitle,
    headers,
    rows,
}: {
    title: string;
    subtitle?: string;
    headers: string[];
    rows: React.ReactNode[][];
}) {
    return (
        <div className="max-w-3xl">
            <h3 className="text-sm font-semibold">{title}</h3>
            {subtitle && <p className="mb-2 text-xs text-muted-foreground">{subtitle}</p>}
            <div className={`rounded-xl border bg-card overflow-x-auto ${subtitle ? '' : 'mt-2'}`}>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {headers.map((header, i) => (
                                <th
                                    key={header}
                                    scope="col"
                                    className={`px-4 py-2.5 font-medium ${i === 0 ? 'text-left' : 'text-right'}`}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((cells, r) => (
                            <tr key={r} className={r < rows.length - 1 ? 'border-b' : undefined}>
                                {cells.map((cell, i) =>
                                    i === 0 ? (
                                        <th
                                            key={i}
                                            scope="row"
                                            className="px-4 py-3 text-left font-semibold"
                                        >
                                            {cell}
                                        </th>
                                    ) : (
                                        <td key={i} className="px-4 py-3 text-right tabular-nums">
                                            {cell}
                                        </td>
                                    ),
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
