// app/admin/user/page.tsx
import { Builder } from "@avionrx/pterodactyl-js";
import UsersTable from './usersTable';
import { SettingsIcon, UsersIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const url = process.env.NEXT_PUBLIC_PTERODACTYL_URL;
  const apiKey = process.env.PTERODACTYL_API_KEY;

  if (!url || !apiKey) {
    throw new Error('PTERODACTYL_URL and PTERODACTYL_API_KEY must be defined');
  }

  const client = new Builder().setURL(url).setAPIKey(apiKey).asAdmin();

  try {
    const users = await client.getUsers();

    return (
      <>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              <UsersIcon className="inline-block mr-2" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable users={users} />
          </CardContent>
        </Card>
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
