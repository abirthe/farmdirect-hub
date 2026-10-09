// Field alerts and proactive operational guidance recommendations.
import { Bell, AlertTriangle, CheckCircle2, ArrowUpRight, Sprout } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FieldAlert } from "../types";

const defaultAlerts: FieldAlert[] = [
  { type: "warning", text: "Dry-window alert in 6 days. Schedule irrigation.", time: "2h ago" },
  { type: "success", text: "NDVI reading improved 8.3% vs last week.", time: "1d ago" },
  { type: "info", text: "New buyer demand: 3 buyers interested in Sorghum Block.", time: "2d ago" },
];

interface FarmerFieldAlertsProps {
  alerts?: FieldAlert[];
}

export function FarmerFieldAlerts({ alerts = defaultAlerts }: FarmerFieldAlertsProps) {
  return (
    <Card className="glass-panel" data-testid="farmer-field-alerts">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-black flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Field alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map(({ type, text, time }) => (
          <div key={text} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
            {type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />}
            {type === "success" && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />}
            {type === "info" && <ArrowUpRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-5">{text}</p>
              <p className="text-xs text-muted-foreground mt-1">{time}</p>
            </div>
          </div>
        ))}
        <div className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground">
          <div className="flex items-start gap-2">
            <Sprout className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-primary-foreground/75">Best next move</p>
              <p className="font-bold text-sm mt-1">List maize now — 26 buyers active this week</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
