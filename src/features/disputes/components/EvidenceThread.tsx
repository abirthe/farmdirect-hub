// Shared evidence thread + add-evidence box used by participant and admin views.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAddEvidence } from "../hooks";
import type { Evidence } from "../schemas";

export function EvidenceThread({ disputeId, items, canAdd }: { disputeId: string; items: Evidence[]; canAdd: boolean }) {
  const { toast } = useToast();
  const add = useAddEvidence();
  const [body, setBody] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    add.mutate({ id: disputeId, body }, {
      onSuccess: () => setBody(""),
      onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-2" data-testid="evidence-thread">
      {items.length === 0 && <p className="text-xs text-muted-foreground">No evidence added yet.</p>}
      {items.map((e) => (
        <p key={e.id} className="rounded-md bg-muted/50 p-2 text-sm">
          {e.body} <time className="text-xs text-muted-foreground" dateTime={e.created_at}>{new Date(e.created_at).toLocaleString()}</time>
        </p>
      ))}
      {canAdd && (
        <form onSubmit={onSubmit} className="flex gap-2" aria-label="Add evidence">
          <Input aria-label="Evidence" placeholder="Add evidence or a comment…" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
          <Button className="hover-lift" type="submit" size="sm" disabled={add.isPending || !body.trim()}>Add</Button>
        </form>
      )}
    </div>
  );
}
