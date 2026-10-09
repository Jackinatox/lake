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
import { ticketMessageTextStyle } from './ticketEmailShared';

interface TicketReplyTemplateProps {
    ticketNumber: number;
    subject: string;
    agentName?: string;
    responseMessage: string;
    /** The reply also marked the ticket as resolved. */
    resolved: boolean;
    ticketUrl: string;
    userName?: string;
}

export default function TicketReplyTemplate({
    ticketNumber,
    subject,
    agentName,
    responseMessage,
    resolved,
    ticketUrl,
    userName,
}: TicketReplyTemplateProps) {
    return (
        <EmailLayout
            preview={`Neue Antwort auf dein Support-Ticket #${ticketNumber}.`}
            footerNote="Du erhältst diese E-Mail, weil du ein Support-Ticket bei Scyed erstellt hast."
        >
            <Heading style={headingStyle}>Neue Antwort auf dein Ticket</Heading>
            <Text style={textStyle}>Hallo {userName || 'Scyed Nutzer'},</Text>
            <Text style={textStyle}>
                {agentName ? `${agentName} aus unserem Team` : 'Unser Team'} hat auf dein Ticket
                geantwortet.
            </Text>

            <EmailCard style={{ marginTop: 12 }}>
                <Text style={{ ...mutedTextStyle, margin: 0 }}>
                    Ticket: <span style={{ color: '#0f172a' }}>#{ticketNumber}</span>
                </Text>
                <Text style={{ ...subheadingStyle, marginTop: 6 }}>{subject}</Text>
            </EmailCard>

            <EmailCard style={{ marginTop: 12 }}>
                <Text style={{ ...subheadingStyle, margin: 0 }}>Antwort</Text>
                <Text style={ticketMessageTextStyle}>{responseMessage}</Text>
            </EmailCard>

            {resolved ? (
                <EmailCard tone="success" style={{ marginTop: 12 }}>
                    <Text style={{ ...textStyle, margin: 0 }}>
                        Wir haben dein Ticket als gelöst markiert. Falls doch noch etwas offen ist,
                        antworte einfach im Ticket und es wird wieder geöffnet.
                    </Text>
                </EmailCard>
            ) : null}

            <Section style={{ marginTop: 16 }}>
                <EmailButton href={ticketUrl}>Im Ticket antworten</EmailButton>
            </Section>

            <Text style={{ ...mutedTextStyle, marginTop: 16 }}>
                Bitte antworte direkt im Ticket. Antworten auf diese E-Mail werden deinem Ticket
                nicht zugeordnet.
            </Text>
        </EmailLayout>
    );
}
