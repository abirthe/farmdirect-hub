import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, ShieldCheck, Clock, MapPin, Check, AlertTriangle, Loader2 } from "lucide-react";

interface FarmerRegistryItem {
  id: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  farm_count: number;
  total_hectares: number;
}

export function AdminFarmersPanel() {
  const { toast } = useToast();
  const [farmers, setFarmers] = useState<FarmerRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VERIFIED" | "PENDING">("ALL");

  const loadFarmers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch users with role FARMER
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, role, status, created_at")
        .eq("role", "FARMER")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;

      // Fetch all farms to compute per-farmer aggregates
      const { data: farmsData } = await supabase
        .from("farms")
        .select("id, user_id, total_hectares");

      const farmMap: Record<string, { count: number; hectares: number }> = {};
      (farmsData || []).forEach((f) => {
        if (!farmMap[f.user_id]) {
          farmMap[f.user_id] = { count: 0, hectares: 0 };
        }
        farmMap[f.user_id].count += 1;
        farmMap[f.user_id].hectares += Number(f.total_hectares || 0);
      });

      const registry: FarmerRegistryItem[] = (usersData || []).map((u) => ({
        id: u.id,
        full_name: u.full_name || "Registered Grower",
        role: u.role,
        status: u.status || "PENDING",
        created_at: u.created_at,
        farm_count: farmMap[u.id]?.count || 0,
        total_hectares: Number((farmMap[u.id]?.hectares || 0).toFixed(1)),
      }));

      setFarmers(registry);
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        variant: "destructive",
        title: "Could not load farmers",
        description: e.message || "Failed to load grower registry.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  const handleToggleVerification = async (farmerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "VERIFIED" ? "PENDING" : "VERIFIED";
    try {
      const { error } = await supabase
        .from("users")
        .update({ status: nextStatus })
        .eq("id", farmerId);

      if (error) throw error;

      setFarmers((prev) =>
        prev.map((f) => (f.id === farmerId ? { ...f, status: nextStatus } : f))
      );

      toast({
        title: `Farmer status updated to ${nextStatus}`,
        description: `Grower account verification status adjusted successfully.`,
      });
    } catch (err: unknown) {
      const e = err as Error;
      toast({
        variant: "destructive",
        title: "Status update failed",
        description: e.message || "Could not update user record.",
      });
    }
  };

  const filtered = farmers.filter((f) => {
    const matchesSearch = f.full_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card className="glass-panel" data-testid="admin-farmers-panel">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Verified Grower Registry ({farmers.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Manage farmer onboarding, total managed acreage, and platform verification status.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search grower name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            <Button
              variant={statusFilter === "ALL" ? "default" : "outline"}
              size="sm"
              className="text-xs h-9"
              onClick={() => setStatusFilter("ALL")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "VERIFIED" ? "default" : "outline"}
              size="sm"
              className="text-xs h-9"
              onClick={() => setStatusFilter("VERIFIED")}
            >
              Verified
            </Button>
            <Button
              variant={statusFilter === "PENDING" ? "default" : "outline"}
              size="sm"
              className="text-xs h-9"
              onClick={() => setStatusFilter("PENDING")}
            >
              Pending
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 text-center space-y-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-xs">Synchronizing grower registry from decentralized database...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto opacity-30" />
            <p className="text-sm font-semibold">No farmers match the current filter</p>
            <p className="text-xs">Try adjusting your search query or status criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Grower Name</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Plots Registered</th>
                  <th className="py-3 px-3">Total Area</th>
                  <th className="py-3 px-3">Registered Date</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-foreground">{farmer.full_name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        ID: #{farmer.id.substring(0, 8).toUpperCase()}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={farmer.status === "VERIFIED" ? "secondary" : "outline"}
                        className="gap-1 text-[10px] font-semibold"
                      >
                        {farmer.status === "VERIFIED" ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Clock className="h-3 w-3 text-amber-500" />
                        )}
                        {farmer.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold">{farmer.farm_count}</span>
                      <span className="text-muted-foreground text-[10px] ml-1">fields</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-primary">{farmer.total_hectares}</span>
                      <span className="text-muted-foreground text-[10px] ml-1">ha</span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {new Date(farmer.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant={farmer.status === "VERIFIED" ? "outline" : "default"}
                        className="h-7 text-[11px] gap-1"
                        onClick={() => handleToggleVerification(farmer.id, farmer.status)}
                      >
                        {farmer.status === "VERIFIED" ? "Mark Pending" : "Verify Grower"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
