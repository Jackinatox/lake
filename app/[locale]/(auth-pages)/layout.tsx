import { PRIVATE_ROBOTS } from '@/lib/metadata';
import type { Metadata } from 'next';

// Private section: keep every page below this layout out of search results.
export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
    return children;
}
