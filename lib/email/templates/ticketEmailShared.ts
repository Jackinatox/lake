import { TicketCategory } from '@/app/client/generated/enums';

export const ticketCategoryLabelsDe: Record<TicketCategory, string> = {
    GENERAL: 'Allgemeine Frage',
    TECHNICAL: 'Technisches Problem',
    BILLING: 'Abrechnung & Zahlung',
    ACCOUNT: 'Account & Zugang',
    SUSPENSION: 'Server-Sperrung',
};

export const ticketMessageTextStyle = {
    margin: '8px 0 0 0',
    whiteSpace: 'pre-line' as const,
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    padding: '12px',
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#475569',
} as const;
