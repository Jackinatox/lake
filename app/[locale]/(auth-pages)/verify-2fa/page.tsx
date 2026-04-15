import { auth } from '@/auth';
import { Verify2FAForm } from '@/components/auth/verify-2fa-form';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Verify2FAPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session) {
        redirect('/gameserver');
    }
    return <Verify2FAForm />;
}
