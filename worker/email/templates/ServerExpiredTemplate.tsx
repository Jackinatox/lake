import { Button, Heading, Section, Text } from '@react-email/components';
import { APP_URL, DELETE_GAMESERVER_AFTER_DAYS } from '../../WorkerConstants';
import { EmailLayout } from '../components/EmailLayout';

interface ServerExpiredTemplateProps {
    username: string;
    serverName: string;
    expiredAt: Date;
    deleteDate: Date;
    serverId: string;
    isFreeServer: boolean;
}

export default function ServerExpiredTemplate({
    username,
    serverName,
    expiredAt,
    deleteDate,
    serverId,
    isFreeServer,
}: ServerExpiredTemplateProps) {
    const formattedExpiredAt = new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(expiredAt);

    const formattedDeleteDate = new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(deleteDate);

    return (
        <EmailLayout preview={`Dein Server ${serverName} ist abgelaufen.`}>
            <Heading className="m-0 text-2xl font-bold text-slate-900">
                Server ist abgelaufen
            </Heading>
            <Text className="mt-6 text-base leading-6 text-slate-600">Hallo {username},</Text>
            <Text className="mt-4 text-base leading-6 text-slate-600">
                Dein Server <span className="font-semibold text-slate-900">{serverName}</span> ist
                am {formattedExpiredAt} abgelaufen und wurde pausiert. Wir bewahren deine Daten noch
                bis zum
                {formattedDeleteDate} auf.
            </Text>
            <Section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <Text className="m-0 text-base font-semibold text-amber-900">
                    Datenaufbewahrung bis: {formattedDeleteDate}
                </Text>
                <Text className="mt-2 text-sm leading-6 text-amber-700">
                    Nach diesem Datum werden alle Serverdaten gelöscht. Reaktiviere den Server
                    vorher, um Datenverlust zu vermeiden.
                </Text>
            </Section>
            <Section className="mt-6">
                <Button
                    href={`${APP_URL}/gameserver/${serverId}/upgrade`}
                    className="inline-block rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white no-underline"
                >
                    Server jetzt {isFreeServer ? 'kostenlos ' : ''}erneuern
                </Button>
            </Section>
        </EmailLayout>
    );
}
