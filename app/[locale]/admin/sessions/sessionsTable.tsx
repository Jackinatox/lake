'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { expireSessions, deleteOrders } from '@/app/[locale]/admin/sessions/sessions_actions';
import { useToast } from '@/hooks/use-toast';
import { DbSession } from '@/models/prisma';
import { sso } from 'better-auth/plugins/sso';

type Props = { sessions: DbSession[] };

const SessionsTable: React.FC<Props> = ({ sessions }) => {
    // Deterministic UTC date formatter to avoid SSR/CSR hydration mismatches
    const formatUtc = (input: Date | string | number) => {
        const d = new Date(input);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const yyyy = d.getUTCFullYear();
        const mm = pad(d.getUTCMonth() + 1);
        const dd = pad(d.getUTCDate());
        const hh = pad(d.getUTCHours());
        const mi = pad(d.getUTCMinutes());
        const ss = pad(d.getUTCSeconds());
        return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} UTC`;
    };

    const [selected, setSelected] = React.useState<string[]>([]);
    const [sortKey, setSortKey] = React.useState<null | 'status' | 'type'>(null);
    const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');
    const { toast } = useToast();

    const toggle = (id: string) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const toggleAll = (checked: boolean) => {
        setSelected(
            checked
                ? sessions.map((s) => s.stripeSessionId).filter((id): id is string => id != null)
                : [],
        );
    };

    const onExpire = async () => {
        if (!selected.length) return;
        const res = await expireSessions(selected);
        toast({
            title: 'Expire',
            description: `Expired: ${res.expired.length}, failed: ${res.failed.length}`,
        });
    };

    const onDeleteOrders = async () => {
        if (!selected.length) return;
        const res = await deleteOrders(selected);
        toast({
            title: 'Delete Orders',
            description: `Deleted: ${res.deleted}, not found: ${res.notFound}`,
        });
    };

    // Sorting helpers
    const STATUS_ORDER = ['PENDING', 'PAID', 'PAYMENT_FAILED', 'EXPIRED'] as const;
    const TYPE_ORDER = ['NEW', 'UPGRADE', 'RENEW', 'DOWNGRADE'] as const;

    const sorted = React.useMemo(() => {
        const arr = [...sessions];
        if (!sortKey) return arr;

        const dir = sortDir === 'asc' ? 1 : -1;

        if (sortKey === 'status') {
            const weight = (s: string) => {
                const i = STATUS_ORDER.indexOf(s as any);
                return i === -1 ? Number.MAX_SAFE_INTEGER : i;
            };
            arr.sort((a, b) => (weight(a.status) - weight(b.status)) * dir);
            return arr;
        }

        if (sortKey === 'type') {
            const weight = (t: string) => {
                const i = TYPE_ORDER.indexOf(t as any);
                return i === -1 ? Number.MAX_SAFE_INTEGER : i;
            };
            arr.sort((a, b) => (weight(a.type) - weight(b.type)) * dir);
            return arr;
        }

        return arr;
    }, [sessions, sortKey, sortDir]);

    const toggleSort = (key: 'status' | 'type') => {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Button variant="destructive" onClick={onExpire} disabled={!selected.length}>
                    Expire selected (Stripe)
                </Button>
                <Button variant="secondary" onClick={onDeleteOrders} disabled={!selected.length}>
                    Delete related orders (DB)
                </Button>
                <div className="text-sm text-muted-foreground">Selected: {selected.length}</div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                checked={selected.length === sessions.length && sessions.length > 0}
                                onCheckedChange={(v) => toggleAll(!!v)}
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead>Stripe Session</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>
                            <button className="font-medium" onClick={() => toggleSort('status')}>
                                Status
                                {sortKey === 'status' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                            </button>
                        </TableHead>
                        <TableHead>
                            <button className="font-medium" onClick={() => toggleSort('type')}>
                                Type{sortKey === 'type' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                            </button>
                        </TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sorted.map((s) =>
                        s.stripeSessionId ? (
                            <TableRow
                                key={s.stripeSessionId}
                                data-state={
                                    selected.includes(s.stripeSessionId) ? 'selected' : undefined
                                }
                            >
                                <TableCell className="w-10">
                                    <Checkbox
                                        checked={selected.includes(s.stripeSessionId)}
                                        onCheckedChange={() =>
                                            toggle(s.stripeSessionId ? s.stripeSessionId : '')
                                        }
                                        aria-label="Select row"
                                    />
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                    {s.stripeSessionId}
                                </TableCell>
                                <TableCell>#{s.id}</TableCell>
                                <TableCell className="uppercase">{s.status}</TableCell>
                                <TableCell>{s.type}</TableCell>
                                <TableCell>{s.price.toFixed(2)}</TableCell>
                                <TableCell>{s.user.email ?? '-'}</TableCell>
                                <TableCell>{formatUtc(s.createdAt)}</TableCell>
                                <TableCell>{formatUtc(s.expiresAt)}</TableCell>
                            </TableRow>
                        ) : (
                            <>No Stripe Session ID - This is very bad</>
                        ),
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default SessionsTable;
