'use server'

export async function deleteAllServers(){
    const response = await fetch(`${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/application/servers`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.PTERODACTYL_API_KEY}`,
            'Accept': 'application/json' 
        }
    });
    const data = await response.json();
    console.log('data: ', data);

    data.data.forEach(server => {
        if (server.attributes.name === "serverino"){
            console.log('Deleting Server: ', JSON.stringify(server.attributes.id));
            fetch(`${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/application/servers/${server.attributes.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                    'Accept': 'application/json' 
                }
            });
        }        
    });
}


