import { Builder } from "@avionrx/pterodactyl-js";
import { env } from 'next-runtime-env';

export function createPtClient() {
    const url = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const apiKey = env('PTERODACTYL_API_KEY');

    if (!url || !apiKey) {
        throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
    }

    return new Builder().setURL(url).setAPIKey(apiKey).asAdmin();
}
