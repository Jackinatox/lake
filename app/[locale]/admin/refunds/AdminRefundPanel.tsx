'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminRefund, calculateAdminWithdrawalAmount } from '@/app/actions/refunds/adminRefund';
import { Loader2, Search, Undo2, FileX2, HandCoins } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { RefundServerAction, RefundType } from '@/app/client/generated/browser';
import type { RefundableOrder } from '@/models/prisma';

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
    const [refundType, setRefundType] = useState<RefundType>('WITHDRAWAL');
    const [serverAction, setServerAction] = useState<RefundServerAction>('SUSPEND');
    const [isCalculating, setIsCalculating] = useState(false);

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
        setRefundType('WITHDRAWAL');
        setServerAction('SUSPEND');
    };

    const handleTypeChange = async (type: RefundType) => {
        setRefundType(type);

        if (type === 'WITHDRAWAL' && selectedOrder) {
            // Withdrawal always suspends the server
            setServerAction('SUSPEND');

            // Auto-calculate pro-rata amount
            setIsCalculating(true);
            try {
                const result = await calculateAdminWithdrawalAmount(selectedOrder.id);
                if (result.eligible) {
                    setRefundAmountEur((result.refundableAmountCents / 100).toFixed(2));
                } else {
                    toast({
                        title: 'Withdrawal not eligible',
                        description: result.reason ?? 'This order is not eligible for withdrawal.',
                        variant: 'destructive',
                    });
                }
            } catch {
                toast({
                    title: 'Error',
                    description: 'Could not calculate withdrawal amount.',
                    variant: 'destructive',
                });
            } finally {
                setIsCalculating(false);
            }
        } else if (type === 'REFUND' && selectedOrder) {
            // For refunds, default to full remaining balance and NONE server action
            const remaining = getRemainingBalance(selectedOrder);
            setRefundAmountEur((remaining / 100).toFixed(2));
            setServerAction('NONE');
        }
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
                    type: refundType,
                    serverAction,
                    reason: reason || undefined,
                    internalNote: internalNote || undefined,
                });

                if (result.success) {
                    toast({
                        title:
                            refundType === 'WITHDRAWAL'
                                ? 'Withdrawal initiated'
                                : 'Refund initiated',
                        description: result.message,
                    });
                    setSelectedOrder(null);
                    setDialogOpen(false);
                    router.refresh();
                } else {
                    toast({
                        title: 'Failed',
                        description: result.message,
                        variant: 'destructive',
                    });
                }
            } catch {
                toast({
                    title: 'Error',
                    description: 'Unexpected error processing request.',
                    variant: 'destructive',
                });
            }
        });
    };

    const typeLabel = refundType === 'WITHDRAWAL' ? 'Widerruf (Withdrawal)' : 'Erstattung (Refund)';

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
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
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
                                    isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
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
                                <h3 className="font-medium text-sm">Order Details</h3>
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
                                                {r.type === 'WITHDRAWAL'
                                                    ? ' (Widerruf)'
                                                    : ' (Erstattung)'}
                                            </span>
                                            <span>
                                                {new Date(r.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Type selector */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type</label>
                                <Select
                                    value={refundType}
                                    onValueChange={(v) => handleTypeChange(v as RefundType)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="WITHDRAWAL">
                                            <div className="flex items-center gap-2">
                                                <FileX2 className="h-3.5 w-3.5" />
                                                Widerruf (Withdrawal) — Contract ends
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="REFUND">
                                            <div className="flex items-center gap-2">
                                                <HandCoins className="h-3.5 w-3.5" />
                                                Erstattung (Refund) — Goodwill
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {refundType === 'WITHDRAWAL' && (
                                    <p className="text-xs text-muted-foreground">
                                        §355 BGB — Pro-rata amount auto-calculated. Server will be
                                        suspended. Contract ends immediately.
                                    </p>
                                )}
                            </div>

                            {/* Server action (only for REFUND type — WITHDRAWAL always suspends) */}
                            {refundType === 'REFUND' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Server Action</label>
                                    <Select
                                        value={serverAction}
                                        onValueChange={(v) =>
                                            setServerAction(v as RefundServerAction)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NONE">
                                                Do nothing — Server continues running
                                            </SelectItem>
                                            <SelectItem value="SUSPEND">
                                                Suspend — Server gets suspended immediately
                                            </SelectItem>
                                            <SelectItem value="SHORTEN">
                                                Revert — Revert to previous order config/expiry
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Amount (€)
                                    {isCalculating && (
                                        <Loader2 className="inline h-3 w-3 animate-spin ml-1" />
                                    )}
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={(getRemainingBalance(selectedOrder) / 100).toFixed(2)}
                                    value={refundAmountEur}
                                    onChange={(e) => setRefundAmountEur(e.target.value)}
                                    disabled={refundType === 'WITHDRAWAL'}
                                />
                                {refundType === 'WITHDRAWAL' && (
                                    <p className="text-xs text-muted-foreground">
                                        Amount is auto-calculated based on unused service time (days
                                        used rounded down).
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Reason (visible to customer)
                                </label>
                                <Input
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={
                                        refundType === 'WITHDRAWAL'
                                            ? 'e.g. Admin-triggered withdrawal on behalf of customer'
                                            : 'e.g. Goodwill compensation for downtime'
                                    }
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
                                disabled={isPending || isCalculating}
                                className="w-full"
                                variant="destructive"
                            >
                                {isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : refundType === 'WITHDRAWAL' ? (
                                    <FileX2 className="h-4 w-4 mr-2" />
                                ) : (
                                    <Undo2 className="h-4 w-4 mr-2" />
                                )}
                                {refundType === 'WITHDRAWAL'
                                    ? 'Issue Withdrawal (Widerruf)'
                                    : 'Issue Refund (Erstattung)'}
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
                            Select an order to issue a withdrawal or refund
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation dialog */}
            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {refundType === 'WITHDRAWAL'
                                ? 'Confirm Withdrawal (Widerruf)'
                                : 'Confirm Refund (Erstattung)'}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    You are about to issue a <strong>{typeLabel}</strong> of{' '}
                                    <strong>{refundAmountEur} €</strong> to{' '}
                                    <strong>{selectedOrder?.user.email}</strong> for order{' '}
                                    <code className="text-xs">{selectedOrder?.id}</code>.
                                </p>
                                {refundType === 'WITHDRAWAL' && (
                                    <p className="text-orange-600 dark:text-orange-400 text-sm">
                                        This is a legal withdrawal (Widerruf §355 BGB). The contract
                                        will be terminated and the server will be suspended. A
                                        Widerrufsbestätigung email will be sent.
                                    </p>
                                )}
                                {refundType === 'REFUND' && (
                                    <p className="text-sm text-muted-foreground">
                                        Server action:{' '}
                                        <strong>
                                            {serverAction === 'NONE'
                                                ? 'No change'
                                                : serverAction === 'SUSPEND'
                                                  ? 'Suspend'
                                                  : 'Revert to previous'}
                                        </strong>
                                        . A refund confirmation email will be sent.
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    This action cannot be undone.
                                </p>
                            </div>
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
                            {refundType === 'WITHDRAWAL' ? 'Confirm Withdrawal' : 'Confirm Refund'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
