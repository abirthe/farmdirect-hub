import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export interface DatabaseListing {
  id: string;
  quantity_tons: number;
  floor_price_per_ton: number;
  quality_grade: string | null;
  status: string | null;
  crop_cycles: {
    crop_type: string;
    status: string | null;
    farms: {
      farm_name: string;
      location_name: string | null;
      total_hectares: number | null;
      users: {
        full_name: string | null;
      } | null;
    } | null;
  } | null;
}

export function useMarketplaceListings() {
  return useQuery({
    queryKey: ["marketplace-listings"],
    queryFn: async (): Promise<DatabaseListing[]> => {
      const { data, error } = await supabase.from("listings").select(`
        id, quantity_tons, floor_price_per_ton, quality_grade, status,
        crop_cycles ( crop_type, status, farms ( farm_name, location_name, total_hectares, users ( full_name ) ) )
      `);
      if (error) throw error;
      return (data as unknown as DatabaseListing[]) || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minute cache
  });
}
