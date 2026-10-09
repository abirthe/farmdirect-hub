// Component for 3PL logistics dispatch and live GPS tracking.
import { useState } from "react";
import { Truck, Navigation, MapPin, Radio, ShieldCheck, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useShipment, useDispatchShipment, useUpdateShipmentTelemetry } from "../hooks";
import { CARRIER_OPTIONS, formatLogisticsStatus } from "../schemas";

export function LogisticsTracker({
  orderId,
  isFarmerOrAdmin = false,
}: {
  orderId: string;
  isFarmerOrAdmin?: boolean;
}) {
  const { toast } = useToast();
  const shipment = useShipment(orderId);
  const dispatch = useDispatchShipment();
  const updateGps = useUpdateShipmentTelemetry();

  const [carrier, setCarrier] = useState<string>(CARRIER_OPTIONS[0]);
  const [driver, setDriver] = useState("");
  const [plate, setPlate] = useState("");

  const onDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch.mutate(
      { order_id: orderId, carrier_name: carrier, driver_name: driver, vehicle_plate: plate },
      {
        onSuccess: (res) => toast({ title: "3PL Carrier Dispatched", description: `Tracking assigned: ${res.tracking_number}` }),
        onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const onSimulatePing = () => {
    if (!shipment.data) return;
    const currentLat = shipment.data.current_lat || 23.1667;
    const currentLng = shipment.data.current_lng || 89.2167;
    // Simulate slight movement along regional highway (+0.015 lat/lng towards destination depot)
    const nextLat = Math.round((currentLat + 0.015) * 10000) / 10000;
    const nextLng = Math.round((currentLng + 0.02) * 10000) / 10000;

    updateGps.mutate(
      {
        shipmentId: shipment.data.id,
        lat: nextLat,
        lng: nextLng,
        status: "IN_TRANSIT",
        note: `Checkpoint: Highway Toll Plaza GPS ping at ${new Date().toLocaleTimeString()}`,
      },
      {
        onSuccess: () => toast({ title: "GPS Telemetry Updated", description: `Ping broadcast: [${nextLat}, ${nextLng}]` }),
        onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  if (shipment.isLoading) {
    return <p className="text-xs text-muted-foreground animate-pulse">Loading logistics dispatch status…</p>;
  }

  const s = shipment.data;

  return (
    <Card className="border shadow-sm" data-testid="logistics-tracker">
      <CardHeader className="bg-muted/20 pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-bold">3PL Freight Tracking</CardTitle>
        </div>
        {s && (
          <Badge variant="outline" className={`text-xs ${formatLogisticsStatus(s.status).color}`}>
            {formatLogisticsStatus(s.status).label}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {!s ? (
          /* Dispatch Form (for Farmer or Admin when no carrier is dispatched yet) */
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              No 3PL carrier dispatched for this order yet. Dispatch freight to start automated route tracking.
            </p>
            {isFarmerOrAdmin ? (
              <form onSubmit={onDispatch} className="space-y-3 rounded-lg border p-3 bg-card" aria-label="Dispatch Carrier">
                <select
                  aria-label="Select 3PL Carrier"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-3 text-xs"
                >
                  {CARRIER_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    aria-label="Driver Name"
                    placeholder="Driver Name (optional)"
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <Input
                    aria-label="Vehicle Plate"
                    placeholder="Plate (e.g. DHAKA-METRO-11)"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <Button type="submit" size="sm" disabled={dispatch.isPending} className="w-full text-xs">
                  {dispatch.isPending ? "Assigning Carrier…" : "Dispatch 3PL Freight"}
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground">Carrier dispatch pending from the supplier depot.</p>
            )}
          </div>
        ) : (
          /* Active Shipment Tracker */
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg bg-muted/40 p-2.5">
                <span className="text-muted-foreground block text-[10px]">Carrier</span>
                <span className="font-bold">{s.carrier_name}</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5">
                <span className="text-muted-foreground block text-[10px]">Tracking #</span>
                <span className="font-mono font-bold text-primary">{s.tracking_number}</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5">
                <span className="text-muted-foreground block text-[10px]">Driver & Plate</span>
                <span className="font-medium">{s.driver_name || "Assigned Driver"} ({s.vehicle_plate || "N/A"})</span>
              </div>
              <div className="rounded-lg bg-muted/40 p-2.5">
                <span className="text-muted-foreground block text-[10px]">Current GPS</span>
                <span className="font-mono">{s.current_lat?.toFixed(4)}, {s.current_lng?.toFixed(4)}</span>
              </div>
            </div>

            {/* Waypoints Timeline */}
            <div className="space-y-2 border-t pt-3">
              <span className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground">
                <Navigation className="h-3.5 w-3.5 text-primary" />
                Transit Waypoints ({s.waypoints.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {s.waypoints.map((wp, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 rounded bg-muted/30 p-2 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-[11px]">{wp.note}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">[{wp.lat}, {wp.lng}]</p>
                    </div>
                    <time className="text-[10px] text-muted-foreground shrink-0" dateTime={wp.recorded_at}>
                      {new Date(wp.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>
                ))}
              </div>
            </div>

            {isFarmerOrAdmin && (
              <div className="flex justify-end pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  disabled={updateGps.isPending}
                  onClick={onSimulatePing}
                >
                  <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
                  {updateGps.isPending ? "Broadcasting…" : "Simulate GPS Telemetry Ping"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
