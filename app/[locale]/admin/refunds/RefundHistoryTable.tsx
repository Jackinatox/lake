'use client';

import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type RefundEntry = {
    id: string;
    amount: number;
    reason: string | null;
    internalNote: string | null;
    status: string;
    isAutomatic: boolean;
    initiatedBy: string | null;
    stripeRefundId: string | null;
    createdAt: Date;
    order: {
        id: string;
        price: number;
        type: string;
        user: { id: string; email: string; name: string };
        creationGameData: { name: string };
    };
};

interface RefundHistoryTableProps {
    refunds: RefundEntry[];
}

const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    SUCCEEDED: 'bg-green-500/10 text-green-600 border-green-500/20',
    FAILED: 'bg-red-500/10 text-red-600 border-red-500/20',
    CANCELED: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export function RefundHistoryTable({ refunds }: RefundHistoryTableProps) {
    if (refunds.length === 0) {
        return (
            <p className="text-muted-foreground text-sm p-4 text-center">
                No refunds have been processed yet.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Game</TableHead>
                        <TableHead className="text-right">Original</TableHead>
                        <TableHead className="text-right">Refund</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Stripe ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {refunds.map((refund) => (
                        <TableRow key={refund.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                                {new Date(refund.createdAt).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit',
                                })}
                            </TableCell>
                            <TableCell>
                                <div className="min-w-0">
                                    <p className="text-sm truncate max-w-[180px]">
                                        {refund.order.user.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                        {refund.order.user.name}
                                    </p>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm">
                                {refund.order.creationGameData.name}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                                {(refund.order.price / 100).toFixed(2)} €
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                                {(refund.amount / 100).toFixed(2)} €
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] ${statusColors[refund.status] ?? ''}`}
                                >
                                    {refund.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                    {refund.isAutomatic ? 'Auto' : 'Manual'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {refund.reason ?? '—'}
                            </TableCell>
                            <TableCell className="text-xs font-mono text-muted-foreground max-w-[120px] truncate">
                                {refund.stripeRefundId ?? '—'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
