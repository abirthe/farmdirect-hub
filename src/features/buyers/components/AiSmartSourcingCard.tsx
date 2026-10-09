import { Link } from "react-router-dom";
import { BrainCircuit, ArrowRight, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";

const recommendations = [
  { crop: "🌽 Maize", farm: "Bogra Cluster", price: 318, ready: "May 12, 2026", conf: 94.8, grade: "A+" },
  { crop: "🍚 Boro Rice", farm: "Rajshahi A-1", price: 415, ready: "Jun 18, 2026", conf: 91.2, grade: "A+" },
  { crop: "🫘 Soybean", farm: "Rangpur Coll.", price: 520, ready: "Apr 04, 2026", conf: 88.5, grade: "A" },
];

export function AiSmartSourcingCard() {
  return (
    <Card className="glass-panel border-primary/20">
      <CardHeader className="pb-3 border-b border-border/60 bg-primary/5 rounded-t-xl">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-xl font-black">AI Smart Sourcing</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              High-confidence AI verified yields. Zero broker risk.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {recommendations.map((r) => (
          <div
            key={r.crop}
            className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 hover:-translate-y-0.5 transition-transform duration-200"
          >
            <div className="text-xl">{r.crop.split(" ")[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {r.crop.split(" ").slice(1).join(" ")} · {r.farm}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-transparent h-5 text-[10px]"
                >
                  {r.conf}% AI Conf
                </Badge>
                <Badge variant="outline" className="h-5 text-[10px] border-border/60">
                  Grade {r.grade}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">
                <CurrencyDisplay amount={r.price} />/t
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Harvest: {r.ready}</p>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-full shrink-0 text-primary hover:bg-primary/10"
            >
              <Link to="/marketplace/lst-001">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
        <Button asChild variant="outline" className="w-full rounded-full gap-2 mt-1">
          <Link to="/marketplace">
            <ShoppingBag className="h-4 w-4" />
            Browse all listings
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
