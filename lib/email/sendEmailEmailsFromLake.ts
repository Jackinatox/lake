import { render } from '@react-email/render';
import { env } from 'next-runtime-env';
import { sendMail } from './NodeMailer';
import ConfirmEmailTemplate from './templates/ConfirmEmailTemplate';
import FreeServerCreatedTemplate from './templates/FreeServerCreatedTemplate';
import InvoiceTemplate from './templates/InvoiceTemplate';
import PasswordResetSuccessTemplate from './templates/PasswordResetSuccessTemplate';
import ResetPasswordTemplate from './templates/ResetPassword';
import SupportTicketCreatedTemplate from './templates/SupportTicketCreatedTemplate';
import SupportTicketResponseTemplate from './templates/SupportTicketResponseTemplate';
import TwoFactorCreatedTemplate from './templates/TwoFactorCreatedTemplate';
import TwoFactorOtpTemplate from './templates/TwoFactorOtpTemplate';
import TwoFactorRemovedTemplate from './templates/TwoFactorRemovedTemplate';
import { percentToVCores } from '../GlobalFunctions/formatVCores';
import { OrderType, SupportTicket } from '@/app/client/generated/browser';
import { TicketStatus } from '@/app/client/generated/enums';

export async function sendConfirmEmail(to: string, url: string) {
    const html = await render(
        ConfirmEmailTemplate({
            url: url,
        }),
    );

    await sendMail(to, 'Bestätige deine E-Mail-Adresse für Scyed', html, 'EMAIL_VERIFICATION');
}

export async function sendResetPasswordEmail(to: string, url: string, token: string) {
    const html = await render(
        ResetPasswordTemplate({
            token: token,
            url: url,
        }),
    );

    await sendMail(to, 'Setze dein Passwort zurück', html, 'REQUEST_PASSWORD_RESET');
}

export async function sendPasswordResetSuccessEmail(
    to: string,
    loginUrl: string,
    userName?: string,
    scenario: 'reset' | 'change' = 'reset',
) {
    const html = await render(
        PasswordResetSuccessTemplate({
            loginUrl,
            userName,
            scenario,
        }),
    );

    const subject =
        scenario === 'change'
            ? 'Dein Passwort wurde geändert'
            : 'Dein Passwort wurde zurückgesetzt';

    await sendMail(to, subject, html, 'PASSWORD_RESET_SUCCESS');
}

export async function sendTicketCreatedEmail(to: string, ticket: SupportTicket) {
    const html = await render(
        SupportTicketCreatedTemplate({
            createdAt: ticket.createdAt,
            status: ticket.status,
            category: ticket.category,
            message: ticket.message,
            ticketId: ticket.ticketId,
            ticketUrl: `${env('NEXT_PUBLIC_APP_URL')}/support/tickets/${ticket.ticketId}/notImplementedYet`,
        }),
    );

    await sendMail(
        to,
        'Dein Support-Ticket bei Scyed wurde erstellt',
        html,
        'SUPPORT_TICKET_CREATED',
    );
}

interface SupportTicketResponseEmail {
    to: string;
    ticketId?: string;
    agentName?: string;
    responseMessage: string;
    status?: TicketStatus;
    ticketUrl?: string;
    userName?: string;
}

export async function sendSupportTicketResponseEmail(data: SupportTicketResponseEmail) {
    const html = await render(
        SupportTicketResponseTemplate({
            ticketId: data.ticketId,
            agentName: data.agentName,
            responseMessage: data.responseMessage,
            status: data.status,
            ticketUrl: data.ticketUrl,
            userName: data.userName,
        }),
    );

    await sendMail(
        data.to,
        'Neue Antwort auf dein Support-Ticket',
        html,
        'SUPPORT_TICKET_RESPONSE',
    );
}

interface TwoFactorEmailData {
    to: string;
    userName?: string;
}

export async function sendTwoFactorCreatedEmail(
    data: TwoFactorEmailData & { recoveryCodes?: string[]; manageUrl: string },
) {
    const html = await render(
        TwoFactorCreatedTemplate({
            userName: data.userName,
            recoveryCodes: data.recoveryCodes,
            manageUrl: data.manageUrl,
        }),
    );

    await sendMail(data.to, '2FA wurde aktiviert', html, 'TWO_FACTOR_CREATED');
}

export async function sendTwoFactorRemovedEmail(data: TwoFactorEmailData & { manageUrl: string }) {
    const html = await render(
        TwoFactorRemovedTemplate({
            userName: data.userName,
            manageUrl: data.manageUrl,
        }),
    );

    await sendMail(data.to, '2FA wurde deaktiviert', html, 'TWO_FACTOR_REMOVED');
}

export async function sendTwoFactorOtpEmail(
    data: TwoFactorEmailData & { code: string; expiresInMinutes?: number; loginUrl?: string },
) {
    const html = await render(
        TwoFactorOtpTemplate({
            userName: data.userName,
            code: data.code,
            expiresInMinutes: data.expiresInMinutes,
            loginUrl: data.loginUrl,
        }),
    );

    await sendMail(data.to, 'Dein Sicherheitscode', html, 'TWO_FAKTOR_OPT_SEND');
}

interface InvoiceEmailData {
    userName: string;
    userEmail: string;
    invoiceNumber: string;
    invoiceDate: Date;
    gameName: string;
    gameImageUrl: string;
    serverName: string;
    orderType: OrderType;
    ramMB: number;
    cpuPercent: number;
    diskMB: number;
    location: string;
    price: number;
    expiresAt: Date;
    receiptUrl?: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData) {
    const html = await render(
        InvoiceTemplate({
            userName: data.userName,
            invoiceNumber: data.invoiceNumber,
            invoiceDate: data.invoiceDate,
            gameName: data.gameName,
            gameImageUrl: data.gameImageUrl,
            serverName: data.serverName,
            orderType: data.orderType,
            ramMB: data.ramMB,
            cpuVCores: percentToVCores(data.cpuPercent),
            diskMB: data.diskMB,
            location: data.location,
            price: data.price,
            expiresAt: data.expiresAt,
            receiptUrl: data.receiptUrl,
        }),
    );

    await sendMail(data.userEmail, `Rechnung für deinen ${data.gameName} Server`, html, 'INVOICE');
}

interface FreeServerCreatedEmailData {
    userName: string;
    userEmail: string;
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

export async function sendFreeServerCreatedEmail(data: FreeServerCreatedEmailData) {
    const html = await render(
        FreeServerCreatedTemplate({
            userName: data.userName,
            gameName: data.gameName,
            gameImageUrl: data.gameImageUrl,
            serverName: data.serverName,
            ramMB: data.ramMB,
            cpuVCores: percentToVCores(data.cpuPercent),
            diskMB: data.diskMB,
            location: data.location,
            expiresAt: data.expiresAt,
            serverUrl: data.serverUrl,
            extensionUrl: data.extensionUrl,
        }),
    );

    await sendMail(
        data.userEmail,
        `Dein kostenloser ${data.gameName} Server wurde erstellt!`,
        html,
        'FREE_SERVER_CREATED',
    );
}
