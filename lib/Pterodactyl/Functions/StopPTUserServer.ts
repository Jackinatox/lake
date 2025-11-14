import { env } from 'next-runtime-env';

export default async function PTUserServerPowerAction(
    server: string,
    apiKey: string,
    powerAction: 'start' | 'stop' | 'restart' | 'kill',
) {
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    console.log(`Sending power action '${powerAction}' to server ${server}`);
    await fetch(`${ptUrl}/api/client/servers/${server}/power`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
        },
        body: JSON.stringify({ signal: powerAction }),
    });
}
