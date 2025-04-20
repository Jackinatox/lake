export async function checkIfServerIsReady(identifier: string): Promise<any[]> {
    let result: any[] = [];

    for (let i = 0; i < 10; i++) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/client/servers/${identifier}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        result.push(data);
        await sleep(500);
    }

    // Return the JSON as a formatted string with line breaks
    return result;
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));