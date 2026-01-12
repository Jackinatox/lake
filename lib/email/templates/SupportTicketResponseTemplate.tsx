import { TicketStatus } from '@/app/client/generated/enums';
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

interface SupportTicketResponseTemplateProps {
    ticketId?: string;
    agentName?: string;
    responseMessage: string;
    status?: TicketStatus;
    ticketUrl?: string;
    userName?: string;
}

const statusLabels: Partial<Record<TicketStatus, string>> = {
    OPEN: 'Offen',
    PENDING: 'In Bearbeitung',
    RESOLVED: 'Gelöst',
    CLOSED: 'Geschlossen',
};

export default function SupportTicketResponseTemplate({
    ticketId,
    agentName,
    responseMessage,
    status,
    ticketUrl,
    userName,
}: SupportTicketResponseTemplateProps) {
    return (
        <EmailLayout
            preview="Es gibt ein Update zu deinem Support-Ticket."
            footerNote="Du erhältst diese E-Mail, weil du ein Support-Ticket bei Scyed erstellt hast."
        >
            <Heading style={headingStyle}>Antwort auf dein Ticket</Heading>
            <Text style={textStyle}>Hallo {userName || 'Scyed Nutzer'},</Text>
            <Text style={textStyle}>
                Wir haben eine neue Antwort für dich.{' '}
                {agentName ? `${agentName} hat` : 'Unser Team hat'}
                sich dein Ticket angesehen und dir geantwortet.
            </Text>

            <EmailCard style={{ marginTop: 12 }}>
                {ticketId ? (
                    <Text style={{ ...mutedTextStyle, margin: 0 }}>
                        Ticket-ID: <span style={{ color: '#0f172a' }}>{ticketId}</span>
                    </Text>
                ) : null}
                {status ? (
                    <Text style={{ ...mutedTextStyle, marginTop: 6 }}>
                        Status:{' '}
                        <span style={{ color: '#0f172a' }}>{statusLabels[status] || status}</span>
                    </Text>
                ) : null}
            </EmailCard>

            <EmailCard style={{ marginTop: 12 }}>
                <Text style={{ ...subheadingStyle, margin: 0 }}>Antwort</Text>
                <Text style={messageTextStyle}>{responseMessage}</Text>
            </EmailCard>

            {ticketUrl ? (
                <Section style={{ marginTop: 16 }}>
                    <EmailButton href={ticketUrl}>Ticket im Dashboard ansehen</EmailButton>
                </Section>
            ) : null}

            <Text style={{ ...textStyle, marginTop: 16 }}>
                Wenn du weitere Informationen ergänzen möchtest, antworte einfach auf diese E-Mail
                oder aktualisiere dein Ticket.
            </Text>
        </EmailLayout>
    );
}

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
