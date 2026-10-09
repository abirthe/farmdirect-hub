// Domain types for farmer telemetry, dashboard KPIs, and plots.
import type { ReactNode } from "react";

export interface DisplayFarm {
  id: string;
  name: string;
  crop: string;
  area: string;
  ndvi: number;
  yield: string;
  status: "Ready" | "Registered" | "In Review";
  daysLeft: number;
  health: number;
}

export interface YieldHistoryPoint {
  month: string;
  actual: number | null;
  predicted: number;
}

export interface FieldAlert {
  type: "warning" | "success" | "info";
  text: string;
  time: string;
}

export interface FarmerKpi {
  label: string;
  value: ReactNode;
  sub: string;
  trend: string;
}
