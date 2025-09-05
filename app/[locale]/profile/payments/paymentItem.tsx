"use client";

import { Button } from "@/components/ui/button"
import { Receipt, Server, AlertCircle } from "lucide-react";

interface PaymentItemProps {
  amount: number
  paymentType: string
  date: Date
  receiptUrl: string
  gameServerUrl?: string
  serverExpired?: boolean
  locale?: string
};

export function PaymentItem({
  amount,
  paymentType,
  date,
  receiptUrl,
  gameServerUrl,
  serverExpired = false,
  locale = "de",
}: PaymentItemProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  return (
    <div className="flex justify-between items-center p-3 border rounded-lg">
      <div>
        <p className="font-medium">{paymentType}</p>
        <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
        {serverExpired && (
          <div className="flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 text-orange-500" />
            <span className="text-xs text-orange-500">Server Expired</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">{(amount / 100).toFixed(2)} €</span>
        <Button variant="outline" size="sm" asChild>
          <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
            <Receipt className="h-3 w-3" />
          </a>
        </Button>
        {gameServerUrl && (
          serverExpired ? (
            <Button variant="outline" size="sm" disabled>
              <Server className="h-3 w-3" />
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <a href={gameServerUrl} target="_blank" rel="noopener noreferrer">
                <Server className="h-3 w-3" />
              </a>
            </Button>
          )
        )}
      </div>
    </div>
  );
}
