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
}

export default webSocket;
