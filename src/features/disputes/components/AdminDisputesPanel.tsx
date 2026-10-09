import { useState } from "react";
import { Sparkles, Bot, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useDisputes, useEvidence, useResolveDispute, useTriageDispute } from "../hooks";
import { REASON_LABELS, isOpen, outcomeLabel, resolveInput, sortDisputes, type Dispute } from "../schemas";
import { EvidenceThread } from "./EvidenceThread";

function ResolveBox({ dispute }: { dispute: Dispute }) {
  const { toast } = useToast();
  const resolve = useResolveDispute();
  const triage = useTriageDispute();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (outcome: "RESOLVED_RELEASE" | "RESOLVED_REFUND") => {
    const parsed = resolveInput.safeParse({ outcome, note });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError(null);
    resolve.mutate({ id: dispute.id, input: parsed.data }, {
      onSuccess: () => toast({ title: "Dispute resolved" }),
      onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }),
    });
  };

  const onRunTriage = () => {
    triage.mutate(dispute.id, {
      onSuccess: (res) => {
        toast({ title: "AI Triage Completed", description: `Recommended: ${res.recommendation} (${res.confidence}% confidence)` });
        setNote(`AI Triage Recommendation: ${res.rationale}`);
      },
      onError: (e) => toast({ title: (e as Error).message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs font-semibold"
          disabled={triage.isPending}
          onClick={onRunTriage}
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          {triage.isPending ? "Analyzing telemetry…" : "Run AI Telemetry Triage"}
        </Button>
      </div>

      {dispute.ai_triage && (
        <div data-testid="triage-report" className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
              <Bot className="h-4 w-4 text-primary" />
              AI Recommendation: {dispute.ai_triage.recommendation === "RESOLVED_RELEASE" ? "Release to Farmer" : "Refund Buyer"}
            </span>
            <Badge variant="secondary" className="font-mono text-xs">
              {dispute.ai_triage.confidence}% confidence
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{dispute.ai_triage.rationale}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {dispute.ai_triage.flags.map((flag) => (
              <Badge key={flag} variant="outline" className="text-[10px] font-mono">
                {flag}
              </Badge>
            ))}
            <span className="text-[10px] text-muted-foreground ml-auto self-center">
              NDVI: {dispute.ai_triage.metrics.avg_ndvi} · Fungal: {dispute.ai_triage.metrics.avg_fungal_risk}
            </span>
          </div>
        </div>
      )}

      <Textarea
        aria-label="Resolution note"
        placeholder="Resolution note (required, kept in the audit log)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={2000}
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" disabled={resolve.isPending} onClick={() => run("RESOLVED_RELEASE")}>
          Release to farmer
        </Button>
        <Button size="sm" variant="destructive" disabled={resolve.isPending} onClick={() => run("RESOLVED_REFUND")}>
          Refund buyer
        </Button>
      </div>
    </div>
  );
}

export function AdminDisputesPanel() {
  const disputes = useDisputes();
  const evidence = useEvidence();
  const list = sortDisputes(disputes.data ?? []);

  return (
    <section aria-label="Dispute resolution" data-testid="admin-disputes" className="space-y-3">
      {disputes.isLoading && <p className="text-sm text-muted-foreground">Loading disputes…</p>}
      {disputes.isError && <p role="alert" className="text-sm text-destructive">{(disputes.error as Error).message}</p>}
      {disputes.isSuccess && list.length === 0 && <p data-testid="admin-disputes-empty" className="text-sm text-muted-foreground">No disputes.</p>}
      {list.map((d) => (
        <Card key={d.id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{REASON_LABELS[d.reason]} · {d.orders?.total_price ?? "?"} on hold · order {d.order_id.slice(0, 8)}</p>
              <Badge variant={isOpen(d) ? "secondary" : "outline"}>{outcomeLabel(d.status)}</Badge>
            </div>
            <p className="text-sm">{d.description}</p>
            {d.resolution_note && <p className="text-sm text-muted-foreground">Note: {d.resolution_note}</p>}
            <EvidenceThread disputeId={d.id} canAdd={isOpen(d)} items={(evidence.data ?? []).filter((e) => e.dispute_id === d.id)} />
            {isOpen(d) && <ResolveBox dispute={d} />}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
