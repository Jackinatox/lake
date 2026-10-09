import type { TicketCategory } from '@/app/client/generated/enums';
import {
    CreditCard,
    HelpCircle,
    ShieldAlert,
    UserCog,
    Wrench,
    type LucideIcon,
} from 'lucide-react';

export const ticketCategoryIcons: Record<TicketCategory, LucideIcon> = {
    GENERAL: HelpCircle,
    TECHNICAL: Wrench,
    BILLING: CreditCard,
    ACCOUNT: UserCog,
    SUSPENSION: ShieldAlert,
};
