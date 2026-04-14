import type { auth } from '@/auth';
import {
    adminClient,
    inferAdditionalFields,
    lastLoginMethodClient,
    twoFactorClient,
    usernameClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { apiKeyClient } from '@better-auth/api-key/client';

export const authClient = createAuthClient({
    plugins: [
        lastLoginMethodClient(),
        adminClient(),
        twoFactorClient(),
        usernameClient(),
        apiKeyClient(),
        inferAdditionalFields<typeof auth>(),
    ],
});
