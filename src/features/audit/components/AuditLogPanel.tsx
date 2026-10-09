// Admin tab: tamper-evident audit trail with integrity badge, search, and loading/empty/error states.
import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuditChain, useAuditLog } from "../hooks";
import { filterAuditEntries, isCriticalAction } from "../schemas";

export function AuditLogPanel() {
  const [search, setSearch] = useState("");
  const log = useAuditLog();
  const chain = useAuditChain();
  const rows = useMemo(() => filterAuditEntries(log.data ?? [], { search }), [log.data, search]);

  return (
    <section aria-label="Audit log" data-testid="audit-panel" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          id="audit-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search action, entity or ID…"
          className="max-w-sm"
          aria-label="Search audit log"
        />
        {chain.data && (
          <Badge
            data-testid="audit-chain-status"
            variant={chain.data.ok ? "secondary" : "destructive"}
            className="gap-1.5"
          >
            {chain.data.ok ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
            {chain.data.ok ? `Chain intact · ${chain.data.checked} entries` : "Tampering detected"}
          </Badge>
        )}
      </div>

      {log.isLoading && <p className="text-sm text-muted-foreground">Loading audit log…</p>}
      {log.isError && (
        <p role="alert" className="text-sm text-destructive">{(log.error as Error).message}</p>
      )}
      {log.isSuccess && rows.length === 0 && (
        <p data-testid="audit-empty" className="text-sm text-muted-foreground">No audit entries found.</p>
      )}

      {rows.map((e) => (
        <Card key={e.id}>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 font-semibold">
                {isCriticalAction(e.action) && <AlertTriangle className="h-4 w-4 text-destructive" />}
                {e.action}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {e.entity} · {e.entity_id}
              </p>
            </div>
            <time className="shrink-0 text-xs text-muted-foreground" dateTime={e.created_at}>
              {new Date(e.created_at).toLocaleString()}
            </time>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
