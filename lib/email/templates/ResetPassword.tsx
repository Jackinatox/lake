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
} from "@react-email/components";

interface ResetPasswordTemplateProps {
    url: string;
    token: string;
}

export default function ResetPasswordTemplate({ url, token }: ResetPasswordTemplateProps) {
    const resetLink = `${url}${url.includes("?") ? "&" : "?"}token=${token}`;

    return (
        <Html>
            <Head />
            <Preview>Setze dein Passwort für Scyed zurück.</Preview>
            <Tailwind>
                <Body className="bg-slate-100 py-10">
                    <Container className="mx-auto max-w-[520px] rounded-xl bg-white px-8 py-8 shadow-lg">
                        <Heading className="m-0 text-2xl font-bold text-slate-900">Passwort zurücksetzen</Heading>
                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Hallo,
                        </Text>
                        <Text className="mt-4 text-base leading-6 text-slate-600">
                            Du hast kürzlich beantragt, dein Passwort für dein Scyed Konto zurückzusetzen. Klicke auf den Button unten, um ein neues Passwort festzulegen.
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
                            Aus Sicherheitsgründen ist dieser Link nur für kurze Zeit gültig. Falls der Button nicht funktioniert, kopiere den folgenden Link und füge ihn in deinen Browser ein:
                        </Text>
                        <Text className="mt-2 break-all text-sm leading-6 text-slate-500">{resetLink}</Text>
                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Wenn du keine Zurücksetzung angefordert hast, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.
                        </Text>
                        <Text className="mt-6 text-base font-medium text-slate-900">Dein Scyed Team</Text>
                        <Text className="mt-8 text-sm leading-6 text-slate-400">
                            Du erhältst diese E-Mail, weil du ein Konto bei Scyed hast. Wenn du diese Benachrichtigungen nicht mehr erhalten möchtest, kontaktiere bitte den Support.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}