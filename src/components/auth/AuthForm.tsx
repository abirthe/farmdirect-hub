import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Leaf, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Role = "farmer" | "buyer" | "admin";

interface AuthFormProps {
  mode: "login" | "signup";
}

const roleOptions: { value: Role; label: string; desc: string; emoji: string }[] = [
  { value: "farmer", label: "Farmer", desc: "Map, monitor, and sell your crops directly", emoji: "🌾" },
  { value: "buyer", label: "Buyer", desc: "Discover verified supply and lock in prices", emoji: "🏢" },
  { value: "admin", label: "Admin", desc: "Verify land titles and resolve disputes", emoji: "🛡️" },
];

const AuthForm = ({ mode }: AuthFormProps) => {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>("farmer");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const isLogin = mode === "login";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth — redirect based on role
    setTimeout(() => {
      setLoading(false);
      if (isLogin) {
        navigate("/farmer");
      } else {
        navigate(role === "buyer" ? "/buyer" : role === "admin" ? "/admin" : "/farmer");
      }
    }, 1200);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-primary flex-col justify-between p-12">
        <div className="field-grid absolute inset-0 opacity-10" />
        <div className="scan-line pointer-events-none absolute inset-y-0 left-0 w-full motion-safe:animate-sweep" />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <p className="text-xl font-black text-primary-foreground">AgroDirect</p>
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <span className="eyebrow text-primary-foreground border-primary-foreground/20 bg-primary-foreground/10">
              Decentralized agriculture
            </span>
            <h2 className="text-4xl font-black text-primary-foreground leading-tight">
              The direct trade engine for growers and buyers.
            </h2>
            <p className="text-primary-foreground/75 text-base leading-7">
              Map your land, forecast your yield, and sell direct — no middlemen, no exploitation.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{ label: "Mapped hectares", value: "14.2k" }, { label: "Price uplift", value: "+27%" }, { label: "Accuracy", value: "±8.6%" }].map(s => (
              <div key={s.label} className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4 text-primary-foreground text-center">
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-primary-foreground/70 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-primary-foreground/50">© 2026 AgroDirect</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Leaf className="h-4 w-4" />
              </div>
              <p className="text-lg font-black">AgroDirect</p>
            </Link>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black">{isLogin ? "Welcome back" : "Create your account"}</h1>
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Sign in to access your farm intelligence dashboard." : "Join the direct agriculture marketplace."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector for signup */}
            {!isLogin && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">I am a…</Label>
                <div className="grid gap-2">
                  {roleOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                        role === opt.value
                          ? "border-primary bg-primary/8 shadow-soft"
                          : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/50"
                      )}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <p className={cn("font-semibold text-sm", role === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <div className={cn(
                        "ml-auto h-4 w-4 rounded-full border-2 transition-all",
                        role === opt.value ? "border-primary bg-primary" : "border-border"
                      )} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name (signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-10 h-12 rounded-xl border-border/60"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="pl-10 h-12 rounded-xl border-border/60"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                {isLogin && (
                  <Link to="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10 pr-10 h-12 rounded-xl border-border/60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl gap-2" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {isLogin ? "Signing in…" : "Creating account…"}</>
              ) : (
                <>{isLogin ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Link to={isLogin ? "/signup" : "/login"} className="font-semibold text-primary hover:underline">
              {isLogin ? "Sign up free" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
