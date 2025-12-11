import { Heading, Section, Text } from '@react-email/components';
import {
    EmailButton,
    EmailLayout,
    headingStyle,
    mutedTextStyle,
    textStyle,
} from '../components';

interface ConfirmEmailTemplateProps {
    url: string;
}

export default function ConfirmEmailTemplate({ url }: ConfirmEmailTemplateProps) {
    return (
        <EmailLayout
            preview="Bestätige deine E-Mail-Adresse für Scyed."
            footerNote="Du erhältst diese E-Mail, weil eine Registrierung mit dieser E-Mail-Adresse bei Scyed durchgeführt wurde."
        >
            <Heading style={headingStyle}>E-Mail-Adresse bestätigen</Heading>
            <Text style={textStyle}>Hallo,</Text>
            <Text style={textStyle}>
                Willkommen bei Scyed! Um dein Konto zu aktivieren und alle Funktionen nutzen zu
                können, bestätige bitte deine E-Mail-Adresse.
            </Text>
            <Section style={{ marginTop: 16 }}>
                <EmailButton href={url}>E-Mail bestätigen</EmailButton>
            </Section>
            <Text style={textStyle}>
                Aus Sicherheitsgründen ist dieser Link nur für kurze Zeit gültig. Falls der Button
                nicht funktioniert, kopiere den folgenden Link und füge ihn in deinen Browser ein:
            </Text>
            <Text style={{ ...mutedTextStyle, wordBreak: 'break-all' }}>{url}</Text>
            <Text style={textStyle}>
                Wenn du dich nicht bei Scyed registriert hast, kannst du diese E-Mail ignorieren.
            </Text>
        </EmailLayout>
    );
}
