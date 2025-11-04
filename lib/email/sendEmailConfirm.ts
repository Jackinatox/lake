import { render } from "@react-email/render";
import { mailer } from "./NodeMailer";
import { logger } from "../logger";
import ConfirmEmailTemplate from "./templates/ConfirmEmailTemplate";

export default async function sendConfirmEmail(to: string, url: string) {

    const html = await render(ConfirmEmailTemplate({
        url: url
    }));

    try {
        const res = await mailer.sendMail({
            from: `"Scyed" <${process.env.SMTP_USER}>`,
            to,
            subject: "Confirm your email",
            html: html,
        });

    } catch (error) {
        console.error("Error sending confirm email:", error);
        await logger.error("Failed to send confirm email", "EMAIL", {
            details: { error: (error as Error)?.message, to },
        });
    }
}