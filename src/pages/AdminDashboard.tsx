import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { Link } from "react-router-dom";
import {
  Users, ShieldCheck, BarChart3, CheckCircle2, Clock,
  AlertTriangle, Search, Map, TrendingUp, Settings, BadgeDollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AuditLogPanel } from "@/features/audit/components/AuditLogPanel";
import { FeeTiersPanel } from "@/features/fees/components/FeeTiersPanel";
import { AdminDisputesPanel } from "@/features/disputes/components/AdminDisputesPanel";
import { AdminKycQueue } from "@/features/kyc/components/AdminKycQueue";
import { AdminBkashPaymentVerification } from "@/features/payments/components/AdminBkashPaymentVerification";
import { AdminFarmersPanel } from "@/features/audit/components/AdminFarmersPanel";
import { supabase } from "@/lib/supabaseClient";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    farmers: 0,
    listings: 0,
    pendingKyc: 0,
    orders: 0
  });

  useEffect(() => {
    const fetchAdminStats = async () => {
      const [farmersRes, listingsRes, kycRes, ordersRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'FARMER'),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
        supabase.from('kyc_verifications').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('orders').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        farmers: farmersRes.count || 0,
        listings: listingsRes.count || 0,
        pendingKyc: kycRes.count || 0,
        orders: ordersRes.count || 0
      });
    };

    fetchAdminStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Admin control</span>
            </div>
            <h1 className="text-gradient-primary text-3xl font-black">Platform Administration</h1>
            <p className="text-muted-foreground text-sm">System health, verification queue, and dispute management.</p>
          </div>
          <Button variant="outline" 
            size="sm" 
            className="hover-lift rounded-full gap-1.5"
            onClick={() => toast({ title: "Admin Panel Action", description: "Opening configuration modal..." })}
          >
            <Settings className="h-4 w-4" />
            Platform settings
          </Button>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Platform KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total farmers", value: stats.farmers.toString(), sub: "Live registered growers", icon: Users, trend: "up" },
            { label: "Active listings", value: stats.listings.toString(), sub: "Ready for harvest trade", icon: Map, trend: "up" },
            { label: "Pending verifications", value: stats.pendingKyc.toString(), sub: "Awaiting admin review", icon: Clock, trend: stats.pendingKyc > 0 ? "warn" : "up" },
            { label: "Total orders", value: stats.orders.toString(), sub: "Escrow deals recorded", icon: TrendingUp, trend: "up" },
          ].map(({ label, value, sub, icon: Icon, trend }) => (
            <Card key={label} className="glass-panel hover-lift group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="p-6 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.15em] transition-colors group-hover:text-foreground/80">{label}</p>
                  <p className="text-3xl font-black">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                  trend === "warn" ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" : "bg-primary/10 text-primary"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Health Bars */}
        <Card className="glass-panel hover-lift glass-panel">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-black flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Platform health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Verified farmer ratio", value: 84, color: "bg-primary" },
              { label: "Listing fulfillment rate", value: 96, color: "bg-green-500" },
              { label: "Yield prediction accuracy", value: 91, color: "bg-secondary" },
              { label: "Escrow completion rate", value: 98, color: "bg-green-500" },
              { label: "Dispute resolution rate", value: 87, color: "bg-amber-500" },
            ].map(m => (
              <div key={m.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-bold">{m.value}%</span>
                </div>
                <Progress value={m.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Verification Queue & Disputes */}
        <Tabs defaultValue="verifications">
          <TabsList className="rounded-full bg-muted p-1">
            <TabsTrigger value="payments" className="rounded-full text-sm gap-1.5">
              <BadgeDollarSign className="h-4 w-4" />bKash Queue
            </TabsTrigger>
            <TabsTrigger value="verifications" className="rounded-full text-sm gap-1.5">
              <ShieldCheck className="h-4 w-4" />Verifications
            </TabsTrigger>
            <TabsTrigger value="disputes" className="rounded-full text-sm gap-1.5">
              <AlertTriangle className="h-4 w-4" />Disputes
            </TabsTrigger>
            <TabsTrigger value="farmers" className="rounded-full text-sm gap-1.5">
              <Users className="h-4 w-4" />Farmers
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-full text-sm gap-1.5">
              <ShieldCheck className="h-4 w-4" />Audit Log
            </TabsTrigger>
            <TabsTrigger value="fees" className="rounded-full text-sm gap-1.5">
              Fees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-5">
            <AdminBkashPaymentVerification />
          </TabsContent>

          <TabsContent value="verifications" className="mt-5">
            <AdminKycQueue />
          </TabsContent>

          <TabsContent value="disputes" className="mt-5">
            <AdminDisputesPanel />
          </TabsContent>

          <TabsContent value="farmers" className="mt-5">
            <AdminFarmersPanel />
          </TabsContent>

          <TabsContent value="audit" className="mt-5">
            <AuditLogPanel />
          </TabsContent>

          <TabsContent value="fees" className="mt-5">
            <FeeTiersPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
