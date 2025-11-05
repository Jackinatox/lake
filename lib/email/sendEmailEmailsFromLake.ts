import { render } from "@react-email/render";
import { sendMail } from "./NodeMailer";
import ConfirmEmailTemplate from "./templates/ConfirmEmailTemplate";
import ResetPasswordTemplate from "./templates/ResetPassword";
import { SupportTicket } from "@prisma/client";
import SupportTicketCreatedTemplate from "./templates/SupportTicketCreatedTemplate";

export async function sendConfirmEmail(to: string, url: string) {
    const html = await render(ConfirmEmailTemplate({
        url: url
    }));

    await sendMail(to, "Bestätige deine E-Mail-Adresse für Scyed", html);
}


export async function sendResetPasswordEmail(to: string, url: string, token: string) {
    const html = await render(ResetPasswordTemplate({
        token: token,
        url: url
    }));

    await sendMail(to, "Setze dein Passwort zurück", html);
}

export async function sendTicketCreatedEmail(to: string, ticket: SupportTicket) {
    const html = await render(SupportTicketCreatedTemplate({
        createdAt: ticket.createdAt,
        status: ticket.status,
        category: ticket.category,
        message: ticket.message,
        ticketId: ticket.ticketId,
        ticketUrl: `${process.env.LAKE_URL}/support/tickets/${ticket.ticketId}/notImplementedYet`
    }));

    await sendMail(to, "Dein Support-Ticket bei Scyed wurde erstellt", html);
}