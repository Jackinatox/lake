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

interface InvoiceTemplateProps {
    userName: string;
    invoiceNumber: string;
    invoiceDate: Date;
    gameName: string;
    gameImageUrl: string;
    serverName: string;
    orderType: 'NEW' | 'UPGRADE' | 'RENEW';
    ramMB: number;
    cpuPercent: number;
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
    cpuPercent,
    diskMB,
    location,
    price,
    expiresAt,
    receiptUrl,
}: InvoiceTemplateProps) {
    const netPrice = price / 1.19; // Price without VAT (19%)
    const vatAmount = price - netPrice;

    return (
        <Html>
            <Head />
            <Preview>Rechnung für deinen {gameName} Server</Preview>
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
                            Rechnung
                        </Heading>

                        <Text className="mt-2 text-sm text-slate-500">
                            Rechnungsnummer: {invoiceNumber}
                        </Text>

                        <Text className="mt-6 text-base leading-6 text-slate-600">
                            Hallo {userName},
                        </Text>

                        <Text className="mt-4 text-base leading-6 text-slate-600">
                            vielen Dank für deine Zahlung. Hier ist deine Rechnung für den gebuchten
                            Gameserver.
                        </Text>

                        <Hr className="my-6 border-slate-200" />

                        {/* Game Image with Server Name */}
                        <Section className="mt-6 mb-6">
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                }}
                            >
                                <Img
                                    src={gameImageUrl}
                                    alt={`${gameName} Icon`}
                                    width="64"
                                    height="64"
                                    style={{ borderRadius: '8px', flexShrink: 0 }}
                                />
                                <div style={{ flex: 1, marginLeft: '12px' }}>
                                    <Text
                                        style={{
                                            margin: 0,
                                            fontSize: '16px',
                                            fontWeight: 600,
                                            color: '#0f172a',
                                        }}
                                    >
                                        {gameName} Gameserver
                                    </Text>
                                    <Text
                                        style={{
                                            margin: '4px 0 0 0',
                                            fontSize: '14px',
                                            color: '#64748b',
                                        }}
                                    >
                                        {serverName}
                                    </Text>
                                </div>
                            </div>
                        </Section>

                        <Hr className="my-6 border-slate-200" />

                        {/* Invoice Details */}
                        <Section className="mt-6">
                            <table className="w-full" cellPadding="0" cellSpacing="0">
                                <tbody>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">
                                            Rechnungsdatum:
                                        </td>
                                        <td className="py-2 text-right text-sm text-slate-900">
                                            {formatDate(invoiceDate)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 text-sm text-slate-600">
                                            Leistungszeitraum:
                                        </td>
                                        <td className="py-2 text-right text-sm text-slate-900">
                                            bis {formatDate(expiresAt)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Section>

                        <Hr className="my-6 border-slate-200" />

                        {/* Line Items */}
                        <Section className="mt-6">
                            <Heading className="m-0 mb-4 text-base font-semibold text-slate-900">
                                Leistungsbeschreibung
                            </Heading>

                            <div className="rounded-lg bg-slate-50 p-4">
                                <div className="mb-3 flex justify-between">
                                    <Text className="m-0 text-sm font-semibold text-slate-900">
                                        {gameName} Gameserver - {getOrderTypeLabel(orderType)}
                                    </Text>
                                </div>

                                <table className="w-full" cellPadding="0" cellSpacing="0">
                                    <tbody>
                                        <tr>
                                            <td className="py-1 text-xs text-slate-600">Server:</td>
                                            <td className="py-1 text-right text-xs text-slate-900">
                                                {serverName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-1 text-xs text-slate-600">
                                                Konfiguration:
                                            </td>
                                            <td className="py-1 text-right text-xs text-slate-900">
                                                {(ramMB / 1024).toFixed(1)} GB RAM, {cpuPercent}%
                                                CPU, {(diskMB / 1024).toFixed(1)} GB Speicher
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-1 text-xs text-slate-600">
                                                Standort:
                                            </td>
                                            <td className="py-1 text-right text-xs text-slate-900">
                                                {location}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </Section>

                        <Hr className="my-6 border-slate-200" />

                        {/* Pricing Breakdown */}
                        <Section className="mt-6">
                            <table style={{ width: '100%' }} cellPadding="0" cellSpacing="0">
                                <tbody>
                                    <tr>
                                        <td
                                            style={{
                                                padding: '8px 0',
                                                fontSize: '14px',
                                                color: '#64748b',
                                            }}
                                        >
                                            Nettobetrag:
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 0',
                                                textAlign: 'right',
                                                fontSize: '14px',
                                                color: '#0f172a',
                                            }}
                                        >
                                            {formatPrice(Math.round(netPrice))}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td
                                            style={{
                                                padding: '8px 0',
                                                fontSize: '14px',
                                                color: '#64748b',
                                            }}
                                        >
                                            MwSt. (19%):
                                        </td>
                                        <td
                                            style={{
                                                padding: '8px 0',
                                                textAlign: 'right',
                                                fontSize: '14px',
                                                color: '#0f172a',
                                            }}
                                        >
                                            {formatPrice(Math.round(vatAmount))}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} style={{ padding: '8px 0' }}>
                                            <Hr className="my-2 border-slate-200" />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td
                                            style={{
                                                padding: '12px 0',
                                                fontSize: '16px',
                                                fontWeight: 'bold',
                                                color: '#0f172a',
                                            }}
                                        >
                                            {'Gesamtbetrag:' + ' '}
                                        </td>
                                        <td
                                            style={{
                                                padding: '12px 0',
                                                textAlign: 'right',
                                                fontSize: '20px',
                                                fontWeight: 'bold',
                                                color: '#0f172a',
                                            }}
                                        >
                                            {formatPrice(price)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Section>

                        <Hr className="my-6 border-slate-200" />

                        {/* Payment Status */}
                        <Section className="mt-6">
                            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                                <Text className="m-0 text-sm font-semibold text-green-900">
                                    ✓ Bezahlt
                                </Text>
                                <Text className="m-0 mt-1 text-xs text-green-700">
                                    Zahlung erfolgreich am {formatDate(invoiceDate)} eingegangen.
                                </Text>
                            </div>
                        </Section>

                        {/* Receipt Button */}
                        {receiptUrl && (
                            <Section className="mt-6" style={{ textAlign: 'center' }}>
                                <Button
                                    href={receiptUrl}
                                    style={{
                                        display: 'inline-block',
                                        width: '100%',
                                        maxWidth: '100%',
                                        padding: '12px 24px',
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
                                    Zahlungsbeleg herunterladen
                                </Button>
                            </Section>
                        )}

                        <Text className="mt-8 text-sm leading-6 text-slate-600">
                            Diese Rechnung wurde elektronisch erstellt und ist ohne Unterschrift
                            gültig.
                        </Text>

                        <Text className="mt-6 text-base font-medium text-slate-900">
                            Bei Fragen zu dieser Rechnung{' '}
                            <a
                                href={`${env('NEXT_PUBLIC_APP_URL')}/support`}
                                style={{ color: '#0f172a', textDecoration: 'underline' }}
                            >
                                kontaktiere uns gerne
                            </a>
                            .
                            <br />
                            Dein Scyed Team
                        </Text>

                        <Text className="mt-8 text-sm leading-6 text-slate-400">
                            Scyed | Gameserver Hosting
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
