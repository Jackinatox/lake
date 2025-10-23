import { WorkerJobType, type Email } from "../../generated/client";
import { logError } from "../../lib/logger";
import { prisma } from "../../prisma";

export default async function SendEmail(email: Email, jobRun: string) {
    console.log(`Sending email to ${email.recipient} with subject: ${email.subject}`);

    try {
        // sendEmail and throw exception


    } catch (error) {
        await logError(WorkerJobType.SEND_EMAILS, `Failed to send email`, {
            emailId: email.id,
            type: email.type,
            recipient: email.recipient,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            retryCount: email.retries
        }, { gameServerId: undefined,  userId: undefined, jobRun });

        console.error(`Failed to send email to ${email.recipient}:`, error);
        
        await prisma.email.update({
            where: { id: email.id },
            data: { status: "FAILED", retries: email.retries + 1, errorText: String(error) }
        });

        return;
    }

    await prisma.email.update({
        where: { id: email.id },
        data: { status: "SENT", sentAt: new Date(), }
    });
}