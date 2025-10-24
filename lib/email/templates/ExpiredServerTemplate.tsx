import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Preview,
    Section,
    Tailwind,
    Text,
} from "@react-email/components";

interface ExpiredServerTemplateProps {
    username: string;
    serverName: string;
    expirationDate: Date;
    deleteDate: Date;
}

export default function ExpiredServerTemplate({ username, serverName, expirationDate, deleteDate }: ExpiredServerTemplateProps) {
    const formattedExpirationDate = new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(expirationDate);

    const formattedDeleteDate = new Intl.DateTimeFormat("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(deleteDate);

    return (
        <Html>
            <Head />
            <Preview>Dein Server {serverName} ist abgelaufen.</Preview>
            <Tailwind>
                <Body className="bg-slate-100 py-10">
                    <Container className="mx-auto max-w-[520px] rounded-xl bg-white px-8 py-8 shadow-lg">
                        <Heading className="m-0 text-2xl font-bold text-slate-900">Server abgelaufen</Heading>
                        <Text className="mt-6 text-base leading-6 text-slate-600">Hallo {username},</Text>
                        <Text className="mt-4 text-base leading-6 text-slate-600">
                            Dein Server <span className="font-semibold text-slate-900">{serverName}</span> ist am {formattedExpirationDate} abgelaufen. Wenn du ihn erneuern möchtest kannst du das bis {formattedDeleteDate} tun.
                        </Text>
                        <Section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <Text className="m-0 text-base font-semibold text-slate-900">Letzter Tag zur Reaktivierung: {formattedDeleteDate}</Text>
                            <Text className="mt-2 text-sm leading-6 text-slate-600">
                                Danach wird der Server und alle gespeicherten Daten dauerhaft gelöscht.
                            </Text>
                        </Section>
                        <Section className="mt-6">
                            <Button
                                href="https://example.com"
                                className="inline-block rounded-full bg-slate-900 px-6 py-3 text-base font-semibold text-white no-underline"
                            >
                                Server jetzt erneuern
                            </Button>
                        </Section>
                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Bei Fragen oder wenn du Unterstützung brauchst, melde dich jederzeit bei unserem Support-Team.
                        </Text>
                        <Text className="mt-6 text-base font-medium text-slate-900">Dein Scyed Team</Text>
                        <Text className="mt-8 text-sm leading-6 text-slate-400">
                            Du erhältst diese E-Mail, weil du ein Konto bei Scyed hast. Wenn du keine Emails mehr bekommen möchtest, lösche dein Konto hier.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}