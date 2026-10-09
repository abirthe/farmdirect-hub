// Commodity reports panel for monetized agricultural yield benchmarks and regional indices.
import { useState } from "react";
import { Download, Globe2, Sparkles, Building, BarChart2, Shield, Filter, FileSpreadsheet, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { useToast } from "@/hooks/use-toast";
import { useCommodityReports, useRegionalAggregatedIndex, useDownloadReport } from "../hooks";
import { formatReportType, formatAccessTier, type AccessTier, type CommodityReport, type ReportMetrics } from "../schemas";
import { getLiveCommodityQuotes, type CommodityMarketQuote } from "@/services/commodityPriceFeedService";
import { useEffect } from "react";

export function CommodityReportsPanel() {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [selectedCrop, setSelectedCrop] = useState<string>("");

  const reportsQuery = useCommodityReports(selectedTier || undefined);
  const regionalIndexQuery = useRegionalAggregatedIndex(selectedCrop || undefined);
  const download = useDownloadReport();

  const [marketQuotes, setMarketQuotes] = useState<CommodityMarketQuote[]>([]);

  useEffect(() => {
    getLiveCommodityQuotes().then(setMarketQuotes);
  }, []);

  const reports = reportsQuery.data ?? [];
  const indexItems = regionalIndexQuery.data ?? [];

  const onDownload = (report: CommodityReport) => {
    download.mutate(report.id, {
      onSuccess: (data) => {
        // Trigger client-side JSON/CSV export blob
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `${report.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-bundle.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        toast({
          title: "Report Bundle Exported",
          description: `Downloaded '${report.title}' intelligence bundle.`,
        });
      },
      onError: (err) => {
        toast({ title: (err as Error).message, variant: "destructive" });
      },
    });
  };

  const totalHectaresMonitored = reports.reduce((acc, r) => {
    const m = (typeof r.metrics === "object" && r.metrics !== null ? r.metrics : {}) as Partial<ReportMetrics>;
    return acc + Number(m.total_sample_hectares ?? 0);
  }, 0);

  return (
    <div className="space-y-8" data-testid="commodity-reports-panel">
      {/* Header Panel */}
      <Card className="glass-panel">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black flex items-center gap-2">
                <Globe2 className="h-6 w-6 text-primary" />
                Commodity Intelligence & Regional Aggregation Reports
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Anonymized macro yield forecasts, NDVI vegetation vigor indices, and regional supply calendars for commercial traders and policy institutions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                <Shield className="h-3.5 w-3.5 mr-1" /> PII-Scrubbed Anonymization
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Macro KPI Strip */}
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sampled Farmland Base
              </span>
              <p className="text-2xl font-black">
                {totalHectaresMonitored.toLocaleString()} <span className="text-sm font-medium text-muted-foreground">hectares</span>
              </p>
              <p className="text-[10px] text-muted-foreground">Aggregated across multi-district farmer cooperatives</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Published Macro Reports
              </span>
              <p className="text-2xl font-black text-primary">{reports.length}</p>
              <p className="text-[10px] text-muted-foreground">Institutional and trader intelligence packages</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Regional Index Clusters
              </span>
              <p className="text-2xl font-black text-emerald-500">{indexItems.length}</p>
              <p className="text-[10px] text-muted-foreground">Active supply aggregates updated daily</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Regional Commodity Aggregates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Live Regional Production Aggregates
            </h3>
            <p className="text-xs text-muted-foreground">
              Real-time anonymized supply index computed directly from active field crop cycles and satellite telemetry.
            </p>
          </div>
        </div>

        {regionalIndexQuery.isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-6">Loading regional commodity index...</p>
        ) : indexItems.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No regional supply clusters active yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {indexItems.map((item, idx) => (
              <Card key={`${item.region}-${item.crop_type}-${idx}`} className="soil-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">{item.region}</h4>
                    <p className="text-xs text-muted-foreground">{item.crop_type}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {item.active_cycles_count} cycles
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Mapped Area</span>
                    <p className="font-mono font-bold">{item.total_hectares} ha</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Expected Volume</span>
                    <p className="font-mono font-bold text-primary">{item.projected_volume_tons} tons</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Live Bangladesh Agricultural Market Spot Rates (DAM / Regional Mandis) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Live Wholesale Commodity Benchmarks (DAM / Regional Mandis)
            </h3>
            <p className="text-xs text-muted-foreground">
              Official wholesale rates calibrated against daily agricultural marketing bulletins.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {marketQuotes.map((q) => (
            <Card key={q.cropCode} className="p-3.5 border-border/70 bg-card/60">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs">{q.cropName}</h4>
                  <p className="text-[10px] text-muted-foreground">{q.primaryHub}</p>
                </div>
                <Badge variant={q.trend24h >= 0 ? "secondary" : "destructive"} className="text-[10px] px-1.5 py-0 font-mono">
                  {q.trend24h >= 0 ? `+${q.trend24h}%` : `${q.trend24h}%`}
                </Badge>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between border-t border-border/40 pt-2 text-xs">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase">Wholesale</span>
                  <p className="font-mono font-black text-sm">
                    <CurrencyDisplay amount={q.wholesalePriceBdtPerTon} />/ton
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-muted-foreground uppercase">Retail Avg</span>
                  <p className="font-mono font-semibold text-xs text-muted-foreground">
                    <CurrencyDisplay amount={q.retailPriceBdtPerKg} />/kg
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Catalog of Commercial Intelligence Reports */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Commercial & Institutional Report Catalog
            </h3>
            <p className="text-xs text-muted-foreground">
              Download complete multi-spectral analytics, ripening forecasts, and spot price volatility models.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="h-8 rounded-full border border-border/60 bg-background px-3 text-xs"
              aria-label="Filter Tier"
            >
              <option value="">All Access Tiers</option>
              <option value="PUBLIC_SUMMARY">Open Public Summary</option>
              <option value="PREMIUM_TRADER">Trader Premium</option>
              <option value="GOVERNMENT_INSTITUTIONAL">Government / Institutional</option>
            </select>
          </div>
        </div>

        {reportsQuery.isLoading ? (
          <p className="text-xs text-muted-foreground py-8 text-center">Loading intelligence reports...</p>
        ) : reports.length === 0 ? (
          <Card className="soil-card p-8 text-center space-y-2">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium">No reports found matching criteria</p>
            <p className="text-xs text-muted-foreground">Try selecting 'All Access Tiers'.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report) => {
              const typeMeta = formatReportType(report.report_type);
              const tierMeta = formatAccessTier(report.tier);
              const regions = Array.isArray(report.regions) ? report.regions : [];
              const metrics = (typeof report.metrics === "object" && report.metrics !== null
                ? report.metrics
                : {}) as Partial<ReportMetrics>;

              return (
                <Card key={report.id} className="soil-card flex flex-col justify-between" data-testid={`report-card-${report.id}`}>
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline" className={`text-[10px] font-bold ${tierMeta.badgeClass}`}>
                          {tierMeta.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${typeMeta.badgeClass}`}>
                          {typeMeta.label} · {report.period}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-base leading-snug">{report.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{report.summary}</p>
                    </div>

                    {/* Regional Coverage Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Covered Regions:</span>
                      {regions.map((reg) => (
                        <span key={reg} className="bg-background border border-border/50 text-[10px] px-2 py-0.5 rounded font-mono">
                          {reg}
                        </span>
                      ))}
                    </div>

                    {/* Quantitative Intelligence Metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-background/50 rounded-lg p-2.5 border border-border/40 text-center">
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Sample Area</span>
                        <p className="font-mono font-bold text-xs">
                          {Number(metrics.total_sample_hectares || 0).toLocaleString()} ha
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Avg Yield</span>
                        <p className="font-mono font-bold text-xs text-primary">
                          {metrics.avg_yield_tons_ha ?? 6.8} t/ha
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Mean NDVI</span>
                        <p className="font-mono font-bold text-xs text-emerald-600">
                          {metrics.mean_ndvi ?? 0.81}
                        </p>
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-5 pt-0 border-t border-border/40 flex items-center justify-between gap-3 mt-auto">
                    <div>
                      {report.price_usd === 0 ? (
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Free Access</span>
                      ) : (
                        <div className="flex items-center gap-1 text-sm font-black">
                          <CurrencyDisplay amount={report.price_usd} />
                          <span className="text-[10px] font-normal text-muted-foreground">/ license</span>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground">{report.download_count} total downloads</p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => onDownload(report)}
                      disabled={download.isPending}
                      className="rounded-full gap-1.5 text-xs h-8"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export Data Bundle
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
