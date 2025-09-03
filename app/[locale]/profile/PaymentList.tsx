import { auth } from "@/auth";
import NotLoggedIn from "@/components/auth/NoAuthMessage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/prisma";
import { CreditCard, Badge } from "lucide-react";
import ClientPayDate from "./ClientPayDate";

async function PaymentList() {
  const session = await auth();

  if (!session?.user) {
    return <NotLoggedIn />;
  }

  const payments = await prisma.gameServerOrder.findMany({
    where: { userId: session.user.id, status: "PAID" },
  });

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
          <Badge>TODO</Badge>
        </div>
        <div className="space-y-3">
          {payments.length === 0 && <div>No Payments</div>}
          {payments.map((pay) => (
            <div key={pay.id} className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <p className="font-medium"><ClientPayDate date={pay.createdAt}/></p>
              </div>
              <div className="text-right">
                <p className="font-medium">{(pay.price / 100).toFixed(2)} €</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentList;
