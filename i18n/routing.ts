import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['en', 'de'],

    // Used when no locale matches
    defaultLocale: 'de',

    // hreflang is set in the page head and the sitemap (lib/metadata.ts, app/sitemap.ts). The
    // middleware's own Link header would point x-default at `/` and contradict them.
    alternateLinks: false,
});
