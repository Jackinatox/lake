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
                <Body style={{ backgroundColor: '#f8f9fa', margin: 0, padding: 0 }}>
                    <Container
                        style={{
                            margin: '0 auto',
                            maxWidth: '520px',
                            backgroundColor: '#ffffff',
                            padding: '32px 24px',
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
