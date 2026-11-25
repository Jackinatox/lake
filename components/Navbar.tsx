'use client';

import { ThemeImage } from '@/components/ui/theme-image';
import MainMenu from '@/components/Menu/MainMenu';
import Profile from '@/components/auth/profile';
import { LanguageSwitcher } from '@/components/Menu/language-switcher';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import WorkerStatusIndicator from '@/components/dev/WorkerStatusIndicator';

const isDev = process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development';

export default function Navbar({ locale }: { locale: string }) {
    const pathname = usePathname();
    // The ticket form and chat, and the paid server upgrade page bring their own sticky header,
    // so the navbar scrolls away there.
    const unStickNavBar = /\/support\/tickets\/[^/]+|\/upgrade\/payedServer/.test(pathname ?? '');
    return (
        <nav
            className={`${!unStickNavBar ? 'sticky top-0 z-50' : 'relative'} w-full flex justify-center border-b h-16 ${isDev ? 'bg-yellow-400 border-yellow-500 dark:bg-yellow-500 dark:border-yellow-600' : 'bg-background border-b-foreground/10'}`}
        >
            {isDev && <WorkerStatusIndicator />}
            <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="flex items-center font-semibold">
                    {/* shrink-0: in a crowded navbar the flex row would squeeze the logo's width */}
                    <Link href="/" className="mr-4 flex shrink-0 items-center">
                        {/* 36px phones, 40px md, 44px from xl (full menu); the h-16 navbar keeps
                            >=10px air. sizes = rendered widths (logo is 1084x482): 81 / 90 / 99px */}
                        <ThemeImage
                            src="/images/logo/ScyedLogoPride.webp"
                            alt="Scyed"
                            fill={false}
                            width={1084}
                            height={482}
                            sizes="(min-width: 1280px) 99px, (min-width: 768px) 90px, 81px"
                            className="h-9 w-auto md:h-10 xl:h-11"
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
