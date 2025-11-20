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
import { formatVCores } from '../../GlobalFunctions/formatVCores';

interface ServerBookingConfirmationTemplateProps {
    userName: string;
    gameName: string;
    gameImageUrl: string;
    serverName: string;
    ramMB: number;
    cpuVCores: number;
    diskMB: number;
    location: string;
    price: number;
    expiresAt: Date;
    serverUrl: string;
}

const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
    }).format(cents / 100);
};

export default function ServerBookingConfirmationTemplate({
    userName,
    gameName,
    gameImageUrl,
    serverName,
    ramMB,
    cpuVCores,
    diskMB,
    location,
    price,
    expiresAt,
    serverUrl,
}: ServerBookingConfirmationTemplateProps) {
    return (
        <Html>
            <Head />
            <Preview>Dein {gameName} Server wurde erfolgreich gebucht!</Preview>
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
                            Server erfolgreich gebucht! 🎉
                        </Heading>

                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Hallo {userName},
                        </Text>

                        <Text className="mt-4 text-base leading-6 text-slate-600">
                            Vielen Dank für deine Buchung! Dein {gameName} Gameserver wurde
                            erfolgreich erstellt und wird gerade für dich eingerichtet.
                        </Text>

                        <Hr className="my-6 border-slate-200" />

                        {/* Game Image with Server Name */}
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
                                        {gameName} Gameserver
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

                        {/* Server Details */}
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
                                            {formatVCores(cpuVCores)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">Speicher:</td>
                                        <td className="py-2 text-right text-sm font-semibold text-slate-900">
                                            {(diskMB / 1024).toFixed(1)} GB
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">
                                            Performance-Level:
                                        </td>
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

                        {/* Pricing */}
                        <Section className="mt-6">
                            <table
                                style={{
                                    width: '100%',
                                    backgroundColor: '#f1f5f9',
                                    borderRadius: '8px',
                                    padding: '16px',
                                }}
                                cellPadding="0"
                                cellSpacing="0"
                            >
                                <tbody>
                                    <tr>
                                        <td
                                            style={{
                                                padding: '0',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#0f172a',
                                            }}
                                        >
                                            Gesamtbetrag:
                                        </td>
                                        <td
                                            style={{
                                                padding: '0 0 0 16px',
                                                textAlign: 'right',
                                                fontSize: '24px',
                                                fontWeight: 'bold',
                                                color: '#0f172a',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {formatPrice(price)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Section>

                        <Hr className="my-6 border-slate-200" />

                        {/* Call to Action */}
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

                        <Text className="mt-8 text-base leading-6 text-slate-600">
                            Dein Server wird in den gerade eingerichtet, du kannst dich gleich
                            verbinden.
                        </Text>

                        <Text className="mt-4 text-base leading-6 text-slate-600">
                            Bei Fragen oder Problemen steht dir unser{' '}
                            <a
                                href={`${env('NEXT_PUBLIC_APP_URL')}/support`}
                                style={{ color: '#0f172a', textDecoration: 'underline' }}
                            >
                                Support-Team
                            </a>{' '}
                            jederzeit zur Verfügung.
                        </Text>

                        <Text className="mt-6 text-base font-medium text-slate-900">
                            Viel Spaß beim Gaming!
                            <br />
                            Dein Scyed Team
                        </Text>

                        <Text className="mt-8 text-sm leading-6 text-slate-400">
                            Diese E-Mail wurde automatisch generiert, weil du einen Gameserver bei
                            Scyed gebucht hast.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
