// Data access for the audit log; the only file in this feature that calls supabase.
import { supabase } from "@/lib/supabaseClient";
import { auditEntrySchema, chainStatusSchema, type AuditEntry, type ChainStatus } from "./schemas";

export async function fetchAuditLog(limit = 200): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, actor_id, action, entity, entity_id, details, created_at, row_hash")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error("Could not load the audit log.");
  return auditEntrySchema.array().parse(data ?? []);
}

export async function verifyAuditChain(): Promise<ChainStatus> {
  const { data, error } = await supabase.rpc("verify_audit_chain");
  if (error) throw new Error("Could not verify audit log integrity.");
  const row = Array.isArray(data) ? data[0] : data;
  return chainStatusSchema.parse(row);
}
