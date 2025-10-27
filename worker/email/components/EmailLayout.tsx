import { Body, Container, Head, Html, Preview, Tailwind } from "@react-email/components";
import type { ReactNode } from "react";
import { EmailFooter } from "./EmailFooter";

interface EmailLayoutProps {
    preview: string;
    children: ReactNode;
    supportText?: string;
    signature?: string;
}

export function EmailLayout({ preview, children, supportText, signature }: EmailLayoutProps) {
    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Tailwind>
                <Body className="bg-slate-100 py-10">
                    <Container className="mx-auto max-w-[520px] rounded-xl bg-white px-8 py-8 shadow-lg">
                        {children}
                        <EmailFooter supportText={supportText} signature={signature} />
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
