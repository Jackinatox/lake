import { Builder } from "@avionrx/pterodactyl-js";// Import Builder from your actual library

export function createPtClient() {
    const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
    const apiKey = process.env.PTERODACTYL_API_KEY;

    if (!url || !apiKey) {
        throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
    }

    return new Builder().setURL(url).setAPIKey(apiKey).asAdmin();
}
