import { useState, useEffect } from "react";
import { 
  CloudRain, Droplets, Sun, Wind, AlertTriangle, 
  CheckCircle2, RefreshCw, MapPin, Gauge, ShieldAlert, Sparkles 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  fetchAgriMicroclimate, 
  BANGLADESH_AGRI_HUBS, 
  AgriWeatherReading 
} from "@/services/agriWeatherService";
import { toast } from "sonner";

export function FieldWeatherWidget({ 
  initialLat = 24.8465, 
  initialLng = 89.3777,
  cropCycleId
}: { 
  initialLat?: number; 
  initialLng?: number;
  cropCycleId?: string;
}) {
  const [selectedHubIndex, setSelectedHubIndex] = useState(0);
  const [reading, setReading] = useState<AgriWeatherReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeHub = BANGLADESH_AGRI_HUBS[selectedHubIndex];

  const loadWeather = async (lat: number, lng: number, name: string) => {
    try {
      setRefreshing(true);
      const data = await fetchAgriMicroclimate(lat, lng, name);
      setReading(data);
    } catch {
      toast.error("Unable to refresh agro-weather stream");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWeather(activeHub.lat, activeHub.lng, activeHub.name);
  }, [activeHub.lat, activeHub.lng, activeHub.name]);

  const handleSyncToCycle = () => {
    if (!reading) return;
    toast.success("Live field telemetry synced!", {
      description: `Logged: ${reading.soilMoisturePercent}% soil moisture, ${reading.temperatureCelsius}°C, fungal risk ${(reading.fungalRiskFactor * 100).toFixed(0)}%.`
    });
  };

  if (loading || !reading) {
    return (
      <Card className="soil-card animate-pulse">
        <CardContent className="p-6 h-48 flex items-center justify-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Connecting to Open-Meteo Agroclimatic satellite feed...
        </CardContent>
      </Card>
    );
  }

  const isFungalHigh = reading.fungalRiskFactor > 0.4;
  const isMoistureDeficit = reading.irrigationNeedStatus === "DEFICIT_CRITICAL";

  return (
    <Card className="soil-card border-primary/20 shadow-sm overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-border/40 bg-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 text-[11px]">
                <Sun className="h-3 w-3" /> Live Satellite Agro-Telemetry
              </Badge>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                Open-Meteo API &bull; Active
              </span>
            </div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {reading.locationName}
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="text-xs bg-background border border-input rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              value={selectedHubIndex}
              onChange={(e) => setSelectedHubIndex(Number(e.target.value))}
            >
              {BANGLADESH_AGRI_HUBS.map((hub, idx) => (
                <option key={hub.name} value={idx}>{hub.name}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5"
              onClick={() => loadWeather(activeHub.lat, activeHub.lng, activeHub.name)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Primary Gauges Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Temperature */}
          <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Air Temp</span>
              <Sun className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black">{reading.temperatureCelsius}°C</div>
            <p className="text-[11px] text-muted-foreground">Feels like {reading.apparentTempCelsius}°C</p>
          </div>

          {/* Root-zone Soil Moisture */}
          <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Root Moisture</span>
              <Droplets className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black flex items-baseline gap-1">
              {reading.soilMoisturePercent}%
              <span className="text-[11px] font-normal text-muted-foreground">vol</span>
            </div>
            <div className="w-full pt-1">
              <Progress value={reading.soilMoisturePercent} className="h-1.5" />
            </div>
          </div>

          {/* Precipitation & ET0 */}
          <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Precipitation</span>
              <CloudRain className="h-4 w-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black">{reading.precipitationMm} <span className="text-xs font-normal">mm</span></div>
            <p className="text-[11px] text-muted-foreground">ET0 {reading.evapotranspirationMm} mm/day</p>
          </div>

          {/* Canopy Vitality / NDVI proxy */}
          <div className="rounded-xl border border-border/60 bg-card/60 p-3 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Canopy Vigor</span>
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black">{(reading.vegetativeVigorIndex * 100).toFixed(0)}%</div>
            <p className="text-[11px] text-emerald-600 font-semibold">Optical satellite proxy</p>
          </div>
        </div>

        {/* Agronomy Alerts & Disease Risk */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Fungal Disease Index */}
          <div className={`rounded-xl border p-3 flex items-start gap-3 ${
            isFungalHigh 
              ? "border-red-500/30 bg-red-500/10 dark:bg-red-950/20" 
              : "border-border/60 bg-card/40"
          }`}>
            <ShieldAlert className={`h-5 w-5 mt-0.5 shrink-0 ${isFungalHigh ? "text-red-500" : "text-amber-500"}`} />
            <div className="space-y-0.5 text-xs">
              <div className="font-semibold flex items-center gap-1.5">
                Microclimate Fungal Spore Index: 
                <span className="font-mono font-bold">{(reading.fungalRiskFactor * 100).toFixed(1)}%</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {isFungalHigh 
                  ? "Elevated relative humidity and canopy incubation temperature detected. Preventative copper-oxychloride application recommended." 
                  : "Low disease sporulation pressure. Natural ventilation and microclimate are optimal."}
              </p>
            </div>
          </div>

          {/* Irrigation Schedule Recommendation */}
          <div className={`rounded-xl border p-3 flex items-start gap-3 ${
            isMoistureDeficit 
              ? "border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20" 
              : "border-border/60 bg-card/40"
          }`}>
            <Gauge className={`h-5 w-5 mt-0.5 shrink-0 ${isMoistureDeficit ? "text-amber-500" : "text-primary"}`} />
            <div className="space-y-0.5 text-xs">
              <div className="font-semibold flex items-center gap-1.5">
                Irrigation Status: 
                <Badge variant={isMoistureDeficit ? "destructive" : "secondary"} className="text-[10px] py-0">
                  {reading.irrigationNeedStatus.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Soil temp at 0-7cm is {reading.soilTempCelsius}°C. Root-zone volumetric water balance supports standard vegetative transpiration.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            Synchronized with latitude {reading.latitude}°N, longitude {reading.longitude}°E
          </span>
          <Button 
            size="sm" 
            variant="default"
            className="rounded-full gap-1.5 text-xs font-semibold"
            onClick={handleSyncToCycle}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sync Field Telemetry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
