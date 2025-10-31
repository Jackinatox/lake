import { render } from "@react-email/render";
import { mailer } from "./NodeMailer";
import ResetPasswordTemplate from "./templates/ResetPassword";

export default async function sendResetPasswordEmail(to: string, url: string, token: string) {

    const html = await render(ResetPasswordTemplate({
        token: token,
        url: url
    }));    


    const res = await mailer.sendMail({
        from: `"Scyed" <${process.env.SMTP_USER}>`,
        to,
        subject: "Reset your password",
        html: html,
    });
}