// Farmer view: pre-sell part of a growing crop and manage own contracts.
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCancelContract, useContracts, useCreateContract, useMyCycles } from "../hooks";
import { contractValue, createForwardInput, remainingCapacityTons } from "../schemas";

const empty = { crop_cycle_id: "", qty_tons: "", price_per_ton: "", delivery_date: "" };

export function FarmerForwardPanel({ userId }: { userId: string }) {
  const { toast } = useToast();
  const contracts = useContracts();
  const cycles = useMyCycles(userId);
  const create = useCreateContract();
  const cancel = useCancelContract();
  const [form, setForm] = useState(empty);
  const [formError, setFormError] = useState<string | null>(null);

  const onError = (e: unknown) => toast({ title: (e as Error).message, variant: "destructive" });
  const all = contracts.data ?? [];
  const mine = all.filter((c) => c.farmer_id === userId);
  const selected = (cycles.data ?? []).find((c) => c.id === form.crop_cycle_id);
  const remaining = selected ? remainingCapacityTons(selected, all) : null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = createForwardInput.safeParse(form);
    if (!parsed.success) return setFormError(parsed.error.issues[0].message);
    if (remaining !== null && parsed.data.qty_tons > remaining) return setFormError(`Only ${remaining} t of expected yield remain.`);
    setFormError(null);
    create.mutate(parsed.data, { onSuccess: () => { setForm(empty); toast({ title: "Forward contract offered" }); }, onError });
  };

  return (
    <section aria-label="My forward contracts" data-testid="farmer-forward" className="space-y-6">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2" aria-label="New forward contract">
        <select aria-label="Crop" className="h-10 rounded-md border bg-background px-3 text-sm sm:col-span-2"
          value={form.crop_cycle_id} onChange={(e) => setForm({ ...form, crop_cycle_id: e.target.value })}>
          <option value="">Choose a growing crop…</option>
          {(cycles.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.crop_type}</option>)}
        </select>
        {remaining !== null && <p className="text-xs text-muted-foreground sm:col-span-2">Available to pre-sell: {remaining} t</p>}
        <Input aria-label="Quantity in tons" type="number" min={0} placeholder="Quantity (tons)" value={form.qty_tons} onChange={(e) => setForm({ ...form, qty_tons: e.target.value })} />
        <Input aria-label="Locked price per ton" type="number" min={0} placeholder="Locked price / ton" value={form.price_per_ton} onChange={(e) => setForm({ ...form, price_per_ton: e.target.value })} />
        <Input aria-label="Delivery date" type="date" className="sm:col-span-2" value={form.delivery_date} onChange={(e) => setForm({ ...form, delivery_date: e.target.value })} />
        {formError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{formError}</p>}
        <Button type="submit" id="offer-forward" disabled={create.isPending} className="sm:col-span-2">{create.isPending ? "Offering…" : "Offer contract"}</Button>
      </form>

      {contracts.isLoading && <p className="text-sm text-muted-foreground">Loading contracts…</p>}
      {contracts.isError && <p role="alert" className="text-sm text-destructive">{(contracts.error as Error).message}</p>}
      {contracts.isSuccess && mine.length === 0 && <p data-testid="farmer-forward-empty" className="text-sm text-muted-foreground">No forward contracts yet.</p>}
      {mine.map((c) => (
        <Card key={c.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <span>{c.qty_tons} t @ {c.price_per_ton}/t = {contractValue(c)} · delivery {c.delivery_date}</span>
            <span className="flex items-center gap-2">
              <Badge variant={c.status === "ACCEPTED" ? "secondary" : "outline"}>{c.status}</Badge>
              {c.status === "OFFERED" && <Button size="sm" variant="ghost" disabled={cancel.isPending} onClick={() => cancel.mutate(c.id, { onError })}>Cancel</Button>}
            </span>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
