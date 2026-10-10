// Page for Data Monetization & Regional Commodity Aggregation Reports.
import { ArrowLeft, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CommodityReportsPanel } from "@/features/reports/components/CommodityReportsPanel";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function CommodityReportsPage() {
  usePageMeta({
    title: "Regional Commodity Intelligence",
    description: "Anonymized macro yield benchmarks, satellite NDVI vegetative vigor, and regional crop supply aggregates."
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            <h1 className="text-gradient-primary text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Regional Commodity Intelligence
            </h1>
          </div>
        </div>
      </div>

      <main className="container py-8 max-w-6xl space-y-6">
        <CommodityReportsPanel />
      </main>
    </div>
  );
}
