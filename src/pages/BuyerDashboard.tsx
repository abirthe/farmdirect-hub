import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShoppingBag, TrendingUp, Clock, CheckCircle2, ArrowRight,
  BadgeDollarSign, Package, Truck, QrCode, Star, BarChart3, BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DemandForecastPanel } from "@/features/forecasts/components/DemandForecastPanel";

const spendData = [
  { month: "Oct", spend: 12400 }, { month: "Nov", spend: 18200 },
  { month: "Dec", spend: 9800 }, { month: "Jan", spend: 21300 },
  { month: "Feb", spend: 19500 }, { month: "Mar", spend: 24600 },
];

const orders = [
  { id: "#ORD-2401", crop: "Maize 🌽", farm: "Bogra Cluster", qty: "12t", price: <><CurrencyDisplay amount={318} />/t</>, total: <CurrencyDisplay amount={3816} />, status: "In transit", statusType: "transit", date: "Mar 18" },
  { id: "#ORD-2398", crop: "Soybean 🫘", farm: "Rangpur Coll.ctive", qty: "8t", price: <><CurrencyDisplay amount={520} />/t</>, total: <CurrencyDisplay amount={4160} />, status: "Delivered", statusType: "delivered", date: "Mar 12" },
  { id: "#ORD-2391", crop: "Rice 🍚", farm: "Dinajpur Rice Farm", qty: "15t", price: <><CurrencyDisplay amount={415} />/t</>, total: <CurrencyDisplay amount={6225} />, status: "Pending escrow", statusType: "pending", date: "Mar 8" },
];

const statusColor: Record<string, string> = {
  transit: "bg-blue-100 text-blue-700 border-blue-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
};
const statusIcon: Record<string, React.ElementType> = {
  transit: Truck,
  delivered: CheckCircle2,
  pending: Clock,
};

const BuyerDashboard = () => {
  const { formatCurrency, currency } = useCurrency();
  const getSymbol = () => currency === "BDT" ? "৳" : currency === "EUR" ? "€" : "$";
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dbOrders, setDbOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;
      // Fetch dynamic live orders where current auth user is the buyer
      const { data } = await supabase.from('orders').select(`
        id, qty_purchased, total_price, status, created_at,
        listings ( crop_cycles ( crop_type, farms ( farm_name ) ) )
      `).eq('buyer_id', user.id);
      
      if (data) setDbOrders(data);
    };
    fetchOrders();
  }, [user]);

  // Combine real DB orders with mock defaults
  const dynamicOrders = dbOrders.length > 0 ? dbOrders.map(o => ({
    id: `#ORD-${o.id.substring(0, 4).toUpperCase()}`,
    crop: o.listings?.crop_cycles?.crop_type || "Crop",
    farm: o.listings?.crop_cycles?.farms?.farm_name || "Verified Farm",
    qty: `${o.qty_purchased}t`,
    price: <><CurrencyDisplay amount={o.total_price / o.qty_purchased} />/t</>,
    total: <CurrencyDisplay amount={o.total_price} />,
    status: o.status,
    statusType: o.status === 'IN_TRANSIT' ? 'transit' : o.status === 'DELIVERED' ? 'delivered' : 'pending',
    date: new Date(o.created_at).toLocaleDateString()
  })) : orders; // Fallback to mocks if DB entirely empty


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Buyer dashboard</span>
            </div>
            <h1 className="text-3xl font-black">Procurement Centre</h1>
            <p className="text-muted-foreground text-sm">Welcome back, Bengal Agro Ltd. Here's your supply overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild className="rounded-full gap-1.5 w-fit">
              <Link to="/marketplace">
                <ShoppingBag className="h-4 w-4" />
                Browse marketplace
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* KPI Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active orders", value: "3", sub: "2 in transit", icon: Package, color: "text-blue-500 bg-blue-50" },
            { label: "Total spend this month", value: <CurrencyDisplay amount={24600} />, sub: "+26% vs last month", icon: BadgeDollarSign, color: "text-primary bg-primary/10" },
            { label: "Avg price below retail", value: "−24%", sub: "vs middleman pricing", icon: TrendingUp, color: "text-green-600 bg-green-50" },
            { label: "Verified suppliers", value: "8", sub: "Avg rating 4.7 ★", icon: Star, color: "text-amber-500 bg-amber-50" },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label} className="soil-card">
              <CardContent className="p-6 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">{label}</p>
                  <p className="text-3xl font-black">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Spend Chart */}
          <Card className="glass-panel">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Spend analytics</p>
                  <CardTitle className="mt-1 text-2xl font-black">Monthly procurement spend ({getSymbol()})</CardTitle>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={spendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(102,20%,79%,0.4)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${formatCurrency(v/1000)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "1px solid hsl(102,20%,79%)", fontSize: "12px" }}
                    formatter={(v: number) => [`${formatCurrency(v)}`, "Spend"]}
                  />
                  <Bar dataKey="spend" fill="hsl(112,40%,26%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recommended Listings */}
          <Card className="glass-panel border-primary/20">
            <CardHeader className="pb-3 border-b border-border/60 bg-primary/5 rounded-t-xl">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-xl font-black">AI Smart Sourcing</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">High-confidence AI verified yields. Zero broker risk.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {[
                { crop: "🌽 Maize", farm: "Bogra Cluster", price: <><CurrencyDisplay amount={318} />/t</>, ready: "May 12, 2026", conf: 94.8, grade: "A+" },
                { crop: "🍚 Boro Rice", farm: "Rajshahi A-1", price: <><CurrencyDisplay amount={415} />/t</>, ready: "Jun 18, 2026", conf: 91.2, grade: "A+" },
                { crop: "🫘 Soybean", farm: "Rangpur Coll.", price: <><CurrencyDisplay amount={520} />/t</>, ready: "Apr 04, 2026", conf: 88.5, grade: "A" },
              ].map(r => (
                <div key={r.crop} className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 hover:-translate-y-0.5 transition-transform duration-200">
                  <div className="text-xl">{r.crop.split(" ")[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{r.crop.split(" ").slice(1).join(" ")} · {r.farm}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-transparent h-5 text-[10px]">
                        {r.conf}% AI Conf
                      </Badge>
                      <Badge variant="outline" className="h-5 text-[10px] border-border/60">
                        Grade {r.grade}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="font-bold">{r.price}</p>
                     <p className="text-[10px] text-muted-foreground mt-0.5">Harvest: {r.ready}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="rounded-full shrink-0 text-primary hover:bg-primary/10">
                    <Link to="/marketplace/lst-001"><ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full rounded-full gap-2 mt-1">
                <Link to="/marketplace">
                  <ShoppingBag className="h-4 w-4" />
                  Browse all listings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-2xl font-black">Recent orders</h2>
            <Button variant="outline" size="sm" className="rounded-full">View all orders</Button>
          </div>
          <div className="space-y-3">
            {dynamicOrders.map(order => {
              const StatusIcon = statusIcon[order.statusType];
              return (
                <Card key={order.id} className="soil-card hover:-translate-y-0.5 transition-transform duration-200">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="text-2xl">{order.crop.split(" ").pop() || "📦"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold">{order.crop.split(" ")[0]}</p>
                          <span className="text-muted-foreground text-sm">·</span>
                          <p className="text-sm text-muted-foreground truncate">{order.farm}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{order.id}</span>
                          <span>·</span>
                          <span>{order.qty} @ {order.price}</span>
                          <span>·</span>
                          <span>{order.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <p className="font-black text-xl">{order.total}</p>
                      <Badge className={`${statusColor[order.statusType]} rounded-full gap-1`}>
                        <StatusIcon className="h-3 w-3" />{order.status}
                      </Badge>
                      {order.statusType === "transit" && (
                        <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5">
                          <Link to="/escrow/ORD-2401">
                            <QrCode className="h-4 w-4" />Scan QR
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Demand Forecasting & Macro Shortage Alerts */}
        <DemandForecastPanel />

        {/* Supplier Quality */}
        <div>
          <h2 className="text-2xl font-black mb-5">Supplier performance</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Rafiqul Islam", crops: "Maize, Wheat", deals: 12, rating: 4.8, onTime: 100 },
              { name: "Fatema Begum", crops: "Rice", deals: 7, rating: 4.9, onTime: 100 },
              { name: "Abdul Karim", crops: "Soybean", deals: 4, rating: 4.7, onTime: 75 },
            ].map(s => (
              <Card key={s.name} className="soil-card">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-sm shrink-0">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.crops}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-lg border border-border/60 bg-background/70 p-2">
                      <p className="text-xs text-muted-foreground">Deals</p>
                      <p className="font-black">{s.deals}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-background/70 p-2">
                      <div className="flex items-center justify-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <p className="font-black text-sm">{s.rating}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">On-time delivery</span>
                      <span className="font-bold">{s.onTime}%</span>
                    </div>
                    <Progress value={s.onTime} className="h-1.5" />
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

export default BuyerDashboard;
