import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Leaf, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { usePageMeta } from "@/hooks/usePageMeta";
import { deriveRole } from "@/lib/authUtils";
import { AuthBrandSidePanel } from "./AuthBrandSidePanel";

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
  const { toast } = useToast();
  
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>("farmer");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const isLogin = mode === "login";

  usePageMeta({
    title: isLogin ? "Sign In" : "Create Account",
    description: isLogin
      ? "Sign in to access your farm intelligence dashboard."
      : "Join the direct agriculture marketplace.",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw new Error(error.message);

        // Fetch user profile from database to determine true role
        let dbRole: string | null = null;
        if (data.user?.id) {
          const { data: profile } = await supabase
            .from("users")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle();
          if (profile) dbRole = profile.role;
        }

        const targetRole = deriveRole(data.user, dbRole);
        toast({
          title: "Welcome back!",
          description: "Signed in successfully.",
        });

        if (targetRole === "admin") {
          navigate("/admin");
        } else if (targetRole === "buyer") {
          navigate("/buyer");
        } else {
          navigate("/farmer");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: form.name.trim(),
              role: role,
            },
          },
        });

        if (error) throw new Error(error.message);

        if (data.session) {
          toast({
            title: "Account Created Successfully!",
            description: "Welcome to the AgroDirect native network.",
          });
          const targetRole = deriveRole(data.user, role);
          navigate(targetRole === "buyer" ? "/buyer" : targetRole === "admin" ? "/admin" : "/farmer");
        } else {
          toast({
            title: "Registration Initiated!",
            description: "Please check your email inbox to confirm your account before signing in.",
          });
          navigate("/login");
        }
      }
    } catch (err: unknown) {
      console.error("Authentication exception:", err);
      const rawMessage = err instanceof Error ? err.message : "An unknown error occurred";
      const isFetchFailure = rawMessage.toLowerCase().includes("failed to fetch") || rawMessage.toLowerCase().includes("fetch failed");
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: isFetchFailure
          ? "Unable to reach the authentication service. Please check your network connection or try again."
          : rawMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AuthBrandSidePanel />

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
                  {roleOptions.map((opt) => (
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
                        <p className={cn("font-semibold text-sm", role === opt.value ? "text-primary" : "text-foreground")}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <div
                        className={cn(
                          "ml-auto h-4 w-4 rounded-full border-2 transition-all",
                          role === opt.value ? "border-primary bg-primary" : "border-border"
                        )}
                      />
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
