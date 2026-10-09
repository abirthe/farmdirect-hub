// Buyer/farmer view: open a dispute on an eligible order, follow status, add evidence.
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useDisputes, useEligibleOrders, useEvidence, useOpenDispute } from "../hooks";
import { REASONS, REASON_LABELS, isOpen, openDisputeInput, outcomeLabel, sortDisputes } from "../schemas";
import { EvidenceThread } from "./EvidenceThread";

const empty = { order_id: "", reason: "WEIGHT_MISMATCH", description: "" };

export function MyDisputesPanel() {
  const { toast } = useToast();
  const disputes = useDisputes();
  const evidence = useEvidence();
  const orders = useEligibleOrders();
  const open = useOpenDispute();
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = openDisputeInput.safeParse(form);
    if (!parsed.success) return setFormError(parsed.error.issues[0].message);
    setFormError(null);
    open.mutate(parsed.data, {
      onSuccess: () => { setForm(empty); toast({ title: "Dispute opened", description: "Funds are on hold until an admin resolves it." }); },
      onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
    });
  };
  const list = sortDisputes(disputes.data ?? []);

  return (
    <section aria-label="My disputes" data-testid="my-disputes" className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border p-4" aria-label="Open a dispute">
        <select aria-label="Order" className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })}>
          <option value="">{(orders.data ?? []).length ? "Choose an order…" : "No orders eligible for a dispute"}</option>
          {(orders.data ?? []).map((o) => <option key={o.id} value={o.id}>{o.id.slice(0, 8)} · {o.status} · {o.total_price}</option>)}
        </select>
        <select aria-label="Reason" className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
          {REASONS.map((r) => <option key={r} value={r}>{REASON_LABELS[r]}</option>)}
        </select>
        <Textarea aria-label="Description" placeholder="Describe what went wrong…" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} />
        {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        <Button id="open-dispute" type="submit" disabled={open.isPending}>{open.isPending ? "Opening…" : "Open dispute"}</Button>
      </form>

      {disputes.isLoading && <p className="text-sm text-muted-foreground">Loading disputes…</p>}
      {disputes.isError && <p role="alert" className="text-sm text-destructive">{(disputes.error as Error).message}</p>}
      {disputes.isSuccess && list.length === 0 && <p data-testid="my-disputes-empty" className="text-sm text-muted-foreground">You have no disputes.</p>}
      {list.map((d) => (
        <Card key={d.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{REASON_LABELS[d.reason]} · order {d.order_id.slice(0, 8)}</p>
              <Badge variant={isOpen(d) ? "secondary" : "outline"}>{outcomeLabel(d.status)}</Badge>
            </div>
            <p className="text-sm">{d.description}</p>
            {d.resolution_note && <p className="text-sm text-muted-foreground">Admin note: {d.resolution_note}</p>}
            <EvidenceThread disputeId={d.id} canAdd={isOpen(d)} items={(evidence.data ?? []).filter((e) => e.dispute_id === d.id)} />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
