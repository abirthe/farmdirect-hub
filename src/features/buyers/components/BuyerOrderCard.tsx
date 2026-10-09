import React from "react";
import { Link } from "react-router-dom";
import { Truck, CheckCircle2, Clock, QrCode } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface BuyerOrderSummary {
  id: string;
  crop: string;
  farm: string;
  qty: string;
  price: React.ReactNode;
  total: React.ReactNode;
  status: string;
  statusType: "transit" | "delivered" | "pending";
  date: string;
}

const statusColor: Record<string, string> = {
  transit: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  delivered: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
  pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

const statusIcon: Record<string, React.ElementType> = {
  transit: Truck,
  delivered: CheckCircle2,
  pending: Clock,
};

interface BuyerOrderCardProps {
  order: BuyerOrderSummary;
}

export function BuyerOrderCard({ order }: BuyerOrderCardProps) {
  const StatusIcon = statusIcon[order.statusType] || Clock;

  return (
    <Card className="soil-card hover:-translate-y-0.5 transition-transform duration-200">
      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="text-2xl">{order.crop.split(" ").pop() || "📦"}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold">{order.crop.split(" ")[0]}</p>
              <span className="text-muted-foreground text-sm">·</span>
              <p className="text-sm text-muted-foreground truncate">{order.farm}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{order.id}</span>
              <span>·</span>
              <span>
                {order.qty} @ {order.price}
              </span>
              <span>·</span>
              <span>{order.date}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <p className="font-black text-xl">{order.total}</p>
          <Badge className={`${statusColor[order.statusType] || ""} rounded-full gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {order.status}
          </Badge>
          {order.statusType === "transit" && (
            <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5">
              <Link to="/escrow/ORD-2401">
                <QrCode className="h-4 w-4" />
                Scan QR
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
