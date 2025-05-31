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
      <NextIntlClientProvider>
        <body className="bg-background text-foreground">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main className="min-h-screen flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col items-center">
                <SessionProvider>
                  <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                    <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
                      <div className="flex items-center font-semibold">
                        {/* left topbar */}

                        <Link href="/" className="mr-4">Scyed</Link>
                        <MainMenu locale={locale} />

                        {/* left topbar end */}
                      </div>

                      <Profile />
                    </div>
                  </nav>
                  <div className="flex flex-col gap-10 w-5/6 p-5">

                    {children}
                    <Toaster />
                    <SessionInfo />

                  </div>
                </SessionProvider>

                <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
                  <ThemeSwitcher />
                </footer>

              </div>
            </main>
          </ThemeProvider>
        </body>
      </NextIntlClientProvider>
    </html>
  );
}
