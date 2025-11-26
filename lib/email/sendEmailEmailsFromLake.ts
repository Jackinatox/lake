import { render } from '@react-email/render';
import { env } from 'next-runtime-env';
import { sendMail } from './NodeMailer';
import ConfirmEmailTemplate from './templates/ConfirmEmailTemplate';
import FreeServerCreatedTemplate from './templates/FreeServerCreatedTemplate';
import InvoiceTemplate from './templates/InvoiceTemplate';
import ResetPasswordTemplate from './templates/ResetPassword';
import ServerBookingConfirmationTemplate from './templates/ServerBookingConfirmationTemplate';
import SupportTicketCreatedTemplate from './templates/SupportTicketCreatedTemplate';
import { percentToVCores } from '../GlobalFunctions/formatVCores';
import { OrderType, SupportTicket } from '@/app/client/generated/browser';

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

    await sendMail(to, 'Setze dein Passwort zurück', html, 'PASSWORD_RESET');
}

export async function sendTicketCreatedEmail(to: string, ticket: SupportTicket) {
    const html = await render(
        SupportTicketCreatedTemplate({
            createdAt: ticket.createdAt,
            status: ticket.status,
            category: ticket.category,
            message: ticket.message,
            ticketId: ticket.ticketId,
            ticketUrl: `${env("NEXT_PUBLIC_APP_URL")}/support/tickets/${ticket.ticketId}/notImplementedYet`,
        }),
    );

    await sendMail(
        to,
        'Dein Support-Ticket bei Scyed wurde erstellt',
        html,
        'SUPPORT_TICKET_CREATED',
    );
}

interface ServerBookingEmailData {
    userName: string;
    userEmail: string;
    gameName: string;
    gameImageUrl: string;
    serverName: string;
    ramMB: number;
    cpuPercent: number;
    diskMB: number;
    location: string;
    price: number;
    expiresAt: Date;
    serverUrl: string;
}

export async function sendServerBookingConfirmationEmail(data: ServerBookingEmailData) {
    const html = await render(
        ServerBookingConfirmationTemplate({
            userName: data.userName,
            gameName: data.gameName,
            gameImageUrl: data.gameImageUrl,
            serverName: data.serverName,
            ramMB: data.ramMB,
            cpuVCores: percentToVCores(data.cpuPercent),
            diskMB: data.diskMB,
            location: data.location,
            price: data.price,
            expiresAt: data.expiresAt,
            serverUrl: data.serverUrl,
        }),
    );

    await sendMail(
        data.userEmail,
        `Dein ${data.gameName} Server wurde erfolgreich gebucht!`,
        html,
        'SERVER_BOOKING_CONFIRMATION',
    );
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
