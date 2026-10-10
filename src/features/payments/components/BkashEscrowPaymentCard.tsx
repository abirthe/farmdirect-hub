import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { ShieldCheck, Smartphone, CheckCircle2, ArrowRight, Loader2, Copy, Check, Zap } from "lucide-react";

interface BkashEscrowPaymentModalProps {
  orderId: string;
  totalAmount: number;
  onPaymentSubmitted?: () => void;
}

const OFFICIAL_BKASH_NUMBER = "01580382868";

export function BkashEscrowPaymentCard({
  orderId,
  totalAmount,
  onPaymentSubmitted,
}: BkashEscrowPaymentModalProps) {
  const [senderPhone, setSenderPhone] = useState("");
  const [trxId, setTrxId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(OFFICIAL_BKASH_NUMBER);
    setCopied(true);
    toast({ title: "Copied!", description: "bKash number copied to clipboard." });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone || !trxId) {
      toast({ variant: "destructive", title: "Missing details", description: "Please provide both sender number and TrxID." });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("submit_bkash_payment", {
        p_order_id: orderId,
        p_sender_number: senderPhone,
        p_trx_id: trxId,
      });

      if (error) throw error;

      toast({
        title: "Deposit Submitted",
        description: "Your bKash transaction is being verified by platform administrators. Escrow will lock upon confirmation.",
      });

      onPaymentSubmitted?.();
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: e.message || "Failed to submit bKash TrxID.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="glass-panel hover-lift glass-panel border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
            <Smartphone className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg font-black">bKash Escrow Payment</CardTitle>
            <CardDescription className="text-xs">
              Secure buyer escrow protection with manual TrxID verification
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Step-by-Step Instruction Box */}
        <div className="rounded-2xl border border-border/80 bg-background/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Send Money To:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-base text-primary">{OFFICIAL_BKASH_NUMBER}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={handleCopyNumber}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
            <span>Amount to Send (Exact):</span>
            <span className="font-bold text-foreground text-sm">
              <CurrencyDisplay amount={totalAmount} />
            </span>
          </div>

          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside border-t border-border/50 pt-2">
            <li>Open your bKash app and choose <strong>Send Money</strong>.</li>
            <li>Enter <strong className="text-foreground">{OFFICIAL_BKASH_NUMBER}</strong> and exact amount.</li>
            <li>Use Order ID <strong className="text-foreground">#ORD-{orderId.slice(0, 8).toUpperCase()}</strong> in reference.</li>
            <li>Copy the <strong>Transaction ID (TrxID)</strong> and submit below.</li>
          </ol>
        </div>

        {/* Verification Submission Form */}
        <form onSubmit={handleSubmitPayment} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="senderPhone" className="text-xs font-semibold">Your bKash Account Number</Label>
            <Input
              id="senderPhone"
              placeholder="e.g. 01712345678"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              className="h-10 rounded-xl text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trxId" className="text-xs font-semibold">bKash Transaction ID (TrxID)</Label>
            <Input
              id="trxId"
              placeholder="e.g. BL489A7K92"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              className="h-10 rounded-xl text-xs font-mono uppercase"
              required
            />
          </div>

          <Button type="submit"
            disabled={submitting}
            className="hover-lift w-full h-11 rounded-xl bg-pink-600 hover:bg-pink-700 text-white gap-2 font-bold"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Submit TrxID to Lock Escrow
          </Button>

          {/* Instant Sandbox PGW Checkout Simulator */}
          <div className="pt-2 border-t border-border/40 text-center">
            <Button type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              className="hover-lift w-full text-xs gap-1.5 border-dashed border-pink-500/40 text-pink-600 dark:text-pink-400 hover:bg-pink-500/10"
              onClick={async () => {
                setSubmitting(true);
                try {
                  const demoTrx = `SIM${Math.random().toString(36).substring(2, 8).toUpperCase()}9`;
                  const { error } = await supabase.rpc("submit_bkash_payment", {
                    p_order_id: orderId,
                    p_sender_number: "01700000000",
                    p_trx_id: demoTrx,
                  });
                  if (error) throw error;
                  toast({
                    title: "bKash Sandbox Simulation",
                    description: `Simulated PGW payment verified with TrxID: ${demoTrx}`,
                  });
                  onPaymentSubmitted?.();
                } catch (err: unknown) {
                  const e = err as Error;
                  toast({
                    variant: "destructive",
                    title: "Simulation Failed",
                    description: e.message || "Could not execute simulated payment.",
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Instant Sandbox Checkout (1-Click Demo)
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
