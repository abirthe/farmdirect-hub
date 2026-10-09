import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SupplierMetric {
  name: string;
  crops: string;
  deals: number;
  rating: number;
  onTime: number;
}

const suppliers: SupplierMetric[] = [
  { name: "Rafiqul Islam", crops: "Maize, Wheat", deals: 12, rating: 4.8, onTime: 100 },
  { name: "Fatema Begum", crops: "Rice", deals: 7, rating: 4.9, onTime: 100 },
  { name: "Abdul Karim", crops: "Soybean", deals: 4, rating: 4.7, onTime: 75 },
];

export function SupplierPerformanceList() {
  return (
    <div>
      <h2 className="text-2xl font-black mb-5">Supplier performance</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {suppliers.map((s) => (
          <Card key={s.name} className="soil-card">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold text-sm shrink-0">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.crops}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-lg border border-border/60 bg-background/70 p-2">
                  <p className="text-xs text-muted-foreground">Deals</p>
                  <p className="font-black">{s.deals}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/70 p-2">
                  <div className="flex items-center justify-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <p className="font-black text-sm">{s.rating}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">On-time delivery</span>
                  <span className="font-bold">{s.onTime}%</span>
                </div>
                <Progress value={s.onTime} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
