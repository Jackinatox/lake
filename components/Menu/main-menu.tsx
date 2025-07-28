'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  Menu as MenuIcon,
  Package,
  Settings,
  LayoutDashboard,
  Image,
  Users,
  HardDrive,
  Server,
  Gamepad2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetHeader,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from './language-switcher'

// 1) Define a TS type for clarity (optional, but helpful in larger apps)
type SubItem = { label: string; href: string; Icon: React.FC<React.SVGProps<SVGSVGElement>> }
type MenuItem = {
  label: string
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  // If `subItems` is present, we render a dropdown; else it's a single link
  subItems?: SubItem[]
  href?: string
}

// 2) Centralized menu "JSON"
const MENU: MenuItem[] = [
  // {
  //   label: 'Admin',
  //   Icon: Settings,
  //   subItems: [
  //     { label: 'Users', href: '/admin/users', Icon: Users },
  //     { label: 'GameServer', href: '/admin/gameservers', Icon: Settings },
  //     { label: 'Wings', href: '/admin/wings', Icon: HardDrive },
  //   ],
  // },
  {
    label: 'Packages',
    Icon: Package,
    subItems: [
      { label: 'Games', href: '/products/gameserver', Icon: Gamepad2 },
      { label: 'Server config', href: '/products/server', Icon: Server },
    ],
  },
  {
    label: 'Dashboard',
    Icon: LayoutDashboard,
    href: '/gameserver',
  },
]

export default function MainMenu({ locale }) {
  return (
    <header className="">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">


          {/* — Desktop Menu — */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="flex space-x-4">
              {MENU.map((item) =>
                item.subItems ? (
                  // Dropdown for items with subItems
                  <NavigationMenuItem key={item.label}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center">
                          <item.Icon className="h-4 w-4 mr-1.5" />
                          {item.label}
                          <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {item.subItems.map((sub) => (
                          <DropdownMenuItem asChild key={sub.label}>
                            <Link href={sub.href} className="flex items-center">
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
                        'hover:text-primary rounded-md transition-colors'
                      )}
                    >
                      <item.Icon className="h-4 w-4 mr-1.5" />
                      {item.label}
                    </Link>
                  </NavigationMenuItem>
                )
              )}
              {/* <NavigationMenuItem>
                <div className="flex flex-end">
                  <LanguageSwitcher currentLocale={locale} />
                </div>
              </NavigationMenuItem> */}
            </NavigationMenuList>
          </NavigationMenu>

          {/* — Mobile Menu — */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <Link href="/">
                    <SheetTitle> Home </SheetTitle>
                  </Link>
                </SheetHeader>

                <nav className="flex flex-col space-y-2 mt-4">
                  {MENU.map((item) =>
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
                            <DropdownMenuItem asChild key={sub.label}>
                              <Link href={sub.href} className="flex items-center">
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
                        className="flex items-center px-3 py-2 text-base font-medium hover:text-primary rounded-md"
                      >
                        <item.Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Link>
                    )
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
  )
}
