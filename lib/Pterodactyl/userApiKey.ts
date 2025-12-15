import { env } from 'next-runtime-env';
import { logger } from '../logger';

async function createUserApiKey(userId: number): Promise<any> {
    const pturl = env('NEXT_PUBLIC_PTERODACTYL_URL');
    const apiKey = env('PTERODACTYL_API_KEY');
    const url = `${pturl}/api/application/users/${userId}/api-keys`;
    const data = {
        description: 'API key for new user by lake',
        allowed_ips: [],
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`, // Replace with your actual API key
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, url: ${url}, body: ${JSON.stringify(response.body)}`);
        }

        const responseData = await response.json();
        console.log('Response Data:', responseData);
        const { identifier } = responseData.attributes;
        const { secret_token } = responseData.meta;

        const key = identifier + secret_token;

        return key;
    } catch (e) {
        logger.fatal('PTUser API-Key Creation: ', 'SYSTEM', { details: { error: (e as Error).message } });
    }
}

export default createUserApiKey;
