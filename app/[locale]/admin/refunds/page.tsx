'use server';

import { auth } from '@/auth';
import NoAdmin from '@/components/admin/NoAdminMessage';
import AdminBreadcrumb from '@/components/admin/AdminBreadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <AdminBreadcrumb items={[{ label: 'Refunds' }]} />

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
