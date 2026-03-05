import { BadgeDollarSign, MapPinned, QrCode, Waves } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const buyerSignals = [
  { day: "Mon", value: 62 },
  { day: "Tue", value: 70 },
  { day: "Wed", value: 68 },
  { day: "Thu", value: 79 },
  { day: "Fri", value: 88 },
  { day: "Sat", value: 83 },
];

const workflow = [
  {
    icon: MapPinned,
    title: "Boundary registered",
    text: "Polygon area confirmed at 12.8 hectares.",
  },
  {
    icon: BadgeDollarSign,
    title: "Fair price surfaced",
    text: "Retail benchmark minus logistics sets a clear floor price.",
  },
  {
    icon: QrCode,
    title: "Escrow unlocks on delivery",
    text: "Buyer scans and funds release after crop receipt.",
  },
];

const MarketplacePanel = () => {
  return (
    <section className="section-shell pt-0">
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <Card className="glass-panel overflow-hidden">
          <CardHeader className="pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Marketplace pulse</p>
            <CardTitle className="mt-2 text-2xl font-black">Buyer-ready signals, not blind negotiation.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-[2rem] border border-border/60 bg-background/80 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Maize price trend</p>
                  <p className="mt-1 text-3xl font-black">$318</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-soft">
                  <Waves />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-6 items-end gap-3">
                {buyerSignals.map((item) => (
                  <div key={item.day} className="space-y-2 text-center">
                    <div className="flex h-36 items-end rounded-full bg-muted px-1.5 py-2">
                      <div
                        className="w-full rounded-full bg-primary shadow-soft transition-transform duration-300 hover:-translate-y-1"
                        style={{ height: `${item.value}%` }}
                      />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">{item.day}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="soil-card p-4">
                <p className="text-sm text-muted-foreground">Bulk demand</p>
                <p className="mt-1 text-2xl font-black">26 buyers</p>
              </div>
              <div className="soil-card p-4">
                <p className="text-sm text-muted-foreground">Ready in</p>
                <p className="mt-1 text-2xl font-black">10 days</p>
              </div>
              <div className="soil-card p-4">
                <p className="text-sm text-muted-foreground">Quality docs</p>
                <p className="mt-1 text-2xl font-black">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          {workflow.map(({ icon: Icon, title, text }, index) => (
            <Card key={title} className="soil-card relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1 bg-secondary" />
              <CardContent className="flex items-start gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
                  <Icon />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Step {index + 1}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <h3 className="text-2xl font-black">{title}</h3>
                  <p className="max-w-xl text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketplacePanel;
