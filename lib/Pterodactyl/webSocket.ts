async function webSocket(serverId: string, apiKey: string) {
  const response = await fetch('/api/ptero', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: apiKey,  // or get it from somewhere secure
      serverId: serverId,
    }),
  });

  if (!response.ok) {
    // handle error
    throw new Error(`Error: ${response.status}`);
  }

    const data = await response.json();
    console.log('Pterodactyl data:', data);

    return data;



  // const pturl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

  // const url = `${pturl}/api/client/servers/${serverId}/websocket`;

  // console.log('ws cretion url: ', url)

  // try {
  //   const response = await fetch(url, {
  //     method: "GET",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${apiKey}`, // Replace with your actual API key
  //     },
  //   });
    
  //   console.log('ws creation function: ', JSON.stringify(response));

  //   if (response.ok) {
  //     return await response.json();
  //   }
  // } finally {
  // }
}

export default webSocket;
