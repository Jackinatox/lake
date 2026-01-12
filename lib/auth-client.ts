import { auth } from '@/auth';
import {
    adminClient,
    inferAdditionalFields,
    lastLoginMethodClient,
    twoFactorClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
    plugins: [
        lastLoginMethodClient(),
        adminClient(),
        twoFactorClient(),
        inferAdditionalFields<typeof auth>(),
    ],
});
