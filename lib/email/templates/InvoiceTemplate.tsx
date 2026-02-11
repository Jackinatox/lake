import { Heading, Hr, Img, Section, Text } from '@react-email/components';
import { env } from 'next-runtime-env';
import { formatDate } from '../../formatDate';
import { formatVCores } from '../../GlobalFunctions/formatVCores';
import { OrderType } from '@/app/client/generated/enums';
import {
    EmailButton,
    EmailCard,
    EmailLayout,
    headingStyle,
    mutedTextStyle,
    subheadingStyle,
    textStyle,
} from '../components';

interface InvoiceTemplateProps {
    userName: string;
    invoiceNumber: string;
    invoiceDate: Date;
    gameName: string;
    gameImageUrl: string;
    serverName: string;
    orderType: OrderType;
    ramMB: number;
    cpuVCores: number;
    diskMB: number;
    location: string;
    price: number;
    expiresAt: Date;
    receiptUrl?: string;
}

const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
    }).format(cents / 100);
};

const getOrderTypeLabel = (type: string) => {
    switch (type) {
        case 'NEW':
            return 'Neue Buchung';
        case 'UPGRADE':
            return 'Upgrade';
        case 'RENEW':
            return 'Verlängerung';
        default:
            return type;
    }
};

export default function InvoiceTemplate({
    userName,
    invoiceNumber,
    invoiceDate,
    gameName,
    gameImageUrl,
    serverName,
    orderType,
    ramMB,
    cpuVCores,
    diskMB,
    location,
    price,
    expiresAt,
    receiptUrl,
}: InvoiceTemplateProps) {
    const netPrice = price / 1.19; // Price without VAT (19%)
    const vatAmount = price - netPrice;

    return (
        <EmailLayout
            preview={`Rechnung für deinen ${gameName} Server`}
            footerNote="Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift gültig."
            hideSupport
        >
            <Heading style={headingStyle}>Rechnung</Heading>
            <Text style={{ ...mutedTextStyle, marginTop: 6 }}>
                Rechnungsnummer: {invoiceNumber}
            </Text>

            <Text style={textStyle}>Hallo {userName},</Text>
            <Text style={textStyle}>
                vielen Dank für deine Zahlung. Hier ist deine Rechnung für den gebuchten Gameserver.
            </Text>

            <EmailCard style={{ marginTop: 16 }}>
                <Section style={{ margin: 0 }}>
                    <table
                        role="presentation"
                        width="100%"
                        cellPadding="0"
                        cellSpacing="0"
                        style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}
                    >
                        <tbody>
                            <tr>
                                <td
                                    style={{
                                        verticalAlign: 'middle',
                                        paddingRight: 14,
                                        width: 64,
                                        minWidth: 64,
                                    }}
                                >
                                    <Img
                                        src={gameImageUrl}
                                        alt={`${gameName} Icon`}
                                        width="64"
                                        height="64"
                                        style={{
                                            borderRadius: '10px',
                                            display: 'block',
                                            maxWidth: '64px',
                                        }}
                                    />
                                </td>
                                <td style={{ verticalAlign: 'middle', textAlign: 'left' }}>
                                    <table
                                        role="presentation"
                                        style={{ borderCollapse: 'collapse' }}
                                    >
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <Text style={{ ...subheadingStyle, margin: 0 }}>
                                                        {gameName}
                                                    </Text>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <Text
                                                        style={{
                                                            ...textStyle,
                                                            margin: '6px 0 0 0',
                                                        }}
                                                    >
                                                        {serverName}
                                                    </Text>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </Section>
            </EmailCard>

            <Section style={{ marginTop: 16 }}>
                <table style={{ width: '100%' }} cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr>
                            <td style={cellLabelStyle}>Rechnungsdatum:</td>
                            <td style={cellValueStyle}>{formatDate(invoiceDate)}</td>
                        </tr>
                        <tr>
                            <td style={cellLabelStyle}>Leistungszeitraum:</td>
                            <td style={cellValueStyle}>bis {formatDate(expiresAt)}</td>
                        </tr>
                    </tbody>
                </table>
            </Section>

            <EmailCard style={{ marginTop: 16 }}>
                <Heading style={{ ...subheadingStyle, marginBottom: 8 }}>
                    Leistungsbeschreibung
                </Heading>
                <Text style={{ ...textStyle, fontWeight: 600, marginTop: 4 }}>
                    {gameName} - {getOrderTypeLabel(orderType)}
                </Text>
                <table style={{ width: '100%', marginTop: 8 }} cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr>
                            <td style={smallLabelStyle}>Server:</td>
                            <td style={smallValueStyle}>{serverName}</td>
                        </tr>
                        <tr>
                            <td style={smallLabelStyle}>Konfiguration:</td>
                            <td style={smallValueStyle}>
                                {(ramMB / 1024).toFixed(0)} GB RAM, {formatVCores(cpuVCores)},{' '}
                                {(diskMB / 1024).toFixed(0)} GB Speicher
                            </td>
                        </tr>
                        <tr>
                            <td style={smallLabelStyle}>Performance-Level:</td>
                            <td style={smallValueStyle}>{location}</td>
                        </tr>
                    </tbody>
                </table>
            </EmailCard>

            <EmailCard tone="info" style={{ marginTop: 16 }}>
                <table style={{ width: '100%' }} cellPadding="0" cellSpacing="0">
                    <tbody>
                        <tr>
                            <td style={priceLabelStyle}>Nettobetrag:</td>
                            <td style={priceValueStyle}>{formatPrice(Math.round(netPrice))}</td>
                        </tr>
                        <tr>
                            <td style={priceLabelStyle}>MwSt. (19%):</td>
                            <td style={priceValueStyle}>{formatPrice(Math.round(vatAmount))}</td>
                        </tr>
                        <tr>
                            <td colSpan={2} style={{ padding: '10px 0' }}>
                                <Hr style={{ borderColor: '#cbd5e1', margin: '6px 0' }} />
                            </td>
                        </tr>
                        <tr>
                            <td style={{ ...priceLabelStyle, fontWeight: 700 }}>Gesamtbetrag:</td>
                            <td style={{ ...priceValueStyle, fontSize: '18px', fontWeight: 700 }}>
                                {formatPrice(price)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </EmailCard>

            <EmailCard tone="success" style={{ marginTop: 16 }}>
                <Text style={{ ...textStyle, fontWeight: 700, color: '#065f46', margin: 0 }}>
                    ✓ Bezahlt
                </Text>
                <Text style={{ ...mutedTextStyle, marginTop: 4, color: '#047857' }}>
                    Zahlung erfolgreich am {formatDate(invoiceDate)} eingegangen.
                </Text>
            </EmailCard>

            {receiptUrl ? (
                <Section style={{ marginTop: 16, textAlign: 'center' }}>
                    <EmailButton href={receiptUrl}>Zahlungsbeleg herunterladen</EmailButton>
                </Section>
            ) : null}

            <Text style={{ ...textStyle, marginTop: 16 }}>
                Bei Fragen zu dieser Rechnung{' '}
                <a
                    href={`${env('NEXT_PUBLIC_APP_URL')}/support`}
                    style={{ color: '#0f172a', textDecoration: 'underline' }}
                >
                    kontaktiere uns gerne
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
    color: '#0f172a',
    fontWeight: 600,
} as const;

const smallLabelStyle = {
    padding: '4px 0',
    fontSize: '13px',
    color: '#64748b',
} as const;

const smallValueStyle = {
    padding: '4px 0',
    textAlign: 'right' as const,
    fontSize: '13px',
    color: '#0f172a',
    fontWeight: 600,
} as const;

const priceLabelStyle = {
    padding: '6px 0',
    fontSize: '14px',
    color: '#475569',
} as const;

const priceValueStyle = {
    padding: '6px 0',
    textAlign: 'right' as const,
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: 600,
} as const;
