import type { Prisma } from '@/app/client/generated/client';

/**
 * FAQ entries for a fresh database (prisma/seed.ts inserts them only into an empty FAQ table).
 * Categories decide the page: pricing → /pricing, refunds → /withdrawal, free_servers → /order/free,
 * game_<slug> → /order/<slug>. Fixed numbers (30 days runtime, 90 days until deletion) are the
 * exceptions documented in docs/content-placement.md; update them here and in the admin together.
 */
export const FAQ_SEED: Prisma.FAQCreateManyInput[] = [
    {
        question_de: 'Wie funktioniert die Abrechnung?',
        question_en: 'How does billing work?',
        answer_de:
            'Du zahlst einmalig für die gewählte Laufzeit. Kein Abo, keine automatische Verlängerung, der Server stoppt, wenn die bezahlte Zeit abgelaufen ist.',
        answer_en:
            'You pay once for the selected duration. No subscription, no automatic renewal, your server stops when the paid time runs out.',
        sorting: 10,
        enabled: true,
        category: ['pricing'],
    },
    {
        question_de: 'Sind die Preise inklusive Mehrwertsteuer?',
        question_en: 'Do prices include VAT?',
        answer_de:
            'Alle Preise sind Endpreise. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet, es kommt also nichts dazu.',
        answer_en:
            'All prices are final. Under Section 19 of the German VAT Act (UStG), no VAT is charged, so nothing is added on top.',
        sorting: 15,
        enabled: true,
        category: ['pricing'],
    },
    {
        question_de: 'Kann ich später upgraden?',
        question_en: 'Can I upgrade later?',
        answer_de:
            'Ja. Du kannst Deinen Server jederzeit upgraden oder die Laufzeit verlängern. Beim Upgrade wird die Preisdifferenz anteilig auf Deine verbleibende Laufzeit angerechnet.',
        answer_en:
            'Yes. You can upgrade your server or extend its duration at any time. When upgrading, the price difference is credited proportionally to your remaining runtime.',
        sorting: 20,
        enabled: true,
        category: ['pricing'],
    },
    {
        question_de: 'Kann ich meinen Gameserver-Vertrag widerrufen?',
        question_en: 'Can I withdraw from my gameserver contract?',
        answer_de:
            'Ja. Als Verbraucher hast Du 14 Tage nach Vertragsschluss das Recht, Deinen Kauf ohne Angabe von Gründen zu widerrufen.\n\nDa Du beim Checkout zugestimmt hast, dass Dein Server sofort startet, gilt: Für die Tage, an denen Dein Server bereits lief, berechnen wir einen zeitanteiligen Wertersatz. Den restlichen Betrag erstatten wir vollständig.',
        answer_en:
            'Yes. As a consumer, you have the right to withdraw from your purchase within 14 days of the contract being concluded, without giving any reason.\n\nSince you agreed at checkout that your server starts immediately: For the days your server was already running, we charge a proportional compensation for use. The remaining amount will be refunded in full.',
        sorting: 30,
        enabled: true,
        category: ['refunds'],
    },
    {
        question_de: 'Wie läuft der Widerruf ab?',
        question_en: 'How does the withdrawal process work?',
        answer_de:
            '1. Nutze das [Widerrufsformular](https://scyed.com/withdrawal) oder schreib uns an [support@scyed.com](mailto:support@scyed.com). Für die Frist reicht es, wenn Du den Widerruf rechtzeitig abschickst.\n2. Wir bestätigen Dir den Eingang. Für die Tage, an denen Dein Server bis zum Widerruf lief, steht uns ein zeitanteiliger Wertersatz zu. Den verrechnen wir mit Deiner Zahlung.\n3. Den Rest erstatten wir innerhalb von 14 Tagen nach Eingang Deines Widerrufs auf das Zahlungsmittel, mit dem Du bezahlt hast.',
        answer_en:
            '1. Use the [withdrawal form](https://scyed.com/withdrawal) or email us at [support@scyed.com](mailto:support@scyed.com). Sending your withdrawal in time is enough to meet the deadline.\n2. We confirm receipt. For the days your server ran until the withdrawal, we are entitled to proportional compensation, which we offset against your payment.\n3. We refund the rest within 14 days of receiving your withdrawal, to the payment method you used.',
        sorting: 40,
        enabled: true,
        category: ['refunds'],
    },
    {
        question_de: 'Wann wird mein Server abgeschaltet?',
        question_en: 'When will my server be shut down?',
        answer_de:
            'Nach Ende der Laufzeit oder nach einem Widerruf wird Dein Server deaktiviert. Du kannst ihn dann nicht mehr nutzen und nicht auf Deine Dateien zugreifen.\n\nDeine Daten bleiben noch 90 Tage gespeichert. Danach wird der Server mit allen Daten gelöscht. Verlängerst Du den Server innerhalb der Frist, sind Deine Daten sofort wieder da.',
        answer_en:
            'After the runtime ends or after a withdrawal, your server is deactivated. You can then no longer use it or access your files.\n\nYour data is kept for 90 more days. After that, the server and all its data are deleted. If you extend the server within that period, your data is available again right away.',
        sorting: 50,
        enabled: true,
        category: ['pricing', 'refunds'],
    },
    {
        question_de: 'Ist der Server wirklich kostenlos?',
        question_en: 'Is the server really free?',
        answer_de:
            'Ja. Du brauchst keine Zahlungsdaten und schließt kein Abo ab. Der Server kostet nichts, solange Du ihn nutzt.',
        answer_en:
            'Yes. You do not need payment details and there is no subscription. The server costs nothing for as long as you use it.',
        sorting: 10,
        enabled: true,
        category: ['free_servers'],
    },
    {
        question_de: 'Wie lange läuft ein kostenloser Server?',
        question_en: 'How long does a free server run?',
        answer_de:
            'Ein kostenloser Server läuft 30 Tage. Du kannst ihn im Dashboard jederzeit mit wenigen Klicks kostenlos verlängern, so oft Du willst. Die 30 Tage starten dann wieder von vorn, sie werden nicht aufaddiert.',
        answer_en:
            'A free server runs for 30 days. You can extend it for free in the dashboard at any time in a few clicks, as often as you like. The 30 days then start over; they do not add up.',
        sorting: 20,
        enabled: true,
        category: ['free_servers'],
    },
    {
        question_de: 'Was passiert, wenn die Laufzeit abläuft?',
        question_en: 'What happens when the runtime ends?',
        answer_de:
            'Der Server schaltet sich ab, Deine Daten bleiben aber erhalten. Sobald Du ihn verlängerst, läuft er wieder. Wird ein abgelaufener Server nicht innerhalb von 90 Tagen verlängert, wird er mit allen Daten gelöscht.',
        answer_en:
            'The server shuts down, but your data is kept. As soon as you extend it, it runs again. If an expired server is not extended within 90 days, it is deleted with all its data.',
        sorting: 30,
        enabled: true,
        category: ['free_servers'],
    },
    {
        question_de: 'Wie bekomme ich einen kostenlosen Server?',
        question_en: 'How do I get a free server?',
        answer_de:
            'Melde Dich mit Discord oder Google an, wähle auf dieser Seite Dein Spiel und Dein Server wird automatisch eingerichtet. Du verwaltest ihn danach in unserem Dashboard mit Konsole, Datei-Manager und Backups.',
        answer_en:
            'Sign in with Discord or Google, pick your game on this page and your server is set up automatically. You then manage it in our dashboard with console, file manager and backups.',
        sorting: 40,
        enabled: true,
        category: ['free_servers'],
    },
    {
        question_de: 'Gibt es eine Begrenzung der Spieleranzahl?',
        question_en: 'Is there a player limit?',
        answer_de:
            'Nein. Es gibt keine Slot-Begrenzung und keine Warteschlange, und der Server läuft weiter, auch wenn gerade niemand online ist. Die Grenze setzen nur CPU, RAM und Speicherplatz.',
        answer_en:
            'No. There is no slot limit and no queue, and the server keeps running even when no one is online. The only limits are CPU, RAM and storage.',
        sorting: 50,
        enabled: true,
        category: ['free_servers'],
    },
    {
        question_de: 'Können Bedrock-Spieler mitspielen?',
        question_en: 'Can Bedrock players join?',
        answer_de:
            'Ja, mit Geyser. Es läuft als Plugin auf Paper und als Mod auf Fabric und NeoForge, nicht auf Vanilla und Forge. Trägst Du in der Geyser-Konfiguration den Port Deines Servers ein, reicht ein einziger Port. Mehr dazu in der [Doku](/docs/spiele/minecraft/#bedrock-spieler-einladen).',
        answer_en:
            "Yes, with Geyser: a plugin on Paper and a mod on Fabric and NeoForge, not available on Vanilla and Forge. Set your server's port in Geyser's config and a single port is enough. More in the [docs](/docs/spiele/minecraft/#bedrock-spieler-einladen).",
        sorting: 10,
        enabled: true,
        category: ['game_minecraft'],
    },
    {
        question_de: 'Kann ich die Minecraft-Version oder den Modloader später wechseln?',
        question_en: 'Can I change the Minecraft version or mod loader later?',
        answer_de:
            'Ja, jederzeit in den Einstellungen Deines Servers. Dort findest Du auch „Spiel wechseln“, um ein anderes Spiel zu installieren, oder bei Minecraft einen anderen Modloader. Lege vorher ein Backup an: Eine Welt lässt sich auf eine neuere Minecraft-Version hochziehen, aber nicht zurück.',
        answer_en:
            "Yes, at any time in your server's settings. There you also find “Change Game” to install a different game or, for Minecraft, a different mod loader. Make a backup first: a world can be upgraded to a newer Minecraft version, but not back.",
        sorting: 20,
        enabled: true,
        category: ['game_minecraft'],
    },
    {
        question_de: 'Wie lade ich meine bestehende Welt hoch?',
        question_en: 'How do I upload my existing world?',
        answer_de:
            'Per SFTP, im Browser gehen nur einzelne Dateien. Wie das geht, steht unter [Dateien hochladen](/docs/rund-um-scyed/server/dateien-hochladen/).',
        answer_en:
            'Via SFTP, the browser only takes single files. See [Uploading files](/docs/rund-um-scyed/server/dateien-hochladen/) (German).',
        sorting: 30,
        enabled: true,
        category: ['game_minecraft'],
    },
    {
        question_de: 'Kann ich Plugins und Mods installieren?',
        question_en: 'Can I install plugins and mods?',
        answer_de:
            'Ja. Plugins laufen auf Paper, Mods auf dem Modloader, den die Mod angibt: Fabric, Forge oder NeoForge. Ob beides zusammen geht, steht in der [Doku](/docs/spiele/minecraft/#welcher-server-typ-passt). Hochladen kannst Du sie im Tab „Dateien“ oder per [SFTP](/docs/rund-um-scyed/server/dateien-hochladen/).',
        answer_en:
            'Yes. Plugins run on Paper, mods on the mod loader the mod names: Fabric, Forge or NeoForge. Whether both work together is explained in the [docs](/docs/spiele/minecraft/#welcher-server-typ-passt). Upload them in the “Files” tab or via [SFTP](/docs/rund-um-scyed/server/dateien-hochladen/).',
        sorting: 40,
        enabled: true,
        category: ['game_minecraft'],
    },
    {
        question_de: 'Wird Space Age unterstützt?',
        question_en: 'Is Space Age supported?',
        answer_de:
            'Ja. Du kannst bei der Installation auswählen, welche der 3 offiziellen Mods aktiviert werden sollen.',
        answer_en:
            'Yes. During installation, you can choose which of the 3 official mods should be activated.',
        sorting: 10,
        enabled: true,
        category: ['game_factorio'],
    },
];
