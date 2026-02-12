import { Heading, Section, Text } from '@react-email/components';
import { EmailButton, EmailLayout, headingStyle, mutedTextStyle, textStyle } from '../components';

interface PasswordResetSuccessTemplateProps {
    userName?: string;
    loginUrl: string;
    scenario?: 'reset' | 'change';
}

export default function PasswordResetSuccessTemplate({
    userName,
    loginUrl,
    scenario = 'reset',
}: PasswordResetSuccessTemplateProps) {
    const isPasswordChange = scenario === 'change';
    
    return (
        <EmailLayout
            preview={
                isPasswordChange
                    ? 'Dein Passwort bei Scyed wurde erfolgreich geändert.'
                    : 'Dein Passwort bei Scyed wurde erfolgreich zurückgesetzt.'
            }
            footerNote="Wenn du diese Änderung nicht vorgenommen hast, sichere dein Konto bitte sofort."
        >
            <Heading style={headingStyle}>
                {isPasswordChange ? 'Passwort geändert' : 'Passwort zurückgesetzt'}
            </Heading>
            <Text style={textStyle}>Hallo {userName || 'Scyed Nutzer'},</Text>
            <Text style={textStyle}>
                {isPasswordChange
                    ? 'Wir bestätigen, dass das Passwort deines Scyed Kontos gerade geändert wurde. Du kannst dich ab sofort mit deinem neuen Passwort anmelden.'
                    : 'Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich ab sofort mit deinem neuen Passwort anmelden.'}
            </Text>
            <Section style={{ marginTop: 16 }}>
                <EmailButton href={loginUrl}>
                    {isPasswordChange ? 'Zum Profil' : 'Zum Login'}
                </EmailButton>
            </Section>
            <Text style={{ ...textStyle, marginTop: 16 }}>
                Warst du das nicht? Setze dein Passwort bitte sofort zurück und kontaktiere unser
                Support-Team. Wir empfehlen zusätzlich die Aktivierung der
                Zwei-Faktor-Authentifizierung.
            </Text>
            <Text style={{ ...mutedTextStyle, marginTop: 12 }}>
                Der Sicherheit deines Accounts hat für uns höchste Priorität.
            </Text>
        </EmailLayout>
    );
}
