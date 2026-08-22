import { Heading, Hr, Section, Text } from '@react-email/components';
import { formatDate } from '../../formatDate';
import {
    EmailButton,
    EmailCard,
    EmailLayout,
    headingStyle,
    subheadingStyle,
    textStyle,
} from '../components';

interface ServerSuspendedTemplateProps {
    userName: string;
    serverName: string;
    gameName: string;
    reason: string;
    suspendedUntil: Date;
    deleteAfterExpiry: boolean;
    supportUrl: string;
}

export default function ServerSuspendedTemplate({
    userName,
    serverName,
    gameName,
    reason,
    suspendedUntil,
    deleteAfterExpiry,
    supportUrl,
}: ServerSuspendedTemplateProps) {
    const untilFormatted = formatDate(suspendedUntil, true);

    return (
        <EmailLayout
            preview={`Dein Server "${serverName}" wurde gesperrt`}
            footerNote="Diese E-Mail wurde automatisch generiert."
        >
            <Heading style={headingStyle}>Dein Server wurde gesperrt</Heading>

            <Text style={textStyle}>Hallo {userName},</Text>
            <Text style={textStyle}>
                wir mussten deinen {gameName} Server <strong>{serverName}</strong> sperren. Der
                Server ist ab sofort nicht mehr erreichbar und kann nicht gestartet werden. Deine
                Daten bleiben vorerst erhalten.
            </Text>

            <EmailCard tone="info" style={{ marginTop: 16 }}>
                <Text style={{ ...subheadingStyle, margin: 0 }}>Grund der Sperrung</Text>
                <Text style={{ ...textStyle, margin: '8px 0 0 0', whiteSpace: 'pre-wrap' }}>
                    {reason}
                </Text>
            </EmailCard>

            <Hr style={{ borderColor: '#e2e8f0', margin: '18px 0' }} />

            <Section>
                <table style={{ width: '100%' }} cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr>
                            <td style={cellLabelStyle}>Server:</td>
                            <td style={cellValueStyle}>{serverName}</td>
                        </tr>
                        <tr>
                            <td style={cellLabelStyle}>Spiel:</td>
                            <td style={cellValueStyle}>{gameName}</td>
                        </tr>
                        <tr>
                            <td style={cellLabelStyle}>Gesperrt bis:</td>
                            <td style={cellValueStyle}>{untilFormatted}</td>
                        </tr>
                    </tbody>
                </table>
            </Section>

            {deleteAfterExpiry ? (
                <EmailCard tone="warning" style={{ marginTop: 16 }}>
                    <Text style={{ ...subheadingStyle, margin: 0 }}>
                        Der Server wird am {untilFormatted} gelöscht
                    </Text>
                    <Text style={{ ...textStyle, margin: '8px 0 0 0' }}>
                        Wenn die Sperre bis dahin nicht aufgehoben wird, werden der Server und
                        <strong> alle darauf gespeicherten Daten endgültig gelöscht</strong>. Eine
                        Wiederherstellung ist danach nicht mehr möglich. Melde dich bitte vorher bei
                        uns, wenn du dazu etwas sagen möchtest.
                    </Text>
                </EmailCard>
            ) : (
                <EmailCard tone="info" style={{ marginTop: 16 }}>
                    <Text style={{ ...textStyle, margin: 0 }}>
                        Nach Ablauf der Sperre am {untilFormatted} wird dein Server automatisch
                        wieder freigeschaltet.
                    </Text>
                </EmailCard>
            )}

            <Text style={{ ...textStyle, marginTop: 16 }}>
                Wenn du der Meinung bist, dass die Sperre zu Unrecht erfolgt ist, antworte uns bitte
                über den folgenden Link und erkläre uns kurz, warum wir deinen Server wieder
                freischalten sollten.
            </Text>

            <Section style={{ marginTop: 16, textAlign: 'center' }}>
                <EmailButton href={supportUrl}>Support kontaktieren</EmailButton>
            </Section>
        </EmailLayout>
    );
}

const cellLabelStyle = {
    padding: '6px 0',
    fontSize: '14px',
    color: '#64748b',
} as const;

const cellValueStyle = {
    padding: '6px 0',
    textAlign: 'right' as const,
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
} as const;
