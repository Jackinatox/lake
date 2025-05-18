import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, Zap, CheckCircle, ChevronRight } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import Link from "next/link";

// Spieldaten mit Bildern
// const supportedGames = [
//   { name: "Minecraft", image: "/placeholder.svg?height=60&width=60" },
//   { name: "Counter-Strike 2", image: "/placeholder.svg?height=60&width=60" },
//   { name: "ARK: Survival Evolved", image: "/placeholder.svg?height=60&width=60" },
//   { name: "Rust", image: "/placeholder.svg?height=60&width=60" },
//   { name: "Valheim", image: "/placeholder.svg?height=60&width=60" },
// ]



export default async function LandingPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.from('GameData').select('*');

  // console.log(data)

  const supportedGames = data.map((game) => {
    const imgName = game.name.toLowerCase() + '.jpg';

    const { data } = supabase.storage.from('images').getPublicUrl(imgName);


    return {
      id: game.id,
      name: game.name,
      image: data.publicUrl || "/placeholder.svg?height=60&width=60"
    }
  })



  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero-Bereich mit Hintergrundbild */}
      <section className="relative py-20 px-4 md:px-6">
        {/* Hintergrundbild */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/background-hero.png`}

            alt="Gaming Hintergrund"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Gameserver-Hosting <span className="text-primary">leicht gemacht</span>
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
                <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-background/80 backdrop-blur-sm">
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <h3 className="text-xl font-semibold">Einfach</h3>
                  <p className="text-muted-foreground">Einrichtung in Minuten</p>
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-background/80 backdrop-blur-sm">
                  <Shield className="h-10 w-10 text-primary mb-2" />
                  <h3 className="text-xl font-semibold">Sicher</h3>
                  <p className="text-muted-foreground">Geschützte Infrastruktur</p>
                </div>

                <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-background/80 backdrop-blur-sm">
                  <CheckCircle className="h-10 w-10 text-primary mb-2" />
                  <h3 className="text-xl font-semibold">Zuverlässig</h3>
                  <p className="text-muted-foreground">99,9% Verfügbarkeitsgarantie</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products/gameserver">
                  <Button size="lg" className="px-8"> Jetzt starten </Button>
                </Link>
                <Button size="lg" variant="outline" className="px-8">
                  Vergleichen
                </Button>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border">
              <h2 className="text-2xl font-bold mb-6">Unterstützte Spiele</h2>
              <div className="grid grid-cols-1 gap-4">
                {supportedGames.map((game) => (
                  <div
                    key={game.name}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="relative h-12 w-12 rounded-md overflow-hidden border">
                      <Image
                        src={game.image || "/placeholder.svg"}
                        alt={`${game.name} Icon`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium">{game.name}</span>
                  </div>
                ))}
              </div>
              <Button variant="link" className="mt-6 flex items-center gap-1">
                Alle Spiele anzeigen
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Funktionen-Bereich */}
      <section className="py-20 px-4 md:px-6 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Leistungsstarke Verwaltungstools</h2>

          {/* Kontrollpanel-Funktion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl font-bold mb-4">Intuitives Kontrollpanel</h3>
              <p className="text-muted-foreground mb-6">
                Unser Control Panel macht Server-Management zum Kinderspiel: Starte, stoppe oder restarte deinen Server mit nur einem Klick. Behalte die Performance immer im Blick und gib deinem Server easy mehr Power, wenn du’s brauchst – alles super intuitiv und ohne Stress.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Ein-Klick-Server-Bereitstellung</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Echtzeit-Leistungsüberwachung</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Ressourcenzuweisungssteuerung</span>
                </li>
              </ul>
              {/* <Button>Mehr erfahren</Button> */}
            </div>
            <div className="order-1 lg:order-2">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/panel.png`}
                width={600}
                height={400}
                alt="Kontrollpanel Screenshot"
                className="rounded-lg shadow-lg border"
              />
            </div>
          </div>

          {/* Dateimanager-Funktion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <div>
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/filemanager.png`}
                width={600}
                height={400}
                alt="Dateimanager Screenshot"
                className="rounded-lg shadow-lg border"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">Einfacher Dateimanager</h3>
              <p className="text-muted-foreground mb-6">
                Lade einzelne Dateien bequem im Browser herunter oder lade neue Dateien manuell hoch. Für weitergehende Dateioperationen wie Bearbeiten, Verschieben oder Massen-Uploads nutze bitte einen FTP-Client.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Dateien herunterladen</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Dateien manuell hochladen</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Erweiterte Verwaltung per FTP-Client</span>
                </li>
              </ul>
              {/* <Button>Mehr erfahren</Button> */}
            </div>
          </div>

          {/* Backup-Manager-Funktion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl font-bold mb-4">Zuverlässiger Backup-Manager</h3>
              <p className="text-muted-foreground mb-6">
                Deine Spielstände sind bei uns safe! Mit automatischen Backups bist du immer auf der sicheren Seite – egal was passiert. Restore mit nur einem Klick und du bist sofort wieder am Start.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Automatisierte geplante Backups</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Ein-Klick-Wiederherstellungsfunktion</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span>Sichere externe Speicherung</span>
                </li>
              </ul>
              {/* <Button>Mehr erfahren</Button> */}
            </div>
            <div className="order-1 lg:order-2">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/backups.png`}
                width={600}
                height={400}
                alt="Backup-Manager Screenshot"
                className="rounded-lg shadow-lg border"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA-Bereich */}
      <section className="py-20 px-4 md:px-6 bg-primary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Bereit, Deinen Gameserver zu hosten?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Kleine Beschreibung
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">

            <Link href="/products/gameserver">
              <Button size="lg" className="px-8">Loslegen </Button>
            </Link>

            {/* <Button size="lg" variant="outline" className="px-8">
              Tarife vergleichen
            </Button> */}
          </div>
        </div>
      </section>
    </main>
  )
}
