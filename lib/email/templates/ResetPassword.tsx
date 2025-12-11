import { Heading, Section, Text } from '@react-email/components';
import { EmailButton, EmailLayout, headingStyle, mutedTextStyle, textStyle } from '../components';

interface ResetPasswordTemplateProps {
    url: string;
    token: string;
}

export default function ResetPasswordTemplate({ url, token }: ResetPasswordTemplateProps) {
    const resetLink = `${url}${url.includes('?') ? '&' : '?'}token=${token}`;

    return (
        <EmailLayout
            preview="Setze dein Passwort für Scyed zurück."
            footerNote="Du erhältst diese E-Mail, weil du ein Konto bei Scyed hast."
        >
            <Heading style={headingStyle}>Passwort zurücksetzen</Heading>
            <Text style={textStyle}>Hallo,</Text>
            <Text style={textStyle}>
                Du hast kürzlich beantragt, dein Passwort für dein Scyed Konto zurückzusetzen.
                Klicke auf den Button unten, um ein neues Passwort festzulegen.
            </Text>
            <Section style={{ marginTop: 16 }}>
                <EmailButton href={resetLink}>Passwort zurücksetzen</EmailButton>
            </Section>
            <Text style={textStyle}>
                Aus Sicherheitsgründen ist dieser Link nur für kurze Zeit gültig. Falls der Button
                nicht funktioniert, kopiere den folgenden Link und füge ihn in deinen Browser ein:
            </Text>
            <Text style={{ ...mutedTextStyle, wordBreak: 'break-all' }}>{resetLink}</Text>
            <Text style={textStyle}>
                Wenn du keine Zurücksetzung angefordert hast, kannst du diese E-Mail ignorieren.
                Dein Passwort bleibt unverändert.
            </Text>
        </EmailLayout>
    );
}
