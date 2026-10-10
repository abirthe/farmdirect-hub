import { Link } from "react-router-dom";
import {
  Leaf, MapPin, Users, Star, ShieldCheck, BadgeDollarSign,
  QrCode, AlertTriangle, CheckCircle2, ArrowRight
} from "lucide-react";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketplaceListing } from "../types";

interface ListingDealCardProps {
  listing: MarketplaceListing;
  userRole?: string;
  onRequestSample: () => void;
}

export function ListingDealCard({
  listing,
  userRole,
  onRequestSample,
}: ListingDealCardProps) {
  return (
    <Card className="glass-panel hover-lift glass-panel sticky top-24">
      <CardContent className="p-6 space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            Floor price (logistics deducted)
          </p>
          <p className="text-5xl font-black mt-1">
            <CurrencyDisplay amount={listing.floorPrice} />
            <span className="text-lg font-normal text-muted-foreground">/t</span>
          </p>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Retail benchmark</span>
              <span>
                <CurrencyDisplay amount={listing.retailPrice} />/t
              </span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>— Logistics cost</span>
              <span>
                -<CurrencyDisplay amount={listing.logisticsCost} />/t
              </span>
            </div>
            <div className="flex justify-between font-bold text-primary border-t border-border/60 pt-1">
              <span>Your floor price</span>
              <span>
                <CurrencyDisplay amount={listing.floorPrice} />/t
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/70 divide-y divide-border/60 overflow-hidden text-sm">
          {[
            { label: "Available quantity", value: listing.qty, icon: Leaf },
            { label: "Farm area", value: listing.area, icon: MapPin },
            { label: "Interested buyers", value: `${listing.buyers} active`, icon: Users },
            { label: "Quality grade", value: listing.quality, icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground flex-1">{label}</span>
              <span className="font-semibold">{value}</span>
            </div>
          ))}
        </div>

        {listing.escrowReady && (
          <div className="rounded-2xl bg-primary/8 border border-primary/20 p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-primary">Escrow protected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Funds held until QR delivery scan. Zero payment risk.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {userRole === "buyer" ? (
            <>
              <Button asChild className="hover-lift w-full h-12 rounded-xl gap-2">
                <Link to={`/escrow/${listing.id}`}>
                  <BadgeDollarSign className="h-5 w-5" />
                  Lock price in escrow
                </Link>
              </Button>
              <Button variant="outline"
                className="hover-lift w-full h-12 rounded-xl gap-2"
                onClick={onRequestSample}
              >
                <QrCode className="h-4 w-4" />
                Request quality sample
              </Button>
            </>
          ) : userRole === "admin" ? (
            <Button variant="destructive" className="hover-lift w-full h-12 rounded-xl gap-2">
              <AlertTriangle className="h-5 w-5" />
              Suspend Listing (Admin)
            </Button>
          ) : (
            <Button variant="secondary" className="hover-lift w-full h-12 rounded-xl gap-2" disabled>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Listing Active & Public
            </Button>
          )}
        </div>

        {/* Farmer info */}
        <div className="flex items-center gap-3 border-t border-border/60 pt-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-sm shrink-0">
            {listing.farmer.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{listing.farmer}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {listing.farmerRating} · {listing.farmerDeals} successful deals
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-full text-xs">
            <Link to="/farmer">
              View profile
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
