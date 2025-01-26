// app/admin/page.js
import { Builder } from 'pterodactyl.js';
import UserTable from './userTable';

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
      <div>
        <h1>Admin Panel</h1>
        <UserTable users={users}></UserTable>
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
