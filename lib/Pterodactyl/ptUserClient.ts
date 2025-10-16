import { Builder } from 'pterodactyl.js';
import { env } from 'next-runtime-env';

export function createPtUserClient(apiKey: string) {
    const url = env('NEXT_PUBLIC_PTERODACTYL_URL');

    if (!url || !apiKey) {
        throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
    }

    return new Builder().setURL(url).setAPIKey(apiKey).asUser();
}
