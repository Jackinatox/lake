import { Builder } from 'pterodactyl.js';
export function createPtUserClient(apiKey: string) {
    const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

    if (!url || !apiKey) {
        throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
    }

    return new Builder().setURL(url).setAPIKey(apiKey).asUser();
}
