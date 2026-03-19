import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Leaf, MapPin, CloudSun, Target, TrendingUp, AlertTriangle, CloudRain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
                <h1 className="text-3xl font-black">Makurdi Maize Cluster</h1>
              </div>
              <p className="text-muted-foreground">ID: {farmId || "FARM-001"} · 12.8 hectares · Maize</p>
            </div>
            <div className="flex items-center gap-4 text-sm text-right">
              <div>
                <p className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Predicted Yield</p>
                <p className="font-black text-2xl text-primary">18.4 tons</p>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <Card className="glass-panel overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Machine Learning Yield Forecast
            </CardTitle>
            <p className="text-sm text-muted-foreground">Model confidence: ±0.4 tons</p>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(112, 40%, 26%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(112, 40%, 26%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(102, 20%, 79%, 0.4)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} domain={[12, 20]} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid hsl(102, 20%, 79%)" }}
                  itemStyle={{ fontSize: "14px", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="predicted" stroke="hsl(112, 40%, 26%)" strokeWidth={2} fill="url(#colorPredicted)" name="Forecast (t)" />
                <Area type="monotone" dataKey="actual" stroke="hsl(46, 86%, 63%)" strokeWidth={3} fill="none" dot={{ r: 4 }} name="Actual (t)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
                <p className="text-4xl font-black">$5,850</p>
                <p className="text-sm text-muted-foreground mt-1">Based on $318/t floor</p>
              </div>
              <div className="space-y-2">
                <Button size="sm" className="w-full rounded-full gap-2">
                  <Target className="h-4 w-4" /> Update Marketplace Listing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default YieldDetail;
