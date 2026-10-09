import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Leaf, MapPin, CloudSun, Target, TrendingUp, AlertTriangle, CloudRain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { runYieldPredictionModel, FarmMLFeatures } from "@/lib/ml-service";
import { IoTTelemetryPanel } from "@/features/iot/components/IoTTelemetryPanel";
import { PrecisionPrescriptionPanel } from "@/features/prescriptions/components/PrecisionPrescriptionPanel";

const forecastData = [
  { day: "Day 1", predicted: 14.5, actual: 14.5 },
  { day: "Day 10", predicted: 15.2, actual: 15.0 },
  { day: "Day 20", predicted: 16.1, actual: 16.0 },
  { day: "Day 30", predicted: 17.5, actual: 17.4 },
  { day: "Day 40", predicted: 18.0, actual: 18.2 },
  { day: "Day 50", predicted: 18.4, actual: null }, // Future prediction
  { day: "Day 60", predicted: 18.4, actual: null },
];

const YieldDetail = () => {
  const { farmId } = useParams();

  // 1. Create Dummy AI Feature Set corresponding to Python data logic
  const mlFeatures: FarmMLFeatures = {
    cropType: 'Boro Rice',
    farmSizeHectares: 1.82, // Standardized safely to match PostgreSQL Table (exactly 4.5 acres)
    avgTempCelsius: 32.5,
    rainfallMm: 145.0,
    soilMoisturePercent: 55.0,
    satelliteNdvi: 0.75, // Healthy Crop
    daysSincePlanting: 45,
  };

  // 2. Fetch realtime machine learning output
  const prediction = runYieldPredictionModel(mlFeatures);

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5">
            <Link to="/farmer"><ArrowLeft className="h-4 w-4" />Back to dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="container py-8 space-y-8 max-w-5xl">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                <h1 className="text-3xl font-black">Rajshahi {mlFeatures.cropType} Cluster</h1>
              </div>
              <p className="text-muted-foreground">ID: {farmId || "ACRE-092"} · {mlFeatures.farmSizeHectares} hectares · {mlFeatures.cropType}</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-right">
              <div>
                <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Predicted Yield</p>
                <p className="font-black text-2xl text-primary">{prediction.predictedYieldTons.toFixed(2)} tons</p>
              </div>
            </div>
          </div>
        </div>

        {/* ML Yield Forecast Chart */}
        <Card className="glass-panel overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Yield Trajectory Neural Network
            </CardTitle>
            <p className="text-sm text-muted-foreground">Model confidence: ±{((100 - prediction.confidenceScore)/100 * prediction.predictedYieldTons).toFixed(2)} tons</p>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[12, 20]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))", color: "hsl(var(--card-foreground))" }}
                  itemStyle={{ fontSize: "14px", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="predicted" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#colorPredicted)" name="Forecast (t)" />
                <Area type="monotone" dataKey="actual" stroke="hsl(var(--secondary))" strokeWidth={3} fill="none" dot={{ r: 5, fill: "hsl(var(--secondary))" }} name="Actual (t)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Harvest Prediction Model */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="glass-panel border-primary/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
               <Target className="w-32 h-32" />
             </div>
             <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <CloudSun className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-black text-primary">Optimal Ripening Window</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/50 rounded-xl p-4 border border-border/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Predicted Harvest Date</p>
                    <p className="text-2xl font-black mt-1 leading-none">{prediction.harvestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs font-medium text-green-500">{prediction.daysToHarvest} days left</p>
                    </div>
                  </div>
                  <div className="bg-background/50 rounded-xl p-4 border border-border/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Riped Crop Est.</p>
                    <p className="text-2xl font-black mt-1 leading-none">{prediction.predictedYieldKg.toLocaleString('en-US', { maximumFractionDigits: 0 })} KG</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs font-medium text-amber-500">{prediction.confidenceScore.toFixed(1)}% Confidence</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1 mt-3">
                    <span>Crop Development Timeline</span>
                    <span>{mlFeatures.daysSincePlanting} / {mlFeatures.daysSincePlanting + prediction.daysToHarvest} Days</span>
                  </div>
                  <Progress value={(mlFeatures.daysSincePlanting / (mlFeatures.daysSincePlanting + prediction.daysToHarvest)) * 100} className="h-2 [&>div]:bg-primary" />
                </div>
             </CardContent>
          </Card>

          <Card className="glass-panel border-blue-500/20 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
               <AlertTriangle className="w-32 h-32 text-blue-500" />
             </div>
             <CardContent className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-black text-blue-500">AgroDirect Deep Learning AI</h3>
                </div>
                
                <div className="grid gap-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <p className="text-sm font-medium text-muted-foreground">Predicted Moisture Content</p>
                    <p className="font-bold">{prediction.moisturePrediction.toFixed(1)}% (Optimal)</p>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <p className="text-sm font-medium text-muted-foreground">Estimated Fungal Risk</p>
                    <p className="font-bold text-green-500">Low ({(prediction.confidenceScore / 40).toFixed(1)}%)</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Projected Gross Floor</p>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-primary"><CurrencyDisplay amount={prediction.predictedYieldTons * 318} /></span>
                      <Leaf className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Intelligence Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* NDVI */}
          <Card className="soil-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">NDVI Health</p>
                <Leaf className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-4xl font-black">1.12<span className="text-xl text-muted-foreground">x</span></p>
                <p className="text-sm text-green-600 font-medium mt-1">↑ +12% vs historical avg</p>
              </div>
              <div className="space-y-1">
                <Progress value={85} className="h-1.5 [&>div]:bg-primary" />
                <p className="text-xs text-muted-foreground text-right">Excellent canopy density</p>
              </div>
            </CardContent>
          </Card>

          {/* Weather Risk */}
          <Card className="soil-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">Weather Risk Factor</p>
                <CloudRain className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-4xl font-black">0.94</p>
                <p className="text-sm text-amber-600 font-medium mt-1">Minor risk detected</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground bg-background/50 p-3 rounded-xl border border-border/50">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p>Dry window approaching in 6 days. Irrigation readiness recommended.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Insight */}
          <Card className="soil-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">Market Est. Value</p>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-4xl font-black"><CurrencyDisplay amount={5850} /></p>
                <p className="text-sm text-muted-foreground mt-1">Based on <CurrencyDisplay amount={318} />/t floor</p>
              </div>
              <div className="space-y-2">
                <Button size="sm" className="w-full rounded-full gap-2">
                  <Target className="h-4 w-4" /> Update Marketplace Listing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Field IoT Sensors & Soil Telemetry */}
        <IoTTelemetryPanel cycleId={farmId || "00000000-0000-4000-8000-000000000001"} />

        {/* AI Precision Agronomy Prescriptions Engine */}
        <PrecisionPrescriptionPanel cycleId={farmId || "00000000-0000-4000-8000-000000000001"} />
      </div>
    </div>
  );
};

export default YieldDetail;
