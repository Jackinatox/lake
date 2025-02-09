"use server"

import { encodedRedirect } from '@/utils/utils';
import { redirect } from 'next/navigation';
import { Builder } from 'pterodactyl.js';
import React from 'react'

export default async function newUserAction(formData: FormData) {
    const name = formData.get('name')?.toString();
    const email = formData.get('email')?.toString();
    const lastname = formData.get('lastname')?.toString();
    const password = formData.get('password')?.toString();

    if (name && email && password && lastname) {
        const url = process.env.PTERODACTYL_URL;
        const apiKey = process.env.PTERODACTYL_API_KEY;

        if (!url || !apiKey) {
            throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
        }

        let user;

        const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();
        try {
            user = await client.createUser({
                firstName: name,
                lastName: lastname,
                username: name,
                email: email,
                password: password,
                externalId: `scy-${name}`
            });

            console.log('Created User : ', JSON.stringify(user));
        } catch (e){
            console.log('error in User Creation: ', e);        
            return encodedRedirect('error', '/admin/user/new', `error in pt registration: ${JSON.stringify(e)}`);
        }
        redirect(`/admin/user/${user.id}`);
    } else {
        return encodedRedirect('error', '/admin/user/new', 'Die Form ist nicht komplett ausgefüllt');
    }
}
