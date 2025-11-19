import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Tailwind,
    Text,
} from '@react-email/components';
import { env } from 'next-runtime-env';
import { formatDate } from '../../formatDate';

interface FreeServerCreatedTemplateProps {
    userName: string;
    gameName: string;
    gameImageUrl: string;
    serverName: string;
    ramMB: number;
    cpuPercent: number;
    diskMB: number;
    location: string;
    expiresAt: Date;
    serverUrl: string;
    extensionUrl?: string;
}

// shared formatDate imported from lib/formatDate

export default function FreeServerCreatedTemplate({
    userName,
    gameName,
    gameImageUrl,
    serverName,
    ramMB,
    cpuPercent,
    diskMB,
    location,
    expiresAt,
    serverUrl,
    extensionUrl,
}: FreeServerCreatedTemplateProps) {
    return (
        <Html>
            <Head />
            <Preview>Dein kostenloser {gameName} Server wurde erstellt 🎉</Preview>
            <Tailwind>
                <Body style={{ backgroundColor: '#f8f9fa', margin: 0, padding: 0 }}>
                    <Container
                        style={{
                            margin: '0 auto',
                            maxWidth: '600px',
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
                            Kostenloser Server erstellt
                        </Heading>

                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Hallo {userName},
                        </Text>

                        <Text className="mt-4 text-base leading-6 text-slate-600">
                            Wir haben erfolgreich einen kostenlosen {gameName} Gameserver für dich
                            erstellt. Unten findest du die wichtigsten Informationen zum Server.
                        </Text>

                        <Hr className="my-6 border-slate-200" />

                        <Section className="mt-6 mb-6">
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '24px',
                                    padding: '20px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '12px',
                                    border: '2px solid #e2e8f0',
                                }}
                            >
                                <Img
                                    src={gameImageUrl}
                                    alt={`${gameName} Icon`}
                                    width="80"
                                    height="80"
                                    style={{ borderRadius: '12px', flexShrink: 0 }}
                                />
                                <div style={{ flex: 1, marginLeft: '12px' }}>
                                    <Text
                                        style={{
                                            margin: 0,
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#0f172a',
                                            lineHeight: '1.4',
                                        }}
                                    >
                                        {gameName} Gameserver (Kostenlos)
                                    </Text>
                                    <Text
                                        style={{
                                            margin: '6px 0 0 0',
                                            fontSize: '15px',
                                            color: '#64748b',
                                            lineHeight: '1.4',
                                        }}
                                    >
                                        {serverName}
                                    </Text>
                                </div>
                            </div>
                        </Section>

                        <Hr className="my-6 border-slate-200" />

                        <Section className="mt-6">
                            <Heading className="m-0 mb-4 text-lg font-semibold text-slate-900">
                                Server Details
                            </Heading>

                            <table className="w-full" cellPadding="0" cellSpacing="0">
                                <tbody>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">
                                            Server Name:
                                        </td>
                                        <td className="py-2 text-right text-sm font-semibold text-slate-900">
                                            {serverName}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">Spiel:</td>
                                        <td className="py-2 text-right text-sm font-semibold text-slate-900">
                                            {gameName}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">RAM:</td>
                                        <td className="py-2 text-right text-sm font-semibold text-slate-900">
                                            {(ramMB / 1024).toFixed(1)} GB
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">CPU:</td>
                                        <td className="py-2 text-right text-sm font-semibold text-slate-900">
                                            {cpuPercent}%
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">Speicher:</td>
                                        <td className="py-2 text-right text-sm font-semibold text-slate-900">
                                            {(diskMB / 1024).toFixed(1)} GB
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">Standort:</td>
                                        <td className="py-2 text-right text-sm font-semibold text-slate-900">
                                            {location}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">Läuft bis:</td>
                                        <td className="py-2 text-right text-sm font-semibold text-slate-900">
                                            {formatDate(expiresAt, true)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Section>

                        <Hr className="my-6 border-slate-200" />

                        <Section className="mt-8" style={{ textAlign: 'center' }}>
                            <Button
                                href={serverUrl}
                                style={{
                                    display: 'inline-block',
                                    width: '100%',
                                    maxWidth: '100%',
                                    padding: '14px 32px',
                                    backgroundColor: '#0f172a',
                                    color: '#ffffff',
                                    textDecoration: 'none',
                                    borderRadius: '9999px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    boxSizing: 'border-box',
                                }}
                            >
                                Server verwalten
                            </Button>
                        </Section>

                        {/* Extension CTA: only show when extensionUrl present */}
                        {extensionUrl && (
                            <Section className="mt-4" style={{ textAlign: 'center' }}>
                                <Text className="mt-4 text-sm leading-6 text-slate-600">
                                    Du kannst deinen kostenlosen Server unbegrenzt kostenlos um bis zu
                                    1 Monat in die Zukunft verlängern. Klicke auf den folgenden Link,
                                    um deinen Server sofort zu verlängern.
                                </Text>

                                <div style={{ height: 12 }} />

                                <Button
                                    href={extensionUrl}
                                    style={{
                                        display: 'inline-block',
                                        width: '100%',
                                        maxWidth: '100%',
                                        padding: '12px 24px',
                                        backgroundColor: '#047857',
                                        color: '#ffffff',
                                        textDecoration: 'none',
                                        borderRadius: '9999px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    Kostenlos verlängern
                                </Button>
                            </Section>
                        )}

                        <Text className="mt-8 text-base leading-6 text-slate-600">
                            Dein kostenloser Server ist jetzt aktiv. Bei Fragen erreichst du unser{' '}
                            <a
                                href={`${env('NEXT_PUBLIC_APP_URL')}/support`}
                                style={{ color: '#0f172a', textDecoration: 'underline' }}
                            >
                                Support-Team
                            </a>
                            .
                        </Text>

                        <Text className="mt-6 text-base font-medium text-slate-900">
                            Viel Spaß beim Gaming!
                            <br />
                            Dein Scyed Team
                        </Text>

                        <Text className="mt-8 text-sm leading-6 text-slate-400">
                            Diese E-Mail wurde automatisch generiert.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
