// Data access for 3PL logistics and live GPS transit telemetry.
import { supabase } from "@/lib/supabaseClient";
import { shipmentSchema, dispatchInputSchema, type Shipment, type DispatchInput } from "./schemas";

export async function fetchShipmentByOrder(orderId: string): Promise<Shipment | null> {
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load logistics details.");
  }
  if (!data) return null;
  return shipmentSchema.parse(data);
}

export async function dispatchShipment(input: DispatchInput): Promise<Shipment> {
  const v = dispatchInputSchema.parse(input);
  const { data, error } = await supabase.rpc("dispatch_shipment", {
    p_order_id: v.order_id,
    p_carrier: v.carrier_name,
    p_driver_name: v.driver_name || null,
    p_vehicle: v.vehicle_plate || null,
  });

  if (error) {
    throw new Error(error.message || "Failed to dispatch 3PL carrier.");
  }
  return shipmentSchema.parse(data);
}

export async function updateShipmentTelemetry(
  shipmentId: string,
  lat: number,
  lng: number,
  status = "IN_TRANSIT",
  note = "Transit waypoint update"
): Promise<Shipment> {
  const { data, error } = await supabase.rpc("update_shipment_telemetry", {
    p_shipment_id: shipmentId,
    p_lat: lat,
    p_lng: lng,
    p_status: status,
    p_note: note,
  });

  if (error) {
    throw new Error(error.message || "Failed to update transit telemetry.");
  }
  return shipmentSchema.parse(data);
}
