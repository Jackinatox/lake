import React from 'react'
import NodeTable from './NodesTable';
import { Builder } from 'pterodactyl.js';

async function Nodes() {
    const url = process.env.PTERODACTYL_URL;
    const apiKey = process.env.PTERODACTYL_API_KEY;
  
    if (!url || !apiKey) {
      throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
    }
  
    const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();
  
    try {
      const nodes = await client.getNodes();
  
      return (
        <div>
          <h1>Admin Panel</h1>
          <NodeTable nodes={nodes}></NodeTable>
        </div>
      );
    } catch (error: any) {
      return (
        <div>
          <h1>Error</h1>
          <p>{error.message}</p>
        </div>
      );
    }
}

export default Nodes