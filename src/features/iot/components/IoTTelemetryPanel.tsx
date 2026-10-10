// Dashboard panel for field IoT sensor probes and live soil telemetry.
import { useState } from "react";
import { Cpu, Battery, Radio, Plus, Droplets, Thermometer, FlaskConical, AlertCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSensorDevices, useTelemetryLogs, useRegisterDevice, useIngestTelemetry } from "../hooks";
import { evaluateNpkHealth, type DeviceType } from "../schemas";

export function IoTTelemetryPanel({ cycleId }: { cycleId: string }) {
  const { toast } = useToast();
  const devices = useSensorDevices(cycleId);
  const telemetry = useTelemetryLogs(cycleId);
  const register = useRegisterDevice();
  const ingest = useIngestTelemetry();

  const [serial, setSerial] = useState("");
  const [deviceType, setDeviceType] = useState<DeviceType>("SOIL_PROBE_NPK");

  const onRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serial.trim()) return;
    register.mutate(
      { cycleId, serial: serial.trim(), type: deviceType },
      {
        onSuccess: () => {
          setSerial("");
          toast({ title: "IoT Sensor Paired", description: "Hardware probe registered to this crop cycle." });
        },
        onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const onSimulatePing = (deviceSerial: string) => {
    // Generates a field reading with healthy NPK and moisture values
    ingest.mutate(
      {
        crop_cycle_id: cycleId,
        device_serial: deviceSerial,
        soil_moisture_percent: 58.5,
        avg_temp_celsius: 28.2,
        rainfall_mm: 12.0,
        npk_nitrogen: 85,
        npk_phosphorus: 45,
        npk_potassium: 62,
        soil_ph: 6.8,
      },
      {
        onSuccess: () => toast({ title: "IoT Telemetry Ingested", description: "Real-time probe data synced into crop cycle telemetry." }),
        onError: (err) => toast({ title: (err as Error).message, variant: "destructive" }),
      }
    );
  };

  const latest = (telemetry.data ?? [])[0];
  const npkEval = latest?.npk_nitrogen
    ? evaluateNpkHealth(latest.npk_nitrogen, latest.npk_phosphorus || 0, latest.npk_potassium || 0)
    : null;

  return (
    <div className="space-y-6" data-testid="iot-telemetry-panel">
      {/* Latest Soil & Microclimate Metrics */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="glass-panel hover-lift p-3.5 space-y-1 bg-card">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-blue-500" /> Soil Moisture
            </span>
            <p className="text-2xl font-black">{latest.soil_moisture_percent}%</p>
            <p className="text-[10px] text-muted-foreground">Source: {latest.source}</p>
          </Card>

          <Card className="glass-panel hover-lift p-3.5 space-y-1 bg-card">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Thermometer className="h-3.5 w-3.5 text-amber-500" /> Soil Temperature
            </span>
            <p className="text-2xl font-black">{latest.avg_temp_celsius}°C</p>
            <p className="text-[10px] text-muted-foreground">Root Zone Temperature</p>
          </Card>

          <Card className="glass-panel hover-lift p-3.5 space-y-1 bg-card">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-emerald-500" /> N-P-K Levels
            </span>
            <p className="text-xl font-bold font-mono">
              {latest.npk_nitrogen || 0}-{latest.npk_phosphorus || 0}-{latest.npk_potassium || 0}
            </p>
            {npkEval && (
              <Badge variant="outline" className={`text-[10px] ${npkEval.status === "OPTIMAL" ? "text-emerald-600 border-emerald-400" : "text-amber-600 border-amber-400"}`}>
                {npkEval.status}
              </Badge>
            )}
          </Card>

          <Card className="glass-panel hover-lift p-3.5 space-y-1 bg-card">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Soil pH
            </span>
            <p className="text-2xl font-black">{latest.soil_ph || 6.5}</p>
            <p className="text-[10px] text-muted-foreground">Fungal Factor: {latest.fungal_risk_factor}</p>
          </Card>
        </div>
      )}

      {npkEval && (
        <div className="rounded-lg border bg-muted/30 p-3 text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Agronomic Prescription: </span>
            <span className="text-muted-foreground">{npkEval.advice}</span>
          </div>
        </div>
      )}

      {/* Sensor Probes Registry */}
      <Card className="glass-panel hover-lift border shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">Field IoT Sensor Probes</CardTitle>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {(devices.data ?? []).length} Probes Active
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Pair New Sensor Form */}
          <form onSubmit={onRegister} className="flex flex-col sm:flex-row gap-2" aria-label="Register IoT Sensor">
            <Input
              aria-label="Probe Serial Number"
              placeholder="Hardware Probe Serial (e.g. SN-SOIL-884)"
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              className="h-9 text-xs flex-1"
            />
            <select
              aria-label="Sensor Type"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as DeviceType)}
              className="h-9 rounded-md border bg-background px-3 text-xs"
            >
              <option value="SOIL_PROBE_NPK">Soil Probe (Moisture & NPK)</option>
              <option value="WEATHER_STATION">Micro-Weather Station</option>
              <option value="LEAF_WETNESS_SENSOR">Leaf Wetness Probe</option>
            </select>
            <Button type="submit" size="sm" disabled={register.isPending || !serial.trim()} className="hover-lift gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> Pair Probe
            </Button>
          </form>

          {/* Device List */}
          {devices.isLoading && <p className="text-xs text-muted-foreground">Scanning hardware telemetry...</p>}
          {(devices.data ?? []).length === 0 && (
            <p data-testid="iot-empty" className="text-xs text-muted-foreground text-center py-4">
              No IoT sensor probes paired yet. Register a probe above to enable direct automated telemetry.
            </p>
          )}

          <div className="space-y-2">
            {(devices.data ?? []).map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{d.device_serial}</span>
                    <Badge variant="outline" className="text-[10px]">{d.device_type}</Badge>
                    <Badge variant={d.status === "ACTIVE" ? "secondary" : "outline"} className="text-[10px]">
                      {d.status}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Last transmission: {d.last_ping ? new Date(d.last_ping).toLocaleTimeString() : "Never"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                    <Battery className="h-3.5 w-3.5 text-emerald-500" /> {d.battery_level}%
                  </span>
                  <Button size="sm"
                    variant="outline"
                    className="hover-lift h-7 text-[11px] gap-1"
                    disabled={ingest.isPending}
                    onClick={() => onSimulatePing(d.device_serial)}
                  >
                    <Radio className="h-3 w-3 text-primary animate-pulse" /> Ping Telemetry
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



