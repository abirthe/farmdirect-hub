// Area chart comparing predicted maize yields against actual harvests.
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { YieldHistoryPoint } from "../types";

const defaultYieldHistory: YieldHistoryPoint[] = [
  { month: "Oct", actual: 14.2, predicted: 15 },
  { month: "Nov", actual: 15.8, predicted: 16 },
  { month: "Dec", actual: 13.5, predicted: 14 },
  { month: "Jan", actual: 17.1, predicted: 17 },
  { month: "Feb", actual: 16.9, predicted: 18 },
  { month: "Mar", actual: null, predicted: 18.4 },
];

interface FarmerYieldChartProps {
  data?: YieldHistoryPoint[];
}

export function FarmerYieldChart({ data = defaultYieldHistory }: FarmerYieldChartProps) {
  return (
    <Card className="glass-panel hover-lift glass-panel" data-testid="farmer-yield-chart">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">Yield intelligence</p>
            <CardTitle className="mt-1 text-2xl font-black">Maize yield forecast vs. actual</CardTitle>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full">Live data</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="predictedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(112,40%,26%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(112,40%,26%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(46,86%,63%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(46,86%,63%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(102,20%,79%,0.4)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid hsl(102,20%,79%)", fontSize: "12px" }}
              formatter={(v: number) => [`${v}t`, ""]}
            />
            <Area type="monotone" dataKey="predicted" stroke="hsl(112,40%,26%)" strokeWidth={2} fill="url(#predictedGrad)" name="Predicted" strokeDasharray="4 2" />
            <Area type="monotone" dataKey="actual" stroke="hsl(46,86%,63%)" strokeWidth={2.5} fill="url(#actualGrad)" name="Actual" dot={{ r: 4, fill: "hsl(46,86%,63%)" }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-5 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-6 rounded-full bg-primary opacity-60" style={{ backgroundImage: "repeating-linear-gradient(90deg,transparent,transparent 4px,white 4px,white 6px)" }} />
            <span className="text-xs text-muted-foreground">Predicted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-6 rounded-full bg-secondary" />
            <span className="text-xs text-muted-foreground">Actual</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
