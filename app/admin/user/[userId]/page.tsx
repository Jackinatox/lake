import { Builder } from 'pterodactyl.js';
import React from 'react'
import { json } from 'stream/consumers';

async function User({ params }: { params: Promise<{ userId: string }> }) {
    const userId = (await params).userId;

    const url = process.env.PTERODACTYL_URL;
    const apiKey = process.env.PTERODACTYL_API_KEY;

    if (!url || !apiKey) {
        throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
    }

    const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

    try {
        const user = await client.getUser(userId);



        return (
            <div>{ user.fullName }</div>
        )
    } catch (e) {
        return (
            <div>{JSON.stringify(e)}</div>
        )
    }
}

export default User