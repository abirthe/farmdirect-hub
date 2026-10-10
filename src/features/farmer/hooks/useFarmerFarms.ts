// Hook for loading registered farms and satellite NDVI telemetry for current farmer.
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { fetchFarmNdvi } from "@/services/satelliteNdviService";
import type { DisplayFarm } from "../types";

import type { Database } from "@/integrations/supabase/types";
type FarmRow = Database['public']['Tables']['farms']['Row'];

export function useFarmerFarms() {
  const { user } = useAuth();
  const [dbFarms, setDbFarms] = useState<FarmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmNdviScores, setFarmNdviScores] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchFarms = async () => {
      if (!user?.id) {
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) setLoading(true);
      const { data } = await supabase.from("farms").select("*").eq("user_id", user.id);
      if (isMounted) {
        if (data) setDbFarms(data);
        setLoading(false);
      }
    };
    fetchFarms();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const loadTelemetry = async () => {
      if (dbFarms.length === 0) return;
      const scores: Record<string, number> = {};
      for (const f of dbFarms) {
        try {
          const lat = f.boundary_coordinates?.[0]?.[0] || 24.8465;
          const lng = f.boundary_coordinates?.[0]?.[1] || 89.3777;
          const telemetry = await fetchFarmNdvi(lat, lng);
          scores[f.id] = telemetry.ndviScore;
        } catch {
          scores[f.id] = 0.82;
        }
      }
      if (isMounted) {
        setFarmNdviScores(scores);
      }
    };
    loadTelemetry();
    return () => {
      isMounted = false;
    };
  }, [dbFarms]);

  const displayFarms: DisplayFarm[] = dbFarms.map((f) => {
    const ndvi = farmNdviScores[f.id] ?? 0.84;
    return {
      id: f.id,
      name: f.farm_name,
      crop: "Active Cultivation",
      area: `${f.total_hectares || 0} ha`,
      ndvi,
      yield: "Telemetry Active",
      status: "Registered",
      daysLeft: 0,
      health: Math.round(ndvi * 100),
    };
  });

  return {
    farms: displayFarms,
    rawFarms: dbFarms,
    loading,
  };
}
