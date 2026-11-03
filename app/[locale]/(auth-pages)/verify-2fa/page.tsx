import { auth } from '@/auth';
import { Verify2FAForm } from '@/components/auth/verify-2fa-form';
import { headers } from 'next/headers';
import { redirect } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';

export default async function Verify2FAPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session) {
        redirect({ href: '/gameserver', locale: await getLocale() });
    }
    return <Verify2FAForm />;
}
