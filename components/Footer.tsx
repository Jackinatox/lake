import { ThemeSwitcher } from "@/components/Menu/theme-switcher";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="w-full flex flex-col items-center justify-center border-t mx-auto text-center gap-4 py-8">
      <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
        <Link href="/legal/impressum" className="hover:text-foreground transition-colors">
          {t("impressum")}
        </Link>
        <Link href="/legal/agb" className="hover:text-foreground transition-colors">
          {t("agb")}
        </Link>
        <Link href="/legal/datenschutz" className="hover:text-foreground transition-colors">
          {t("datenschutz")}
        </Link>
      </nav>
      <ThemeSwitcher />
    </footer>
  );
}
