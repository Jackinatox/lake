import { env } from 'next-runtime-env';

export default async function ReinstallPTUserServer(server: string, apiKey: string) {
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const response = await fetch(`${ptUrl}/api/client/servers/${server}/settings/reinstall`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
        },
    });
    return response;
}