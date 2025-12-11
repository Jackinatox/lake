import { Body, Container, Head, Html, Preview, Tailwind } from '@react-email/components';
import type { ReactNode } from 'react';
import { EmailFooter } from './EmailFooter';

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
                <Body style={{ backgroundColor: '#eef2f7', margin: 0, padding: '18px 12px' }}>
                    <Container
                        style={{
                            margin: '0 auto',
                            width: '100%',
                            maxWidth: '620px',
                            backgroundColor: '#ffffff',
                            padding: '20px 18px',
                            borderRadius: '14px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
                        }}
                    >
                        {children}
                        <EmailFooter supportText={supportText} signature={signature} />
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
