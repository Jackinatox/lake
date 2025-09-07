import { createAuthClient } from "better-auth/react"
import { adminClient, inferAdditionalFields } from "better-auth/client/plugins"
import { auth } from "@/auth";


export const authClient = createAuthClient({
    plugins: [inferAdditionalFields<typeof auth>(), adminClient() ],
});