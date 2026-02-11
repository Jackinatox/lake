'use client';

import * as React from 'react';
import Link from 'next/link';
import {
    ChevronDown,
    Menu as MenuIcon,
    LayoutDashboard,
    Gamepad2,
    HeadphonesIcon,
    Gift,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from './language-switcher';
import { authClient } from '@/lib/auth-client';

// 1) Define a TS type for clarity (optional, but helpful in larger apps)
type SubItem = { label: string; href: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> };
type MenuItem = {
    label: string;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    // If `subItems` is present, we render a dropdown; else it's a single link
    subItems?: SubItem[];
    href?: string;
};

// 2) Centralized menu "JSON"
const MENU: MenuItem[] = [
    {
        label: 'Games',
        Icon: Gamepad2,
        href: '/order',
    },
    {
        label: 'Dashboard',
        Icon: LayoutDashboard,
        href: '/gameserver',
    },
    {
        label: 'Support',
        Icon: HeadphonesIcon,
        href: '/support',
    },
];

interface MainMenuInterface {
    locale: string;
}

export default function MainMenu({ locale }: MainMenuInterface) {
    const auth = authClient.useSession().data;
    const [open, setOpen] = React.useState(false);
    const pathname = usePathname();
    const t = useTranslations('freeServer');

    const isActive = (href: string) => {
        // Remove locale prefix for comparison
        const pathWithoutLocale = pathname?.replace(/^\/(de|en)/, '') || '';
        const hrefWithoutLocale = href.replace(/^\/(de|en)/, '');
        return (
            pathWithoutLocale === hrefWithoutLocale ||
            pathWithoutLocale.startsWith(hrefWithoutLocale + '/')
        );
    };

    return (
        <header className="">
            <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between items-center">
                    {/* — Desktop Menu — */}
                    <NavigationMenu className="hidden lg:flex">
                        <NavigationMenuList className="flex space-x-4 items-center">
                            {MENU.map((item) =>
                                item.subItems ? (
                                    // Dropdown for items with subItems
                                    <NavigationMenuItem key={item.label}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="flex items-center"
                                                >
                                                    <item.Icon className="h-4 w-4 mr-1.5" />
                                                    {item.label}
                                                    <ChevronDown className="ml-1 h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                {item.subItems.map((sub) => (
                                                    <DropdownMenuItem asChild key={sub.label}>
                                                        <Link
                                                            href={sub.href}
                                                            className="flex items-center"
                                                        >
                                                            <sub.Icon className="h-4 w-4 mr-2" />
                                                            {sub.label}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </NavigationMenuItem>
                                ) : (
                                    // Simple link for items without subItems
                                    <NavigationMenuItem key={item.label}>
                                        <Link
                                            href={item.href!}
                                            className={cn(
                                                'flex items-center px-3 py-2 text-sm font-medium',
                                                'hover:text-primary rounded-md transition-colors',
                                                isActive(item.href!) &&
                                                    'bg-primary/10 text-primary font-semibold',
                                            )}
                                        >
                                            <item.Icon className="h-4 w-4 mr-1.5" />
                                            {item.label}
                                        </Link>
                                    </NavigationMenuItem>
                                ),
                            )}
                            {/* Free Server Button */}
                            <NavigationMenuItem>
                                <Button
                                    asChild
                                    size="default"
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg"
                                >
                                    <Link
                                        href="/order"
                                        className="flex items-center"
                                    >
                                        <Gift className="h-4 w-4 mr-1.5" />
                                        {t('buttonText')}
                                    </Link>
                                </Button>
                            </NavigationMenuItem>
                            {/* <NavigationMenuItem>
                <div className="flex flex-end">
                  <LanguageSwitcher currentLocale={locale} />
                </div>
              </NavigationMenuItem> */}
                        </NavigationMenuList>
                    </NavigationMenu>

                    {/* — Mobile Menu — */}
                    <div className="lg:hidden">
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MenuIcon className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-64">
                                <SheetHeader>
                                    <SheetTitle>
                                        <Link href="/" onClick={() => setOpen(false)}>
                                            {/* Light mode logo */}
                                            <Image
                                                src="/images/light/logo/ScyedLogo.webp"
                                                alt="Scyed"
                                                fill={false}
                                                width={1084}
                                                height={482}
                                                sizes="64px"
                                                style={{ width: 'auto', maxHeight: '100%' }}
                                                className="block dark:hidden"
                                                priority
                                            />
                                            <Image
                                                src="/images/dark/logo/ScyedLogo.webp"
                                                alt="Scyed"
                                                fill={false}
                                                width={1084}
                                                height={482}
                                                sizes="64px"
                                                style={{ width: 'auto', maxHeight: '100%' }}
                                                className="hidden dark:block"
                                                priority
                                            />
                                        </Link>
                                    </SheetTitle>
                                </SheetHeader>

                                <nav className="flex flex-col space-y-2 mt-6">
                                    {/* Dashboard prominently at the top */}
                                    { auth?.session &&                                       
                                        <Link
                                            href="/gameserver"
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                'flex items-center px-4 py-3 text-lg font-semibold rounded-lg transition-colors',
                                                isActive('/gameserver')
                                                    ? 'bg-primary/20 text-primary font-semibold'
                                                    : 'hover:text-primary',
                                            )}
                                        >
                                            <LayoutDashboard className="h-6 w-6 mr-3" />
                                            Dashboard
                                        </Link>
                                    }

                                    {/* Free Server Button - Mobile */}
                                    <Link
                                        href="/order"
                                        onClick={() => setOpen(false)}
                                        className="flex items-center px-4 py-3 text-lg font-semibold rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all"
                                    >
                                        <Gift className="h-6 w-6 mr-3" />
                                        {t('buttonText')}
                                    </Link>

                                    {/* Divider */}
                                    <div className="border-t my-2" />

                                    {/* Other menu items */}
                                    {MENU.filter((item) => item.label !== 'Dashboard').map(
                                        (item) =>
                                            item.subItems ? (
                                                <DropdownMenu key={item.label}>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="flex items-center w-full justify-between"
                                                        >
                                                            <span className="flex items-center">
                                                                <item.Icon className="h-5 w-5 mr-2" />
                                                                {item.label}
                                                            </span>
                                                            <ChevronDown className="h-5 w-5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-full">
                                                        {item.subItems.map((sub) => (
                                                            <DropdownMenuItem
                                                                asChild
                                                                key={sub.label}
                                                            >
                                                                <Link
                                                                    href={sub.href}
                                                                    className="flex items-center"
                                                                    onClick={() => setOpen(false)}
                                                                >
                                                                    <sub.Icon className="h-5 w-5 mr-2" />
                                                                    {sub.label}
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <Link
                                                    key={item.label}
                                                    href={item.href!}
                                                    onClick={() => setOpen(false)}
                                                    className={cn(
                                                        'flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors',
                                                        isActive(item.href!)
                                                            ? 'bg-primary/20 text-primary font-semibold'
                                                            : 'hover:text-primary',
                                                    )}
                                                >
                                                    <item.Icon className="h-5 w-5 mr-3" />
                                                    {item.label}
                                                </Link>
                                            ),
                                    )}

                                    <div className="absolute bottom-4 left-0 w-full flex justify-center">
                                        <LanguageSwitcher currentLocale={locale} />
                                    </div>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}
