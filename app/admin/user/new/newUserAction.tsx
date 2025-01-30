"use server"

import { Builder } from 'pterodactyl.js';
import React from 'react'

export default async function newUserAction(formData: FormData) {
    const name = formData.get('name')?.toString();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (name && email && password) {
        const url = process.env.PTERODACTYL_URL;
        const apiKey = process.env.PTERODACTYL_API_KEY;

        if (!url || !apiKey) {
            throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
        }

        const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

        const user = await client.createUser({
            firstName: '',
            lastName: '',
            username: name,
            email: email,
            password: password
        });

        console.log('logged from form: ', name);
        
        // return { user: user };
    }
}
