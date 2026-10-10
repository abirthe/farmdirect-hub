import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";

const spendData = [
  { month: "Oct", spend: 12400 },
  { month: "Nov", spend: 18200 },
  { month: "Dec", spend: 9800 },
  { month: "Jan", spend: 21300 },
  { month: "Feb", spend: 19500 },
  { month: "Mar", spend: 24600 },
];

export function SpendAnalyticsCard() {
  const { formatCurrency, currency } = useCurrency();
  const getSymbol = () => (currency === "BDT" ? "\u09F3" : currency === "EUR" ? "\u20AC" : "$");

  return (
    <Card className="glass-panel hover-lift glass-panel">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              Spend analytics
            </p>
            <CardTitle className="mt-1 text-2xl font-black">
              Monthly procurement spend ({getSymbol()})
            </CardTitle>
          </div>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={spendData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(102,20%,79%,0.4)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${formatCurrency(v / 1000)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid hsl(102,20%,79%)", fontSize: "12px" }}
              formatter={(v: number) => [`${formatCurrency(v)}`, "Spend"]}
            />
            <Bar dataKey="spend" fill="hsl(112,40%,26%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
