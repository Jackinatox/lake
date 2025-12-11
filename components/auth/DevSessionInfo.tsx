'use client';

import { authClient } from '@/lib/auth-client';

function DevSessionInfo() {
    const session = authClient.useSession().data;
    return (
        <div>
            {' '}
            <pre className="wrap-break-word whitespace-pre-wrap bg-muted p-4 rounded text-xs ">
                {JSON.stringify(session?.user, null, 2)}
            </pre>
        </div>
    );
}

export default DevSessionInfo;
