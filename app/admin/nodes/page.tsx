import React from 'react'
import NodeTable from './NodesTable';
import { Builder } from 'pterodactyl.js';
import { Breadcrumbs, Typography, Link } from '@mui/joy';
import { SettingsIcon, UserIcon } from 'lucide-react';

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
      <>
        <Breadcrumbs separator="›" aria-label="breadcrumbs">

          <Link color="primary" href="/admin">
            <SettingsIcon />
            Admin Panel
          </Link>

          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            <UserIcon />
            Wings
          </Typography>

        </Breadcrumbs>
        <NodeTable nodes={nodes}></NodeTable>
      </>
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