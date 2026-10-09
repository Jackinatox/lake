'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

function DevSessionInfo() {
    const session = authClient.useSession().data;
    // `useSession` has no data during SSR but can return a cached session on the very first
    // client render — that mismatch is a hydration error for the whole tree. Hold the output
    // back until after mount so both renders agree on "nothing yet".
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div>
            {' '}
            <pre className="wrap-break-word whitespace-pre-wrap bg-muted p-4 rounded text-xs ">
                {mounted ? JSON.stringify(session?.user, null, 2) : null}
            </pre>
        </div>
    );
}

export default DevSessionInfo;
