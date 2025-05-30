async function createUserApiKey(userId: number): Promise<any> {
    const pturl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
    const apiKey = process.env.PTERODACTYL_API_KEY;
    const url = `${pturl}/api/application/users/${userId}/api-keys`;
    const data = {
        description: 'API key for new user by lake',
        allowed_ips: []
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` // Replace with your actual API key
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response Data:', responseData);
        const { identifier } = responseData.attributes;
        const { secret_token } = responseData.meta;

        const key = identifier + secret_token;
        
        return key;
    } catch (e) {
        console.error('PTUser API-Key Creation: ', e);
    }
}

export default createUserApiKey;
