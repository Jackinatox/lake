import SupportLanding from '@/components/support/SupportLanding';
import { redirect } from 'next/navigation';

type SearchParams = { category?: string; subject?: string; server?: string };

/**
 * Temporary home of the new support landing page (`SUPPORT_LANDING_PATH`).
 *
 * Accepts the same `?category=&subject=` deep links as the legacy `/support` page (plus
 * `?server=`) and forwards them straight to the ticket form, so existing links keep working
 * once this page takes over `/support`.
 */
export default async function SupportLandingPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<SearchParams>;
}) {
    const [{ locale }, query] = await Promise.all([params, searchParams]);

    if (query.category || query.subject || query.server) {
        const forward = new URLSearchParams();
        if (query.category) forward.set('category', query.category);
        if (query.subject) forward.set('subject', query.subject);
        if (query.server) forward.set('server', query.server);
        redirect(`/${locale}/support/tickets/new?${forward.toString()}`);
    }

    return <SupportLanding />;
}
