// app/layout.tsx
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import MainMenu from "@/components/Menu/main-menu";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { SessionProvider } from "next-auth/react";
import SessionInfo from "@/components/session-info";
import Profile from "@/components/auth/profile";
import { Toaster } from "@/components/ui/toaster";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Scyed #lake",
  description: "with Next.js and now with nextauth !!!!",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <NextIntlClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider>
              <div className="flex flex-col min-h-screen">
                <nav className="w-full border-b border-b-foreground/10 h-16">
                  <div className="w-full max-w-7xl mx-auto flex items-center justify-between p-3 px-5 text-sm">
                    <div className="flex items-center font-semibold">
                      {/* left topbar */}
                      <Link href="/" className="mr-4">Scyed</Link>
                      <MainMenu locale={locale} />
                      {/* left topbar end */}
                    </div>
                    <Profile />
                  </div>
                </nav>

                <main className="flex-grow w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                  {children}
                  {/* <SessionInfo /> */}
                </main>

                <footer className="w-full border-t">
                  <div className="w-full max-w-7xl mx-auto flex items-center justify-center text-center text-xs gap-8 py-16">
                    <ThemeSwitcher />
                  </div>
                </footer>
              </div>
              <Toaster />
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
