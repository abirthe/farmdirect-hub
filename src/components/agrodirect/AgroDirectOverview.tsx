import { ArrowUpRight, CloudSun, ScanSearch, ShieldCheck, Sprout, Tractor } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const loops = [
  {
    icon: ScanSearch,
    title: "Map every field",
    text: "Farmers draw boundaries once and instantly get hectare confirmation, crop context, and harvest timing.",
  },
  {
    icon: CloudSun,
    title: "Forecast every yield",
    text: "Yield signals combine crop history, satellite health, and weather risk into one decision-ready score.",
  },
  {
    icon: ShieldCheck,
    title: "Trade without middlemen",
    text: "Buyers lock supply early, farmers keep more margin, and escrow closes the trust gap at delivery.",
  },
];

const stats = [
  { label: "Mapped hectares", value: "14.2k" },
  { label: "Prediction accuracy", value: "±8.6%" },
  { label: "Farmer price uplift", value: "+27%" },
];

const cockpit = [
  { label: "Field health", value: "0.91 NDVI", detail: "Moisture stress low" },
  { label: "Yield outlook", value: "18.4 tons", detail: "2.1 tons above local avg" },
  { label: "Market floor", value: "$318 / ton", detail: "Logistics already deducted" },
];

const AgroDirectOverview = () => {
  return (
    <section className="section-shell">
      <div className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-4">
          <span className="eyebrow">Built for farmers, buyers, and field ops</span>
          <h2 className="text-3xl font-black md:text-5xl">A field-to-contract interface that turns land data into market power.</h2>
          <p className="text-base leading-7 text-muted-foreground md:text-lg">
            AgroDirect blends GIS mapping, yield intelligence, and a direct marketplace into one mobile-first flow that works in real farming conditions.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 md:w-[28rem]">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-panel p-4 text-center">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</div>
              <div className="mt-2 text-2xl font-black">{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-5 md:grid-cols-3">
          {loops.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="soil-card overflow-hidden">
              <CardHeader className="space-y-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
                  <Icon />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl font-extrabold">{title}</CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="glass-panel overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Farmer cockpit</p>
              <CardTitle className="mt-2 text-2xl font-black">Today’s farm intelligence</CardTitle>
            </div>
            <Tractor className="text-primary" />
          </CardHeader>
          <CardContent className="space-y-4">
            {cockpit.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-2xl font-black">{item.value}</p>
                  </div>
                  <ArrowUpRight className="text-primary" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.detail}</p>
              </div>
            ))}
            <div className="rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/80">Best next move</p>
                  <p className="mt-1 text-lg font-bold">List maize now for delivery in 10 days</p>
                </div>
                <Sprout className="shrink-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AgroDirectOverview;
