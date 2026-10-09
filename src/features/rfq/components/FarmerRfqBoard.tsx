// Farmer view: browse open RFQs, bid (client pre-validated, server authoritative), see/withdraw own bids.
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useBids, useRfqs, useSubmitBid, useWithdrawBid } from "../hooks";
import { isRfqExpired, validateBid, type Rfq } from "../schemas";

function BidForm({ rfq }: { rfq: Rfq }) {
  const { toast } = useToast();
  const submit = useSubmitBid();
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = { price_per_ton: Number(price), qty_tons: Number(qty) };
    if (!(input.price_per_ton > 0 && input.qty_tons > 0)) return setError("Enter a price and quantity.");
    const problem = validateBid(rfq, input);
    setError(problem);
    if (problem) return;
    submit.mutate({ rfqId: rfq.id, input }, {
      onSuccess: () => toast({ title: "Bid submitted" }),
      onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2" aria-label={`Bid on ${rfq.crop_type}`}>
      <Input aria-label="Your price per ton" type="number" min={0} className="w-36" placeholder="Price / ton" value={price} onChange={(e) => setPrice(e.target.value)} />
      <Input aria-label="Your quantity in tons" type="number" min={0} className="w-36" placeholder="Qty (tons)" value={qty} onChange={(e) => setQty(e.target.value)} />
      <Button type="submit" size="sm" disabled={submit.isPending}>{submit.isPending ? "Sending…" : "Place bid"}</Button>
      {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}

export function FarmerRfqBoard({ userId }: { userId: string }) {
  const { toast } = useToast();
  const rfqs = useRfqs();
  const bids = useBids();
  const withdraw = useWithdrawBid();
  const myBids = (bids.data ?? []).filter((b) => b.farmer_id === userId);
  const open = (rfqs.data ?? []).filter((r) => r.status === "OPEN" && !isRfqExpired(r));

  return (
    <section aria-label="Open requests for quotes" data-testid="farmer-rfq" className="space-y-4">
      {rfqs.isLoading && <p className="text-sm text-muted-foreground">Loading requests…</p>}
      {rfqs.isError && <p role="alert" className="text-sm text-destructive">{(rfqs.error as Error).message}</p>}
      {rfqs.isSuccess && open.length === 0 && <p data-testid="farmer-rfq-empty" className="text-sm text-muted-foreground">No open requests right now.</p>}
      {open.map((r) => {
        const mine = myBids.find((b) => b.rfq_id === r.id);
        return (
          <Card key={r.id}>
            <CardContent className="space-y-3 p-4">
              <p className="font-semibold">{r.crop_type} · {r.qty_tons} t · max {r.max_price_per_ton}/t</p>
              <p className="text-xs text-muted-foreground">Closes <time dateTime={r.deadline}>{new Date(r.deadline).toLocaleString()}</time>{r.notes ? ` · ${r.notes}` : ""}</p>
              {mine ? (
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="secondary">{mine.status}</Badge>
                  <span>Your bid: {mine.price_per_ton}/t · {mine.qty_tons} t</span>
                  {mine.status === "PENDING" && (
                    <Button size="sm" variant="ghost" disabled={withdraw.isPending}
                      onClick={() => withdraw.mutate(mine.id, { onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }) })}>
                      Withdraw
                    </Button>
                  )}
                </div>
              ) : <BidForm rfq={r} />}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
