import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';

interface ConfirmEmailTemplateProps {
    url: string;
}

export default function ConfirmEmailTemplate({ url }: ConfirmEmailTemplateProps) {
    return (
        <Html>
            <Head />
            <Preview>Bestätige deine E-Mail-Adresse für Scyed.</Preview>
            <Tailwind>
                <Body style={{ backgroundColor: '#f8f9fa', margin: 0, padding: 0 }}>
                    <Container
                        style={{
                            margin: '0 auto',
                            maxWidth: '520px',
                            backgroundColor: '#ffffff',
                            padding: '32px 24px',
                        }}
                    >
                        <Heading
                            style={{
                                margin: 0,
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#0f172a',
                            }}
                        >
                            E-Mail-Adresse bestätigen
                        </Heading>
                        <Text className="mt-6 text-base leading-6 text-slate-600">Hallo,</Text>
                        <Text className="mt-4 text-base leading-6 text-slate-600">
                            Willkommen bei Scyed! Um dein Konto zu aktivieren und alle Funktionen
                            nutzen zu können, bestätige bitte deine E-Mail-Adresse.
                        </Text>
                        <Section className="mt-6">
                            <Button
                                href={url}
                                className="inline-block rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white no-underline"
                            >
                                E-Mail bestätigen
                            </Button>
                        </Section>
                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Aus Sicherheitsgründen ist dieser Link nur für kurze Zeit gültig. Falls
                            der Button nicht funktioniert, kopiere den folgenden Link und füge ihn
                            in deinen Browser ein:
                        </Text>
                        <Text className="mt-2 break-all text-sm leading-6 text-slate-500">
                            {url}
                        </Text>
                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Wenn du dich nicht bei Scyed registriert hast, kannst du diese E-Mail
                            ignorieren.
                        </Text>
                        <Text className="mt-6 text-base font-medium text-slate-900">
                            Dein Scyed Team
                        </Text>
                        <Text className="mt-8 text-sm leading-6 text-slate-400">
                            Du erhältst diese E-Mail, weil eine Registrierung mit dieser
                            E-Mail-Adresse bei Scyed durchgeführt wurde.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
