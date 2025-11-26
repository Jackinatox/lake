import { TicketCategory, TicketStatus } from '@/app/client/generated/enums';
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';
import { env } from 'next-runtime-env';

interface SupportTicketCreatedTemplateProps {
    createdAt: Date;
    status: TicketStatus;
    category: TicketCategory;
    message: string;
    ticketId?: string;
    ticketUrl?: string;
}

const formatEnumLabel = (value: string) =>
    value
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

export default function SupportTicketCreatedTemplate({
    createdAt,
    status,
    category,
    message,
    ticketId,
    ticketUrl,
}: SupportTicketCreatedTemplateProps) {
    const formattedCreatedAt = new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(createdAt);

    return (
        <Html>
            <Head />
            <Preview>Dein Support-Ticket bei Scyed wurde erstellt.</Preview>
            <Tailwind>
                <Body style={{ backgroundColor: '#f8f9fa', margin: 0, padding: 0 }}>
                    <Container
                        style={{
                            margin: '0 auto',
                            maxWidth: '520px',
                            backgroundColor: '#ffffff',
                            padding: '32px 24px',
                        }}
                    >
                        <Heading
                            style={{
                                margin: 0,
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#0f172a',
                            }}
                        >
                            Support-Ticket erstellt
                        </Heading>
                        <Text className="mt-6 text-base leading-6 text-slate-600">Hallo,</Text>
                        <Text className="mt-4 text-base leading-6 text-slate-600">
                            vielen Dank für deine Anfrage. Wir haben dein Support-Ticket erfolgreich
                            erhalten und melden uns schnellstmöglich mit einer Antwort.
                        </Text>
                        <Section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            {ticketId && (
                                <Text className="m-0 text-sm font-medium text-slate-500">
                                    Ticket-ID: <span className="text-slate-900">{ticketId}</span>
                                </Text>
                            )}
                            <Text className="mt-2 text-base font-semibold text-slate-900">
                                Zusammenfassung
                            </Text>
                            <Text className="mt-2 text-sm leading-6 text-slate-600">
                                <span className="font-medium text-slate-900">Eingegangen:</span>{' '}
                                {formattedCreatedAt}
                            </Text>
                            <Text className="text-sm leading-6 text-slate-600">
                                <span className="font-medium text-slate-900">Status:</span>{' '}
                                {formatEnumLabel(status)}
                            </Text>
                            <Text className="text-sm leading-6 text-slate-600">
                                <span className="font-medium text-slate-900">Kategorie:</span>{' '}
                                {formatEnumLabel(category)}
                            </Text>
                        </Section>
                        <Section className="mt-6">
                            <Text className="text-base font-medium text-slate-900">
                                Deine Nachricht
                            </Text>
                            <Text className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                                {message}
                            </Text>
                        </Section>
                        {ticketUrl && (
                            <Section className="mt-6">
                                <Button
                                    href={ticketUrl}
                                    className="inline-block rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white no-underline"
                                >
                                    Ticket im Dashboard ansehen
                                </Button>
                            </Section>
                        )}
                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Falls du weitere Informationen ergänzen möchtest, antworte einfach auf
                            diese E-Mail oder aktualisiere dein Ticket im Dashboard.
                        </Text>
                        <Text className="mt-6 text-base font-medium text-slate-900">
                            Dein Scyed Team
                        </Text>
                        <Text className="mt-8 text-sm leading-6 text-slate-400">
                            Du erhältst diese E-Mail, weil du ein Support-Ticket bei Scyed erstellt
                            hast. Wenn du keine Benachrichtigungen mehr erhalten möchtest,
                            kontaktiere bitte den{' '}
                            <a
                                href={`${env("NEXT_PUBLIC_APP_URL")}/support`}
                                style={{ color: '#94a3b8', textDecoration: 'underline' }}
                            >
                                Support
                            </a>
                            .
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
