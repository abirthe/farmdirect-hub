// Zod schemas and transit calculations for 3PL logistics tracking.
import { z } from "zod";

export const shipmentStatusSchema = z.enum(["PENDING_PICKUP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"]);
export type ShipmentStatus = z.infer<typeof shipmentStatusSchema>;

export const waypointSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  status: z.string(),
  note: z.string(),
  recorded_at: z.string(),
});
export type Waypoint = z.infer<typeof waypointSchema>;

export const shipmentSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  carrier_name: z.string(),
  tracking_number: z.string(),
  driver_name: z.string().nullable(),
  vehicle_plate: z.string().nullable(),
  status: shipmentStatusSchema,
  current_lat: z.coerce.number().nullable(),
  current_lng: z.coerce.number().nullable(),
  waypoints: z.array(waypointSchema),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Shipment = z.infer<typeof shipmentSchema>;

export const dispatchInputSchema = z.object({
  order_id: z.string().uuid("Invalid order ID"),
  carrier_name: z.string().trim().min(2, "Carrier name is required").max(60),
  driver_name: z.string().max(80).optional(),
  vehicle_plate: z.string().max(30).optional(),
});
export type DispatchInput = z.infer<typeof dispatchInputSchema>;

export const CARRIER_OPTIONS = [
  "RedX Agro Freight",
  "Sundarban Express Logistics",
  "Paperfly Cold Chain",
  "Pathao Cargo",
  "SA Paribahan Agri Transit",
] as const;

export function formatLogisticsStatus(status: ShipmentStatus): { label: string; color: string } {
  switch (status) {
    case "PENDING_PICKUP": return { label: "Dispatched · Awaiting Pickup", color: "bg-amber-500/10 text-amber-600 border-amber-300" };
    case "IN_TRANSIT": return { label: "Freight in Transit", color: "bg-blue-500/10 text-blue-600 border-blue-300" };
    case "OUT_FOR_DELIVERY": return { label: "Out for Final Delivery", color: "bg-purple-500/10 text-purple-600 border-purple-300" };
    case "DELIVERED": return { label: "Completed & Received", color: "bg-emerald-500/10 text-emerald-600 border-emerald-300" };
  }
}
