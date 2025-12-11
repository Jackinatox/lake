import { Section } from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';

interface EmailCardProps {
    children: ReactNode;
    tone?: 'default' | 'info' | 'warning' | 'success';
    style?: CSSProperties;
    className?: string;
}

const toneStyles: Record<NonNullable<EmailCardProps['tone']>, CSSProperties> = {
    default: {
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
    },
    info: {
        backgroundColor: '#eef2ff',
        border: '1px solid #c7d2fe',
    },
    warning: {
        backgroundColor: '#fff7ed',
        border: '1px solid #fed7aa',
    },
    success: {
        backgroundColor: '#ecfdf3',
        border: '1px solid #bbf7d0',
    },
};

export function EmailCard({ children, tone = 'default', style, className }: EmailCardProps) {
    return (
        <Section
            className={className}
            style={{
                padding: '16px',
                borderRadius: '12px',
                ...toneStyles[tone],
                ...style,
            }}
        >
            {children}
        </Section>
    );
}
