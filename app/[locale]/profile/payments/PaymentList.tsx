import { auth } from "@/auth";
import NotLoggedIn from "@/components/auth/NoAuthMessage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/prisma";
import { CreditCard, Badge } from "lucide-react";
import { PaymentItem } from "./paymentItem";

async function PaymentList() {
  const session = await auth();

  if (!session?.user) {
    return <NotLoggedIn />;
  }

  const payments = await prisma.gameServerOrder.findMany({
    where: { userId: session.user.id, status: "PAID" },
    include: { gameServer: true },
  });

  const totalSpent = payments.reduce((acc, pay) => acc + pay.price, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <span className="font-medium">Total spend: </span>
          <span className="font-medium">{(totalSpent / 100).toFixed(2)} €</span>
          {/* <Badge>TODO</Badge> */}
        </div>
        <div className="space-y-3">
          {payments.length === 0 && <div>No Payments</div>}
          {payments.map((pay) => (
            <PaymentItem
              key={pay.id}
              amount={pay.price}
              paymentType={pay.type}
              date={pay.createdAt}
              receiptUrl={pay.receipt_url}
              gameServerUrl={`/gameserver/${pay.gameServer?.ptServerId}`}
              serverExpired={!pay.gameServer}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentList;
