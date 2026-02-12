import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';

export default async function ChangePasswordPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <NotLoggedIn />;
    }

    const t = await getTranslations('RegisterLogin.changePassword.oauthNotAvailable');

    // Check if the user has a password account (email/password login)
    const passwordAccount = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            password: {
                not: null,
            },
        },
        select: {
            id: true,
        },
    });

    // If user doesn't have a password account, they're using OAuth
    if (!passwordAccount) {
        return (
            <div className="min-h-screen bg-background p-2 md:p-6">
                <div className="mx-auto max-w-2xl">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                                <ShieldAlert className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <CardTitle className="text-xl">{t('title')}</CardTitle>
                            <CardDescription>{t('subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <p className="text-sm text-muted-foreground">{t('description')}</p>
                            <Button asChild variant="default">
                                <Link href="/profile">{t('backButton')}</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-2 md:p-6">
            <div className="mx-auto max-w-2xl">
                <ChangePasswordForm />
            </div>
        </div>
    );
}
