import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';

export const SITE_NAME = 'Scyed Hosting';

/** Absolute site origin for sitemap.xml and robots.txt, which need full URLs. */
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://scyed.com';

// Social/link previews (Telegram, Twitter, etc.) size the image from the actual file at
// og:image, not from the declared width/height. Serving a small optimized version via the
// Next image optimizer makes platforms render a compact thumbnail instead of a huge banner.
const OG_IMAGE_WIDTH = 256;

/** Builds an absolute, small, optimized og:image URL from a local public path. */
function buildOgImageUrl(path: string): string {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
    return `${base}/_next/image?url=${encodeURIComponent(path)}&w=${OG_IMAGE_WIDTH}&q=75`;
}

/** Default og:image used for public pages that don't supply their own. */
const DEFAULT_OG_IMAGE: MetaImage = {
    path: '/logo/ScyedLogoBlack.webp',
    alt: SITE_NAME,
};

/** og:image for a game page, using the dark game icon convention. */
export function gameIconImage(gameName: string, alt: string): MetaImage {
    return { path: `/images/dark/games/icons/${gameName.toLowerCase()}.webp`, alt };
}

type SupportedLocale = (typeof routing.locales)[number];

/** `BlogPost` has no language field: every post is written in German, also under /en/blog. */
export const BLOG_CONTENT_LOCALE: SupportedLocale = 'de';
type SearchParamValue = string | string[] | undefined;
type SearchParamRecord = Record<string, SearchParamValue>;

const ogLocaleByLocale: Record<SupportedLocale, string> = {
    de: 'de_DE',
    en: 'en_US',
};

const metadataCopy = {
    de: {
        homeTitle: 'Gameserver-Hosting leicht gemacht',
        homeDescription:
            'Miete Deinen Gameserver mit flexibler CPU, RAM und Laufzeit. Startklar in Sekunden, mit übersichtlichem Control Panel, Backups und kostenlosen Servern zum Testen.',
        blogTitle: 'Blog',
        blogDescription:
            'Neuigkeiten, Anleitungen und Hintergründe rund um Gameserver-Hosting bei Scyed.',
        changelogTitle: 'Neuigkeiten',
        changelogDescription:
            'Die neuesten Updates, Verbesserungen und Fehlerbehebungen bei Scyed Hosting.',
        supportTitle: 'Support',
        supportDescription:
            'Eröffne ein Ticket und schreib direkt mit unserem Team. Du bekommst eine E-Mail, sobald wir antworten.',
        supportTicketTitle: 'Support-Ticket',
        orderIndexTitle: 'Gameserver-Hosting',
        orderIndexDescription:
            'Wähle ein Spiel und konfiguriere Deinen Gameserver mit flexibler Hardware, Speichertiers und schnellem Setup.',
        orderConfigureTitle: (summary?: string) =>
            summary ? `Hardware konfigurieren - ${summary}` : 'Hardware konfigurieren',
        orderConfigureDescription:
            'Wähle CPU, RAM, Laufzeit und Speichertier, bevor Du Dein Spiel auswählst.',
        orderConfigureGamesTitle: (summary?: string) =>
            summary ? `Spiel wählen - ${summary}` : 'Spiel wählen',
        orderConfigureGamesDescription:
            'Wähle ein Spiel für Deine konfigurierte Hardware und fahre mit dem Setup fort.',
        // Game names in title and description: searches name the game ("kostenloser Minecraft
        // Server"), and without them the per-game funnel pages outranked this overview.
        freeOrderIndexTitle: (games: string[]) =>
            games.length === 0
                ? 'Kostenlose Gameserver'
                : games.length <= 2
                  ? `Kostenlose Gameserver für ${new Intl.ListFormat('de', { type: 'conjunction' }).format(games)}`
                  : `Kostenlose Gameserver für ${games.slice(0, 2).join(', ')} & mehr`,
        freeOrderIndexDescription: (games: string[]) =>
            games.length === 0
                ? 'Starte einen kostenlosen Gameserver, ohne Zahlungsdaten und ohne Abo.'
                : `Kostenlose Gameserver für ${new Intl.ListFormat('de', { type: 'conjunction' }).format(games)}: ohne Zahlungsdaten und ohne Abo, kostenlos verlängerbar.`,
        orderCheckoutTitle: 'Checkout',
        orderCheckoutDescription:
            'Schließe den sicheren Checkout für Deine Gameserver-Bestellung ab.',
        gameserversTitle: 'Gameserver',
        gameserversDescription: 'Verwalte Deine Gameserver, Laufzeiten, Upgrades und Spielwechsel.',
        gameserverFallbackTitle: 'Gameserver',
        gameOrderTitle: (gameName: string) => `${gameName} Gameserver`,
        gameOrderDescription: (gameName: string) =>
            `Konfiguriere einen ${gameName}-Gameserver mit flexibler CPU, RAM und Backups.`,
        gameSetupTitle: (gameName: string, summary?: string) =>
            summary ? `${gameName} Setup - ${summary}` : `${gameName} Setup`,
        gameSetupDescription: (gameName: string) =>
            `Schließe das Setup für Deinen ${gameName}-Gameserver ab und prüfe die gewählte Hardware vor dem Checkout.`,
        freeGameTitle: (gameName: string) => `Kostenloser ${gameName} Server`,
        freeGameDescription: (gameName: string) =>
            `Erstelle einen kostenlosen ${gameName}-Server und starte ohne Vorabzahlung los.`,
        gameserverDashboardTitle: (serverName: string) => `${serverName} Dashboard`,
        gameserverDashboardDescription: (serverName: string, gameName?: string | null) =>
            gameName
                ? `Verwalte ${serverName}, Deinen ${gameName}-Gameserver.`
                : `Verwalte Deinen Gameserver ${serverName}.`,
        gameserverUpgradeTitle: (serverName: string) => `${serverName} Upgrade`,
        gameserverUpgradeDescription: (serverName: string) =>
            `Verlängere oder upgrade den Server ${serverName}.`,
        freeGameserverUpgradeTitle: (serverName: string) => `${serverName} Free-Upgrade`,
        freeGameserverUpgradeDescription: (serverName: string) =>
            `Verlängere ${serverName} oder wechsle vom kostenlosen Tarif auf bezahlte Hardware.`,
        paidGameserverUpgradeTitle: (serverName: string) => `${serverName} Upgrade`,
        paidGameserverUpgradeDescription: (serverName: string) =>
            `Passe Hardware oder Laufzeit für ${serverName} an.`,
        gameserverChangeGameTitle: (serverName: string) => `${serverName} - Spiel wechseln`,
        gameserverChangeGameDescription: (serverName: string) =>
            `Wähle ein neues Spiel für ${serverName}.`,
        gameserverChangeGameSetupTitle: (serverName: string, gameName: string) =>
            `${serverName} -> ${gameName}`,
        gameserverChangeGameSetupDescription: (serverName: string, gameName: string) =>
            `Prüfe die Konfiguration und wechsle ${serverName} auf ${gameName}.`,
        checkoutOrderTitle: (gameName: string, locationName?: string | null) =>
            locationName ? `Checkout ${gameName} - ${locationName}` : `Checkout ${gameName}`,
        checkoutOrderDescription: (gameName: string, locationName?: string | null) =>
            locationName
                ? `Schließe den sicheren Checkout für Deinen ${gameName}-Server in ${locationName} ab.`
                : `Schließe den sicheren Checkout für Deinen ${gameName}-Server ab.`,
        hardwareCores: (value: string) => `${value} Kerne`,
        hardwareRam: (value: string) => `${value} GiB RAM`,
        hardwareDays: (value: string) => `${value} Tage`,
        freePageHeading: 'Hol Dir Deinen kostenlosen Gameserver',
        freePageHeadingHighlight: 'kostenlosen',
        freePageSubheading: 'Keine Zahlungsdaten erforderlich',
        freePageWhyFreeQuestion: 'Warum kostenlos?',
        freePageWhyFreeAnswerShort:
            'Wir möchten, dass Du uns ohne Risiko kennenlernen kannst. Deshalb laufen auch die kostenlosen Server auf moderner Hardware.',
        freePageWhyFreeAnswerLong:
            'Wir möchten, dass Du uns ohne Risiko kennenlernen kannst. Deshalb laufen auch die kostenlosen Server auf moderner Hardware mit hoher Leistung pro Kern, auf die es bei Gameservern besonders ankommt.',
        freePageNoCatchLabel: 'Fair Play',
        freePageNoCatchPoints: [
            'Keine Slot-Begrenzung',
            'Keine Warteschlange',
            'Läuft weiter, auch wenn niemand online ist',
        ],
        freePageSpecsLabel: 'Server-Specs',
        freePageSpecCpuOn: (cpu: string) => `auf ${cpu}`,
        freePageSpecDisk: 'Speicherplatz',
        freePageSelectGame: 'Wähle Dein Spiel',
        freePageFaqHeading: 'Häufige Fragen',
        freePageAboutHeading: 'So funktioniert Dein kostenloser Gameserver',
        freePageAboutParagraphs: ({ games, durationDays, maxServers, deleteAfterDays }) => [
            `Bei Scyed bekommst Du einen kostenlosen Gameserver für ${new Intl.ListFormat('de', { type: 'conjunction' }).format(games)}, ohne Zahlungsdaten und ohne Abo. Du meldest Dich mit Discord oder Google an, wählst Dein Spiel und Dein Server wird automatisch eingerichtet. Verwaltet wird er in unserem eigenen Dashboard mit Konsole, Dateimanager, Backups und Einstellungen.` +
                (maxServers === 1
                    ? ' Pro Account kannst Du einen kostenlosen Server betreiben.'
                    : maxServers > 1
                      ? ` Pro Account kannst Du bis zu ${maxServers} kostenlose Server gleichzeitig betreiben.`
                      : ''),
            `Ein kostenloser Server läuft ${durationDays} Tage. Du kannst ihn jederzeit mit wenigen Klicks kostenlos verlängern, so oft Du willst, die Laufzeit startet dann wieder bei ${durationDays} Tagen. Verlängerst Du nicht, schaltet sich der Server nach Ablauf ab. Deine Daten bleiben erhalten und mit einer Verlängerung läuft er wieder. Verlängerst Du einen abgelaufenen Server nicht innerhalb von ${deleteAfterDays} Tagen, wird er gelöscht.`,
        ],
    },
    en: {
        homeTitle: 'Game Server Hosting Made Easy',
        homeDescription:
            'Rent your game server with flexible CPU, RAM and runtime. Ready in seconds, with a clean control panel, backups and free servers to try us out.',
        blogTitle: 'Blog',
        blogDescription: 'News, guides and background on game server hosting at Scyed.',
        changelogTitle: "What's New",
        changelogDescription: 'The latest updates, improvements and fixes at Scyed Hosting.',
        supportTitle: 'Support',
        supportDescription:
            "Open a ticket and chat directly with our team. You'll get an email whenever we reply.",
        supportTicketTitle: 'Support ticket',
        orderIndexTitle: 'Game Server Hosting',
        orderIndexDescription:
            'Choose a game and configure your game server with flexible hardware, storage tiers, and fast setup.',
        orderConfigureTitle: (summary?: string) =>
            summary ? `Configure Hardware - ${summary}` : 'Configure Hardware',
        orderConfigureDescription:
            'Choose CPU, RAM, duration, and a storage tier before selecting your game.',
        orderConfigureGamesTitle: (summary?: string) =>
            summary ? `Choose a Game - ${summary}` : 'Choose a Game',
        orderConfigureGamesDescription:
            'Pick a game for your configured hardware and continue to setup.',
        freeOrderIndexTitle: (games: string[]) =>
            games.length === 0
                ? 'Free Game Servers'
                : games.length <= 2
                  ? `Free Game Servers for ${new Intl.ListFormat('en', { type: 'conjunction' }).format(games)}`
                  : `Free Game Servers for ${games.slice(0, 2).join(', ')} & More`,
        freeOrderIndexDescription: (games: string[]) =>
            games.length === 0
                ? 'Launch a free game server, with no payment details and no subscription.'
                : `Free game servers for ${new Intl.ListFormat('en', { type: 'conjunction' }).format(games)}: no payment details, no subscription, free to extend.`,
        orderCheckoutTitle: 'Checkout',
        orderCheckoutDescription: 'Complete secure checkout for your game server order.',
        gameserversTitle: 'Gameservers',
        gameserversDescription: 'Manage your gameservers, runtimes, upgrades, and game changes.',
        gameserverFallbackTitle: 'Gameserver',
        gameOrderTitle: (gameName: string) => `${gameName} Server Hosting`,
        gameOrderDescription: (gameName: string) =>
            `Configure a ${gameName} server with flexible CPU, RAM and backups.`,
        gameSetupTitle: (gameName: string, summary?: string) =>
            summary ? `${gameName} Setup - ${summary}` : `${gameName} Setup`,
        gameSetupDescription: (gameName: string) =>
            `Finish the setup for your ${gameName} server and review the selected hardware before checkout.`,
        freeGameTitle: (gameName: string) => `Free ${gameName} Server`,
        freeGameDescription: (gameName: string) =>
            `Create a free ${gameName} server and start playing with no upfront payment.`,
        gameserverDashboardTitle: (serverName: string) => `${serverName} Dashboard`,
        gameserverDashboardDescription: (serverName: string, gameName?: string | null) =>
            gameName
                ? `Manage ${serverName}, your ${gameName} server.`
                : `Manage your gameserver ${serverName}.`,
        gameserverUpgradeTitle: (serverName: string) => `${serverName} Upgrade`,
        gameserverUpgradeDescription: (serverName: string) => `Extend or upgrade ${serverName}.`,
        freeGameserverUpgradeTitle: (serverName: string) => `${serverName} Free Upgrade`,
        freeGameserverUpgradeDescription: (serverName: string) =>
            `Extend ${serverName} or move it from the free tier to paid hardware.`,
        paidGameserverUpgradeTitle: (serverName: string) => `${serverName} Upgrade`,
        paidGameserverUpgradeDescription: (serverName: string) =>
            `Adjust hardware or runtime for ${serverName}.`,
        gameserverChangeGameTitle: (serverName: string) => `${serverName} - Change Game`,
        gameserverChangeGameDescription: (serverName: string) =>
            `Choose a new game for ${serverName}.`,
        gameserverChangeGameSetupTitle: (serverName: string, gameName: string) =>
            `${serverName} -> ${gameName}`,
        gameserverChangeGameSetupDescription: (serverName: string, gameName: string) =>
            `Review the configuration and switch ${serverName} to ${gameName}.`,
        checkoutOrderTitle: (gameName: string, locationName?: string | null) =>
            locationName ? `Checkout ${gameName} - ${locationName}` : `Checkout ${gameName}`,
        checkoutOrderDescription: (gameName: string, locationName?: string | null) =>
            locationName
                ? `Complete secure checkout for your ${gameName} server order in ${locationName}.`
                : `Complete secure checkout for your ${gameName} server order.`,
        hardwareCores: (value: string) => `${value} cores`,
        hardwareRam: (value: string) => `${value} GiB RAM`,
        hardwareDays: (value: string) => `${value} days`,
        freePageHeading: 'Get Your Free Game Server',
        freePageHeadingHighlight: 'Free',
        freePageSubheading: 'No payment details required',
        freePageWhyFreeQuestion: 'Why free?',
        freePageWhyFreeAnswerShort:
            'We want you to get to know us without any risk. That is why our free servers also run on modern hardware.',
        freePageWhyFreeAnswerLong:
            'We want you to get to know us without any risk. That is why our free servers also run on modern hardware with strong per-core performance, which matters most for game servers.',
        freePageNoCatchLabel: 'Fair Play',
        freePageNoCatchPoints: [
            'No player slot limit',
            'No queue',
            'Stays online even when no one is playing',
        ],
        freePageSpecsLabel: 'Server Specs',
        freePageSpecCpuOn: (cpu: string) => `on ${cpu}`,
        freePageSpecDisk: 'Storage',
        freePageSelectGame: 'Select Your Game',
        freePageFaqHeading: 'Frequently Asked Questions',
        freePageAboutHeading: 'How your free game server works',
        freePageAboutParagraphs: ({ games, durationDays, maxServers, deleteAfterDays }) => [
            `Scyed gives you a free game server for ${new Intl.ListFormat('en', { type: 'conjunction' }).format(games)}, with no payment details and no subscription. Sign in with Discord or Google, pick your game and your server is set up automatically. You manage it in our own dashboard with console, file manager, backups and settings.` +
                (maxServers === 1
                    ? ' You can run one free server per account.'
                    : maxServers > 1
                      ? ` You can run up to ${maxServers} free servers per account at the same time.`
                      : ''),
            `A free server runs for ${durationDays} days. You can extend it for free at any time in a few clicks, as often as you like, and the runtime starts again at ${durationDays} days. If you do not extend it, the server shuts down when it expires. Your data is kept and extending it brings it back. If you do not extend an expired server within ${deleteAfterDays} days, it is deleted.`,
        ],
    },
} satisfies Record<
    SupportedLocale,
    {
        homeTitle: string;
        homeDescription: string;
        blogTitle: string;
        blogDescription: string;
        changelogTitle: string;
        changelogDescription: string;
        supportTitle: string;
        supportDescription: string;
        supportTicketTitle: string;
        orderIndexTitle: string;
        orderIndexDescription: string;
        orderConfigureTitle: (summary?: string) => string;
        orderConfigureDescription: string;
        orderConfigureGamesTitle: (summary?: string) => string;
        orderConfigureGamesDescription: string;
        freeOrderIndexTitle: (games: string[]) => string;
        freeOrderIndexDescription: (games: string[]) => string;
        orderCheckoutTitle: string;
        orderCheckoutDescription: string;
        gameserversTitle: string;
        gameserversDescription: string;
        gameserverFallbackTitle: string;
        gameOrderTitle: (gameName: string) => string;
        gameOrderDescription: (gameName: string) => string;
        gameSetupTitle: (gameName: string, summary?: string) => string;
        gameSetupDescription: (gameName: string) => string;
        freeGameTitle: (gameName: string) => string;
        freeGameDescription: (gameName: string) => string;
        gameserverDashboardTitle: (serverName: string) => string;
        gameserverDashboardDescription: (serverName: string, gameName?: string | null) => string;
        gameserverUpgradeTitle: (serverName: string) => string;
        gameserverUpgradeDescription: (serverName: string) => string;
        freeGameserverUpgradeTitle: (serverName: string) => string;
        freeGameserverUpgradeDescription: (serverName: string) => string;
        paidGameserverUpgradeTitle: (serverName: string) => string;
        paidGameserverUpgradeDescription: (serverName: string) => string;
        gameserverChangeGameTitle: (serverName: string) => string;
        gameserverChangeGameDescription: (serverName: string) => string;
        gameserverChangeGameSetupTitle: (serverName: string, gameName: string) => string;
        gameserverChangeGameSetupDescription: (serverName: string, gameName: string) => string;
        checkoutOrderTitle: (gameName: string, locationName?: string | null) => string;
        checkoutOrderDescription: (gameName: string, locationName?: string | null) => string;
        hardwareCores: (value: string) => string;
        hardwareRam: (value: string) => string;
        hardwareDays: (value: string) => string;
        freePageHeading: string;
        freePageHeadingHighlight: string;
        freePageSubheading: string;
        freePageWhyFreeQuestion: string;
        freePageWhyFreeAnswerShort: string;
        freePageWhyFreeAnswerLong: string;
        freePageNoCatchLabel: string;
        freePageNoCatchPoints: string[];
        freePageSpecsLabel: string;
        freePageSpecCpuOn: (cpu: string) => string;
        freePageSpecDisk: string;
        freePageSelectGame: string;
        freePageFaqHeading: string;
        freePageAboutHeading: string;
        freePageAboutParagraphs: (info: {
            games: string[];
            durationDays: number;
            maxServers: number;
            deleteAfterDays: number;
        }) => string[];
    }
>;

function normalizeLocale(locale?: string): SupportedLocale {
    if (locale && routing.locales.includes(locale as SupportedLocale)) {
        return locale as SupportedLocale;
    }

    return routing.defaultLocale;
}

function normalizePath(path: string) {
    if (path === '/' || path.length === 0) {
        return '';
    }

    return path.startsWith('/') ? path : `/${path}`;
}

function localizedPath(locale: string, path: string) {
    return `/${locale}${normalizePath(path)}`;
}

function firstSearchValue(value: SearchParamValue) {
    if (Array.isArray(value)) {
        return value[0];
    }

    return value;
}

function formatSummaryNumber(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}

function parsePositiveNumber(value: SearchParamValue) {
    const firstValue = firstSearchValue(value);

    if (!firstValue) {
        return null;
    }

    const parsed = Number(firstValue);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }

    return parsed;
}

export function getMetadataCopy(locale?: string) {
    return metadataCopy[normalizeLocale(locale)];
}

export function buildHardwareMetadataSummary(
    searchParams: SearchParamRecord | undefined,
    locale?: string,
) {
    if (!searchParams) {
        return null;
    }

    const copy = getMetadataCopy(locale);
    const cpu = parsePositiveNumber(searchParams.cpu);
    const ram = parsePositiveNumber(searchParams.ram);
    const days = parsePositiveNumber(searchParams.days);
    const parts: string[] = [];

    if (cpu != null) {
        parts.push(copy.hardwareCores(formatSummaryNumber(cpu)));
    }

    if (ram != null) {
        parts.push(copy.hardwareRam(formatSummaryNumber(ram)));
    }

    if (days != null) {
        parts.push(copy.hardwareDays(formatSummaryNumber(days)));
    }

    return parts.length > 0 ? parts.join(' / ') : null;
}

type MetaImage = {
    /** Local public path (e.g. /images/dark/games/icons/minecraft.webp). Served via the
     *  Next image optimizer at a small size so social previews render a compact thumbnail. */
    path: string;
    alt: string;
};

export function createPublicMetadata({
    locale,
    path,
    title,
    description,
    keywords,
    image,
    article,
    noindex,
    contentLocale,
}: {
    locale: string;
    path: string;
    title: string;
    description: string;
    keywords?: string[];
    image?: MetaImage;
    /** Marks the page as an article (og:type=article) with its dates. */
    article?: { publishedTime: Date; modifiedTime?: Date };
    /** Order funnel steps: keep title and link preview, but stay out of the index (links are
     *  still followed). */
    noindex?: boolean;
    /** The content exists in this language only (blog posts). Every locale's URL then points its
     *  canonical at this one and hreflang lists only it, so the German text under /en is not a
     *  duplicate. */
    contentLocale?: SupportedLocale;
}): Metadata {
    const normalizedLocale = contentLocale ?? normalizeLocale(locale);
    const languages = Object.fromEntries(
        (contentLocale ? [contentLocale] : routing.locales).map((currentLocale) => [
            currentLocale,
            localizedPath(currentLocale, path),
        ]),
    );

    const ogImage = image ?? DEFAULT_OG_IMAGE;
    const ogImageUrl = buildOgImageUrl(ogImage.path);

    return {
        title,
        description,
        keywords,
        ...(noindex ? { robots: { index: false, follow: true } } : {}),
        alternates: {
            canonical: localizedPath(normalizedLocale, path),
            languages: {
                ...languages,
                'x-default': localizedPath(contentLocale ?? routing.defaultLocale, path),
            },
        },
        openGraph: {
            ...(article
                ? {
                      type: 'article',
                      publishedTime: article.publishedTime.toISOString(),
                      modifiedTime: article.modifiedTime?.toISOString(),
                  }
                : { type: 'website' }),
            siteName: SITE_NAME,
            title,
            description,
            url: localizedPath(normalizedLocale, path),
            locale: ogLocaleByLocale[normalizedLocale],
            images: {
                url: ogImageUrl,
                alt: ogImage.alt,
                height: OG_IMAGE_WIDTH,
                width: OG_IMAGE_WIDTH,
            },
        },
        twitter: {
            card: 'summary',
            title,
            description,
            images: [ogImageUrl],
        },
    };
}

/** Keeps a page out of search results. Used instead of a robots.txt `Disallow`, which would stop
 *  crawlers from ever seeing this tag. Layouts of private sections export it directly. */
export const PRIVATE_ROBOTS: Metadata['robots'] = {
    index: false,
    follow: false,
    googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
    },
};

export function createPrivateMetadata({
    title,
    description,
}: {
    title: string;
    description?: string;
}): Metadata {
    return {
        title,
        description,
        robots: PRIVATE_ROBOTS,
    };
}
