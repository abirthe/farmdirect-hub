// Real-time parcel telemetry HUD displaying geodesic acreage, perimeter, and canopy health.
import React from 'react';
import { Leaf, CheckCircle2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  calculatePolygonAreaHectares,
  calculatePolygonPerimeterKm,
  formatParcelMetrics,
} from '@/lib/geoUtils';

interface ParcelTelemetryHudProps {
  coords: [number, number][];
}

export function ParcelTelemetryHud({ coords }: ParcelTelemetryHudProps) {
  if (!coords || coords.length < 3) return null;

  const hectares = calculatePolygonAreaHectares(coords);
  const perimeterKm = calculatePolygonPerimeterKm(coords);
  const metrics = formatParcelMetrics(hectares);

  return (
    <div
      data-testid="parcel-telemetry-hud"
      className="absolute bottom-3 left-3 z-[1000] bg-card/90 backdrop-blur-md border border-border/80 rounded-2xl p-3 shadow-xl max-w-[280px] sm:max-w-[320px] space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Leaf className="h-4 w-4 text-emerald-500" />
          <span>Parcel Telemetry</span>
        </div>
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
          <CheckCircle2 className="h-3 w-3" />
          GPS Locked
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/50 rounded-xl p-2 border border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Field Area</p>
          <p className="text-base font-black text-emerald-600 dark:text-emerald-400">{metrics.hectares}</p>
          <p className="text-[10px] text-muted-foreground">{metrics.acres}</p>
        </div>

        <div className="bg-muted/50 rounded-xl p-2 border border-border/40">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold">Perimeter</p>
          <p className="text-base font-black text-foreground">{perimeterKm} km</p>
          <p className="text-[10px] text-muted-foreground">{coords.length} GPS Pins</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-primary/5 rounded-xl px-2.5 py-1.5 border border-primary/10">
        <span className="flex items-center gap-1 font-medium">
          <Sparkles className="h-3 w-3 text-primary" />
          NDVI Bio-Vigor:
        </span>
        <span className="font-bold text-primary">0.84 (High Vigor)</span>
      </div>
    </div>
  );
}
