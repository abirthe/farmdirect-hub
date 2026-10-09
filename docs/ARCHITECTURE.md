# Backend Architecture

Stack: React/Vite client → Supabase (Postgres + Auth + RLS + RPC). No custom server; the
database is the API and enforces all rules.

## Layers
- **Reads:** `supabase.from(...)` filtered by RLS (listings public when ACTIVE; orders/notifications
  private; telemetry owner/admin only).
- **Writes with business rules:** RPC only (`SECURITY DEFINER`, `search_path` pinned):
  - `place_order(listing_id, qty)` – price, stock lock, farmer derivation all server-side.
  - `transition_order(order_id, status)` – the only legal order state machine.
  - `admin_set_user_status(user_id, status)` – admin-only.
- **Direct client writes allowed:** `farms`, `crop_cycles`, own `full_name`, own `notifications.is_read`.
- **Audit:** `audit_log` records order and admin actions (admin read-only).

## Order state machine
INITIATED →(admin/service, payment webhook) ESCROW_LOCKED →(farmer) IN_TRANSIT →(buyer) DELIVERED
→(buyer/admin) RELEASED. Buyer may DISPUTE from ESCROW_LOCKED/IN_TRANSIT/DELIVERED; admin resolves.

## Client usage
```ts
await supabase.rpc('place_order', { p_listing_id, p_qty });
await supabase.rpc('transition_order', { p_order_id, p_new_status: 'IN_TRANSIT' });
```
Errors surface as codes in `error.message` (e.g. `INSUFFICIENT_STOCK`, `ILLEGAL_TRANSITION`).

## Open items
- Payment provider webhook (Edge Function using `service_role`) to call `transition_order(..., 'ESCROW_LOCKED')`.
- Remove obsolete `supabase_schema.sql` (destructive DROPs) and the Prisma-style init migration drift.
- Rotate keys if any were committed; run `npx supabase gen types typescript --linked` after `db push`.
