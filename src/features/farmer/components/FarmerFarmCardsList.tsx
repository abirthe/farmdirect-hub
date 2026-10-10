// Presentation list of registered farmer land parcels with live NDVI metrics and fast actions.
import { Link } from "react-router-dom";
import { Leaf, Plus, CheckCircle2, Clock, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import type { DisplayFarm } from "../types";

interface FarmerFarmCardsListProps {
  farms: DisplayFarm[];
  loading: boolean;
}

export function FarmerFarmCardsList({ farms, loading }: FarmerFarmCardsListProps) {
  return (
    <div data-testid="farmer-farm-cards-list">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-gradient-primary text-2xl font-black">My farms</h2>
        <Button asChild variant="outline" size="sm" className="hover-lift rounded-full gap-1.5">
          <Link to="/farmer/register">
            <Plus className="h-4 w-4" />
            Add farm
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground" data-testid="farms-loading">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm">Loading your registered farms...</p>
        </div>
      ) : farms.length === 0 ? (
        <Card className="glass-panel hover-lift glass-panel text-center py-12 px-4" data-testid="farms-empty-state">
          <CardContent className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
              <Leaf className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">No registered farms yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Register your agricultural land and GPS field boundaries to start tracking satellite NDVI telemetry and AI yield predictions.
              </p>
            </div>
            <Button asChild className="hover-lift rounded-full gap-2">
              <Link to="/farmer/register">
                <Plus className="h-4 w-4" />
                Register your first farm
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2" data-testid="farms-grid">
          {farms.map((farm) => (
            <Card key={farm.name} className="glass-panel hover-lift overflow-hidden hover:-translate-y-1 transition-transform duration-300">
              <div className="h-1.5 bg-gradient-to-r from-primary to-secondary" />
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge
                      className={
                        farm.status === "Ready"
                          ? "bg-green-100 text-green-700 border-green-200 rounded-full dark:bg-green-950/40 dark:text-green-300 dark:border-green-800"
                          : "bg-amber-100 text-amber-700 border-amber-200 rounded-full dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                      }
                    >
                      {farm.status === "Ready" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {farm.status}
                      {farm.daysLeft > 0 ? ` · ${farm.daysLeft}d` : ""}
                    </Badge>
                    <h3 className="mt-2 text-xl font-black">{farm.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {farm.crop} · {farm.area}
                    </p>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Field health (NDVI)</span>
                    <span className="font-bold">{farm.health}%</span>
                  </div>
                  <Progress value={farm.health} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "NDVI", value: `${farm.ndvi}×` },
                    { label: "Expected yield", value: farm.yield },
                    { label: "Floor price", value: <><CurrencyDisplay amount={318} />/t</> },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl border border-border/60 bg-background/70 p-3 text-center">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="font-black mt-1">{m.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button asChild variant="default" size="sm" className="hover-lift flex-1 rounded-full gap-1.5">
                    <Link to="/marketplace">
                      <ShieldCheck className="h-4 w-4" />
                      List for sale
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="hover-lift flex-1 rounded-full gap-1.5 border-primary/20 hover:bg-primary/5 text-primary hover:text-primary">
                    <Link to={`/farmer/yield/${farm.name.replace(/\s+/g, "-").toUpperCase()}`}>
                      <Sparkles className="h-4 w-4" />
                      AI Yield
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
