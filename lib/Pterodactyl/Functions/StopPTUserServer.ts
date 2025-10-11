const ptUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

export default async function PTUserServerPowerAction(server: string, apiKey: string, powerAction: 'start' | 'stop' | 'restart' | 'kill') {
    await fetch(`${ptUrl}/api/client/servers/${server}/power`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
        },
        body: JSON.stringify({ signal: powerAction }),
    });
}