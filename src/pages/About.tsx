import { Link } from "react-router-dom";
import { Leaf, Target, Users, Globe, ArrowRight, CheckCircle2, Sprout, Map, TrendingUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const milestones = [
  { year: "2023", title: "The problem identified", text: "Farmers in Rajshahi Division received 35% less than market price for their maize due to middleman chains." },
  { year: "2024", title: "Research & prototyping", text: "Partnered with 40 smallholder farms to test GIS boundary mapping and yield prediction models." },
  { year: "2025", title: "Platform launch", text: "Launched AgroDirect with 312 verified farmers and $1.2M in transactions in the first 6 months." },
  { year: "2026", title: "Scaling across South Asia", text: "Expanding to Nepal, Sri Lanka, and Vietnam. 14,200 hectares now mapped and monitored." },
];

const team = [
  { 
    name: "Abir Hossain", 
    role: "Founder & AI/ML Engineer", 
    bio: "As a Computer Science & Engineering student specializing in Artificial Intelligence, Abir builds predictive machine learning models to solve real-world agricultural inequalities. His work bridges the gap between deep tech and grassroots farming." 
  },
];

const values = [
  { icon: Target, title: "Radical transparency", text: "Every price, every fee, every data source is fully visible to all parties." },
  { icon: Users, title: "Farmer-first design", text: "Every feature is tested with real farmers in the field on low-bandwidth devices." },
  { icon: Globe, title: "Local impact", text: "We measure success by how much more money reaches the farmer—not platform revenue." },
  { icon: ShieldCheck, title: "Trust through technology", text: "Satellite data, escrow, and quality certs eliminate the need to trust a middleman." },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="field-grid absolute inset-0 opacity-10" />
        <div className="scan-line pointer-events-none absolute inset-y-0 left-0 w-1/2 motion-safe:animate-sweep" />
        <div className="container relative z-10 py-24 md:py-32">
          <div className="max-w-3xl space-y-6">
            <span className="eyebrow border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
              Our mission
            </span>
            <h1 className="text-5xl md:text-6xl font-black text-primary-foreground leading-tight">
              We exist to end middleman exploitation in agriculture.
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-8 max-w-2xl">
              AgroDirect is a decentralized agriculture platform connecting farmers directly to buyers using satellite intelligence, machine learning forecasting, and escrow-protected trade.
            </p>
            <div className="flex gap-3">
              <Button asChild variant="hero" size="lg" className="rounded-full gap-2">
                <Link to="/signup">Join the platform <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="soil" size="lg" className="rounded-full border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/16">
                <Link to="/marketplace">View marketplace</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="border-y border-border/60 bg-card/50">
        <div className="container py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { label: "Hectares mapped", value: "14,200+" },
              { label: "Verified farmers", value: "312" },
              { label: "Avg farmer price uplift", value: "+27%" },
              { label: "Yield prediction accuracy", value: "±8.6%" },
            ].map(s => (
              <div key={s.label} className="text-center space-y-1">
                <p className="text-3xl font-black">{s.value}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission */}
      <section className="section-shell">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="eyebrow">The problem we solve</span>
            <h2 className="text-4xl font-black leading-tight">A farmer earns 35 cents for every dollar of food value they create.</h2>
            <p className="text-muted-foreground leading-7">
              The average smallholder farmer in Bangladesh receives just 35% of the final sale price of their crop. The remaining 65% is captured by intermediary chains — aggregators, transporters, and wholesale buyers — who exploit information asymmetry.
            </p>
            <p className="text-muted-foreground leading-7">
              AgroDirect eliminates this by giving farmers satellite-grade yield intelligence, fair price discovery, and a direct marketplace where buyers compete for supply before it's even harvested.
            </p>
            <div className="space-y-3">
              {["GIS field mapping removes land dispute risk", "NDVI monitoring catches crop stress before loss", "Fair price calculation removes negotiation power from middlemen", "Escrow protects both buyer and farmer at delivery"].map(p => (
                <div key={p} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm leading-6">{p}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Map, label: "Map", text: "Boundary capture in minutes, not weeks." },
              { icon: Sprout, label: "Forecast", text: "ML-driven yield predictions per field." },
              { icon: TrendingUp, label: "Price", text: "Real-time floor pricing, no negotiation games." },
              { icon: ShieldCheck, label: "Trade", text: "Escrow-protected deals, zero defaults." },
            ].map(({ icon: Icon, label, text }) => (
              <div key={label} className="soil-card p-6 space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-bold">{label}</p>
                <p className="text-sm text-muted-foreground leading-5">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-shell pt-0">
        <div className="mb-10 space-y-4 max-w-2xl">
          <span className="eyebrow">Our values</span>
          <h2 className="text-4xl font-black">What we believe in</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="soil-card hover:-translate-y-1 transition-transform duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="font-black text-lg">{title}</p>
                  <p className="text-sm text-muted-foreground leading-6">{text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="section-shell pt-0">
        <div className="mb-10 space-y-4 max-w-2xl">
          <span className="eyebrow">Our journey</span>
          <h2 className="text-4xl font-black">From a field observation to a continent-wide platform</h2>
        </div>
        <div className="relative ml-4 space-y-0 border-l-2 border-primary/30 pl-8">
          {milestones.map((m, i) => (
            <div key={m.year} className="relative pb-10 last:pb-0">
              <div className="absolute -left-[2.7rem] flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-card text-xs font-black text-primary">
                {m.year.slice(2)}
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-1">{m.year}</p>
              <h3 className="text-xl font-black">{m.title}</h3>
              <p className="text-muted-foreground text-sm mt-2 leading-6 max-w-xl">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="section-shell pt-0">
        <div className="mb-10 space-y-4 max-w-2xl">
          <span className="eyebrow">The team</span>
          <h2 className="text-4xl font-black">Built by people who grew up near the problem</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-5">
          {team.map(({ name, role, bio }) => (
            <Card key={name} className="glass-panel w-full max-w-xs text-left">
              <CardContent className="p-6 space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-black">
                  {name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <p className="font-black text-lg">{name}</p>
                  <p className="text-xs uppercase tracking-[0.15em] text-primary font-semibold">{role}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-5">{bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-shell pt-0">
        <Card className="glass-panel overflow-hidden">
          <div className="field-grid absolute inset-0 opacity-10" />
          <CardContent className="relative z-10 p-10 md:p-16 text-center space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto motion-safe:animate-float">
              <Leaf className="h-8 w-8" />
            </div>
            <h2 className="text-4xl font-black max-w-xl mx-auto">Ready to trade without the middleman?</h2>
            <p className="text-muted-foreground max-w-md mx-auto leading-7">Join 312 farmers and 80+ buyers already using AgroDirect to build fairer agricultural trade.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="xl" className="rounded-full gap-2">
                <Link to="/signup">Get started free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="rounded-full">
                <Link to="/marketplace">Browse listings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default About;
