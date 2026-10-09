// Public data access for consumer crop traceability.
import { supabase } from "@/lib/supabaseClient";
import { publicTraceSchema, type PublicTrace } from "./schemas";

export async function fetchPublicTrace(orderId: string): Promise<PublicTrace> {
  const { data, error } = await supabase.rpc("get_public_trace", { p_order_id: orderId });
  if (error) {
    throw new Error("Unable to locate batch traceability certificate. The batch ID may be invalid or not yet published.");
  }
  return publicTraceSchema.parse(data);
}
