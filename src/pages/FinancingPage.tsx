// Farmer dashboard for micro-financing and parametric insurance underwriting.
import { useState } from "react";
import { Landmark, ShieldPlus, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMyCycles } from "@/features/forward/hooks";
import { useUnderwritingPassports, useGeneratePassport } from "@/features/financing/hooks";
import { FinancingPassportCard } from "@/features/financing/components/FinancingPassportCard";

export default function FinancingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const cycles = useMyCycles(user?.id ?? "");
  const passports = useUnderwritingPassports();
  const generate = useGeneratePassport();
  const [selectedCycle, setSelectedCycle] = useState("");

  const onGenerate = () => {
    if (!selectedCycle) {
      toast({ title: "Please choose a crop cycle", variant: "destructive" });
      return;
    }
    generate.mutate(selectedCycle, {
      onSuccess: () => {
        toast({ title: "Underwriting Passport Generated", description: "Your agricultural credit score & insurance limits have been sealed." });
        setSelectedCycle("");
      },
      onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
    });
  };

  return (
    <main className="container max-w-4xl py-24 space-y-8" data-testid="financing-page">
      <title>Pre-Harvest Financing & Parametric Insurance | AgroDirect</title>
      <meta name="description" content="Access pre-harvest liquidity and automated climate insurance powered by verifiable crop intelligence." />

      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary text-sm font-semibold">
          <Landmark className="h-4 w-4" />
          <span>AgroDirect Capital & Risk Protection</span>
        </div>
        <h1 className="text-gradient-primary text-3xl font-black tracking-tight">Agricultural Credit & Parametric Insurance</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Convert satellite NDVI health, soil stability, and AI yield forecasts into bank-grade underwriting scores. Access low-interest pre-harvest advance loans and parametric climate insurance.
        </p>
      </header>

      {/* Passport Generator Box */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm space-y-4" aria-label="Generate Underwriting Passport">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h2 className="text-gradient-primary font-bold text-base">Generate Underwriting Passport</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Select an active growing crop to compile real-time telemetry into an underwriter dossier.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            aria-label="Select growing crop cycle"
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Choose an active growing crop cycle…</option>
            {(cycles.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.crop_type} · Est. Yield: {c.ai_predicted_yield_kg ? `${c.ai_predicted_yield_kg / 1000}t` : "Pending"}
              </option>
            ))}
          </select>
          <Button onClick={onGenerate}
            disabled={!selectedCycle || generate.isPending}
            className="hover-lift gap-2 shrink-0"
          >
            <ShieldPlus className="h-4 w-4" />
            {generate.isPending ? "Underwriting in progress…" : "Seal Credit Passport"}
          </Button>
        </div>
      </section>

      {/* Existing Passports */}
      <section className="space-y-4" aria-label="Sealed Passports">
        <h3 className="font-bold text-lg">Active Underwriting Dossiers</h3>

        {passports.isLoading && (
          <p className="text-sm text-muted-foreground animate-pulse">Loading underwriting dossiers…</p>
        )}

        {passports.isError && (
          <p role="alert" className="text-sm text-destructive">{(passports.error as Error).message}</p>
        )}

        {passports.isSuccess && (passports.data ?? []).length === 0 && (
          <div data-testid="financing-empty" className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground space-y-1">
            <p className="font-semibold">No Underwriting Passports Yet</p>
            <p className="text-xs">Select a growing crop cycle above to generate your first credit passport.</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {(passports.data ?? []).map((p) => (
            <FinancingPassportCard key={p.id} passport={p} />
          ))}
        </div>
      </section>
    </main>
  );
}
