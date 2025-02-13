async function webSocket(serverId: string, apiKey: string) {
  const pturl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

  const url = `${pturl}/api/client/servers/${serverId}/websocket`;

  console.log('ws cretion url: ', url)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`, // Replace with your actual API key
      },
    });
    
    console.log('ws creation function: ', JSON.stringify(response));

    if (response.ok) {
      return await response.json();
    }
  } finally {
  }
}

export default webSocket;
