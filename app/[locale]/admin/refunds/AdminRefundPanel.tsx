'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminRefund } from '@/app/actions/refunds/adminRefund';
import { Loader2, Search, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type RefundableOrder = {
    id: string;
    price: number;
    type: string;
    status: string;
    refundStatus: string;
    createdAt: Date;
    stripePaymentIntent: string | null;
    user: { id: string; email: string; name: string };
    refunds: { id: string; amount: number; status: string; reason: string | null; createdAt: Date }[];
    gameServer: { ptServerId: string | null; name: string; status: string } | null;
    creationGameData: { name: string };
};

interface AdminRefundPanelProps {
    orders: RefundableOrder[];
}

export function AdminRefundPanel({ orders }: AdminRefundPanelProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<RefundableOrder | null>(null);
    const [refundAmountEur, setRefundAmountEur] = useState('');
    const [reason, setReason] = useState('');
    const [internalNote, setInternalNote] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    const filteredOrders = orders.filter((order) => {
        const q = searchQuery.toLowerCase();
        return (
            order.id.toLowerCase().includes(q) ||
            order.user.email.toLowerCase().includes(q) ||
            order.user.name.toLowerCase().includes(q) ||
            order.creationGameData.name.toLowerCase().includes(q)
        );
    });

    const getAlreadyRefunded = (order: RefundableOrder) => {
        return order.refunds
            .filter((r) => r.status === 'SUCCEEDED' || r.status === 'PENDING')
            .reduce((sum, r) => sum + r.amount, 0);
    };

    const getRemainingBalance = (order: RefundableOrder) => {
        return Math.round(order.price) - getAlreadyRefunded(order);
    };

    const handleSelectOrder = (order: RefundableOrder) => {
        setSelectedOrder(order);
        const remaining = getRemainingBalance(order);
        setRefundAmountEur((remaining / 100).toFixed(2));
        setReason('');
        setInternalNote('');
    };

    const handleSubmitRefund = () => {
        if (!selectedOrder) return;
        const amountCents = Math.round(parseFloat(refundAmountEur) * 100);
        if (isNaN(amountCents) || amountCents <= 0) {
            toast({
                title: 'Invalid amount',
                description: 'Please enter a valid positive amount.',
                variant: 'destructive',
            });
            return;
        }
        setDialogOpen(true);
    };

    const confirmRefund = () => {
        if (!selectedOrder) return;
        const amountCents = Math.round(parseFloat(refundAmountEur) * 100);

        startTransition(async () => {
            try {
                const result = await adminRefund({
                    orderId: selectedOrder.id,
                    amountCents,
                    reason: reason || undefined,
                    internalNote: internalNote || undefined,
                });

                if (result.success) {
                    toast({ title: 'Refund initiated', description: result.message });
                    setSelectedOrder(null);
                    setDialogOpen(false);
                    router.refresh();
                } else {
                    toast({
                        title: 'Refund failed',
                        description: result.message,
                        variant: 'destructive',
                    });
                }
            } catch {
                toast({
                    title: 'Error',
                    description: 'Unexpected error processing refund.',
                    variant: 'destructive',
                });
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by order ID, email, name, or game..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Order list */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredOrders.length === 0 && (
                        <p className="text-muted-foreground text-sm p-4 text-center">
                            No refundable orders found.
                        </p>
                    )}
                    {filteredOrders.map((order) => {
                        const alreadyRefunded = getAlreadyRefunded(order);
                        const remaining = getRemainingBalance(order);
                        const isSelected = selectedOrder?.id === order.id;

                        return (
                            <button
                                key={order.id}
                                onClick={() => handleSelectOrder(order)}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                    isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {order.user.email}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {order.creationGameData.name} · {order.type}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {order.id}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-medium">
                                            {(order.price / 100).toFixed(2)} €
                                        </p>
                                        {alreadyRefunded > 0 && (
                                            <p className="text-xs text-orange-500">
                                                -{(alreadyRefunded / 100).toFixed(2)} € refunded
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Bal: {(remaining / 100).toFixed(2)} €
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 mt-1.5">
                                    <Badge variant="outline" className="text-[10px]">
                                        {order.status}
                                    </Badge>
                                    {order.refundStatus !== 'NONE' && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] text-orange-500"
                                        >
                                            {order.refundStatus}
                                        </Badge>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Refund form */}
                <div className="border rounded-lg p-4 space-y-4">
                    {selectedOrder ? (
                        <>
                            <div>
                                <h3 className="font-medium text-sm">Refund for Order</h3>
                                <p className="text-xs text-muted-foreground font-mono">
                                    {selectedOrder.id}
                                </p>
                                <p className="text-sm mt-1">
                                    {selectedOrder.user.name} ({selectedOrder.user.email})
                                </p>
                            </div>

                            <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Original amount:</span>
                                    <span className="font-medium">
                                        {(selectedOrder.price / 100).toFixed(2)} €
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Already refunded:</span>
                                    <span>
                                        {(getAlreadyRefunded(selectedOrder) / 100).toFixed(2)} €
                                    </span>
                                </div>
                                <div className="flex justify-between font-medium">
                                    <span>Remaining balance:</span>
                                    <span>
                                        {(getRemainingBalance(selectedOrder) / 100).toFixed(2)} €
                                    </span>
                                </div>
                            </div>

                            {/* Previous refunds on this order */}
                            {selectedOrder.refunds.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Previous refunds:
                                    </p>
                                    {selectedOrder.refunds.map((r) => (
                                        <div
                                            key={r.id}
                                            className="flex justify-between text-xs text-muted-foreground"
                                        >
                                            <span>
                                                {(r.amount / 100).toFixed(2)} € — {r.status}
                                            </span>
                                            <span>
                                                {new Date(r.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Refund amount (€)
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={(getRemainingBalance(selectedOrder) / 100).toFixed(2)}
                                    value={refundAmountEur}
                                    onChange={(e) => setRefundAmountEur(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Reason (visible to customer)
                                </label>
                                <Input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Customer requested refund"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Internal note (admin only)
                                </label>
                                <Textarea
                                    value={internalNote}
                                    onChange={(e) => setInternalNote(e.target.value)}
                                    placeholder="Internal notes..."
                                    rows={2}
                                />
                            </div>

                            <Button
                                onClick={handleSubmitRefund}
                                disabled={isPending}
                                className="w-full"
                                variant="destructive"
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Undo2 className="h-4 w-4 mr-2" />
                                )}
                                Issue Refund
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
                            Select an order to issue a refund
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation dialog */}
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to refund{' '}
                            <strong>{refundAmountEur} €</strong> to{' '}
                            <strong>{selectedOrder?.user.email}</strong> for order{' '}
                            <code className="text-xs">{selectedOrder?.id}</code>.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRefund}
                            disabled={isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Confirm Refund
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
