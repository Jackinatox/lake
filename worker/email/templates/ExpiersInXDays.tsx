import { Button, Heading, Section, Text } from "@react-email/components";
import { DELETE_GAMESERVER_AFTER_DAYS } from "../../WorkerConstants";
import { EmailLayout } from "../components/EmailLayout";

interface ExpiredServerTemplateProps {
    username: string;
    serverName: string;
    expirationDate: Date;
    expirationDays: 7 | 1;
    deleteDate: Date;
}

export default function ExpiredServerTemplate({ username, serverName, expirationDate, expirationDays, deleteDate }: ExpiredServerTemplateProps) {
    const formattedExpirationDate = new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(expirationDate);

    const formattedDeleteDate = new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(deleteDate);

    const previewText = `Dein Server ${serverName} läuft in ${expirationDays === 1 ? "1 Tag" : `${expirationDays} Tagen`} ab.`;

    return (
        <EmailLayout preview={previewText}>
            <Heading className="m-0 text-2xl font-bold text-slate-900">Server läuft bald ab</Heading>
            <Text className="mt-6 text-base leading-6 text-slate-600">Hallo {username},</Text>
            <Text className="mt-4 text-base leading-6 text-slate-600">
                Dein Server <span className="font-semibold text-slate-900">{serverName}</span> läuft in {expirationDays === 1 ? "1 Tag" : `${expirationDays} Tagen`} ab, exakt am {formattedExpirationDate}.
            </Text>
            <Text className="mt-4 text-base leading-6 text-slate-600">
                Nach dem Ablauf bleibt er für {DELETE_GAMESERVER_AFTER_DAYS} Tage gesichert und kann bis spätestens {formattedDeleteDate} reaktiviert werden.
            </Text>
            <Section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Text className="m-0 text-base font-semibold text-slate-900">Ablaufdatum: {formattedExpirationDate}</Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600">
                    Wir halten deinen Server danach noch {DELETE_GAMESERVER_AFTER_DAYS} Tage vor, bis zum {formattedDeleteDate}. Anschließend werden alle Daten gelöscht.
                </Text>
            </Section>
            <Section className="mt-6">
                <Button
                    href="https://example.com"
                    className="inline-block rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white no-underline"
                >
                    Server jetzt erneuern
                </Button>
            </Section>
        </EmailLayout>
    );
}