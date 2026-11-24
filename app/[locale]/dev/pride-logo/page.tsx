import { isDevServer } from '@/lib/devMode';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PrideLogoLab from './PrideLogoLab';

export const metadata: Metadata = {
    title: 'Pride logo lab',
    robots: { index: false, follow: false },
};

/** Dev-only playground for the animated Pride logo variants. 404 on built servers. */
export default function PrideLogoLabPage() {
    if (!isDevServer) notFound();
    return <PrideLogoLab />;
}
