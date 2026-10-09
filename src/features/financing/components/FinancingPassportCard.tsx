// Display card for an agricultural credit & parametric insurance underwriting passport.
import { Landmark, ShieldAlert, CheckCircle2, Copy, FileText, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { TIER_CONFIG, getParametricPayoutTrigger, type UnderwritingPassport } from "../schemas";

export function FinancingPassportCard({ passport }: { passport: UnderwritingPassport }) {
  const { toast } = useToast();
  const tier = TIER_CONFIG[passport.risk_tier];
  const trigger = getParametricPayoutTrigger(passport.weather_hazard_index);

  const onCopyHash = () => {
    navigator.clipboard?.writeText(passport.passport_hash);
    toast({ title: "Passport Hash Copied", description: "Cryptographic underwriting hash copied to clipboard." });
  };

  return (
    <Card className="border-2 shadow-md hover:shadow-lg transition-shadow" data-testid="passport-card">
      <CardHeader className="bg-muted/30 pb-3 border-b flex flex-row items-center justify-between">
        <div>
          <span className="text-xs font-mono text-muted-foreground block">
            Passport ID: {passport.id.slice(0, 8)}…
          </span>
          <CardTitle className="text-xl font-black flex items-center gap-2 pt-1">
            <Landmark className="h-5 w-5 text-primary" />
            Underwriting Grade: {passport.risk_tier}
          </CardTitle>
        </div>
        <div className="text-right">
          <Badge className={`text-sm font-mono font-bold px-3 py-1 ${tier.color}`} variant="outline">
            {passport.credit_score} / 850
          </Badge>
          <span className="text-[10px] text-muted-foreground block pt-0.5">{tier.label}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* Core Financial Offerings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
            <span className="text-xs font-semibold text-primary block">Pre-Harvest Advance Limit</span>
            <p className="text-2xl font-black">
              <CurrencyDisplay amount={passport.max_eligible_credit} />
            </p>
            <p className="text-[11px] text-muted-foreground">Estimated APR: {tier.interestRateApr}</p>
          </div>

          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-1">
            <span className="text-xs font-semibold text-blue-600 block">Parametric Coverage Cap</span>
            <p className="text-2xl font-black text-foreground">
              <CurrencyDisplay amount={passport.parametric_coverage} />
            </p>
            <p className="text-[11px] text-muted-foreground">Zero-inspection claims processing</p>
          </div>
        </div>

        {/* Agricultural Risk Indicators */}
        <div className="rounded-lg bg-muted/40 p-3 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500" /> NDVI Stability Index
            </span>
            <span className="font-mono font-bold">{passport.ndvi_stability_index} / 1.000</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Weather Hazard Factor
            </span>
            <span className="font-mono font-bold">{passport.weather_hazard_index} / 1.000</span>
          </div>
          <div className="pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
            {trigger}
          </div>
        </div>

        {/* Cryptographic Seal & Export */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
          <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[240px]">
            SHA256: {passport.passport_hash.slice(0, 16)}…
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onCopyHash}>
              <Copy className="h-3.5 w-3.5" /> Copy Seal
            </Button>
            <Button size="sm" className="gap-1.5 text-xs" onClick={() => toast({ title: "Underwriting Passport Exported", description: "Bank-ready underwriting dossier generated." })}>
              <FileText className="h-3.5 w-3.5" /> Export Dossier
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
