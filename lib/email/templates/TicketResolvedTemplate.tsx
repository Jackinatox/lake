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

interface TicketResolvedTemplateProps {
    ticketNumber: number;
    subject: string;
    ticketUrl: string;
    userName?: string;
}

export default function TicketResolvedTemplate({
    ticketNumber,
    subject,
    ticketUrl,
    userName,
}: TicketResolvedTemplateProps) {
    return (
        <EmailLayout
            preview={`Dein Support-Ticket #${ticketNumber} wurde als gelöst markiert.`}
            footerNote="Du erhältst diese E-Mail, weil du ein Support-Ticket bei Scyed erstellt hast."
        >
            <Heading style={headingStyle}>Ticket gelöst</Heading>
            <Text style={textStyle}>Hallo {userName || 'Scyed Nutzer'},</Text>
            <Text style={textStyle}>
                wir haben dein Ticket als gelöst markiert. Falls doch noch etwas offen ist, antworte
                einfach im Ticket und es wird wieder geöffnet.
            </Text>

            <EmailCard tone="success" style={{ marginTop: 12 }}>
                <Text style={{ ...mutedTextStyle, margin: 0 }}>
                    Ticket: <span style={{ color: '#0f172a' }}>#{ticketNumber}</span>
                </Text>
                <Text style={{ ...subheadingStyle, marginTop: 6 }}>{subject}</Text>
            </EmailCard>

            <Section style={{ marginTop: 16 }}>
                <EmailButton href={ticketUrl}>Ticket ansehen</EmailButton>
            </Section>
        </EmailLayout>
    );
}
