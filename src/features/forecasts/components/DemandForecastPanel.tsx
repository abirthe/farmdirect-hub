// Demand forecast panel showing regional crop shortages, macroeconomic supply-demand trends, and price advisories.
import { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Compass, Filter, Sparkles, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { useRegionalForecasts } from "../hooks";
import { formatShortageRisk, formatDeficit } from "../schemas";

export function DemandForecastPanel() {
  const [regionFilter, setRegionFilter] = useState("");
  const [cropFilter, setCropFilter] = useState("");

  const forecastsQuery = useRegionalForecasts({
    region: regionFilter.trim() || undefined,
    cropType: cropFilter.trim() || undefined,
  });

  const list = forecastsQuery.data ?? [];
  const severeAlerts = list.filter((f) => f.shortage_risk === "SEVERE").length;
  const totalDemand = list.reduce((acc, f) => acc + f.projected_demand_tons, 0);
  const totalSupply = list.reduce((acc, f) => acc + f.projected_supply_tons, 0);
  const netBalance = totalSupply - totalDemand;

  return (
    <Card className="glass-panel hover-lift glass-panel" data-testid="demand-forecasts-panel">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Demand Forecasting & Regional Shortage Alerts
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Macroeconomic supply-demand trajectories and price projections to optimize bulk procurement timing.
          </p>
        </div>

        {/* Quick Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Filter by Region..."
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="pl-8 h-8 text-xs w-36"
              aria-label="Filter Region"
            />
          </div>
          <Input
            placeholder="Filter by Crop..."
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="h-8 text-xs w-32"
            aria-label="Filter Crop"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {/* Macro KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Monitored Demand
            </span>
            <p className="text-2xl font-black">{totalDemand.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">tons</span></p>
            <p className="text-[10px] text-muted-foreground">Aggregated regional commercial demand</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Net Supply Balance
            </span>
            <p className={`text-2xl font-black ${netBalance < 0 ? "text-red-500" : "text-emerald-500"}`}>
              {netBalance < 0 ? `-${Math.abs(netBalance).toLocaleString()}` : `+${netBalance.toLocaleString()}`} <span className="text-sm font-medium text-muted-foreground">tons</span>
            </p>
            <p className="text-[10px] text-muted-foreground">Regional production vs market requirement</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Critical Shortage Alerts
            </span>
            <p className="text-2xl font-black text-amber-500">{severeAlerts}</p>
            <p className="text-[10px] text-muted-foreground">Regions facing &gt;20% production deficit</p>
          </div>
        </div>

        {/* Forecast Cards */}
        {forecastsQuery.isLoading ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Loading regional forecasts...</p>
        ) : list.length === 0 ? (
          <div className="text-center py-8 space-y-2" data-testid="forecasts-empty">
            <Compass className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium">No shortage forecasts match your search</p>
            <p className="text-xs text-muted-foreground">Try clearing your region or crop filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((item) => {
              const risk = formatShortageRisk(item.shortage_risk);
              const deficit = formatDeficit(item.deficit_surplus_tons);
              const isSpike = item.price_trend_pct > 0;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/60 bg-card/70 p-4 space-y-4 hover:border-primary/40 transition"
                  data-testid={`forecast-card-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-primary" />
                        <h3 className="font-black text-base">
                          {item.region} · {item.crop_type}
                        </h3>
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {item.forecast_month} Forecast Window
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${risk.badgeClass}`}>
                      {risk.label}
                    </Badge>
                  </div>

                  {/* Quantitative Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-background/50 rounded-lg p-3 border border-border/40">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                        Supply vs Demand
                      </span>
                      <p className="font-mono mt-0.5">
                        {item.projected_supply_tons.toLocaleString()}t / {item.projected_demand_tons.toLocaleString()}t
                      </p>
                      <span className={`text-[11px] font-bold ${deficit.colorClass}`}>
                        {deficit.formatted}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                        Projected Benchmark
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono font-bold">
                          <CurrencyDisplay amount={item.projected_price_benchmark_usd} />/t
                        </span>
                        <span className={`text-[10px] font-bold flex items-center ${isSpike ? "text-red-500" : "text-emerald-500"}`}>
                          {isSpike ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {Math.abs(item.price_trend_pct)}%
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Confidence: {item.confidence_score}%
                      </span>
                    </div>
                  </div>

                  {/* Recommendation and Action */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-foreground">Procurement Strategy: </span>
                        <span>{item.recommended_action}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button asChild size="sm" variant="outline" className="hover-lift h-8 text-xs rounded-full gap-1">
                        <Link to="/rfq">
                          <Sparkles className="h-3.5 w-3.5 text-primary" /> Post RFQ
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="hover-lift h-8 text-xs rounded-full gap-1">
                        <Link to="/forward">Explore Forwards</Link>
                      </Button>
                    </div>
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
