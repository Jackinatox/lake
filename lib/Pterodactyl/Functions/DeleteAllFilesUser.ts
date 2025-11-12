import { env } from 'next-runtime-env';
import PTUserServerPowerAction from './StopPTUserServer';

export default async function DeleteAllFilesUserServer(server: string, apiKey: string) {
    await PTUserServerPowerAction(server, apiKey, 'kill');
    await new Promise((resolve) => setTimeout(resolve, 200));
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
    };

    const response = await fetch(`${ptUrl}/api/client/servers/${server}/files/list`, {
        method: 'GET',
        headers: headers,
    });

    if (!response.ok) {
        throw new Error(`Error fetching file list: ${response.statusText}`);
    }

    console.log(`Deleting all Files for server ${server}`);

    const data = await response.json();
    const files = data.data;

    const toDelete = files.filter((path: string) => path !== '/').map((file: any) => file.attributes.name);

    const deleted = await fetch(`${ptUrl}/api/client/servers/${server}/files/delete`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            root: "/",
            files: toDelete
        })
    });

    return deleted;
}