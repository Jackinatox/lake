const ptUrl = process.env.NEXT_PUBLIC_PTERODACTYL_URL;

async function webSocket(serverId: string, apiKey: string) {
  const response = await fetch(`${ptUrl}/api/client/servers/${serverId}/websocket`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    console.error(response.body)
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export default webSocket;
