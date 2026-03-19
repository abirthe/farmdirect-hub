import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, SlidersHorizontal, MapPin, Clock, ShieldCheck, TrendingUp,
  Leaf, Star, CheckCircle2, ArrowRight, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const listings = [
  {
    id: "lst-001",
    crop: "Maize",
    emoji: "🌽",
    farmName: "Bogra Maize Cluster",
    farmer: "Rafiqul Islam",
    location: "Rajshahi Division, Bangladesh",
    area: "12.8 ha",
    qty: "18.4 t",
    floorPrice: 318,
    status: "Ready in 10 days",
    statusType: "upcoming",
    ndvi: 1.12,
    buyers: 26,
    quality: "Grade A",
    verified: true,
    rating: 4.8,
  },
  {
    id: "lst-002",
    crop: "Wheat",
    emoji: "🌾",
    farmName: "Rajshahi Wheat Block",
    farmer: "Rafiqul Islam",
    location: "Rajshahi Division, Bangladesh",
    area: "7.4 ha",
    qty: "11.2 t",
    floorPrice: 245,
    status: "Ready now",
    statusType: "ready",
    ndvi: 0.98,
    buyers: 14,
    quality: "Grade B+",
    verified: true,
    rating: 4.6,
  },
  {
    id: "lst-003",
    crop: "Rice",
    emoji: "🍚",
    farmName: "Dinajpur Rice Farm",
    farmer: "Fatema Begum",
    location: "Dinajpur District, Bangladesh",
    area: "22.1 ha",
    qty: "34.8 t",
    floorPrice: 415,
    status: "Ready in 21 days",
    statusType: "upcoming",
    ndvi: 1.05,
    buyers: 41,
    quality: "Grade A+",
    verified: true,
    rating: 4.9,
  },
  {
    id: "lst-004",
    crop: "Potato",
    emoji: "🪴",
    farmName: "Jessore Potato Belt",
    farmer: "Kamrul Hasan",
    location: "Jessore District, Bangladesh",
    area: "16.5 ha",
    qty: "62.4 t",
    floorPrice: 175,
    status: "Growing",
    statusType: "growing",
    ndvi: 0.87,
    buyers: 9,
    quality: "Grade A",
    verified: false,
    rating: 4.3,
  },
  {
    id: "lst-005",
    crop: "Soybean",
    emoji: "🫘",
    farmName: "Rangpur Soybean Collective",
    farmer: "Abdul Karim",
    location: "Rangpur Division, Bangladesh",
    area: "31.2 ha",
    qty: "28.6 t",
    floorPrice: 520,
    status: "Ready in 5 days",
    statusType: "upcoming",
    ndvi: 1.14,
    buyers: 33,
    quality: "Grade A+",
    verified: true,
    rating: 4.7,
  },
  {
    id: "lst-006",
    crop: "Groundnut",
    emoji: "🥜",
    farmName: "Kushtia Groundnut Farm",
    farmer: "Nasrin Akter",
    location: "Kushtia District, Bangladesh",
    area: "9.3 ha",
    qty: "9.8 t",
    floorPrice: 610,
    status: "Ready now",
    statusType: "ready",
    ndvi: 1.01,
    buyers: 18,
    quality: "Grade A",
    verified: true,
    rating: 4.5,
  },
];

const statusColor: Record<string, string> = {
  ready: "bg-green-100 text-green-700 border-green-200",
  upcoming: "bg-amber-100 text-amber-700 border-amber-200",
  growing: "bg-blue-100 text-blue-700 border-blue-200",
};

const Marketplace = () => {
  const [search, setSearch] = useState("");
  const [cropFilter, setCropFilter] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = listings.filter(l => {
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

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <strong className="text-foreground">{filtered.length}</strong> of {listings.length} listings
          </p>
          <Select>
            <SelectTrigger className="h-9 w-44 rounded-full border-border/60 text-sm">
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

        {/* Listing Grid */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((listing) => (
            <Card key={listing.id} className="soil-card overflow-hidden hover:-translate-y-1 transition-transform duration-300 group">
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
                  <Badge className={`${statusColor[listing.statusType]} rounded-full text-xs shrink-0`}>
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
                  ].map(m => (
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
                    <p className="text-2xl font-black"><CurrencyDisplay amount={listing.floorPrice} /><span className="text-sm font-normal text-muted-foreground">/t</span></p>
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
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center space-y-3">
            <p className="text-4xl">🌿</p>
            <p className="font-semibold">No listings found</p>
            <p className="text-muted-foreground text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
