import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export function AuthBrandSidePanel() {
  return (
    <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-hero-overlay text-white flex-col justify-between p-12">
      <div className="field-grid absolute inset-0 opacity-10" />
      <div className="scan-line pointer-events-none absolute inset-y-0 left-0 w-full motion-safe:animate-sweep" />
      <div className="relative z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
            <Leaf className="h-5 w-5" />
          </div>
          <p className="text-xl font-black text-white">AgroDirect</p>
        </Link>
      </div>
      <div className="relative z-10 space-y-6">
        <div className="space-y-3">
          <span className="eyebrow text-white border-white/20 bg-white/10 backdrop-blur-sm">
            Decentralized agriculture
          </span>
          <h2 className="text-gradient-primary text-4xl font-black text-white leading-tight">
            The direct trade engine for growers and buyers.
          </h2>
          <p className="text-white/80 text-base leading-7">
            Map your land, forecast your yield, and sell direct — no middlemen, no exploitation.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Mapped hectares", value: "14.2k" },
            { label: "Price uplift", value: "+27%" },
            { label: "Accuracy", value: "±8.6%" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/20 bg-white/10 p-4 text-white text-center"
            >
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-white/70 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="relative z-10 text-xs text-white/60">© 2026 AgroDirect</p>
    </div>
  );
}
