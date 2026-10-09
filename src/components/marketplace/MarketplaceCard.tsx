// Presentational card component for individual marketplace crop listings.
import { Link } from "react-router-dom";
import { ShieldCheck, MapPin, Star, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/ui/currency-display";

export interface MarketplaceListingItem {
  id: string;
  crop: string;
  emoji: string;
  farmName: string;
  farmer: string;
  location: string;
  area: string;
  qty: string;
  floorPrice: number;
  status: string;
  statusType: string;
  ndvi: number;
  buyers: number;
  quality: string;
  verified: boolean;
  rating: number;
}

const statusColor: Record<string, string> = {
  ready: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
  upcoming: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  growing: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
};

export function MarketplaceCard({ listing }: { listing: MarketplaceListingItem }) {
  return (
    <Card className="soil-card overflow-hidden hover:-translate-y-1 transition-transform duration-300 group">
      <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-primary bg-size-200 group-hover:bg-pos-100 transition-all duration-500" />
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
              {listing.emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-black text-lg leading-none">{listing.crop}</p>
                {listing.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{listing.quality}</p>
            </div>
          </div>
          <Badge className={`${statusColor[listing.statusType] || "bg-muted text-muted-foreground"} rounded-full text-xs shrink-0`}>
            {listing.status}
          </Badge>
        </div>

        {/* Farm Info */}
        <div className="space-y-1">
          <p className="font-semibold text-sm">{listing.farmName}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {listing.location}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{listing.rating} · {listing.farmer}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Area", value: listing.area },
            { label: "Quantity", value: listing.qty },
            { label: "NDVI", value: `${listing.ndvi}×` },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-border/60 bg-background/70 p-2 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em]">{m.label}</p>
              <p className="font-black text-sm mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            <p className="text-xs text-muted-foreground">Floor price</p>
            <p className="text-2xl font-black">
              <CurrencyDisplay amount={listing.floorPrice} />
              <span className="text-sm font-normal text-muted-foreground">/t</span>
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {listing.buyers} buyers interested
            </div>
          </div>
          <Button asChild size="sm" className="rounded-full gap-1.5 shrink-0">
            <Link to={`/marketplace/${listing.id}`}>
              View deal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
