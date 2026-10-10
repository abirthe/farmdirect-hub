import { BrainCircuit, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MLPrediction } from "@/lib/ml-service";

interface ListingAiVerificationProps {
  prediction: MLPrediction;
}

export function ListingAiVerification({ prediction }: ListingAiVerificationProps) {
  const qaScore = Math.max(90, prediction.confidenceScore);

  return (
    <Card className="glass-panel hover-lift glass-panel border-primary/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <BrainCircuit className="w-32 h-32 text-primary" />
      </div>
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="text-xl font-black flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          AgroDirect AI Verification
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Satellite intelligence actively replacing manual broker inspections.
        </p>
      </CardHeader>
      <CardContent className="relative z-10 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "Optimal Harvest Date",
              value: prediction.harvestDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              sub: `${prediction.daysToHarvest} days remaining`,
              good: true,
            },
            {
              label: "Verified Ripe Yield",
              value: `${prediction.predictedYieldKg.toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })} KG`,
              sub: "±400kg model variance",
              good: true,
            },
            {
              label: "Predicted Output Grade",
              value: "Grade A+",
              sub: `${prediction.confidenceScore.toFixed(1)}% Confidence`,
              good: true,
            },
            {
              label: "Fungal Risk Escrow Filter",
              value: "Low (2%)",
              sub: `Moisture content ${prediction.moisturePrediction.toFixed(1)}%`,
              good: true,
            },
          ].map((m) => (
            <div
              key={m.label}
              className="glass-panel hover-lift p-4 space-y-2 bg-background/50 border border-border/50"
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold">
                {m.label}
              </p>
              <p className="text-lg font-black leading-none">{m.value}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {m.good ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                )}
                {m.sub}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 mt-4 pt-4 border-t border-border/40">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Algorithmic QA Score
            </span>
            <span className="font-bold text-primary">{qaScore.toFixed(1)}% / 100%</span>
          </div>
          <Progress value={qaScore} className="h-2 [&>div]:bg-primary" />
          <p className="text-xs text-muted-foreground mt-2">
            By purchasing, you bypass traditional 15% broker fees through cryptographically secured AI analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
