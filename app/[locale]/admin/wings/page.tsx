import React from 'react'
import WingsTable from './WingsTable';
import { Builder } from "@avionrx/pterodactyl-js";
import { Breadcrumbs, Typography, Link } from '@mui/joy';
import { SettingsIcon, SquarePlay } from 'lucide-react';

async function Wings() {
  const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
  const apiKey = process.env.PTERODACTYL_API_KEY;

  if (!url || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
  }

  const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

  try {
    const wings = await client.getNodes();

    return (
      <>
        <Breadcrumbs separator="›" aria-label="breadcrumbs">

          <Link color="primary" href="/admin">
            <SettingsIcon /> &nbsp; Admin Panel
          </Link>

          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            <SquarePlay /> &nbsp; Wings
          </Typography>

        </Breadcrumbs>
        <WingsTable wings={wings}></WingsTable>
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

export default Wings