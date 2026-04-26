import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';

const SITE_NAME = 'Scyed Hosting';

type SupportedLocale = (typeof routing.locales)[number];
type SearchParamValue = string | string[] | undefined;
type SearchParamRecord = Record<string, SearchParamValue>;

const ogLocaleByLocale: Record<SupportedLocale, string> = {
    de: 'de_DE',
    en: 'en_US',
};

const metadataCopy = {
    de: {
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
        freeOrderIndexTitle: 'Kostenlose Gameserver',
        freeOrderIndexDescription:
            'Wähle ein unterstütztes Spiel und starte einen kostenlosen Gameserver ohne Kreditkarte.',
        orderCheckoutTitle: 'Checkout',
        orderCheckoutDescription:
            'Schließe den sicheren Checkout für Deine Gameserver-Bestellung ab.',
        gameserversTitle: 'Gameserver',
        gameserversDescription: 'Verwalte Deine Gameserver, Laufzeiten, Upgrades und Spielwechsel.',
        gameserverFallbackTitle: 'Gameserver',
        gameOrderTitle: (gameName: string) => `${gameName} Gameserver`,
        gameOrderDescription: (gameName: string) =>
            `Konfiguriere einen ${gameName}-Gameserver mit flexibler CPU, RAM, Speichertiers, Backups und Standorten.`,
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
    },
    en: {
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
        freeOrderIndexTitle: 'Free Game Servers',
        freeOrderIndexDescription:
            'Choose a supported game and launch a free game server with no credit card required.',
        orderCheckoutTitle: 'Checkout',
        orderCheckoutDescription: 'Complete secure checkout for your game server order.',
        gameserversTitle: 'Gameservers',
        gameserversDescription: 'Manage your gameservers, runtimes, upgrades, and game changes.',
        gameserverFallbackTitle: 'Gameserver',
        gameOrderTitle: (gameName: string) => `${gameName} Server Hosting`,
        gameOrderDescription: (gameName: string) =>
            `Configure a ${gameName} server with flexible CPU, RAM, storage tiers, backups, and locations.`,
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
    },
} satisfies Record<
    SupportedLocale,
    {
        orderIndexTitle: string;
        orderIndexDescription: string;
        orderConfigureTitle: (summary?: string) => string;
        orderConfigureDescription: string;
        orderConfigureGamesTitle: (summary?: string) => string;
        orderConfigureGamesDescription: string;
        freeOrderIndexTitle: string;
        freeOrderIndexDescription: string;
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

export function createPublicMetadata({
    locale,
    path,
    title,
    description,
    keywords,
}: {
    locale: string;
    path: string;
    title: string;
    description: string;
    keywords?: string[];
}): Metadata {
    const normalizedLocale = normalizeLocale(locale);
    const languages = Object.fromEntries(
        routing.locales.map((currentLocale) => [currentLocale, localizedPath(currentLocale, path)]),
    );

    return {
        title,
        description,
        keywords,
        alternates: {
            canonical: localizedPath(normalizedLocale, path),
            languages: {
                ...languages,
                'x-default': localizedPath(routing.defaultLocale, path),
            },
        },
        openGraph: {
            type: 'website',
            siteName: SITE_NAME,
            title,
            description,
            url: localizedPath(normalizedLocale, path),
            locale: ogLocaleByLocale[normalizedLocale],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
    };
}

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
        robots: {
            index: false,
            follow: false,
            googleBot: {
                index: false,
                follow: false,
                noimageindex: true,
            },
        },
    };
}
