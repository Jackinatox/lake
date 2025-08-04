import Link from "next/link";
import Image from "next/image";
import MainMenu from "@/components/Menu/MainMenu";
import Profile from "@/components/auth/profile";
import { LanguageSwitcher } from "@/components/Menu/language-switcher";

export default function Navbar({ locale }: { locale: string }) {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
      <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
        <div className="flex items-center font-semibold">
          <Link href="/" className="mr-4 flex items-center" style={{ height: "100%" }}>
            <Image
              src="/images/logo/ScyedLogo.png"
              alt="Scyed"
              fill={false}
              width={1920}
              height={1080}
              sizes="64px"
              style={{ width: "auto", maxHeight: "100%" }}
              className="block dark:hidden"
              priority
            />
            <Image
              src="/images/logo/ScyedLogo-dark.png"
              alt="Scyed"
              fill={false}
              width={1084}
              height={482}
              sizes="64px"
              style={{ width: "auto", maxHeight: "100%" }}
              className="hidden dark:block"
              priority
            />
          </Link>
          <MainMenu locale={locale} />
        </div>
        <div className="flex justify-between">
          <div className="hidden md:block">
            <LanguageSwitcher currentLocale={locale} />
          </div>
          <Profile />
        </div>
      </div>
    </nav>
  );
}
