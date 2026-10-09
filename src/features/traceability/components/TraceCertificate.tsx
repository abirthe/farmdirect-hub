// Consumer-facing digital provenance certificate.
import { ShieldCheck, MapPin, Sprout, Leaf, Calendar, Award, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateFreshnessScore, getTrustBadges, type PublicTrace } from "../schemas";

export function TraceCertificate({ trace }: { trace: PublicTrace }) {
  const freshness = calculateFreshnessScore(trace.harvest_date || trace.delivered_at);
  const badges = getTrustBadges(trace);

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-xl" data-testid="trace-certificate">
      <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge variant="outline" className="gap-1 border-primary text-primary font-mono text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Batch Provenance
          </Badge>
          <span className="font-mono text-xs text-muted-foreground">
            Hash: {trace.qr_delivery_hash.slice(0, 12)}…
          </span>
        </div>
        <CardTitle className="pt-2 text-2xl font-black tracking-tight">
          {trace.crop_type} ({trace.quality_grade})
        </CardTitle>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          {trace.farm.name} · {trace.farm.location}
        </p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Freshness & Origin Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sprout className="h-3.5 w-3.5" /> Freshness
            </span>
            <p className="font-bold text-sm">{freshness.score}%</p>
            <p className="text-[10px] text-primary">{freshness.label}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Harvest Date
            </span>
            <p className="font-bold text-sm">{trace.harvest_date || "Seasonal"}</p>
            <p className="text-[10px] text-muted-foreground">{trace.quantity_tons} Tons Batch</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Leaf className="h-3.5 w-3.5" /> Satellite NDVI
            </span>
            <p className="font-bold text-sm">{trace.environmental.avg_ndvi}</p>
            <p className="text-[10px] text-emerald-600 font-medium">Optimal Vigor</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Award className="h-3.5 w-3.5" /> Carbon Offset
            </span>
            <p className="font-bold text-sm">-{trace.environmental.carbon_offset_kg} kg</p>
            <p className="text-[10px] text-muted-foreground">Direct Route</p>
          </div>
        </div>

        {/* Farmer & Field Verification */}
        <div className="rounded-xl border p-4 space-y-3">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Grower Authenticity Profile
          </h4>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs block">Registered Producer:</span>
              <span className="font-semibold">{trace.farm.farmer_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs block">Cultivated Land:</span>
              <span className="font-semibold">{trace.farm.hectares ? `${trace.farm.hectares} Hectares` : "Verified Geo-Boundary"}</span>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          {badges.map((b) => (
            <Badge key={b} variant="secondary" className="text-xs py-1 px-2.5 rounded-full">
              ✓ {b}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
