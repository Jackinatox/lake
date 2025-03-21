import React from 'react'
import GameserversTable from './GameserversTable';
import { Builder } from "@avionrx/pterodactyl-js";
import { Breadcrumbs, Typography, Link } from '@mui/joy';
import { SettingsIcon, Gamepad2Icon } from 'lucide-react';

async function Gameservers() {
  const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
  const apiKey = process.env.PTERODACTYL_API_KEY;

  if (!url || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
  }

  const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

  try {
    const gameservers = await client.getServers();

    return (
      <>
        <Breadcrumbs separator="›" aria-label="breadcrumbs">

          <Link color="primary" href="/admin">
            <SettingsIcon /> &nbsp; Admin Panel
          </Link>

          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            <Gamepad2Icon /> &nbsp; Gameservers
          </Typography>

        </Breadcrumbs>
        <GameserversTable servers={gameservers}></GameserversTable>
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

export default Gameservers