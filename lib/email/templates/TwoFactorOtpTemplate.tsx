import { Heading, Section, Text } from '@react-email/components';
import { EmailLayout, headingStyle, mutedTextStyle, textStyle } from '../components';

interface TwoFactorOtpTemplateProps {
    userName?: string;
    code: string;
    expiresInMinutes?: number;
    loginUrl?: string;
}

export default function TwoFactorOtpTemplate({
    userName,
    code,
    expiresInMinutes = 10,
    loginUrl,
}: TwoFactorOtpTemplateProps) {
    return (
        <EmailLayout preview="Dein Anmeldecode für Scyed." hideSupport footerNote="Teile diesen Code mit niemandem." hideSignature>
            <Heading style={headingStyle}>Dein Sicherheitscode</Heading>
            <Text style={textStyle}>Hallo {userName || 'Scyed Nutzer'},</Text>
            <Text style={textStyle}>
                Verwende den folgenden Code, um die Anmeldung bei Scyed abzuschließen. Der Code ist für
                kurze Zeit gültig und kann nur einmal verwendet werden.
            </Text>
            <Section style={{ marginTop: 12 }}>
                <Text
                    style={{
                        ...headingStyle,
                        display: 'inline-block',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        letterSpacing: '0.12em',
                        textAlign: 'center',
                    }}
                >
                    {code}
                </Text>
            </Section>
            <Text style={{ ...mutedTextStyle, marginTop: 12 }}>
                Gültig für etwa {expiresInMinutes} Minuten. Wenn du diese Anmeldung nicht gestartet hast,
                ändere bitte dein Passwort und aktiviere 2FA.
            </Text>
            {loginUrl ? (
                <Text style={{ ...textStyle, marginTop: 12 }}>
                    Du kannst die Anmeldung hier fortsetzen: <a href={loginUrl}>{loginUrl}</a>
                </Text>
            ) : null}
        </EmailLayout>
    );
}
