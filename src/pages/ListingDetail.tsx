import { useCurrency } from "@/contexts/CurrencyContext";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  ArrowLeft, MapPin, ShieldCheck, Clock, TrendingUp, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { runYieldPredictionModel, FarmMLFeatures } from "@/lib/ml-service";
import { ListingAiVerification } from "@/features/marketplace/components/ListingAiVerification";
import { ListingDealCard } from "@/features/marketplace/components/ListingDealCard";
import { MarketplaceListing } from "@/features/marketplace/types";

const priceHistory = [
  { week: "W-6", price: 298 }, { week: "W-5", price: 305 }, { week: "W-4", price: 301 },
  { week: "W-3", price: 310 }, { week: "W-2", price: 314 }, { week: "W-1", price: 318 },
];

const mockListing: MarketplaceListing = {
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
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const userRole = session?.user?.user_metadata?.role;

  usePageMeta({
    title: `${mockListing.crop} Listing (${mockListing.farmName})`,
    description: mockListing.description,
  });

  // Enforce Absolute POV Routing Isolation
  useEffect(() => {
    if (userRole === "farmer") {
      navigate("/farmer", { replace: true });
    }
  }, [userRole, navigate]);

  // ML Intelligence Feed for Buyers
  const mlFeatures: FarmMLFeatures = {
    cropType: 'Maize',
    farmSizeHectares: 12.8,
    avgTempCelsius: 30.5,
    rainfallMm: 80.0,
    soilMoisturePercent: 62.0,
    satelliteNdvi: mockListing.ndvi / 1.5,
    daysSincePlanting: 100,
  };
  const prediction = runYieldPredictionModel(mlFeatures);

  const handleRequestSample = () => {
    toast({
      title: "Sample Request Dispatched",
      description: "Farmer has been notified to dispatch quality sample inspection."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5">
            <Link to="/marketplace">
              <ArrowLeft className="h-4 w-4" />
              Back to marketplace
            </Link>
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
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-full px-3 py-1.5 text-sm dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                  <Clock className="h-3.5 w-3.5 mr-1" />{mockListing.status}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-7">{mockListing.description}</p>
            </div>

            {/* Deep Learning Quality Verification */}
            <ListingAiVerification prediction={prediction} />

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
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(112,40%,26%)"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "hsl(112,40%,26%)" }}
                      activeDot={{ r: 6 }}
                    />
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
                  {mockListing.certDocs.map((doc) => (
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
            <ListingDealCard
              listing={{ ...mockListing, id: id || mockListing.id }}
              userRole={userRole}
              onRequestSample={handleRequestSample}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
