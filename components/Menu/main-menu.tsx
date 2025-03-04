"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, Menu, Package, Settings, LayoutDashboard, Image, Users, FileText, RefreshCw, HardDrive, Server, Gamepad2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MainMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:space-x-8 md:items-center">
            <DesktopNavItem
              title="Admin"
              icon={<Settings className="h-4 w-4 mr-1.5" />}
              items={[
                { title: "Users", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
                { title: "GameServer", href: "/admin/gameservers", icon: <Settings className="h-4 w-4" /> },
                { title: "Wings", href: "/admin/wings", icon: <HardDrive className="h-4 w-4" /> },
              ]}
            />
            <DesktopNavItem
              title="Packages"
              icon={<Package className="h-4 w-4 mr-1.5" />}
              items={[
                { title: "Games", href: "/products/gameserver", icon: <Gamepad2 className="h-4 w-4" /> },
                { title: "Hardware", href: "/products/hardware", icon: <Server className="h-4 w-4" /> },
                // { title: "Updates", href: "/packages/updates", icon: <RefreshCw className="h-4 w-4" /> },
              ]}
            />
            <Link
              href="/icons"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
            >
              <Image className="h-4 w-4 mr-1.5" />
              Icons
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              Dashboard
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-primary focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={cn("md:hidden", mobileMenuOpen ? "block" : "hidden")}>
        <div className="space-y-1 px-4 pb-3 pt-2">
          <MobileNavItem
            title="Admin"
            icon={<Settings className="h-5 w-5" />}
            items={[
              { title: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
              { title: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
              { title: "Logs", href: "/admin/logs", icon: <FileText className="h-5 w-5" /> },
            ]}
          />
          <MobileNavItem
            title="Packages"
            icon={<Package className="h-5 w-5" />}
            items={[
              { title: "Browse", href: "/packages/browse", icon: <Package className="h-5 w-5" /> },
              { title: "Installed", href: "/packages/installed", icon: <Package className="h-5 w-5" /> },
              { title: "Updates", href: "/packages/updates", icon: <RefreshCw className="h-5 w-5" /> },
            ]}
          />
          <Link
            href="/icons"
            className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary rounded-md"
          >
            <Image className="h-5 w-5 mr-3" />
            Icons
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary rounded-md"
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  )
}

interface NavItem {
  title: string
  href: string
  icon?: React.ReactNode
}

interface DesktopNavItemProps {
  title: string
  icon?: React.ReactNode
  items: NavItem[]
}

function DesktopNavItem({ title, icon, items }: DesktopNavItemProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 300) // 300ms delay before closing
  }

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {icon}
        {title}
        <ChevronDown className={cn("ml-1 h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 z-10 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="py-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary"
              >
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface MobileNavItemProps {
  title: string
  icon?: React.ReactNode
  items: NavItem[]
}

function MobileNavItem({ title, icon, items }: MobileNavItemProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div>
      <button
        className="flex w-full items-center justify-between px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary rounded-md"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          {icon && <span className="mr-3">{icon}</span>}
          {title}
        </div>
        <ChevronDown className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="mt-1 space-y-1 pl-10">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-primary rounded-md"
            >
              {item.icon && <span className="mr-3">{item.icon}</span>}
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

