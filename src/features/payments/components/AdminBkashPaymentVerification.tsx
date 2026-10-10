import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { CheckCircle2, XCircle, Clock, ShieldCheck, Phone, Hash, Loader2 } from "lucide-react";

interface PendingPaymentOrder {
  id: string;
  qty_purchased: number;
  total_price: number;
  status: string;
  bkash_sender_number: string | null;
  bkash_trx_id: string | null;
  payment_submitted_at: string | null;
  created_at: string;
  buyer_id: string;
  farmer_id: string;
}

export function AdminBkashPaymentVerification() {
  const [orders, setOrders] = useState<PendingPaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const fetchPendingPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("id, qty_purchased, total_price, status, bkash_sender_number, bkash_trx_id, payment_submitted_at, created_at, buyer_id, farmer_id")
      .eq("status", "PAYMENT_SUBMITTED")
      .order("payment_submitted_at", { ascending: false });

    if (!error && data) {
      setOrders(data as PendingPaymentOrder[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const handleVerify = async (orderId: string, approved: boolean) => {
    setProcessingId(orderId);
    try {
      const note = rejectNotes[orderId] || (approved ? "Payment verified via bKash statement" : "TrxID not found in statement");
      const { error } = await supabase.rpc("verify_bkash_payment", {
        p_order_id: orderId,
        p_approved: approved,
        p_note: note,
      });

      if (error) throw error;

      toast({
        title: approved ? "Escrow Locked" : "Payment Rejected",
        description: approved
          ? "bKash TrxID verified successfully. Order status moved to ESCROW_LOCKED."
          : "Order payment was marked invalid. Buyer notified to re-submit.",
      });

      fetchPendingPayments();
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: e.message || "Failed to execute payment state change.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className="glass-panel hover-lift glass-panel">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              bKash Escrow Payment Queue
            </CardTitle>
            <CardDescription>
              Designated platform payment recipient: <span className="font-mono font-bold text-foreground">01580382868</span> (bKash)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPendingPayments} disabled={loading} className="hover-lift rounded-full">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
            <p className="text-sm">Fetching pending bKash submissions...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground space-y-2">
            <CheckCircle2 className="h-10 w-10 mx-auto text-primary/40" />
            <p className="font-semibold text-foreground">No Pending bKash Verifications</p>
            <p className="text-xs">All buyer deposit transactions have been verified and processed into escrow.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="p-5 rounded-2xl border border-border/70 bg-background/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-primary">#ORD-{order.id.slice(0, 8).toUpperCase()}</span>
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Awaiting Admin Match
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submitted: {order.payment_submitted_at ? new Date(order.payment_submitted_at).toLocaleString() : "Just now"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Deposit Due</p>
                    <p className="text-xl font-black text-foreground">
                      <CurrencyDisplay amount={order.total_price} />
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 p-3.5 rounded-xl text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Buyer bKash Number</p>
                      <p className="font-mono font-bold text-foreground">{order.bkash_sender_number || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Submitted TrxID</p>
                      <p className="font-mono font-bold text-primary tracking-wider">{order.bkash_trx_id || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <Input
                    placeholder="Optional rejection reason / reconciliation note"
                    value={rejectNotes[order.id] || ""}
                    onChange={(e) => setRejectNotes((prev) => ({ ...prev, [order.id]: e.target.value }))}
                    className="h-10 text-xs rounded-xl"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <Button variant="outline"
                      size="sm"
                      className="hover-lift rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5 flex-1 sm:flex-initial"
                      disabled={processingId === order.id}
                      onClick={() => handleVerify(order.id, false)}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button variant="default"
                      size="sm"
                      className="hover-lift rounded-xl bg-green-600 hover:bg-green-700 text-white gap-1.5 flex-1 sm:flex-initial"
                      disabled={processingId === order.id}
                      onClick={() => handleVerify(order.id, true)}
                    >
                      {processingId === order.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Confirm & Lock Escrow
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
