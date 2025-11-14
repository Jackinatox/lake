import { Button, Heading, Section, Text } from '@react-email/components';
import { APP_URL } from '../../WorkerConstants';
import { EmailLayout } from '../components/EmailLayout';

interface DeleteServerTemplateProps {
    username: string;
    serverName: string;
    expirationDate: Date;
    deletionDate: Date;
    deletionDays: 7 | 1;
    serverId: string;
}

export default function DeleteServerTemplate({
    username,
    serverName,
    expirationDate,
    deletionDate,
    deletionDays,
    serverId,
}: DeleteServerTemplateProps) {
    const formattedExpirationDate = new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(expirationDate);

    const formattedDeletionDate = new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(deletionDate);

    // Calculate actual days remaining
    const now = new Date();
    const msRemaining = deletionDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

    const daysText = daysRemaining === 1 ? '1 Tag' : `${daysRemaining} Tagen`;
    const previewText = `Dein Server ${serverName} wird in ${daysText} endgültig gelöscht.`;

    return (
        <EmailLayout preview={previewText}>
            <Heading className="m-0 text-2xl font-bold text-slate-900">
                Server wird bald gelöscht
            </Heading>
            <Text className="mt-6 text-base leading-6 text-slate-600">Hallo {username},</Text>
            <Text className="mt-4 text-base leading-6 text-slate-600">
                Dein Server <span className="font-semibold text-slate-900">{serverName}</span> wird
                in {daysText} endgültig gelöscht, exakt am {formattedDeletionDate}.
            </Text>
            <Text className="mt-4 text-base leading-6 text-slate-600">
                Der Server ist bereits am {formattedExpirationDate} abgelaufen. Nach der Löschung
                können die Daten nicht wiederhergestellt werden.
            </Text>
            <Section className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                <Text className="m-0 text-base font-semibold text-red-900">
                    ⚠️ Löschung am: {formattedDeletionDate}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-red-600">
                    Nach diesem Datum werden alle Serverdaten unwiderruflich gelöscht. Bitte sichere
                    wichtige Daten oder reaktiviere den Server rechtzeitig.
                </Text>
            </Section>
            <Section className="mt-6">
                <Button
                    href={`${APP_URL}/de/gameserver/${serverId}/upgrade`}
                    className="inline-block rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white no-underline"
                >
                    Server jetzt reaktivieren
                </Button>
            </Section>
        </EmailLayout>
    );
}
