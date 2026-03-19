import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import {
  Leaf, Map, TrendingUp, CloudSun, ShieldCheck, Bell, Plus,
  ArrowUpRight, AlertTriangle, CheckCircle2, Clock, Sprout
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const yieldHistory = [
  { month: "Oct", actual: 14.2, predicted: 15 },
  { month: "Nov", actual: 15.8, predicted: 16 },
  { month: "Dec", actual: 13.5, predicted: 14 },
  { month: "Jan", actual: 17.1, predicted: 17 },
  { month: "Feb", actual: 16.9, predicted: 18 },
  { month: "Mar", actual: null, predicted: 18.4 },
];

const farms = [
  {
    name: "Bogra Maize Plot A",
    crop: "Maize",
    area: "12.8 ha",
    ndvi: 1.12,
    yield: "18.4t",
    status: "Growing",
    daysLeft: 10,
    health: 91,
  },
  {
    name: "Rajshahi Wheat Block",
    crop: "Wheat",
    area: "7.4 ha",
    ndvi: 0.98,
    yield: "11.2t",
    status: "Ready",
    daysLeft: 0,
    health: 78,
  },
];

const alerts = [
  { type: "warning", text: "Dry-window alert in 6 days. Schedule irrigation.", time: "2h ago" },
  { type: "success", text: "NDVI reading improved 8.3% vs last week.", time: "1d ago" },
  { type: "info", text: "New buyer demand: 3 buyers interested in Wheat Block.", time: "2d ago" },
];

const FarmerDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Leaf className="h-4 w-4" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Farmer cockpit</span>
            </div>
            <h1 className="text-3xl font-black">Farm Intelligence</h1>
            <p className="text-muted-foreground text-sm">Welcome back, Adamu. Here's today's field briefing.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full gap-1.5">
              <Bell className="h-4 w-4" />
              Alerts
              <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full">1</Badge>
            </Button>
            <Button asChild size="sm" className="rounded-full gap-1.5">
              <Link to="/farmer/register">
                <Plus className="h-4 w-4" />
                Register farm
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* KPI Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Area Mapped", value: "20.2 ha", sub: "2 active farms", icon: Map, trend: "+12%" },
            { label: "Total Expected Yield", value: "29.6 t", sub: "Combined output", icon: Sprout, trend: "+18%" },
            { label: "Best Floor Price", value: <><CurrencyDisplay amount={318} />/t</>, sub: "After logistics", icon: TrendingUp, trend: "+5%" },
            { label: "Avg NDVI Score", value: "1.05×", sub: "Above seasonal avg", icon: CloudSun, trend: "+8%" },
          ].map(({ label, value, sub, icon: Icon, trend }) => (
            <Card key={label} className="soil-card">
              <CardContent className="p-6 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">{label}</p>
                  <p className="text-3xl font-black">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <div className="space-y-2 text-right">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ml-auto">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-green-600">{trend}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Yield Trend Chart */}
          <Card className="glass-panel">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Yield intelligence</p>
                  <CardTitle className="mt-1 text-2xl font-black">Maize yield forecast vs. actual</CardTitle>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full">Live data</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={yieldHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(112,40%,26%)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(112,40%,26%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(46,86%,63%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(46,86%,63%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(102,20%,79%,0.4)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(102,20%,79%)", fontSize: "12px" }}
                    formatter={(v: number) => [`${v}t`, ""]}
                  />
                  <Area type="monotone" dataKey="predicted" stroke="hsl(112,40%,26%)" strokeWidth={2} fill="url(#predictedGrad)" name="Predicted" strokeDasharray="4 2" />
                  <Area type="monotone" dataKey="actual" stroke="hsl(46,86%,63%)" strokeWidth={2.5} fill="url(#actualGrad)" name="Actual" dot={{ r: 4, fill: "hsl(46,86%,63%)" }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-4">
                <div className="flex items-center gap-2"><div className="h-2 w-6 rounded-full bg-primary opacity-60" style={{backgroundImage:"repeating-linear-gradient(90deg,transparent,transparent 4px,white 4px,white 6px)"}} /><span className="text-xs text-muted-foreground">Predicted</span></div>
                <div className="flex items-center gap-2"><div className="h-2 w-6 rounded-full bg-secondary" /><span className="text-xs text-muted-foreground">Actual</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Panel */}
          <Card className="glass-panel">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Field alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map(({ type, text, time }) => (
                <div key={text} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
                  {type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
                  {type === "success" && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
                  {type === "info" && <ArrowUpRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-5">{text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{time}</p>
                  </div>
                </div>
              ))}
              <div className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground">
                <div className="flex items-start gap-2">
                  <Sprout className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-primary-foreground/75">Best next move</p>
                    <p className="font-bold text-sm mt-1">List maize now — 26 buyers active this week</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Farm Cards */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-2xl font-black">My farms</h2>
            <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5">
              <Link to="/farmer/register"><Plus className="h-4 w-4" />Add farm</Link>
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {farms.map((farm) => (
              <Card key={farm.name} className="soil-card overflow-hidden hover:-translate-y-1 transition-transform duration-300">
                <div className="h-1.5 bg-gradient-to-r from-primary to-secondary" />
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge className={
                        farm.status === "Ready"
                          ? "bg-green-100 text-green-700 border-green-200 rounded-full"
                          : "bg-amber-100 text-amber-700 border-amber-200 rounded-full"
                      }>
                        {farm.status === "Ready" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {farm.status}{farm.daysLeft > 0 ? ` · ${farm.daysLeft}d` : ""}
                      </Badge>
                      <h3 className="mt-2 text-xl font-black">{farm.name}</h3>
                      <p className="text-sm text-muted-foreground">{farm.crop} · {farm.area}</p>
                    </div>
                    <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Field health (NDVI)</span>
                      <span className="font-bold">{farm.health}%</span>
                    </div>
                    <Progress value={farm.health} className="h-2" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "NDVI", value: `${farm.ndvi}×` },
                      { label: "Expected yield", value: farm.yield },
                      { label: "Floor price", value: <><CurrencyDisplay amount={318} />/t</> },
                    ].map(m => (
                      <div key={m.label} className="rounded-xl border border-border/60 bg-background/70 p-3 text-center">
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                        <p className="font-black mt-1">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="default" size="sm" className="flex-1 rounded-full gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      List for sale
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                      <Map className="h-4 w-4" />
                      View map
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
