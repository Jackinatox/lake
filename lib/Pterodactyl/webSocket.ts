async function webSocket(serverId: string, apiKey: string) {
  const response = await fetch('/api/ptero', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: apiKey,
      serverId: serverId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export default webSocket;
