import { auth } from '@/auth';
import { adminClient, inferAdditionalFields, lastLoginMethodClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
    plugins: [inferAdditionalFields<typeof auth>(), lastLoginMethodClient(), adminClient()],
});
