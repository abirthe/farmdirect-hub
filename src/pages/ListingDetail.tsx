import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, MapPin, ShieldCheck, Star, Clock, TrendingUp, CloudSun,
  QrCode, Leaf, BadgeDollarSign, CheckCircle2, AlertTriangle, ArrowRight, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const priceHistory = [
  { week: "W-6", price: 298 }, { week: "W-5", price: 305 }, { week: "W-4", price: 301 },
  { week: "W-3", price: 310 }, { week: "W-2", price: 314 }, { week: "W-1", price: 318 },
];

const mockListing = {
  id: "lst-001",
  crop: "Maize",
  emoji: "🌽",
  farmName: "Bogra Maize Cluster",
  farmer: "Rafiqul Islam",
  farmerRating: 4.8,
  farmerDeals: 12,
  location: "Bogra, Rajshahi Division, Bangladesh",
  area: "12.8 ha",
  qty: "18.4 t",
  floorPrice: 318,
  retailPrice: 420,
  logisticsCost: 102,
  status: "Ready in 10 days",
  statusType: "upcoming",
  ndvi: 1.12,
  weatherRisk: 0.94,
  fieldHealth: 91,
  buyers: 26,
  quality: "Grade A",
  verified: true,
  certDocs: ["Quality Certificate", "Land Title", "Pesticide Clearance"],
  escrowReady: true,
  description: "Premium yellow maize from the fertile Padma River basin. Grown using traditional methods with minimal chemical inputs. Canopy density trending above seasonal average with low weather risk.",
};

const ListingDetail = () => {
  const { id } = useParams();
  const { formatCurrency } = useCurrency();

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5">
            <Link to="/marketplace"><ArrowLeft className="h-4 w-4" />Back to marketplace</Link>
          </Button>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
                    {mockListing.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-black">{mockListing.crop}</h1>
                      {mockListing.verified && <ShieldCheck className="h-6 w-6 text-primary" />}
                    </div>
                    <p className="text-muted-foreground">{mockListing.farmName}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />{mockListing.location}
                    </div>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full px-3 py-1.5 text-sm">
                  <Clock className="h-3.5 w-3.5 mr-1" />{mockListing.status}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-7">{mockListing.description}</p>
            </div>

            {/* Field Intelligence */}
            <Card className="glass-panel">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <CloudSun className="h-5 w-5 text-primary" />
                  Field intelligence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "NDVI Health Score", value: `${mockListing.ndvi}×`, sub: "Above seasonal avg", good: true },
                    { label: "Weather Risk Factor", value: `${mockListing.weatherRisk}`, sub: "Low risk. Minor dry alert in 6d", good: true },
                    { label: "Field Health", value: `${mockListing.fieldHealth}%`, sub: "Canopy density", good: true },
                  ].map(m => (
                    <div key={m.label} className="soil-card p-4 space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">{m.label}</p>
                      <p className="text-2xl font-black">{m.value}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {m.good ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <AlertTriangle className="h-3 w-3 text-amber-500" />}
                        {m.sub}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall field health</span>
                    <span className="font-bold">{mockListing.fieldHealth}%</span>
                  </div>
                  <Progress value={mockListing.fieldHealth} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Price Trend Chart */}
            <Card className="glass-panel">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  6-week price trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={priceHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(102,20%,79%,0.4)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[280, 340]} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid hsl(102,20%,79%)", fontSize: "12px" }}
                      formatter={(v: number) => [`${formatCurrency(v)}/t`, "Floor price"]}
                    />
                    <Line type="monotone" dataKey="price" stroke="hsl(112,40%,26%)" strokeWidth={2.5}
                      dot={{ r: 4, fill: "hsl(112,40%,26%)" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quality Certs */}
            <Card className="glass-panel">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Quality & documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {mockListing.certDocs.map(doc => (
                    <div key={doc} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 p-3">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm font-medium">{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column — Deal card */}
          <div className="space-y-5">
            <Card className="glass-panel sticky top-24">
              <CardContent className="p-6 space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Floor price (logistics deducted)</p>
                  <p className="text-5xl font-black mt-1"><CurrencyDisplay amount={mockListing.floorPrice} /><span className="text-lg font-normal text-muted-foreground">/t</span></p>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Retail benchmark</span><span><CurrencyDisplay amount={mockListing.retailPrice} />/t</span>
                    </div>
                    <div className="flex justify-between text-destructive">
                      <span>— Logistics cost</span><span>-<CurrencyDisplay amount={mockListing.logisticsCost} />/t</span>
                    </div>
                    <div className="flex justify-between font-bold text-primary border-t border-border/60 pt-1">
                      <span>Your floor price</span><span><CurrencyDisplay amount={mockListing.floorPrice} />/t</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/70 divide-y divide-border/60 overflow-hidden text-sm">
                  {[
                    { label: "Available quantity", value: mockListing.qty, icon: Leaf },
                    { label: "Farm area", value: mockListing.area, icon: MapPin },
                    { label: "Interested buyers", value: `${mockListing.buyers} active`, icon: Users },
                    { label: "Quality grade", value: mockListing.quality, icon: Star },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-3 px-4 py-3">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground flex-1">{label}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  ))}
                </div>

                {mockListing.escrowReady && (
                  <div className="rounded-2xl bg-primary/8 border border-primary/20 p-4 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-primary">Escrow protected</p>
                      <p className="text-xs text-muted-foreground mt-1">Funds held until QR delivery scan. Zero payment risk.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Button asChild className="w-full h-12 rounded-xl gap-2">
                    <Link to={`/escrow/lst-001`}>
                      <BadgeDollarSign className="h-5 w-5" />
                      Lock price in escrow
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full h-11 rounded-xl gap-2">
                    <QrCode className="h-4 w-4" />
                    Request quality sample
                  </Button>
                </div>

                {/* Farmer info */}
                <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-sm shrink-0">
                    {mockListing.farmer.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{mockListing.farmer}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {mockListing.farmerRating} · {mockListing.farmerDeals} successful deals
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full text-xs">
                    View profile
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
