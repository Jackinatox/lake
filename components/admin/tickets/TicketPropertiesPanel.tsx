'use client';

import { adminUpdateTicketAction } from '@/app/actions/tickets/adminTicketActions';
import type { TicketCategory, TicketPriority, TicketState } from '@/app/client/generated/enums';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATES } from '@/lib/tickets/constants';
import {
    adminTicketCategoryLabels,
    adminTicketPriorityLabels,
    adminTicketStateLabels,
} from '@/lib/tickets/presentation';
import type { AdminTicketUpdateInput } from '@/lib/validation/tickets';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import SidebarSection, { SidebarField, SidebarFields } from './SidebarSection';

const NONE = '__none';

export type TicketPropertyOption = { id: string; label: string };

function PropertySelect({
    value,
    disabled,
    onChange,
    options,
}: {
    value: string;
    disabled?: boolean;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <Select value={value} disabled={disabled} onValueChange={onChange}>
            <SelectTrigger className="h-8 px-2 text-xs">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default function TicketPropertiesPanel({
    ticketId,
    status,
    priority,
    category,
    assigneeId,
    gameServerId,
    currentAdminId,
    admins,
    servers,
}: {
    ticketId: string;
    status: TicketState;
    priority: TicketPriority;
    category: TicketCategory;
    assigneeId: string | null;
    gameServerId: string | null;
    currentAdminId: string;
    admins: TicketPropertyOption[];
    /** The customer's servers, the only ones a ticket can be linked to. */
    servers: TicketPropertyOption[];
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const update = (patch: Omit<AdminTicketUpdateInput, 'ticketId'>) =>
        startTransition(async () => {
            const result = await adminUpdateTicketAction({ ticketId, ...patch }).catch(() => null);
            if (!result?.success) {
                toast({
                    title: 'Update failed',
                    description: result?.message ?? 'Could not update the ticket.',
                    variant: 'destructive',
                });
                return;
            }
            router.refresh();
        });

    // Keep a linked server selectable even if it is no longer among the customer's servers.
    const serverOptions =
        gameServerId && !servers.some((server) => server.id === gameServerId)
            ? [...servers, { id: gameServerId, label: 'Linked server (deleted)' }]
            : servers;

    return (
        <SidebarSection
            title="Ticket"
            action={isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        >
            <SidebarFields>
                <SidebarField label="Status">
                    <PropertySelect
                        value={status}
                        disabled={isPending}
                        onChange={(value) => update({ status: value as TicketState })}
                        options={TICKET_STATES.map((value) => ({
                            value,
                            label: adminTicketStateLabels[value],
                        }))}
                    />
                </SidebarField>
                <SidebarField label="Priority">
                    <PropertySelect
                        value={priority}
                        disabled={isPending}
                        onChange={(value) => update({ priority: value as TicketPriority })}
                        options={TICKET_PRIORITIES.map((value) => ({
                            value,
                            label: adminTicketPriorityLabels[value],
                        }))}
                    />
                </SidebarField>
                <SidebarField label="Category">
                    <PropertySelect
                        value={category}
                        disabled={isPending}
                        onChange={(value) => update({ category: value as TicketCategory })}
                        options={TICKET_CATEGORIES.map((value) => ({
                            value,
                            label: adminTicketCategoryLabels[value],
                        }))}
                    />
                </SidebarField>
                <SidebarField label="Assignee">
                    <PropertySelect
                        value={assigneeId ?? NONE}
                        disabled={isPending}
                        onChange={(value) => update({ assigneeId: value === NONE ? null : value })}
                        options={[
                            { value: NONE, label: 'Unassigned' },
                            ...admins.map((admin) => ({ value: admin.id, label: admin.label })),
                        ]}
                    />
                </SidebarField>
                {assigneeId !== currentAdminId && (
                    <>
                        <span />
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => update({ assigneeId: currentAdminId })}
                            className="-mt-1 justify-self-start text-xs font-medium text-primary hover:underline"
                        >
                            Assign to me
                        </button>
                    </>
                )}
                <SidebarField label="Server">
                    <PropertySelect
                        value={gameServerId ?? NONE}
                        disabled={isPending || serverOptions.length === 0}
                        onChange={(value) =>
                            update({ gameServerId: value === NONE ? null : value })
                        }
                        options={[
                            { value: NONE, label: 'None' },
                            ...serverOptions.map((server) => ({
                                value: server.id,
                                label: server.label,
                            })),
                        ]}
                    />
                </SidebarField>
            </SidebarFields>
        </SidebarSection>
    );
}
