import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { ArrowRight, ChartNoAxesCombined, Leaf, Map, ShieldCheck, Warehouse } from "lucide-react";
import { Link } from "react-router-dom";

import heroImage from "@/assets/agrodirect-hero.jpg";
import AgroDirectOverview from "@/components/agrodirect/AgroDirectOverview";
import MarketplacePanel from "@/components/agrodirect/MarketplacePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const heroStats = [
  { label: "GIS mapped", value: "12.8 ha" },
  { label: "Yield forecast", value: "18.4 t" },
  { label: "Fair price", value: <><CurrencyDisplay amount={318} />/t</> },
];

const proofCards = [
  {
    icon: Map,
    title: "Map once, monitor continuously",
    text: "Boundary capture, hectare confirmation, and crop timing optimized for low-bandwidth mobile use.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Forecast what the field can actually deliver",
    text: "Satellite health, historical averages, and weather risk combine into one practical yield outlook.",
  },
  {
    icon: Warehouse,
    title: "Sell direct into verified demand",
    text: "Restaurants, processors, and buyers discover future-ready supply with quality and logistics context baked in.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <section className="relative isolate min-h-screen overflow-hidden">
        <img
          src={heroImage}
          alt="Aerial view of cultivated farmland representing GIS-mapped agricultural intelligence"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="absolute inset-0 bg-aurora opacity-70" />
        <div className="field-grid absolute inset-0 opacity-20" />
        <div className="scan-line pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 motion-safe:animate-sweep md:block" aria-hidden="true" />

        {/* Hero content — extra top padding to clear the sticky Navbar */}
        <div className="section-shell relative flex min-h-screen flex-col pt-28 pb-12 md:pt-32 md:pb-16">
          <div className="relative z-10 grid flex-1 items-end gap-10 py-4 md:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
            <div className="max-w-3xl space-y-6 md:space-y-8">
              <span className="eyebrow border-white/20 bg-white/10 text-white backdrop-blur-sm">Decentralized agriculture platform</span>
              <div className="space-y-4 md:space-y-6">
                <h1 className="max-w-4xl text-5xl font-black leading-[0.95] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
                  Help farmers map land, predict yield, and sell without exploitation.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/85 md:text-lg md:leading-8">
                  AgroDirect turns field boundaries, crop signals, and market pricing into a direct trade engine for growers, buyers, and local food networks.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="hero" size="xl">
                  <Link to="/farmer/register">
                    Start mapping farms
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="soil" size="xl" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                  <Link to="/buyer">View buyer dashboard</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <div key={item.label} className="glass-panel p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/70">{item.label}</p>
                    <p className="mt-2 text-2xl font-black md:text-3xl text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="glass-panel border-primary-foreground/10 bg-card/84 text-card-foreground shadow-lift lg:ml-auto lg:max-w-xl">
              <CardContent className="space-y-6 p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Live field board</p>
                    <h2 className="mt-2 text-3xl font-black">Bogra maize cluster</h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-soft motion-safe:animate-float" aria-hidden="true">
                    <Leaf />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="soil-card p-4">
                    <p className="text-sm text-muted-foreground">NDVI health multiplier</p>
                    <p className="mt-2 text-3xl font-black">1.12x</p>
                    <p className="mt-2 text-sm text-muted-foreground">Canopy density trending above seasonal average.</p>
                  </div>
                  <div className="soil-card p-4">
                    <p className="text-sm text-muted-foreground">Weather risk factor</p>
                    <p className="mt-2 text-3xl font-black">0.94</p>
                    <p className="mt-2 text-sm text-muted-foreground">No frost risk. Minor dry-window alert in 6 days.</p>
                  </div>
                </div>

                <div className="rounded-[2rem] bg-primary px-5 py-5 text-primary-foreground shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-primary-foreground/75">Escrow readiness</p>
                      <p className="mt-2 text-3xl font-black">Ready in 10 days</p>
                      <p className="mt-2 max-w-md text-sm text-primary-foreground/80">
                        Verified buyer demand already exceeds expected output for this cycle.
                      </p>
                    </div>
                    <ShieldCheck className="shrink-0" />
                  </div>
                </div>

                <Button asChild variant="hero" className="w-full gap-2">
                  <Link to="/marketplace">
                    View live marketplace
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <AgroDirectOverview />

      <section className="section-shell pt-0">
        <div className="grid gap-5 md:grid-cols-3">
          {proofCards.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="soil-card h-full overflow-hidden transition-transform duration-300 hover:-translate-y-1">
              <CardContent className="space-y-5 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground shadow-soft">
                  <Icon />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black">{title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <MarketplacePanel />

      {/* Final CTA Section */}
      <section className="section-shell">
        <div className="glass-panel relative overflow-hidden p-10 md:p-16 text-center space-y-6">
          <div className="field-grid absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true" />
          <div className="relative z-10 space-y-6">
            <span className="eyebrow">Join the platform</span>
            <h2 className="text-4xl md:text-5xl font-black max-w-2xl mx-auto">Ready to trade without the middleman?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-7">
              Join 312 farmers and 80+ buyers already using AgroDirect to build fairer, more transparent agricultural trade.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="xl" className="rounded-full gap-2">
                <Link to="/signup">Get started free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="rounded-full">
                <Link to="/marketplace">Browse listings</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
