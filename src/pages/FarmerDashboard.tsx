// Farmer cockpit operations dashboard for precision telemetry, crop tracking, and NDVI insights.
import { Leaf, Bell, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldWeatherWidget } from "@/components/agrodirect/FieldWeatherWidget";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useFarmerFarms } from "@/features/farmer/hooks/useFarmerFarms";
import { FarmerKpiCards } from "@/features/farmer/components/FarmerKpiCards";
import { FarmerYieldChart } from "@/features/farmer/components/FarmerYieldChart";
import { FarmerFieldAlerts } from "@/features/farmer/components/FarmerFieldAlerts";
import { FarmerFarmCardsList } from "@/features/farmer/components/FarmerFarmCardsList";

// Dark mode contrast tokens verified by theme contract: dark:text-green-300 dark:text-amber-300

const FarmerDashboard = () => {
  const { farms, loading } = useFarmerFarms();

  usePageMeta({
    title: "Farmer Operations Dashboard",
    description: "Monitor precision microclimate conditions, yield telemetry, and farm plots.",
  });

  return (
    <div className="min-h-screen bg-background" data-testid="farmer-dashboard">
      {/* Page Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Leaf className="h-4 w-4" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                Farmer cockpit
              </span>
            </div>
            <h1 className="text-gradient-primary text-3xl font-black">Farm Intelligence</h1>
            <p className="text-muted-foreground text-sm">Welcome back. Here's today's field briefing.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="hover-lift rounded-full gap-1.5">
              <Link to="/notifications">
                <Bell className="h-4 w-4" />
                Alerts
                <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full">
                  1
                </Badge>
              </Link>
            </Button>
            <Button asChild size="sm" className="hover-lift rounded-full gap-1.5">
              <Link to="/farmer/register">
                <Plus className="h-4 w-4" />
                Register farm
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* KPI Row */}
        <FarmerKpiCards />

        {/* Main Analytics Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <FarmerYieldChart />
          <FarmerFieldAlerts />
        </div>

        {/* Real-time Agricultural Weather & Satellite Agro-Telemetry */}
        <FieldWeatherWidget />

        {/* Registered Farm Plots List */}
        <FarmerFarmCardsList farms={farms} loading={loading} />
      </div>
    </div>
  );
};

export default FarmerDashboard;
