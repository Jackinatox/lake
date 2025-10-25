import { env } from 'next-runtime-env';
import DeleteAllFilesUserServer from './DeleteAllFilesUser';

export default async function ReinstallPTUserServer(server: string, apiKey: string, deleteAllFiles: boolean) {
    const ptUrl = env('NEXT_PUBLIC_PTERODACTYL_URL');

    if (deleteAllFiles) {
        await DeleteAllFilesUserServer(server, apiKey);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

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