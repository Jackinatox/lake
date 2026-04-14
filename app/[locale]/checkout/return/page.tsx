'use server';

import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { checkoutReturnSearchParamsSchema } from '@/lib/validation/order';
import { headers } from 'next/headers';
import ServerReadyPoller from './ServerReadyPoller';

export default async function ReturnPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    const search = await searchParams;
    const parsedSearch = checkoutReturnSearchParamsSchema.safeParse({
        session_id: search.session_id,
    });

    if (!parsedSearch.success) {
        return <div>Invalid session ID.</div>;
    }
    const { session_id } = parsedSearch.data;

    return (
        <div>
            <ServerReadyPoller sessionId={session_id} />
        </div>
    );
}
