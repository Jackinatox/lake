export async function waitForServerInstallation(identifier: string): Promise<void> {
    let result: any[] = [];

    // TODO: Improve this code
    for (let i = 0; i < 40; i++) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/client/servers/${identifier}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        result.push(data);
        // console.log('installling: ', data.attributes.is_installing);

        if (data.attributes.is_installing === false) {
                        
            break;
        }
        await sleep(1000);
    }
    // console.log(result);
    return;
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));