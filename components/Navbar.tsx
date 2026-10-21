'use client';

import { ThemeImage } from '@/components/ui/theme-image';
import MainMenu from '@/components/Menu/MainMenu';
import Profile from '@/components/auth/profile';
import { LanguageSwitcher } from '@/components/Menu/language-switcher';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';

const isDev = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development';

export default function Navbar({ locale }: { locale: string }) {
    const pathname = usePathname();
    // The ticket form and chat bring their own sticky header, so the navbar scrolls away there.
    const unStickNavBar = /\/support\/tickets\/[^/]+/.test(pathname ?? '');
    return (
        <nav
            className={`${!unStickNavBar ? 'sticky top-0 z-50' : ''} w-full flex justify-center border-b h-16 ${isDev ? 'bg-yellow-400 border-yellow-500 dark:bg-yellow-500 dark:border-yellow-600' : 'bg-background border-b-foreground/10'}`}
        >
            <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="flex items-center font-semibold">
                    {/* shrink-0: in a crowded navbar the flex row would squeeze the logo's width */}
                    <Link href="/" className="mr-4 flex shrink-0 items-center">
                        {/* Larger only on tablets (touch, md and up); sizes must cover that width (h-10 ≈ 90px) */}
                        <ThemeImage
                            src="/images/logo/ScyedLogo.webp"
                            alt="Scyed"
                            fill={false}
                            width={1084}
                            height={482}
                            sizes="(min-width: 768px) and (pointer: coarse) 90px, 64px"
                            className="h-7 w-auto md:pointer-coarse:h-10"
                            priority
                        />
                    </Link>
                    <MainMenu locale={locale} />
                </div>
                <div className="flex items-center space-x-2">
                    <div className="hidden md:block">
                        <LanguageSwitcher currentLocale={locale} />
                    </div>
                    <Profile />
                </div>
            </div>
        </nav>
    );
}
