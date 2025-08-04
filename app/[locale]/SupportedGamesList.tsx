import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import React from "react";

export type Game = {
    id: string;
    name: string;
    images: {
      light: string;
      dark: string;
    };
  };
type SupportedGamesListProps = {
  supportedGames: Array<Game>;
  t: (key: string) => string;
};


export function SupportedGamesList({ supportedGames, t }: SupportedGamesListProps) {
  return (
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
                  src={game.images.light}
                  alt={`${game.name} Icon`}
                  fill
                  className="object-cover block dark:hidden"
                />
                <Image
                  src={game.images.dark}
                  alt={`${game.name} Icon`}
                  fill
                  className="object-cover hidden dark:block"
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
  );
}
