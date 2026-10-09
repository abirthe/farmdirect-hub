// Admin tab: view and edit volume-based platform fee tiers (local draft, saved via audited RPC).
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFeeTiers, useSaveFeeTiers } from "../hooks";
import { validateTiers, type FeeTier } from "../schemas";

export function FeeTiersPanel() {
  const { data, isLoading, isError, error } = useFeeTiers();
  const save = useSaveFeeTiers();
  const { toast } = useToast();
  const [draft, setDraft] = useState<FeeTier[]>([]);

  // Draft is an editable copy of server data, reset whenever the server value changes.
  useEffect(() => { if (data) setDraft(data); }, [data]);

  const problem = validateTiers(draft);
  const update = (i: number, patch: Partial<FeeTier>) =>
    setDraft((d) => d.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const onSave = () =>
    save.mutate(draft, {
      onSuccess: () => toast({ title: "Fee tiers updated" }),
      onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }),
    });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading fee tiers…</p>;
  if (isError) return <p role="alert" className="text-sm text-destructive">{(error as Error).message}</p>;

  return (
    <section aria-label="Platform fee tiers" data-testid="fee-panel" className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Fee rate applies by order total. The rate is frozen on each order when it is placed.
      </p>
      {draft.length === 0 && <p data-testid="fee-empty" className="text-sm">No tiers configured.</p>}
      {draft.map((t, i) => (
        <Card key={i}>
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <label className="text-sm">
              Orders from
              <Input
                aria-label={`Tier ${i + 1} minimum order total`}
                type="number" min={0} value={t.min_order_total}
                onChange={(e) => update(i, { min_order_total: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Fee (%)
              <Input
                aria-label={`Tier ${i + 1} fee percent`}
                type="number" min={0} max={20} step={0.01} value={t.rate_bps / 100}
                onChange={(e) => update(i, { rate_bps: Math.round(Number(e.target.value) * 100) })}
              />
            </label>
            <Button variant="ghost" onClick={() => setDraft((d) => d.filter((_, idx) => idx !== i))}>Remove</Button>
          </CardContent>
        </Card>
      ))}
      {problem && <p role="alert" className="text-sm text-destructive">{problem}</p>}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setDraft((d) => [...d, { min_order_total: 0, rate_bps: 300 }])}>
          Add tier
        </Button>
        <Button id="save-fee-tiers" onClick={onSave} disabled={!!problem || save.isPending}>
          {save.isPending ? "Saving…" : "Save tiers"}
        </Button>
      </div>
    </section>
  );
}
