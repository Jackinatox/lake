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

interface FreeServerCreatedTemplateProps {
    userName: string;
    gameName: string;
    gameImageUrl: string;
    serverName: string;
    ramMB: number;
    cpuVCores: number;
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
    cpuVCores,
    diskMB,
    location,
    expiresAt,
    serverUrl,
    extensionUrl,
}: FreeServerCreatedTemplateProps) {
    return (
        <EmailLayout
            preview={`Dein kostenloser ${gameName} Server wurde erstellt 🎉`}
            footerNote="Diese E-Mail wurde automatisch generiert."
            hideSupport
        >
            <Heading style={headingStyle}>Kostenloser Server erstellt</Heading>

            <Text style={textStyle}>Hallo {userName},</Text>
            <Text style={textStyle}>
                Wir haben erfolgreich einen kostenlosen {gameName} Gameserver für dich erstellt.
                Unten findest du die wichtigsten Informationen zum Server.
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
                        <Text style={{ ...subheadingStyle, margin: 0 }}>
                            {gameName} Gameserver (Kostenlos)
                        </Text>
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
                            <td style={cellLabelStyle}>Server Name:</td>
                            <td style={cellValueStyle}>{serverName}</td>
                        </tr>
                        <tr>
                            <td style={cellLabelStyle}>Spiel:</td>
                            <td style={cellValueStyle}>{gameName}</td>
                        </tr>
                        <tr>
                            <td style={cellLabelStyle}>RAM:</td>
                            <td style={cellValueStyle}>{(ramMB / 1024).toFixed(1)} GB</td>
                        </tr>
                        <tr>
                            <td style={cellLabelStyle}>CPU:</td>
                            <td style={cellValueStyle}>{formatVCores(cpuVCores)}</td>
                        </tr>
                        <tr>
                            <td style={cellLabelStyle}>Speicher:</td>
                            <td style={cellValueStyle}>{(diskMB / 1024).toFixed(1)} GB</td>
                        </tr>
                        <tr>
                            <td style={cellLabelStyle}>Performance-Level:</td>
                            <td style={cellValueStyle}>{location}</td>
                        </tr>
                        <tr>
                            <td style={cellLabelStyle}>Läuft bis:</td>
                            <td style={cellValueStyle}>{formatDate(expiresAt, true)}</td>
                        </tr>
                    </tbody>
                </table>
            </Section>

            <Section style={{ marginTop: 24, textAlign: 'center' }}>
                <EmailButton href={serverUrl}>Server verwalten</EmailButton>
            </Section>

            {extensionUrl ? (
                <EmailCard tone="success" style={{ marginTop: 12 }}>
                    <Text style={{ ...textStyle, margin: 0 }}>
                        Du kannst deinen kostenlosen Server kostenlos um bis zu 1 Monat verlängern.
                        Klicke auf den folgenden Link, um deinen Server sofort zu verlängern.
                    </Text>
                    <Section style={{ marginTop: 12 }}>
                        <EmailButton href={extensionUrl} variant="success">
                            Kostenlos verlängern
                        </EmailButton>
                    </Section>
                </EmailCard>
            ) : null}

            <Text style={{ ...textStyle, marginTop: 16 }}>
                Dein kostenloser Server ist jetzt aktiv. Bei Fragen erreichst du unser{' '}
                <a
                    href={`${env('NEXT_PUBLIC_APP_URL')}/support`}
                    style={{ color: '#0f172a', textDecoration: 'underline' }}
                >
                    Support-Team
                </a>
                .
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
