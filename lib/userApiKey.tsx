async function createUserApiKey(userId: number): Promise<any> {
    const pturl = process.env.PTERODACTYL_URL;
    const url = `${pturl}/api/application/users/${userId}/api-keys`;
    const data = {
        description: 'API key for new user',
        allowed_ips: []
    };

    console.log('Making request to:', url);
    console.log('Request body:', JSON.stringify(data));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_API_KEY' // Replace with your actual API key
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Response Data:', response);
        const responseData = await response.json();
        const { identifier } = responseData.attributes;
        const { secret_token } = responseData.meta;

        return identifier + secret_token;
    } catch (e) {
        console.error('PTUser API-Key Creation: ', e);
    }
}

export default createUserApiKey;
