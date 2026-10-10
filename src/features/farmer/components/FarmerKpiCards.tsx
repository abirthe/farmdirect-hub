// KPI cards row displaying aggregate hectare coverage, yield, pricing, and NDVI indicators.
import { Map, Sprout, TrendingUp, CloudSun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/ui/currency-display";

export function FarmerKpiCards() {
  const kpiData = [
    { label: "Total Area Mapped", value: "20.2 ha", sub: "2 active farms", icon: Map, trend: "+12%" },
    { label: "Total Expected Yield", value: "29.6 t", sub: "Combined output", icon: Sprout, trend: "+18%" },
    { label: "Best Floor Price", value: <><CurrencyDisplay amount={318} />/t</>, sub: "After logistics", icon: TrendingUp, trend: "+5%" },
    { label: "Avg NDVI Score", value: "1.05×", sub: "Above seasonal avg", icon: CloudSun, trend: "+8%" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="farmer-kpi-cards">
      {kpiData.map(({ label, value, sub, icon: Icon, trend }) => (
        <Card key={label} className="glass-panel hover-lift">
          <CardContent className="p-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">{label}</p>
              <p className="text-3xl font-black">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
            <div className="space-y-2 text-right">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ml-auto">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-green-600">{trend}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
