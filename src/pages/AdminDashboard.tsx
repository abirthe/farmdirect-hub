import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { Link } from "react-router-dom";
import {
  Users, ShieldCheck, BarChart3, CheckCircle2, Clock,
  AlertTriangle, Search, Map, TrendingUp, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const initialVerificationQueue = [
  { id: "V-0041", farmer: "Mizanur Rahman", location: "Jessore District", docs: 3, status: "Pending review", type: "Land title" },
  { id: "V-0039", farmer: "Shirin Sultana", location: "Natore District", docs: 2, status: "Under review", type: "Quality cert" },
  { id: "V-0037", farmer: "Tariqul Islam", location: "Comilla District", docs: 4, status: "Approved", type: "Land title" },
  { id: "V-0035", farmer: "Rubel Mia", location: "Faridpur District", docs: 1, status: "Rejected", type: "Identity" },
];

const initialDisputes = [
  { id: "D-0012", parties: "Bengal Agro Ltd vs Rafiqul Islam", issue: "Delivery weight discrepancy (—0.4t)", amount: <CurrencyDisplay amount={127} />, status: "Open" },
  { id: "D-0011", parties: "Krishi Bazar vs Fatema Begum", issue: "Quality grade mismatch on delivery", amount: <CurrencyDisplay amount={340} />, status: "Resolved" },
];

const AdminDashboard = () => {
  const { toast } = useToast();
  const [verificationQueue, setVerificationQueue] = useState(initialVerificationQueue);
  const [disputes, setDisputes] = useState(initialDisputes);

  const handleApprove = (id: string) => {
    setVerificationQueue(prev => prev.map(item => item.id === id ? { ...item, status: "Approved" } : item));
    toast({ title: "Verification Approved", description: `Farmer KYC document ${id} has been cryptographically signed.` });
  };

  const handleReject = (id: string) => {
    setVerificationQueue(prev => prev.map(item => item.id === id ? { ...item, status: "Rejected" } : item));
    toast({ variant: "destructive", title: "Verification Rejected", description: `Rejection notice dispatched to farmer for ${id}.` });
  };

  const handleMediate = (id: string) => {
    setDisputes(prev => prev.map(item => item.id === id ? { ...item, status: "Resolved" } : item));
    toast({ title: "Dispute Mediated", description: `Escrow forced release executed for dispute ${id}.` });
  };
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
            <h1 className="text-3xl font-black">Platform Administration</h1>
            <p className="text-muted-foreground text-sm">System health, verification queue, and dispute management.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full gap-1.5"
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
            { label: "Total farmers", value: "312", sub: "+18 this month", icon: Users, trend: "up" },
            { label: "Active listings", value: "148", sub: "32 ready to harvest", icon: Map, trend: "up" },
            { label: "Pending verifications", value: "6", sub: "2 urgent", icon: Clock, trend: "warn" },
            { label: "Platform GMV (Mar)", value: <><CurrencyDisplay amount={284000}/>k</>, sub: "+31% vs Feb", icon: TrendingUp, trend: "up" },
          ].map(({ label, value, sub, icon: Icon, trend }) => (
            <Card key={label} className="soil-card">
              <CardContent className="p-6 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.15em]">{label}</p>
                  <p className="text-3xl font-black">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
                  trend === "warn" ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Health Bars */}
        <Card className="glass-panel">
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
            <TabsTrigger value="verifications" className="rounded-full text-sm gap-1.5">
              <ShieldCheck className="h-4 w-4" />Verifications
              <Badge variant="secondary" className="h-5 rounded-full px-1.5 text-xs">{verificationQueue.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="disputes" className="rounded-full text-sm gap-1.5">
              <AlertTriangle className="h-4 w-4" />Disputes
              <Badge variant="secondary" className="h-5 rounded-full px-1.5 text-xs">{disputes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="farmers" className="rounded-full text-sm gap-1.5">
              <Users className="h-4 w-4" />Farmers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verifications" className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{verificationQueue.length} items in queue</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input placeholder="Search…" className="h-9 pl-9 pr-4 rounded-full border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            {verificationQueue.map(item => (
              <Card key={item.id} className="soil-card">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold">{item.farmer}</p>
                      <span className="text-xs text-muted-foreground font-mono">{item.id}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.location} · {item.type} · {item.docs} documents</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className={
                      item.status === "Approved" ? "bg-green-100 text-green-700 border-green-200 rounded-full" :
                      item.status === "Rejected" ? "bg-red-100 text-red-700 border-red-200 rounded-full" :
                      item.status === "Under review" ? "bg-blue-100 text-blue-700 border-blue-200 rounded-full" :
                      "bg-amber-100 text-amber-700 border-amber-200 rounded-full"
                    }>
                      {item.status === "Approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {item.status === "Rejected" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {item.status}
                    </Badge>
                    {(item.status === "Pending review" || item.status === "Under review") && (
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-full h-8 gap-1" onClick={() => handleApprove(item.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" />Approve
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-full h-8" onClick={() => handleReject(item.id)}>Reject</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="disputes" className="mt-5 space-y-3">
            {disputes.map(d => (
              <Card key={d.id} className="soil-card">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{d.parties}</p>
                      <span className="text-xs text-muted-foreground font-mono">{d.id}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{d.issue}</p>
                    <p className="text-sm font-semibold">Disputed amount: {d.amount}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className={d.status === "Resolved" ? "bg-green-100 text-green-700 border-green-200 rounded-full" : "bg-amber-100 text-amber-700 border-amber-200 rounded-full"}>
                      {d.status}
                    </Badge>
                    {d.status === "Open" && (
                      <Button size="sm" className="rounded-full h-8" onClick={() => handleMediate(d.id)}>Mediate</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="farmers" className="mt-5">
            <div className="py-12 text-center space-y-3 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto opacity-30" />
              <p className="font-semibold">Full farmer registry coming soon</p>
              <p className="text-sm">Search, filter, and manage all 312 verified farmers on the platform.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
