export async function checkIfServerIsReady(identifier: string): Promise<any[]> {
    let result: any[] = [];

    for (let i = 0; i < 10; i++) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/client/servers/${identifier}`);
        const data = await response.json();
        console.log(data)
        result.push(data);
        await sleep(500);
    }

    return result;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));