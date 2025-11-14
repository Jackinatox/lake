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

interface ResetPasswordTemplateProps {
    url: string;
    token: string;
}

export default function ResetPasswordTemplate({ url, token }: ResetPasswordTemplateProps) {
    const resetLink = `${url}${url.includes('?') ? '&' : '?'}token=${token}`;

    return (
        <Html>
            <Head />
            <Preview>Setze dein Passwort für Scyed zurück.</Preview>
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
                            Passwort zurücksetzen
                        </Heading>
                        <Text className="mt-6 text-base leading-6 text-slate-600">Hallo,</Text>
                        <Text className="mt-4 text-base leading-6 text-slate-600">
                            Du hast kürzlich beantragt, dein Passwort für dein Scyed Konto
                            zurückzusetzen. Klicke auf den Button unten, um ein neues Passwort
                            festzulegen.
                        </Text>
                        <Section className="mt-6">
                            <Button
                                href={resetLink}
                                className="inline-block rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white no-underline"
                            >
                                Passwort zurücksetzen
                            </Button>
                        </Section>
                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Aus Sicherheitsgründen ist dieser Link nur für kurze Zeit gültig. Falls
                            der Button nicht funktioniert, kopiere den folgenden Link und füge ihn
                            in deinen Browser ein:
                        </Text>
                        <Text className="mt-2 break-all text-sm leading-6 text-slate-500">
                            {resetLink}
                        </Text>
                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Wenn du keine Zurücksetzung angefordert hast, kannst du diese E-Mail
                            ignorieren. Dein Passwort bleibt unverändert.
                        </Text>
                        <Text className="mt-6 text-base font-medium text-slate-900">
                            Dein Scyed Team
                        </Text>
                        <Text className="mt-8 text-sm leading-6 text-slate-400">
                            Du erhältst diese E-Mail, weil du ein Konto bei Scyed hast. Wenn du
                            diese Benachrichtigungen nicht mehr erhalten möchtest, kontaktiere bitte
                            den{' '}
                            <a
                                href={`${process.env.NEXT_PUBLIC_APP_URL || process.env.LAKE_URL || 'http://localhost:3000'}/support`}
                                style={{ color: '#94a3b8', textDecoration: 'underline' }}
                            >
                                Support
                            </a>
                            .
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
