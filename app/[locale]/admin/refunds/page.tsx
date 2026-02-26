'use server';

import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@/components/ui/breadcrumb';
import { SettingsIcon, Undo2 } from 'lucide-react';
import { headers } from 'next/headers';
import { getRefundableOrders, getRefundHistory } from '@/app/actions/refunds/adminRefund';
import { AdminRefundPanel } from './AdminRefundPanel';
import { RefundHistoryTable } from './RefundHistoryTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function AdminRefundsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (session?.user.role !== 'admin') {
        return <NoAdmin />;
    }

    const [refundableData, refundHistoryData] = await Promise.all([
        getRefundableOrders(1, 50),
        getRefundHistory(1, 50),
    ]);

    return (
        <div className="space-y-4">
            <div className="mb-2">
                <Breadcrumb>
                    <BreadcrumbItem>
                        <BreadcrumbLink
                            href="#"
                            className="flex items-center gap-2 text-muted-foreground"
                        >
                            <SettingsIcon className="h-4 w-4" />
                            Admin Panel
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbLink
                            href="#"
                            className="flex items-center gap-2 text-muted-foreground"
                        >
                            <Undo2 className="h-4 w-4" />
                            Refunds
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </Breadcrumb>
            </div>

            <Tabs defaultValue="issue" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="issue">Issue Withdrawal / Refund</TabsTrigger>
                    <TabsTrigger value="history">History ({refundHistoryData.total})</TabsTrigger>
                </TabsList>

                <TabsContent value="issue">
                    <Card>
                        <CardHeader>
                            <CardTitle>Issue Withdrawal or Refund</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AdminRefundPanel orders={refundableData.orders} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Withdrawal & Refund History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RefundHistoryTable refunds={refundHistoryData.refunds} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
