// app/layout.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/auth";

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
  const sess = await auth();

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
                  <Navbar locale={locale} />
                  <div className="flex flex-col gap-10 w-full max-w-8xl mx-auto px-2 md:px-6 lg:px-8 py-5">

                    {children}
                    <Toaster />
                    {process.env.NODE_ENV !== "production" &&
                        <pre className="break-words whitespace-pre-wrap bg-muted p-4 rounded text-xs ">
                        {JSON.stringify(sess?.user, null, 2)}
                        </pre>
                    }

                  </div>
                </SessionProvider>

                <Footer />

              </div>
            </main>
          </ThemeProvider>
        </body>
      </NextIntlClientProvider>
    </html>
  );
}
