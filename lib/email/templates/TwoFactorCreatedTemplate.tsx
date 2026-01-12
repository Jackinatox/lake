import { Heading, Section, Text } from '@react-email/components';
import { EmailButton, EmailCard, EmailLayout, headingStyle, textStyle } from '../components';

interface TwoFactorCreatedTemplateProps {
    userName?: string;
    recoveryCodes?: string[];
    manageUrl: string;
}

export default function TwoFactorCreatedTemplate({
    userName,
    recoveryCodes,
    manageUrl,
}: TwoFactorCreatedTemplateProps) {
    return (
        <EmailLayout
            preview="Zwei-Faktor-Authentifizierung aktiviert."
            footerNote="Bewahre deine Wiederherstellungscodes sicher auf."
        >
            <Heading style={headingStyle}>2FA erfolgreich aktiviert</Heading>
            <Text style={textStyle}>Hallo {userName || 'Scyed Nutzer'},</Text>
            <Text style={textStyle}>
                Du hast gerade die Zwei-Faktor-Authentifizierung (2FA) für dein Konto aktiviert. Ab
                sofort benötigst du bei der Anmeldung zusätzlich einen Bestätigungscode.
            </Text>
            {recoveryCodes && recoveryCodes.length ? (
                <EmailCard style={{ marginTop: 12 }} tone="info">
                    <Text style={{ ...textStyle, margin: 0, fontWeight: 600 }}>
                        Deine Wiederherstellungscodes
                    </Text>
                    <Text style={{ ...textStyle, marginTop: 6 }}>
                        Bewahre diese Codes offline an einem sicheren Ort auf. Jeder Code kann
                        einmal genutzt werden, falls du keinen Zugriff mehr auf dein Gerät hast.
                    </Text>
                    <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                        {recoveryCodes.map((code) => (
                            <Text
                                key={code}
                                style={{
                                    ...textStyle,
                                    margin: 0,
                                    fontFamily: 'monospace',
                                    letterSpacing: '0.08em',
                                    backgroundColor: '#0f172a',
                                    color: '#ffffff',
                                    padding: '8px 10px',
                                    borderRadius: '10px',
                                }}
                            >
                                {code}
                            </Text>
                        ))}
                    </div>
                </EmailCard>
            ) : null}
            <Section style={{ marginTop: 16 }}>
                <EmailButton href={manageUrl}>Sicherheitseinstellungen öffnen</EmailButton>
            </Section>
            <Text style={{ ...textStyle, marginTop: 16 }}>
                Wenn du diese Aktion nicht veranlasst hast, deaktiviere 2FA sofort und setze dein
                Passwort zurück.
            </Text>
        </EmailLayout>
    );
}
