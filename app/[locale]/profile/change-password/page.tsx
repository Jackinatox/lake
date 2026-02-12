import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { headers } from 'next/headers';

export default async function ChangePasswordPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    return (
        <div className="min-h-screen bg-background p-2 md:p-6">
            <div className="mx-auto max-w-2xl">
                <ChangePasswordForm />
            </div>
        </div>
    );
}
