import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, QrCode, CheckCircle2, Clock, Truck, BadgeDollarSign, Leaf, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import MapView from "@/components/ui/map-view";
import { useAuth } from "@/contexts/AuthContext";
import { LogisticsTracker } from "@/features/logistics/components/LogisticsTracker";
import { BkashEscrowPaymentCard } from "@/features/payments/components/BkashEscrowPaymentCard";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";

const escrowSteps = [
  { id: 1, label: "Listing created", detail: <>Farmer listed 18.4t of maize at <CurrencyDisplay amount={318}/>/t</>, status: "done", time: "Mar 8, 2026" },
  { id: 2, label: "Buyer locked price", detail: <>Bengal Agro Ltd committed to 12t. Total: <CurrencyDisplay amount={3816}/></>, status: "done", time: "Mar 11, 2026" },
  { id: 3, label: "Escrow initiated", detail: <><CurrencyDisplay amount={3816}/> held securely. Farmer notified to prepare.</>, status: "done", time: "Mar 11, 2026" },
  { id: 4, label: "Crop in transit", detail: "GPS-tracked delivery en route. ETA: Mar 19", status: "active", time: "Mar 18, 2026" },
  { id: 5, label: "QR delivery confirmation", detail: "Buyer scans QR code to confirm receipt.", status: "pending", time: "Pending" },
  { id: 6, label: "Funds released to farmer", detail: <><CurrencyDisplay amount={3702}/> (after 3% platform fee) released.</>, status: "pending", time: "Pending" },
];

import type { Database } from "@/integrations/supabase/types";
type OrderRow = Database['public']['Tables']['orders']['Row'];

const EscrowPage = () => {
  const { id } = useParams();
  const { session } = useAuth();
  const userRole = session?.user?.user_metadata?.role;
  const [order, setOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id || id === "demo") return;
      const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
      if (error) console.error("Failed to fetch order:", error);
      if (data) setOrder(data);
    };
    fetchOrder();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5">
            <Link to="/marketplace"><ArrowLeft className="h-4 w-4" />Back to marketplace</Link>
          </Button>
        </div>
      </div>

      <div className="container py-10 max-w-4xl space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Escrow transaction</span>
          </div>
          <h1 className="text-gradient-primary text-4xl font-black">Bogra Maize Deal</h1>
          <p className="text-muted-foreground">Transaction ID: <span className="font-mono font-semibold">ESC-{id?.slice(0, 8).toUpperCase() || "LST00001"}</span></p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Escrow amount", value: <CurrencyDisplay amount={3816} />, icon: BadgeDollarSign, color: "text-primary bg-primary/10" },
            { label: "Crop quantity", value: "12 tons", icon: Leaf, color: "text-green-600 bg-green-50" },
            { label: "Delivery ETA", value: "Mar 19", icon: Truck, color: "text-blue-600 bg-blue-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="glass-panel hover-lift">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-black">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Logistics Map */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-sm">
          <MapView 
            interactive={true}
            height="320px"
            zoom={7}
            center={[24.3, 89.8]} 
            routePos={[[24.8480, 89.3730], [24.4, 89.6], [23.8103, 90.4125]]} // Bogra to Dhaka route line
            locations={[
              { id: 'origin', lat: 24.8480, lng: 89.3730, title: 'Bogra Origin Farm', color: '#22c55e' },
              { id: 'truck', lat: 24.4, lng: 89.6, title: 'En Route (Live GPS)', color: '#3b82f6' },
              { id: 'dest', lat: 23.8103, lng: 90.4125, title: 'Dhaka Destination', color: '#ef4444' },
            ]}
          />
          <div className="absolute top-4 left-4 z-[400]">
            <div className="glass-panel px-4 py-2 text-xs font-semibold bg-background/95 text-blue-600 flex items-center gap-2 rounded-xl shadow-lg border-blue-200">
              <Truck className="h-4 w-4 shrink-0" /> Live GPS Escrow Tracking Active
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Timeline */}
          <Card className="glass-panel hover-lift glass-panel">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-black">Transaction timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {escrowSteps.map((step, i) => (
                  <div key={step.id} className="flex gap-4">
                    {/* Line + Icon */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 z-10",
                        step.status === "done" ? "border-primary bg-primary text-primary-foreground"
                          : step.status === "active" ? "border-secondary bg-secondary/20 text-secondary-foreground animate-pulse"
                          : "border-border bg-muted text-muted-foreground"
                      )}>
                        {step.status === "done" ? <CheckCircle2 className="h-4 w-4" />
                          : step.status === "active" ? <Clock className="h-4 w-4" />
                          : <span className="text-xs font-bold">{step.id}</span>}
                      </div>
                      {i < escrowSteps.length - 1 && (
                        <div className={cn("w-0.5 flex-1 my-1 min-h-[2.5rem]", step.status === "done" ? "bg-primary" : "bg-border")} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-bold text-sm", step.status === "pending" ? "text-muted-foreground" : "text-foreground")}>
                          {step.label}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">{step.time}</span>
                      </div>
                      <p className={cn("text-xs mt-0.5 leading-5", step.status === "pending" ? "text-muted-foreground/70" : "text-muted-foreground")}>
                        {step.detail}
                      </p>
                      {step.status === "active" && (
                        <Badge className="mt-2 bg-amber-100 text-amber-700 border-amber-200 rounded-full text-xs gap-1 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                          <Clock className="h-3 w-3" />In progress
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Panel */}
          <div className="space-y-5">
            {/* bKash Manual Escrow Deposit Card for Buyers */}
            {userRole === "buyer" && id && (
              <BkashEscrowPaymentCard
                orderId={id}
                totalAmount={order?.total_price || 3816}
                onPaymentSubmitted={() => {
                  if (id) {
                    supabase.from('orders').select('*').eq('id', id).single().then(({ data, error }) => {
                      if (error) console.error("Failed to fetch updated order:", error);
                      if (data) setOrder(data);
                    });
                  }
                }}
              />
            )}

            {/* 3PL Freight Logistics */}
            <LogisticsTracker
              orderId={id && id !== "demo" ? id : "00000000-0000-4000-8000-000000000001"}
              isFarmerOrAdmin={userRole === "farmer" || userRole === "admin"}
            />

            {/* QR Scan */}
            <Card className="glass-panel hover-lift glass-panel">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Delivery confirmation</p>
                  <h2 className="text-gradient-primary text-xl font-black">Scan to release funds</h2>
                  <p className="text-sm text-muted-foreground">When your delivery arrives, scan the farmer's QR code to release funds from escrow.</p>
                </div>
                {userRole === "buyer" ? (
                  <>
                    <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/50 p-8">
                      <div className="text-center space-y-3 text-muted-foreground">
                        <QrCode className="h-16 w-16 mx-auto" />
                        <p className="text-sm font-medium">Camera access required</p>
                        <p className="text-xs">Enable when delivery arrives</p>
                      </div>
                    </div>
                    <Button className="hover-lift w-full h-11 rounded-xl gap-2" disabled>
                      <QrCode className="h-4 w-4" />
                      Scan delivery QR code
                    </Button>
                  </>
                ) : userRole === "admin" ? (
                  <Button variant="destructive" className="hover-lift w-full h-11 rounded-xl gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Force Release Escrow (Admin)
                  </Button>
                ) : (
                  <>
                    <div className="flex items-center justify-center rounded-2xl border-2 border-border bg-white p-8">
                      <div className="text-center space-y-3 text-black">
                        <QrCode className="h-32 w-32 mx-auto" />
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">Show this QR code to the buyer upon delivery to release your funds.</p>
                  </>
                )}
                <p className="text-xs text-center text-muted-foreground font-semibold mt-2">Delivery expected: March 19, 2026</p>
              </CardContent>
            </Card>

            {/* Price Breakdown */}
            <Card className="glass-panel hover-lift glass-panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-black">Payment breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-border/60 bg-background/70 divide-y divide-border/60 overflow-hidden text-sm">
                  {[
                    { label: <>Maize — 12t @ <CurrencyDisplay amount={318}/>/t</>, value: <CurrencyDisplay amount={3816} />, highlight: false },
                    { label: "Platform fee (3%)", value: <><span className="mr-0.5">-</span><CurrencyDisplay amount={114} /></>, highlight: false, negative: true },
                    { label: "Farmer receives", value: <CurrencyDisplay amount={3702} />, highlight: true },
                  ].map(({ label, value, highlight, negative }, idx) => (
                    <div key={idx} className={cn(
                      "flex justify-between px-4 py-3",
                      highlight && "bg-primary/5 font-bold text-primary"
                    )}>
                      <span className={negative ? "text-destructive" : ""}>{label}</span>
                      <span className={cn("font-semibold", negative && "text-destructive")}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl bg-primary/8 border border-primary/20 p-4 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-5">
                    Funds are locked in escrow. Neither party can access them until the QR delivery scan is complete.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button asChild variant="outline" className="hover-lift w-full rounded-xl gap-2">
              <Link to={userRole === "farmer" ? "/farmer" : userRole === "admin" ? "/admin" : "/buyer"}>
                <ArrowRight className="h-4 w-4" />
                Back to {userRole === "admin" ? "Platform control" : userRole === "farmer" ? "farmer" : "buyer"} dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowPage;
