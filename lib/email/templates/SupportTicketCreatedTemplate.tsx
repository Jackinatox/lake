import { TicketCategory, TicketStatus } from '@/app/client/generated/enums';
import { Heading, Section, Text } from '@react-email/components';
import {
    EmailButton,
    EmailCard,
    EmailLayout,
    headingStyle,
    mutedTextStyle,
    subheadingStyle,
    textStyle,
} from '../components';

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
        <EmailLayout
            preview="Dein Support-Ticket bei Scyed wurde erstellt."
            footerNote="Du erhältst diese E-Mail, weil du ein Support-Ticket bei Scyed erstellt hast."
        >
            <Heading style={headingStyle}>Support-Ticket erstellt</Heading>
            <Text style={textStyle}>Hallo,</Text>
            <Text style={textStyle}>
                vielen Dank für deine Anfrage. Wir haben dein Support-Ticket erfolgreich erhalten
                und melden uns schnellstmöglich mit einer Antwort.
            </Text>
            <EmailCard style={{ marginTop: 16 }}>
                {ticketId ? (
                    <Text style={{ ...mutedTextStyle, margin: 0 }}>
                        Ticket-ID: <span style={{ color: '#0f172a' }}>{ticketId}</span>
                    </Text>
                ) : null}
                <Text style={{ ...subheadingStyle, marginTop: ticketId ? 6 : 0 }}>
                    Zusammenfassung
                </Text>
                <Text style={summaryTextStyle}>
                    <span style={summaryLabelStyle}>Eingegangen:</span> {formattedCreatedAt}
                </Text>
                <Text style={summaryTextStyle}>
                    <span style={summaryLabelStyle}>Status:</span> {formatEnumLabel(status)}
                </Text>
                <Text style={summaryTextStyle}>
                    <span style={summaryLabelStyle}>Kategorie:</span> {formatEnumLabel(category)}
                </Text>
            </EmailCard>
            <EmailCard style={{ marginTop: 12 }}>
                <Text style={{ ...subheadingStyle, margin: 0 }}>Deine Nachricht</Text>
                <Text style={messageTextStyle}>{message}</Text>
            </EmailCard>
            {/* {ticketUrl ? (
                <Section style={{ marginTop: 16 }}>
                    <EmailButton href={ticketUrl}>Ticket im Dashboard ansehen</EmailButton>
                </Section>
            ) : null} */}
            <Text style={{ ...textStyle, marginTop: 16 }}>
                Falls du weitere Informationen ergänzen möchtest, antworte einfach auf diese E-Mail.
            </Text>
        </EmailLayout>
    );
}

const summaryTextStyle = {
    margin: '6px 0 0 0',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#475569',
} as const;

const summaryLabelStyle = {
    fontWeight: 600,
    color: '#0f172a',
} as const;

const messageTextStyle = {
    margin: '8px 0 0 0',
    whiteSpace: 'pre-line' as const,
    borderRadius: '10px',
    backgroundColor: '#f8fafc',
    padding: '12px',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#475569',
} as const;
