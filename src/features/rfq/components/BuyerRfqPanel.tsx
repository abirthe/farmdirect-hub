// Buyer view: post an RFQ, review ranked bids, accept one or cancel the request.
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAwardBid, useBids, useCancelRfq, useCreateRfq, useRfqs } from "../hooks";
import { createRfqInput, isRfqExpired, rankBids } from "../schemas";

const empty = { crop_type: "", qty_tons: "", max_price_per_ton: "", deadline: "", notes: "" };

export function BuyerRfqPanel({ userId }: { userId: string }) {
  const { toast } = useToast();
  const rfqs = useRfqs();
  const bids = useBids();
  const create = useCreateRfq();
  const award = useAwardBid();
  const cancel = useCancelRfq();
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState<string | null>(null);

  const onError = (e: unknown) => toast({ title: (e as Error).message, variant: "destructive" });
  const mine = (rfqs.data ?? []).filter((r) => r.buyer_id === userId);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = createRfqInput.safeParse(form);
    if (!parsed.success) return setFormError(parsed.error.issues[0].message);
    setFormError(null);
    create.mutate(parsed.data, { onSuccess: () => { setForm(empty); toast({ title: "Request posted" }); }, onError });
  };
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <section aria-label="My requests for quotes" data-testid="buyer-rfq" className="space-y-6">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2" aria-label="New request for quote">
        <Input aria-label="Crop" placeholder="Crop (e.g. Boro Rice)" value={form.crop_type} onChange={set("crop_type")} />
        <Input aria-label="Quantity in tons" type="number" min={0} placeholder="Quantity (tons)" value={form.qty_tons} onChange={set("qty_tons")} />
        <Input aria-label="Maximum price per ton" type="number" min={0} placeholder="Max price / ton" value={form.max_price_per_ton} onChange={set("max_price_per_ton")} />
        <Input aria-label="Deadline" type="datetime-local" value={form.deadline} onChange={set("deadline")} />
        <Input aria-label="Notes" className="sm:col-span-2" placeholder="Notes (grade, delivery location…)" value={form.notes} onChange={set("notes")} />
        {formError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{formError}</p>}
        <Button id="post-rfq" type="submit" disabled={create.isPending} className="hover-lift sm:col-span-2">
          {create.isPending ? "Posting…" : "Post request"}
        </Button>
      </form>

      {rfqs.isLoading && <p className="text-sm text-muted-foreground">Loading requests…</p>}
      {rfqs.isError && <p role="alert" className="text-sm text-destructive">{(rfqs.error as Error).message}</p>}
      {rfqs.isSuccess && mine.length === 0 && <p data-testid="buyer-rfq-empty" className="text-sm text-muted-foreground">You have not posted any requests yet.</p>}

      {mine.map((r) => {
        const ranked = rankBids((bids.data ?? []).filter((b) => b.rfq_id === r.id));
        return (
          <Card className="glass-panel hover-lift" key={r.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{r.crop_type} · {r.qty_tons} t · max {r.max_price_per_ton}/t</p>
                <Badge variant={r.status === "OPEN" ? "secondary" : "outline"}>
                  {r.status === "OPEN" && isRfqExpired(r) ? "OPEN · past deadline" : r.status}
                </Badge>
              </div>
              {r.status === "OPEN" && ranked.length === 0 && <p className="text-sm text-muted-foreground">No bids yet.</p>}
              {r.status === "OPEN" && ranked.map((b, i) => (
                <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm">
                  <span>{i === 0 && <Badge className="mr-2">Best</Badge>}{b.price_per_ton}/t · {b.qty_tons} t{b.note ? ` · ${b.note}` : ""}</span>
                  <Button className="hover-lift" size="sm" disabled={award.isPending} onClick={() => award.mutate(b.id, { onSuccess: () => toast({ title: "Bid accepted" }), onError })}>
                    Accept
                  </Button>
                </div>
              ))}
              {r.status === "OPEN" && (
                <Button variant="ghost" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate(r.id, { onError })}>Cancel request</Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
