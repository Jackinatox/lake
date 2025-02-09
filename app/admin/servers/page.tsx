import React from 'react'
import ServersTable from './ServersTable';
import { Builder } from 'pterodactyl.js';
import { Breadcrumbs, Typography, Link } from '@mui/joy';
import { SettingsIcon, Gamepad2Icon } from 'lucide-react';

async function Servers() {
  const url = process.env.PTERODACTYL_URL;
  const apiKey = process.env.PTERODACTYL_API_KEY;

  if (!url || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
  }

  const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

  try {
    const servers = await client.getServers();

    return (
      <>
        <Breadcrumbs separator="›" aria-label="breadcrumbs">

          <Link color="primary" href="/admin">
            <SettingsIcon />
            Admin Panel
          </Link>

          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            <Gamepad2Icon />
            Servers
          </Typography>

        </Breadcrumbs>
        <ServersTable servers={servers}></ServersTable>
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

export default Servers