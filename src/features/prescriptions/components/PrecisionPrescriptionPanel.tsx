// Panel for AI precision agriculture prescriptions (irrigation, fertilization, pest/fungal control).
import { Droplets, FlaskConical, Shield, Leaf, Sparkles, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { usePrescriptions, useGeneratePrescriptions, useUpdatePrescriptionStatus } from "../hooks";
import { formatPrescriptionUrgency, formatPrescriptionCategory, type PrescriptionCategory } from "../schemas";

export function PrecisionPrescriptionPanel({ cycleId }: { cycleId: string }) {
  const { toast } = useToast();
  const prescriptions = usePrescriptions(cycleId);
  const generate = useGeneratePrescriptions();
  const updateStatus = useUpdatePrescriptionStatus(cycleId);

  const onGenerate = () => {
    generate.mutate(cycleId, {
      onSuccess: () => {
        toast({
          title: "Prescriptions Generated",
          description: "Micro-climate and soil sensor telemetry analyzed. New schedule generated.",
        });
      },
      onError: (err) => {
        toast({ title: (err as Error).message, variant: "destructive" });
      },
    });
  };

  const onStatusChange = (id: string, status: "APPLIED" | "SKIPPED") => {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast({
            title: status === "APPLIED" ? "Action Recorded" : "Action Skipped",
            description: `Prescription marked as ${status.toLowerCase()}.`,
          });
        },
        onError: (err) => {
          toast({ title: (err as Error).message, variant: "destructive" });
        },
      },
    );
  };

  const renderCategoryIcon = (category: PrescriptionCategory) => {
    switch (category) {
      case "IRRIGATION":
        return <Droplets className="h-4 w-4 text-blue-500" />;
      case "FERTILIZER_NPK":
        return <FlaskConical className="h-4 w-4 text-emerald-500" />;
      case "FUNGAL_PREVENTION":
        return <Shield className="h-4 w-4 text-amber-500" />;
      case "HARVEST_PREP":
      default:
        return <Leaf className="h-4 w-4 text-primary" />;
    }
  };

  const items = prescriptions.data ?? [];

  return (
    <Card className="glass-panel hover-lift glass-panel" data-testid="prescriptions-panel">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Precision Agronomy Prescriptions
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Automated microclimate and IoT sensor-driven schedules for irrigation, NPK fertilization, and crop defense.
          </p>
        </div>
        <Button size="sm"
          variant="outline"
          onClick={onGenerate}
          disabled={generate.isPending}
          className="hover-lift rounded-full gap-1.5 text-xs"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {generate.isPending ? "Analyzing Sensors..." : "Regenerate Prescriptions"}
        </Button>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {prescriptions.isLoading ? (
          <p className="text-xs text-muted-foreground py-6 text-center">Loading agronomic prescriptions...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-8 space-y-3" data-testid="prescriptions-empty">
            <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium">No prescriptions scheduled yet</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Run the precision agronomy engine to synthesize soil probe readings, canopy NDVI, and rainfall forecasts into an actionable schedule.
            </p>
            <Button size="sm"
              onClick={onGenerate}
              disabled={generate.isPending}
              className="hover-lift rounded-full gap-2 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Run Precision Engine
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((p) => {
              const urgency = formatPrescriptionUrgency(p.urgency);
              const cat = formatPrescriptionCategory(p.category);
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3 transition hover:border-primary/40"
                  data-testid={`prescription-item-${p.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-background border border-border/50">
                        {renderCategoryIcon(p.category)}
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {cat.label}
                        </span>
                        <h4 className="font-bold text-sm leading-tight">{p.action_title}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] font-semibold ${urgency.badgeClass}`}>
                        {urgency.label}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Clock className="h-3 w-3" /> Due {p.target_date}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs bg-background/50 rounded-lg p-3 border border-border/40">
                    <div>
                      <span className="font-semibold text-muted-foreground block text-[10px] uppercase tracking-wider">
                        Prescribed Dosage & Method
                      </span>
                      <p className="font-mono mt-0.5">{p.dosage_instruction}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-muted-foreground block text-[10px] uppercase tracking-wider">
                        Telemetry Rationale
                      </span>
                      <p className="text-muted-foreground mt-0.5">{p.rationale}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {p.status === "APPLIED" && (
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4" /> Applied on {new Date(p.applied_at || p.created_at).toLocaleDateString()}
                        </span>
                      )}
                      {p.status === "SKIPPED" && (
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <XCircle className="h-4 w-4" /> Skipped by Farmer
                        </span>
                      )}
                      {p.status === "SCHEDULED" && (
                        <span className="text-xs text-muted-foreground">Status: Awaiting field application</span>
                      )}
                    </div>

                    {p.status === "SCHEDULED" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onStatusChange(p.id, "SKIPPED")}
                          disabled={updateStatus.isPending}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Skip
                        </Button>
                        <Button size="sm"
                          onClick={() => onStatusChange(p.id, "APPLIED")}
                          disabled={updateStatus.isPending}
                          className="hover-lift h-8 text-xs rounded-full gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Applied
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
