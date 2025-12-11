import { Heading, Hr, Img, Section, Text } from '@react-email/components';
import { env } from 'next-runtime-env';
import { formatDate } from '../../formatDate';
import { formatVCores } from '../../GlobalFunctions/formatVCores';
import {
    EmailButton,
    EmailCard,
    EmailLayout,
    headingStyle,
    subheadingStyle,
    textStyle,
} from '../components';

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
        <EmailLayout
            preview={`Dein ${gameName} Server wurde erfolgreich gebucht!`}
            footerNote="Diese E-Mail wurde automatisch generiert, weil du einen Gameserver bei Scyed gebucht hast."
            hideSupport
        >
            <Heading style={headingStyle}>Server erfolgreich gebucht! 🎉</Heading>

            <Text style={textStyle}>Hallo {userName},</Text>

            <Text style={textStyle}>
                Vielen Dank für deine Buchung! Dein {gameName} Gameserver wurde erfolgreich erstellt
                und wird gerade für dich eingerichtet.
            </Text>

            <EmailCard style={{ marginTop: 16 }}>
                <Section style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Img
                        src={gameImageUrl}
                        alt={`${gameName} Icon`}
                        width="72"
                        height="72"
                        style={{ borderRadius: '12px', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                        <Text style={{ ...subheadingStyle, margin: 0 }}>{gameName} Gameserver</Text>
                        <Text style={{ ...textStyle, marginTop: 6 }}>{serverName}</Text>
                    </div>
                </Section>
            </EmailCard>

            <Hr style={{ borderColor: '#e2e8f0', margin: '18px 0' }} />

            <Section style={{ marginTop: 8 }}>
                <Heading style={{ ...subheadingStyle, marginBottom: 8 }}>Server Details</Heading>
                <table style={{ width: '100%' }} cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr>
                            <td style={{ ...cellLabelStyle }}>Server Name:</td>
                            <td style={{ ...cellValueStyle }}>{serverName}</td>
                        </tr>
                        <tr>
                            <td style={{ ...cellLabelStyle }}>Spiel:</td>
                            <td style={{ ...cellValueStyle }}>{gameName}</td>
                        </tr>
                        <tr>
                            <td style={{ ...cellLabelStyle }}>RAM:</td>
                            <td style={{ ...cellValueStyle }}>{(ramMB / 1024).toFixed(1)} GB</td>
                        </tr>
                        <tr>
                            <td style={{ ...cellLabelStyle }}>CPU:</td>
                            <td style={{ ...cellValueStyle }}>{formatVCores(cpuVCores)}</td>
                        </tr>
                        <tr>
                            <td style={{ ...cellLabelStyle }}>Speicher:</td>
                            <td style={{ ...cellValueStyle }}>{(diskMB / 1024).toFixed(1)} GB</td>
                        </tr>
                        <tr>
                            <td style={{ ...cellLabelStyle }}>Performance-Level:</td>
                            <td style={{ ...cellValueStyle }}>{location}</td>
                        </tr>
                        <tr>
                            <td style={{ ...cellLabelStyle }}>Läuft bis:</td>
                            <td style={{ ...cellValueStyle }}>{formatDate(expiresAt, true)}</td>
                        </tr>
                    </tbody>
                </table>
            </Section>

            <Hr style={{ borderColor: '#e2e8f0', margin: '18px 0' }} />

            <EmailCard tone="info" style={{ marginTop: 8 }}>
                <table style={{ width: '100%' }} cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr>
                            <td style={{ ...textStyle, fontWeight: 600, margin: 0 }}>Gesamtbetrag:</td>
                            <td style={{ ...textStyle, textAlign: 'right', fontSize: '20px', fontWeight: 700 }}>
                                {formatPrice(price)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </EmailCard>

            <Section style={{ marginTop: 24, textAlign: 'center' }}>
                <EmailButton href={serverUrl}>Server verwalten</EmailButton>
            </Section>

            <Text style={{ ...textStyle, marginTop: 16 }}>
                Dein Server wird gerade eingerichtet, du kannst dich gleich verbinden.
            </Text>

            <Text style={textStyle}>
                Bei Fragen oder Problemen steht dir unser{' '}
                <a
                    href={`${env('NEXT_PUBLIC_APP_URL')}/support`}
                    style={{ color: '#0f172a', textDecoration: 'underline' }}
                >
                    Support-Team
                </a>{' '}
                jederzeit zur Verfügung.
            </Text>
        </EmailLayout>
    );
}

const cellLabelStyle = {
    padding: '6px 0',
    fontSize: '14px',
    color: '#64748b',
} as const;

const cellValueStyle = {
    padding: '6px 0',
    textAlign: 'right' as const,
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
} as const;
