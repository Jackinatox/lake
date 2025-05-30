"use server"

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/prisma";
import { CheckCircle, ChevronRight, Shield, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

export default async function LandingPage() {
  const t = await getTranslations("landingpage");
  const data = await prisma.gameData.findMany();

  const supportedGames = data.map((game) => {
    const imgName = game.name.toLowerCase() + ".jpg";

    return {
      id: game.id,
      name: game.name,
      image: `/images/games/${imgName}`,
    };  // TODO: Add images
  });

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-6">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/BGs/background-hero.png"
            alt="Gaming background"
            fill
            className="object-cover opacity-30 block dark:hidden"
            priority
          />
          <Image
            src="/images/BGs/background-hero-dark.png"
            alt="Gaming background dark"
            fill
            className="object-cover opacity-30 hidden dark:block"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {t("header1")} <span className="text-primary">{t("header2")}</span>
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-background/80 backdrop-blur-sm">
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <h3 className="text-xl font-semibold">{t("boxLabel1")}</h3>
                  <p className="text-muted-foreground">{t("boxDesc1")}</p>
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-background/80 backdrop-blur-sm">
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <h3 className="text-xl font-semibold">{t("boxLabel2")}</h3>
                  <p className="text-muted-foreground">{t("boxDesc2")}</p>
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-background/80 backdrop-blur-sm">
                  <CheckCircle className="h-10 w-10 text-primary mb-2" />
                  <h3 className="text-xl font-semibold">{t("boxLabel3")}</h3>
                  <p className="text-muted-foreground">{t("boxDesc3")}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products/gameserver">
                  <Button size="lg" className="px-8">
                    {t("buttonStartNow")}
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="px-8">
                  {t("buttonComparePlans")}
                </Button>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border">
              <h2 className="text-2xl font-bold mb-6">{t("supportedGames")}</h2>
              <div className="grid grid-cols-1 gap-4">
                {supportedGames.map((game) => (
                  <Link href={`/booking2/${game.id}`} key={game.id}>
                  <div
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                      <Image
                        src={game.image}
                        alt={`${game.name} Icon`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium">{game.name}</span>
                  </div>
                  </Link>
                ))}
              </div>
              <Link href='/products/gameserver'>
                <Button variant="link" className="mt-6 flex items-center gap-1">
                  {t("showAllGames")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <Card className="mt-5 py-20 px-4 md:px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">{t("toolsHeader")}</h2>

          {/* Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl font-bold mb-4">{t("panelTitle")}</h3>
              <p className="text-muted-foreground mb-6">{t("panelDesc")}</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{t("panelFeature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{t("panelFeature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{t("panelFeature3")}</span>
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <Image
                src="/images/home/panel.png"
                width={600}
                height={400}
                alt="Control panel screenshot"
                className="rounded-lg shadow-lg border"
              />
            </div>
          </div>

          {/* File Manager */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <Image
                src="/images/home/filemanager.png"
                width={600}
                height={400}
                alt="File manager screenshot"
                className="rounded-lg shadow-lg border"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">{t("fileManagerTitle")}</h3>
              <p className="text-muted-foreground mb-6">{t("fileManagerDesc")}</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{t("fileManagerFeature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{t("fileManagerFeature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{t("fileManagerFeature3")}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Backup Manager */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl font-bold mb-4">{t("backupTitle")}</h3>
              <p className="text-muted-foreground mb-6">{t("backupDesc")}</p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{t("backupFeature1")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{t("backupFeature2")}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>{t("backupFeature3")}</span>
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2">
              <Image
                src="/images/home/backups.png"
                width={600}
                height={400}
                alt="Backup manager screenshot"
                className="rounded-lg shadow-lg border"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* CTA Section */}
      <Card className="mt-5 py-20 px-4 md:px-6 bg-primary/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t("ctaHeader")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">{t("ctaDesc")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products/gameserver">
              <Button size="lg" className="px-8">
                {t("ctaButton")}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </main>
  );
}
