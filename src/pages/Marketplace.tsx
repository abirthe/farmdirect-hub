import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search, SlidersHorizontal, MapPin, Clock, ShieldCheck, TrendingUp,
  Leaf, Star, CheckCircle2, ArrowRight, ChevronDown, Map, LayoutGrid
} from "lucide-react";
import MapView from "@/components/ui/map-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useMarketplaceListings } from "@/hooks/useMarketplaceListings";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";

const mockListings = [
  {
    id: "lst-001", crop: "Maize", emoji: "🌽",
    farmName: "Bogra Maize Cluster", farmer: "Rafiqul Islam", location: "Rajshahi Division, Bangladesh",
    lat: 24.8480, lng: 89.3730,
    area: "12.8 ha", qty: "18.4 t", floorPrice: 318,
    status: "Ready in 10 days", statusType: "upcoming", ndvi: 1.12, buyers: 26, quality: "Grade A", verified: true, rating: 4.8,
  },
  {
    id: "lst-002", crop: "Wheat", emoji: "🌾",
    farmName: "Rajshahi Wheat Block", farmer: "Rafiqul Islam", location: "Rajshahi Division, Bangladesh",
    lat: 24.3636, lng: 88.6241,
    area: "7.4 ha", qty: "11.2 t", floorPrice: 245,
    status: "Ready now", statusType: "ready", ndvi: 0.98, buyers: 14, quality: "Grade B+", verified: true, rating: 4.6,
  }
];

const statusColor: Record<string, string> = {
  ready: "bg-green-100 text-green-700 border-green-200",
  upcoming: "bg-amber-100 text-amber-700 border-amber-200",
  growing: "bg-blue-100 text-blue-700 border-blue-200",
};

const Marketplace = () => {
  const { data: dbListings = [], isLoading: loading } = useMarketplaceListings();
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const { session } = useAuth();
  const navigate = useNavigate();
  const userRole = session?.user?.user_metadata?.role;

  // Enforce Absolute POV Routing Isolation
  useEffect(() => {
    if (userRole === "farmer") {
      navigate("/farmer", { replace: true });
    }
  }, [userRole, navigate]);


  const getEmoji = (cropType: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: any = { maize: "🌽", wheat: "🌾", rice: "🍚", potato: "🪴", soybean: "🫘", groundnut: "🥜" };
    return map[cropType?.toLowerCase()] || "📦";
  };

  const dynamicListings = dbListings.length > 0 ? dbListings.map(d => ({
    id: d.id,
    crop: d.crop_cycles?.crop_type || "Unknown Crop",
    emoji: getEmoji(d.crop_cycles?.crop_type),
    farmName: d.crop_cycles?.farms?.farm_name || "Unknown Farm",
    farmer: d.crop_cycles?.farms?.users?.full_name || "Unknown Farmer",
    location: d.crop_cycles?.farms?.location_name || "Unverified Location",
    lat: 24.8480, lng: 89.3730, // Mocked lat/lng since boundary_coordinates is complex
    area: `${d.crop_cycles?.farms?.total_hectares || 0} ha`,
    qty: `${d.quantity_tons} t`,
    floorPrice: d.floor_price_per_ton,
    status: d.status === 'ACTIVE' ? "Ready now" : "Upcoming",
    statusType: d.status === 'ACTIVE' ? "ready" : "upcoming",
    ndvi: 1.0, buyers: 0, quality: d.quality_grade || "Pending", verified: true, rating: 5.0
  })) : mockListings; // Fallback to mocks if DB entirely empty to maintain design

  const filtered = dynamicListings.filter(l => {
    const matchSearch = l.crop.toLowerCase().includes(search.toLowerCase()) ||
      l.farmName.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase());
    const matchCrop = cropFilter === "all" || l.crop.toLowerCase() === cropFilter;
    const matchPrice = l.floorPrice >= priceRange[0] && l.floorPrice <= priceRange[1];
    return matchSearch && matchCrop && matchPrice;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative bg-primary overflow-hidden">
        <div className="field-grid absolute inset-0 opacity-10" />
        <div className="scan-line pointer-events-none absolute inset-y-0 left-0 w-1/2 motion-safe:animate-sweep" />
        <div className="container relative z-10 py-14 md:py-20">
          <div className="max-w-2xl space-y-4">
            <span className="eyebrow border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
              Live marketplace
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-primary-foreground leading-tight">
              Discover future-ready supply from verified farmers.
            </h1>
            <p className="text-primary-foreground/80 text-base leading-7">
              Browse quality-certified listings with transparent floor pricing, NDVI health scores, and escrow-protected transactions.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-lg">
            {[{ label: "Active listings", v: "148" }, { label: "Verified farmers", v: "312" }, { label: "Avg price uplift", v: "+27%" }].map(s => (
              <div key={s.label} className="glass-panel px-4 py-3 text-primary-foreground text-center">
                <p className="text-2xl font-black">{s.v}</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-primary-foreground/70 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search crop, farm, or location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-12 rounded-full border-border/60"
            />
          </div>
          <Select onValueChange={setCropFilter}>
            <SelectTrigger className="h-12 w-full sm:w-44 rounded-full border-border/60">
              <Leaf className="h-4 w-4 mr-1 text-muted-foreground" />
              <SelectValue placeholder="All crops" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All crops</SelectItem>
              {["Maize", "Wheat", "Rice", "Potato", "Soybean", "Groundnut"].map(c => (
                <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="h-12 rounded-full gap-2 shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <Card className="glass-panel">
            <CardContent className="p-6">
              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Price range (<CurrencySymbol />/ton)</p>
                  <Slider
                    min={0} max={1000} step={10}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span><CurrencyDisplay amount={priceRange[0]} /></span><span><CurrencyDisplay amount={priceRange[1]} /></span>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Availability</p>
                  <div className="flex flex-wrap gap-2">
                    {["Ready now", "In 7 days", "In 30 days", "Growing"].map(l => (
                      <Badge key={l} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors rounded-full px-3 py-1">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Quality grade</p>
                  <div className="flex flex-wrap gap-2">
                    {["Grade A+", "Grade A", "Grade B+"].map(g => (
                      <Badge key={g} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors rounded-full px-3 py-1">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Count & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing <strong className="text-foreground">{filtered.length}</strong> of {dynamicListings.length} listings
          </p>
          <div className="flex items-center gap-2">
            <div className="flex bg-muted/50 p-1 rounded-full border border-border/50">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 rounded-full px-3 gap-1.5"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" /> Grid
              </Button>
              <Button 
                variant={viewMode === "map" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 rounded-full px-3 gap-1.5"
                onClick={() => setViewMode("map")}
              >
                <Map className="h-4 w-4" /> Map
              </Button>
            </div>
            
            <Select>
              <SelectTrigger className="h-10 w-[160px] rounded-full border-border/60 text-sm">
                <SelectValue placeholder="Sort: Most buyers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyers">Most buyers</SelectItem>
                <SelectItem value="price-low">Price: Low to high</SelectItem>
                <SelectItem value="price-high">Price: High to low</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* View Layouts */}
        {viewMode === "map" ? (
          <MapView 
            locations={filtered.map(l => ({
              id: l.id,
              lat: l.lat,
              lng: l.lng,
              title: l.farmName,
              crop: l.crop,
              price: l.floorPrice
            }))} 
            height="60vh"
            center={[24.1, 89.5]} // Centered on Bangladesh
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((listing) => (
              <MarketplaceCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <p className="text-4xl">{loading ? <><ArrowRight className="h-6 w-6 animate-spin mx-auto text-primary" /></> : "🌿"}</p>
            <p className="font-semibold">{loading ? "Loading live data..." : "No listings found"}</p>
            <p className="text-muted-foreground text-sm">{loading ? "Synchronizing with decentralized ledger." : "Try adjusting your search or filters."}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
