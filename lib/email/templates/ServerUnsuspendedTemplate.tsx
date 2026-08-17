import { Heading, Section, Text } from '@react-email/components';
import { EmailButton, EmailCard, EmailLayout, headingStyle, textStyle } from '../components';

interface ServerUnsuspendedTemplateProps {
    userName: string;
    serverName: string;
    gameName: string;
    serverUrl: string;
    /** True when the server stays offline because it is expired, not because of the suspension. */
    stillExpired: boolean;
}

export default function ServerUnsuspendedTemplate({
    userName,
    serverName,
    gameName,
    serverUrl,
    stillExpired,
}: ServerUnsuspendedTemplateProps) {
    return (
        <EmailLayout
            preview={`Dein Server "${serverName}" wurde wieder freigeschaltet`}
            footerNote="Diese E-Mail wurde automatisch generiert."
        >
            <Heading style={headingStyle}>Dein Server wurde wieder freigeschaltet</Heading>

            <Text style={textStyle}>Hallo {userName},</Text>
            <Text style={textStyle}>
                die Sperrung deines {gameName} Servers <strong>{serverName}</strong> wurde
                aufgehoben. Du kannst ihn ab sofort wieder wie gewohnt nutzen — alle Daten sind
                unverändert vorhanden.
            </Text>

            {stillExpired ? (
                <EmailCard tone="warning" style={{ marginTop: 16 }}>
                    <Text style={{ ...textStyle, margin: 0 }}>
                        Beachte: Die Laufzeit deines Servers ist abgelaufen. Er bleibt deshalb
                        weiterhin gestoppt, bis du ihn verlängerst.
                    </Text>
                </EmailCard>
            ) : null}

            <Text style={{ ...textStyle, marginTop: 16 }}>
                Bitte halte dich weiterhin an unsere Nutzungsbedingungen, damit wir deinen Server
                nicht erneut sperren müssen.
            </Text>

            <Section style={{ marginTop: 24, textAlign: 'center' }}>
                <EmailButton href={serverUrl}>Server verwalten</EmailButton>
            </Section>
        </EmailLayout>
    );
}
