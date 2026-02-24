import { Heading, Hr, Section, Text } from '@react-email/components';
import { env } from 'next-runtime-env';
import { formatDate } from '../../formatDate';
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

interface RefundTemplateProps {
    userName: string;
    orderId: string;
    orderType: OrderType;
    gameName: string;
    refundAmountCents: number;
    originalAmountCents: number;
    totalRefundedCents: number;
    isFullRefund: boolean;
    refundDate: Date;
    reason?: string;
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
        case 'PACKAGE':
            return 'Paket';
        case 'TO_PAYED':
            return 'Upgrade von Gratis';
        default:
            return type;
    }
};

export default function RefundTemplate({
    userName,
    orderId,
    orderType,
    gameName,
    refundAmountCents,
    originalAmountCents,
    totalRefundedCents,
    isFullRefund,
    refundDate,
    reason,
}: RefundTemplateProps) {
    const appUrl = env('NEXT_PUBLIC_APP_URL');
    const paymentsUrl = appUrl ? `${appUrl}/profile` : '#'; // TODO Link to more specific page when available

    return (
        <EmailLayout
            preview={`Rückerstattung von ${formatPrice(refundAmountCents)} für deinen ${gameName} Server`}
        >
            <Heading style={headingStyle}>Rückerstattung bestätigt</Heading>

            <Text style={textStyle}>Hallo {userName},</Text>
            <Text style={textStyle}>
                wir bestätigen, dass eine Rückerstattung für deine Bestellung verarbeitet wurde. Der
                Betrag wird innerhalb von 5-10 Werktagen auf deine ursprüngliche Zahlungsmethode
                zurückerstattet.
            </Text>

            <EmailCard style={{ marginTop: 16 }}>
                <Text style={{ ...subheadingStyle, margin: 0 }}>Rückerstattungsdetails</Text>

                <Hr style={{ borderColor: '#e2e8f0', margin: '12px 0' }} />

                <table
                    role="presentation"
                    width="100%"
                    cellPadding="0"
                    cellSpacing="0"
                    style={{ borderCollapse: 'collapse' }}
                >
                    <tbody>
                        <tr>
                            <td style={{ ...textStyle, margin: 0, padding: '4px 0' }}>Spiel</td>
                            <td
                                style={{
                                    ...textStyle,
                                    margin: 0,
                                    padding: '4px 0',
                                    textAlign: 'right',
                                    fontWeight: 600,
                                }}
                            >
                                {gameName}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ ...textStyle, margin: 0, padding: '4px 0' }}>
                                Bestelltyp
                            </td>
                            <td
                                style={{
                                    ...textStyle,
                                    margin: 0,
                                    padding: '4px 0',
                                    textAlign: 'right',
                                    fontWeight: 600,
                                }}
                            >
                                {getOrderTypeLabel(orderType)}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ ...textStyle, margin: 0, padding: '4px 0' }}>
                                Ursprünglicher Betrag
                            </td>
                            <td
                                style={{
                                    ...textStyle,
                                    margin: 0,
                                    padding: '4px 0',
                                    textAlign: 'right',
                                    fontWeight: 600,
                                }}
                            >
                                {formatPrice(originalAmountCents)}
                            </td>
                        </tr>
                        <tr>
                            <td
                                style={{
                                    ...textStyle,
                                    margin: 0,
                                    padding: '4px 0',
                                    color: '#16a34a',
                                }}
                            >
                                Erstattungsbetrag
                            </td>
                            <td
                                style={{
                                    ...textStyle,
                                    margin: 0,
                                    padding: '4px 0',
                                    textAlign: 'right',
                                    fontWeight: 700,
                                    color: '#16a34a',
                                }}
                            >
                                {formatPrice(refundAmountCents)}
                            </td>
                        </tr>
                        {!isFullRefund && (
                            <tr>
                                <td style={{ ...textStyle, margin: 0, padding: '4px 0' }}>
                                    Gesamt erstattet
                                </td>
                                <td
                                    style={{
                                        ...textStyle,
                                        margin: 0,
                                        padding: '4px 0',
                                        textAlign: 'right',
                                        fontWeight: 600,
                                    }}
                                >
                                    {formatPrice(totalRefundedCents)}
                                </td>
                            </tr>
                        )}
                        <tr>
                            <td style={{ ...textStyle, margin: 0, padding: '4px 0' }}>Datum</td>
                            <td
                                style={{
                                    ...textStyle,
                                    margin: 0,
                                    padding: '4px 0',
                                    textAlign: 'right',
                                    fontWeight: 600,
                                }}
                            >
                                {formatDate(refundDate)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </EmailCard>

            {isFullRefund && (
                <EmailCard tone="warning" style={{ marginTop: 12 }}>
                    <Text style={{ ...textStyle, margin: 0, fontSize: '14px' }}>
                        <strong>Hinweis:</strong> Durch die Rückerstattung wurde dein Server
                        {orderType === 'UPGRADE' || orderType === 'RENEW'
                            ? ' auf den Stand der vorherigen Bestellung zurückgesetzt. Falls das vorherige Ablaufdatum bereits vergangen ist, wurde der Server pausiert.'
                            : ' pausiert. Du kannst ihn jederzeit neu buchen.'}
                    </Text>
                </EmailCard>
            )}

            {!isFullRefund && (
                <EmailCard tone="warning" style={{ marginTop: 12 }}>
                    <Text style={{ ...textStyle, margin: 0, fontSize: '14px' }}>
                        <strong>Hinweis:</strong> Durch die teilweise Rückerstattung wurde dein
                        Server
                        {orderType === 'UPGRADE' || orderType === 'RENEW'
                            ? ' auf den Stand der vorherigen Bestellung zurückgesetzt (inkl. Ablaufdatum).'
                            : ' pausiert.'}
                    </Text>
                </EmailCard>
            )}

            {reason && <Text style={{ ...mutedTextStyle, marginTop: 12 }}>Grund: {reason}</Text>}

            <Section style={{ marginTop: 20 }}>
                <EmailButton href={paymentsUrl}>Zahlungen anzeigen</EmailButton>
            </Section>
        </EmailLayout>
    );
}
