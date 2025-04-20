'use server'

export async function deleteAllServers(){
    const response = await fetch(`${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/application/servers`, {
        method: 'GET',
        headers: {
            'Authorisation': `Bearer ${process.env.PTERODACTYL_API_KEY}`,
            'Content-Type': 'application/json' 
        }
    });

    const data = await response.json();
    console.log('data: ', data);

    data.data.forEach(server => {
        if (server.name === "serverino"){
            fetch(`${process.env.NEXT_PUBLIC_PTERODACTYL_URL}/api/application/servers/${server.attributes.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorisation': `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                    'Content-Type': 'application/json' 
                }
            });
        }        
    });
}


