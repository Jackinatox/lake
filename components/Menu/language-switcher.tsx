import React, { useTransition, useEffect, useState } from "react"
import { Check, ChevronDown, Globe } from "lucide-react"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "@/i18n/navigation"

// Import from our mock implementation
// In a real project, you would import from next-intl/client
// import { useRouter, usePathname } from "next-intl"

interface Language {
    code: string
    name: string
    flag?: string
}

interface LanguageSwitcherProps {
    currentLocale: string
    availableLocales?: Language[]
}

export function LanguageSwitcher({
    currentLocale,
    availableLocales = [
        { code: "en", name: "English" },
        { code: "de", name: "Deutsch" },
    ],
}: LanguageSwitcherProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()
    const [optimisticLocale, setOptimisticLocale] = React.useState(currentLocale)

    React.useEffect(() => {
        setOptimisticLocale(currentLocale)
    }, [currentLocale])

    const handleLocaleChange = (locale: string) => {
        setOptimisticLocale(locale)
        // Remove the current locale from the pathname (assume it's the first segment)
        const segments = pathname.split("/").filter(Boolean);
        // If the first segment matches a locale code, remove it
        const availableLocaleCodes = availableLocales.map((l) => l.code);
        if (availableLocaleCodes.includes(segments[0])) {
            segments.shift();
        }
        const newPath = "/" + segments.join("/");
        startTransition(() => {
            router.replace(newPath, { locale });
        });
    }

    const currentLanguage = availableLocales.find((locale) => locale.code === optimisticLocale) || {
        code: optimisticLocale,
        name: optimisticLocale,
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={isPending}>
                    <Globe className="h-4 w-4" />
                    <span>{currentLanguage.name}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {availableLocales.map((locale) => (
                    <DropdownMenuItem
                        key={locale.code}
                        onClick={() => handleLocaleChange(locale.code)}
                        className={cn(
                            "flex items-center gap-2",
                            optimisticLocale === locale.code && "font-medium bg-accent/30"
                        )}
                        disabled={isPending && optimisticLocale !== locale.code}
                    >
                        {locale.name}
                        {optimisticLocale === locale.code && <Check className="h-4 w-4 ml-auto" />}
                        {isPending && optimisticLocale !== locale.code && (
                            <span className="ml-auto animate-spin text-xs">...</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
