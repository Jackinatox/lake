import { Button } from '@react-email/components';
import type { CSSProperties, ReactNode } from 'react';

interface EmailButtonProps {
    href: string;
    children: ReactNode;
    fullWidth?: boolean;
    variant?: 'primary' | 'secondary' | 'success';
    style?: CSSProperties;
}

const baseStyle: CSSProperties = {
    display: 'inline-block',
    width: '100%',
    padding: '14px 18px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: '9999px',
    fontSize: '15px',
    fontWeight: 600,
    textAlign: 'center',
    boxSizing: 'border-box',
};

const variantColors: Record<'primary' | 'secondary' | 'success', string> = {
    primary: '#0f172a',
    secondary: '#0b3b6e',
    success: '#0f766e',
};

export function EmailButton({
    href,
    children,
    fullWidth = true,
    variant = 'primary',
    style,
}: EmailButtonProps) {
    return (
        <Button
            href={href}
            style={{
                ...baseStyle,
                width: fullWidth ? '100%' : undefined,
                backgroundColor: variantColors[variant],
                ...style,
            }}
        >
            {children}
        </Button>
    );
}
