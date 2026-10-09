// Zod schemas and pure helpers for the admin audit log feature.
import { z } from "zod";

export const auditEntrySchema = z.object({
  id: z.string().uuid(),
  actor_id: z.string().uuid().nullable(),
  action: z.string(),
  entity: z.string(),
  entity_id: z.string().uuid(),
  details: z.record(z.unknown()),
  created_at: z.string(),
  row_hash: z.string().nullable(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const chainStatusSchema = z.object({
  ok: z.boolean(),
  checked: z.coerce.number(),
  broken_id: z.string().uuid().nullable(),
});
export type ChainStatus = z.infer<typeof chainStatusSchema>;

export interface AuditFilter {
  search: string;
}

/** Case-insensitive match across action, entity and entity id. */
export function filterAuditEntries(entries: AuditEntry[], { search }: AuditFilter): AuditEntry[] {
  const q = search.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((e) =>
    [e.action, e.entity, e.entity_id].some((v) => v.toLowerCase().includes(q)),
  );
}

/** Actions that move money and deserve visual emphasis. */
export const isCriticalAction = (action: string) => /force|release|refund/i.test(action);
