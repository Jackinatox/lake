import { Heading, Section, Text } from '@react-email/components';
import { EmailButton, EmailLayout, headingStyle, textStyle } from '../components';

interface TwoFactorRemovedTemplateProps {
    userName?: string;
    manageUrl: string;
}

export default function TwoFactorRemovedTemplate({
    userName,
    manageUrl,
}: TwoFactorRemovedTemplateProps) {
    return (
        <EmailLayout
            preview="Zwei-Faktor-Authentifizierung wurde deaktiviert."
            footerNote="Aktiviere 2FA erneut, um dein Konto zu schützen."
        >
            <Heading style={headingStyle}>2FA wurde deaktiviert</Heading>
            <Text style={textStyle}>Hallo {userName || 'Scyed Nutzer'},</Text>
            <Text style={textStyle}>
                Die Zwei-Faktor-Authentifizierung für dein Konto wurde soeben deaktiviert. Dein
                Konto ist nun nur noch mit dem Passwort geschützt.
            </Text>
            <Section style={{ marginTop: 16 }}>
                <EmailButton href={manageUrl} variant="secondary">
                    2FA jetzt wieder aktivieren
                </EmailButton>
            </Section>
            <Text style={{ ...textStyle, marginTop: 16 }}>
                Wenn du diese Änderung nicht selbst vorgenommen hast, setze bitte sofort dein
                Passwort zurück und aktiviere 2FA erneut.
            </Text>
        </EmailLayout>
    );
}
