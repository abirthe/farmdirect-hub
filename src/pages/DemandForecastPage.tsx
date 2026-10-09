// Page for buyer macroeconomic demand forecasts and regional shortage alerts.
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DemandForecastPanel } from "@/features/forecasts/components/DemandForecastPanel";

export default function DemandForecastPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5">
            <Link to="/buyer">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Macro Intelligence Hub
            </span>
          </div>
        </div>
      </div>

      <main className="container py-8 max-w-6xl space-y-6">
        <DemandForecastPanel />
      </main>
    </div>
  );
}
