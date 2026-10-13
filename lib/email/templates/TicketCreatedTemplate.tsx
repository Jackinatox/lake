import { TicketCategory } from '@/app/client/generated/enums';
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
import { ticketCategoryLabelsDe, ticketMessageTextStyle } from './ticketEmailShared';

interface TicketCreatedTemplateProps {
    ticketNumber: number;
    subject: string;
    category: TicketCategory;
    message: string;
    createdAt: Date;
    ticketUrl: string;
    userName?: string;
}

export default function TicketCreatedTemplate({
    ticketNumber,
    subject,
    category,
    message,
    createdAt,
    ticketUrl,
    userName,
}: TicketCreatedTemplateProps) {
    const formattedCreatedAt = new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Berlin',
    }).format(createdAt);

    return (
        <EmailLayout
            preview={`Dein Support-Ticket #${ticketNumber} wurde erstellt.`}
            footerNote="Du erhältst diese E-Mail, weil du ein Support-Ticket bei Scyed erstellt hast."
        >
            <Heading style={headingStyle}>Support-Ticket erstellt</Heading>
            <Text style={textStyle}>Hallo {userName || 'Scyed Nutzer'},</Text>
            <Text style={textStyle}>
                vielen Dank für deine Anfrage. Wir haben dein Ticket erhalten und melden uns so
                schnell wie möglich. Sobald wir antworten, bekommst du eine E-Mail.
            </Text>
            <EmailCard style={{ marginTop: 16 }}>
                <Text style={{ ...mutedTextStyle, margin: 0 }}>
                    Ticket: <span style={{ color: '#0f172a' }}>#{ticketNumber}</span>
                </Text>
                <Text style={{ ...subheadingStyle, marginTop: 6 }}>{subject}</Text>
                <Text style={{ ...mutedTextStyle, marginTop: 6 }}>
                    {ticketCategoryLabelsDe[category]} · {formattedCreatedAt}
                </Text>
            </EmailCard>
            <EmailCard style={{ marginTop: 12 }}>
                <Text style={{ ...subheadingStyle, margin: 0 }}>Deine Nachricht</Text>
                <Text style={ticketMessageTextStyle}>{message}</Text>
            </EmailCard>
            <Section style={{ marginTop: 16 }}>
                <EmailButton href={ticketUrl}>Ticket ansehen</EmailButton>
            </Section>
            <Text style={{ ...mutedTextStyle, marginTop: 16 }}>
                Bitte antworte direkt im Ticket. Antworten auf diese E-Mail werden deinem Ticket
                nicht zugeordnet.
            </Text>
        </EmailLayout>
    );
}
