// app/admin/user/page.tsx
import { Builder } from 'pterodactyl.js';
import UsersTable from './usersTable';
import { Breadcrumbs, Link, Typography, Box } from '@mui/joy';
import { SettingsIcon, UserIcon } from 'lucide-react';

export default async function AdminPage() {
  const url = process.env.PTERODACTYL_URL;
  const apiKey = process.env.PTERODACTYL_API_KEY;

  if (!url || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
  }

  const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

  try {
    const users = await client.getUsers();

    return (
      <>
        <Breadcrumbs separator="›">

          <Link color="primary" href="/admin">
            <SettingsIcon />
            Admin Panel
          </Link>

          <Typography sx={{ display: 'flex', alignItems: 'center' }}>
            <UserIcon />
            Users
          </Typography>

        </Breadcrumbs>


        <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: 'auto', alignItems: 'flex-start' }}>
          <UsersTable users={users}></UsersTable>
        </Box>
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
