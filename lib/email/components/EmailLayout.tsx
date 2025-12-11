import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Tailwind,
    Text,
} from '@react-email/components';
import { env } from 'next-runtime-env';
import type { ReactNode } from 'react';

const bodyStyle = {
    backgroundColor: '#eef2f7',
    margin: 0,
    padding: '18px 12px',
};

const containerStyle = {
    margin: '0 auto',
    width: '100%',
    maxWidth: '640px',
    backgroundColor: '#ffffff',
    padding: '20px 18px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
} as const;

export const headingStyle = {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1.3,
} as const;

export const subheadingStyle = {
    margin: '8px 0 0 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#0f172a',
    lineHeight: 1.5,
} as const;

export const textStyle = {
    margin: '12px 0 0 0',
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#475569',
} as const;

export const mutedTextStyle = {
    margin: '12px 0 0 0',
    fontSize: '13px',
    lineHeight: 1.6,
    color: '#94a3b8',
} as const;

interface EmailLayoutProps {
    preview: string;
    children: ReactNode;
    footerNote?: string;
    supportText?: string;
    signature?: string;
    hideSupport?: boolean;
    hideSignature?: boolean;
}

export function EmailLayout({
    preview,
    children,
    footerNote,
    supportText,
    signature,
    hideSupport,
    hideSignature,
}: EmailLayoutProps) {
    const appUrl = env('NEXT_PUBLIC_APP_URL');
    const supportHref = appUrl ? `${appUrl}/support` : undefined;

    return (
        <Html>
            <Head />
            <Preview>{preview}</Preview>
            <Tailwind>
                <Body style={bodyStyle}>
                    <Container style={containerStyle}>
                        {children}
                        {!hideSupport ? (
                            <Text style={textStyle}>
                                {supportText ||
                                    'Bei Fragen oder wenn du Unterstützung brauchst, melde dich jederzeit bei unserem Support-Team.'}{' '}
                                {supportHref ? (
                                    <a
                                        href={supportHref}
                                        style={{ color: '#0f172a', textDecoration: 'underline' }}
                                    >
                                        Support
                                    </a>
                                ) : null}
                                .
                            </Text>
                        ) : null}
                        {!hideSignature ? (
                            <Text style={{ ...textStyle, fontWeight: 600, marginTop: 16 }}>
                                {signature || 'Dein Scyed Team'}
                            </Text>
                        ) : null}
                        {footerNote ? (
                            <Text style={{ ...mutedTextStyle, marginTop: 16 }}>{footerNote}</Text>
                        ) : null}
                        <Hr style={{ borderColor: '#e2e8f0', margin: '24px 0 12px 0' }} />
                        <Text style={{ ...mutedTextStyle, marginTop: 0 }}>
                            Scyed | Gameserver Hosting
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
