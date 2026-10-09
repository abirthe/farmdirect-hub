import { CurrencyDisplay } from "@/components/ui/currency-display";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  ShoppingBag, TrendingUp, BadgeDollarSign, Package, Star, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DemandForecastPanel } from "@/features/forecasts/components/DemandForecastPanel";
import { SpendAnalyticsCard } from "@/features/buyers/components/SpendAnalyticsCard";
import { AiSmartSourcingCard } from "@/features/buyers/components/AiSmartSourcingCard";
import { SupplierPerformanceList } from "@/features/buyers/components/SupplierPerformanceList";
import { BuyerOrderCard, BuyerOrderSummary } from "@/features/buyers/components/BuyerOrderCard";

const BuyerDashboard = () => {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  usePageMeta({
    title: "Buyer Procurement Centre",
    description: "Manage crop orders, track escrow transactions, and review AI smart sourcing.",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase.from('orders').select(`
        id, qty_purchased, total_price, status, created_at,
        listings ( crop_cycles ( crop_type, farms ( farm_name ) ) )
      `).eq('buyer_id', user.id);
      
      if (data) setDbOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  const dynamicOrders: BuyerOrderSummary[] = dbOrders.map((o) => ({
    id: `#ORD-${o.id.substring(0, 4).toUpperCase()}`,
    crop: o.listings?.crop_cycles?.crop_type || "Crop",
    farm: o.listings?.crop_cycles?.farms?.farm_name || "Verified Farm",
    qty: `${o.qty_purchased}t`,
    price: <><CurrencyDisplay amount={o.total_price / o.qty_purchased} />/t</>,
    total: <CurrencyDisplay amount={o.total_price} />,
    status: o.status,
    statusType: o.status === 'IN_TRANSIT' ? 'transit' : o.status === 'DELIVERED' ? 'delivered' : 'pending',
    date: new Date(o.created_at).toLocaleDateString(),
  }));

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
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                Buyer dashboard
              </span>
            </div>
            <h1 className="text-3xl font-black">Procurement Centre</h1>
            <p className="text-muted-foreground text-sm">
              Welcome back, Bengal Agro Ltd. Here's your supply overview.
            </p>
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
            { label: "Active orders", value: "3", sub: "2 in transit", icon: Package, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300" },
            { label: "Total spend this month", value: <CurrencyDisplay amount={24600} />, sub: "+26% vs last month", icon: BadgeDollarSign, color: "text-primary bg-primary/10" },
            { label: "Avg price below retail", value: "−24%", sub: "vs middleman pricing", icon: TrendingUp, color: "text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-300" },
            { label: "Verified suppliers", value: "8", sub: "Avg rating 4.7 ★", icon: Star, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" },
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

        {/* Main Grid: Spend Chart & AI Smart Sourcing */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <SpendAnalyticsCard />
          <AiSmartSourcingCard />
        </div>

        {/* Orders List */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-2xl font-black">Recent orders</h2>
            <Button variant="outline" size="sm" className="rounded-full">
              View all orders
            </Button>
          </div>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-sm">Loading procurement history...</p>
            </div>
          ) : dynamicOrders.length === 0 ? (
            <Card className="glass-panel text-center py-12 px-4">
              <CardContent className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary mx-auto">
                  <Package className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">No orders placed yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Explore active harvests on the marketplace to lock in direct prices with escrow protection.
                  </p>
                </div>
                <Button asChild className="rounded-full gap-2">
                  <Link to="/marketplace">
                    <ShoppingBag className="h-4 w-4" />
                    Explore marketplace
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {dynamicOrders.map((order) => (
                <BuyerOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>

        {/* Demand Forecasting & Macro Shortage Alerts */}
        <DemandForecastPanel />

        {/* Supplier Quality */}
        <SupplierPerformanceList />
      </div>
    </div>
  );
};

export default BuyerDashboard;
