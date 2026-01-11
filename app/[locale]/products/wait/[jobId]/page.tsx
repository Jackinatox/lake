import { auth } from '@/auth';
import NotLoggedIn from '@/components/auth/NoAuthMessage';
import ProvisioningStatus from '@/components/provisioning/ProvisioningStatus';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';

interface ProvisioningPageProps {
    params: Promise<{
        locale: string;
        jobId: string;
    }>;
}

export async function generateMetadata({ params }: ProvisioningPageProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'provisioning' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function ProvisioningPage({ params }: ProvisioningPageProps) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <NotLoggedIn />;
    }
    const { jobId } = await params;

    return (
        <div className="container mx-auto px-0 md:px-4 pb-80">
            <ProvisioningStatus jobId={jobId} />
        </div>
    );
}
