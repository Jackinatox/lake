import { Text } from "@react-email/components";

interface EmailFooterProps {
    supportText?: string;
    signature?: string;
}

const DEFAULT_SUPPORT_TEXT = "Bei Fragen oder wenn du Unterstützung brauchst, melde dich jederzeit bei unserem Support-Team.";
const DEFAULT_SIGNATURE = "Dein Scyed Team";

export function EmailFooter({ supportText = DEFAULT_SUPPORT_TEXT, signature = DEFAULT_SIGNATURE }: EmailFooterProps) {
    return (
        <>
            {supportText ? (
                <Text className="mt-6 text-base leading-6 text-slate-600">{supportText}</Text>
            ) : null}
            {signature ? (
                <Text className="mt-6 text-base font-medium text-slate-900">{signature}</Text>
            ) : null}
            <Text className="mt-8 text-sm leading-6 text-slate-400">
                Du erhältst diese E-Mail, weil du ein Konto bei Scyed hast. Wenn du keine Emails mehr bekommen möchtest, lösche dein Konto hier.
                //TODO: Add delete link
            </Text>
        </>
    );
}
