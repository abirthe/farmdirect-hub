// Admin compliance and automated KYC/KYB identity & land title verification review queue.
import { useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, Search, Filter, Sparkles, FileText, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useKycQueue, useReviewKyc } from "../hooks";
import { formatKycStatus, formatDocumentType, type KycStatus, type AutomatedChecks } from "../schemas";

export function AdminKycQueue() {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const queueQuery = useKycQueue(filterStatus || undefined);
  const review = useReviewKyc();

  const onReview = (id: string, decision: "APPROVED" | "REJECTED") => {
    review.mutate(
      { id, decision },
      {
        onSuccess: () => {
          toast({
            title: decision === "APPROVED" ? "Credential Approved" : "Credential Rejected",
            description: `Verification status updated and logged to immutable audit trail.`,
          });
        },
        onError: (err) => {
          toast({ title: (err as Error).message, variant: "destructive" });
        },
      },
    );
  };

  const allItems = queueQuery.data ?? [];
  const filtered = allItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.full_name.toLowerCase().includes(q) ||
      item.document_number.toLowerCase().includes(q) ||
      item.issuing_authority.toLowerCase().includes(q)
    );
  });

  const pendingCount = allItems.filter((i) => i.status === "MANUAL_REVIEW" || i.status === "PENDING").length;

  return (
    <div className="space-y-4" data-testid="admin-kyc-queue">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {allItems.length} credentials in queue ({pendingCount} pending manual sign-off)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, doc #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs rounded-full w-48 sm:w-60"
              aria-label="Search KYC documents"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-full border border-border/60 bg-background px-3 text-xs"
            aria-label="Filter status"
          >
            <option value="">All Statuses</option>
            <option value="MANUAL_REVIEW">Manual Review</option>
            <option value="AUTO_VERIFIED">AI Auto-Verified</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Queue Listing */}
      {queueQuery.isLoading ? (
        <p className="text-xs text-muted-foreground py-8 text-center">Loading KYC verification queue...</p>
      ) : filtered.length === 0 ? (
        <Card className="glass-panel hover-lift p-8 text-center space-y-2">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium">No verification credentials found</p>
          <p className="text-xs text-muted-foreground">
            {filterStatus ? "Try selecting 'All Statuses' or clearing your search." : "The verification queue is clear."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const st = formatKycStatus(item.status);
            const docLabel = formatDocumentType(item.document_type);
            const checks = (typeof item.automated_checks === "object" && item.automated_checks !== null
              ? item.automated_checks
              : {}) as Partial<AutomatedChecks>;
            const flags = checks.rule_flags ?? [];

            return (
              <Card key={item.id} className="glass-panel hover-lift" data-testid={`kyc-item-${item.id}`}>
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-base">{item.full_name}</p>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {docLabel}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                        {item.document_number}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Issuing Authority: <span className="text-foreground font-medium">{item.issuing_authority}</span> · Submitted {new Date(item.created_at).toLocaleDateString()}
                    </p>

                    {/* AI Automated Rule Engine Diagnostics */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-1 bg-primary/10 text-primary font-bold px-2 py-0.5 rounded text-[10px]">
                        <Sparkles className="h-3 w-3" /> AI Confidence: {item.automated_score}%
                      </div>
                      {checks.format_valid ? (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> Format Validated
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3" /> Format Warning
                        </span>
                      )}
                      {checks.duplicate_check_passed && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> Registry Unique
                        </span>
                      )}
                      {checks.watchlist_cleared && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> AML Cleared
                        </span>
                      )}
                    </div>

                    {flags.length > 0 && (
                      <p className="text-[11px] text-amber-600 font-medium">
                        Rule Flags: {flags.join(", ")}
                      </p>
                    )}

                    {item.rejection_reason && (
                      <p className="text-[11px] text-red-500 font-medium">
                        Reason: {item.rejection_reason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className={`text-xs font-semibold rounded-full ${st.badgeClass}`}>
                      {item.status === "APPROVED" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {item.status === "AUTO_VERIFIED" && <Sparkles className="h-3 w-3 mr-1" />}
                      {item.status === "REJECTED" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {st.label}
                    </Badge>

                    {!st.isTerminal && (
                      <div className="flex items-center gap-2">
                        <Button size="sm"
                          className="hover-lift rounded-full h-8 gap-1 text-xs"
                          onClick={() => onReview(item.id, "APPROVED")}
                          disabled={review.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm"
                          variant="outline"
                          className="hover-lift rounded-full h-8 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => onReview(item.id, "REJECTED")}
                          disabled={review.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
