import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/metadata';

// Private pages (admin, gameserver, profile, tickets, auth) are kept out of the index with a
// noindex meta tag instead of a Disallow here: a disallowed page is never fetched, so crawlers
// would not see its noindex and could still index the bare URL.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/webhook/'],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
