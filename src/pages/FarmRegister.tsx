import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Leaf, CalendarDays, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import MapView from "@/components/ui/map-view";

const steps = ["Map field", "Crop details", "Confirm & submit"];

const cropOptions = [
  "Maize", "Wheat", "Millet", "Rice", "Potato", "Jute", "Soybean",
  "Cotton", "Groundnut", "Tomato", "Pepper",
];

const FarmRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    farmName: "",
    location: "",
    area: "",
    crop: "",
    sowingDate: "",
    harvestDate: "",
    notes: "",
    boundary: [] as [number, number][],
  });

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Authentication required", description: "You must be logged in to register a farm." });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.from('farms').insert([
        { 
          user_id: user.id, 
          farm_name: form.farmName || "Unnamed Farm Block", 
          location_name: form.location, 
          total_hectares: parseFloat(form.area) || 0,
          boundary_coordinates: form.boundary 
        }
      ]);

      if (error) {
        throw new Error(error.message);
      }
      
      console.log("Supabase direct transaction successful:", data);
      toast({ title: "Success", description: "Farm registered successfully!" });
      navigate("/farmer");
    } catch (error: unknown) {
      console.error("Failed to insert Farm into Supabase:", error);
      toast({
        variant: "destructive",
        title: "Database Error",
        description: error instanceof Error ? error.message : "Could not register farm. Ensure you are completely authenticated."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-6 flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full shrink-0">
            <Link to="/farmer"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black">Register a new farm</h1>
            <p className="text-sm text-muted-foreground">Map your field, add crop details, and unlock yield intelligence.</p>
          </div>
        </div>
      </div>

      <div className="container py-10 max-w-3xl">
        {/* Stepper */}
        <div className="flex items-center gap-0 mb-10">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 font-bold text-sm transition-all duration-300",
                  i < step ? "border-primary bg-primary text-primary-foreground"
                    : i === step ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                )}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn(
                  "text-xs font-semibold whitespace-nowrap",
                  i === step ? "text-primary" : "text-muted-foreground"
                )}>{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-3 mb-5 transition-all duration-300", i < step ? "bg-primary" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Map Field */}
        {step === 0 && (
          <Card className="glass-panel">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black">Field location & boundary</h2>
                <p className="text-muted-foreground text-sm">Enter your farm's location. In a future update, you'll draw boundaries directly on an interactive map.</p>
              </div>

              {/* GIS Geoman Powered Form Map */}
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted z-0">
                <MapView 
                  interactive={true}
                  height="340px"
                  zoom={7}
                  center={[23.8103, 90.4125]} // Local context
                  polygons={form.boundary.length >= 3 ? [form.boundary] : []}
                  enableDrawing={true}
                  onPolygonDrawn={(poly) => {
                    setForm({ ...form, boundary: poly });
                  }}
                />
                <div className="absolute top-3 right-3 z-[400] pointer-events-none">
                  <div className="glass-panel px-3 py-1.5 text-xs font-semibold bg-background/90 text-primary whitespace-nowrap">
                    {form.boundary.length > 0 ? "Boundary tracked securely ✓" : "Use drawing tools on left"}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="farmName" className="text-sm font-semibold">Farm name</Label>
                  <Input id="farmName" placeholder="e.g. Bogra Maize Plot A" value={form.farmName}
                    onChange={e => setForm({ ...form, farmName: e.target.value })}
                    className="h-12 rounded-xl border-border/60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-semibold">Location / State</Label>
                  <Input id="location" placeholder="e.g. Bogra, Rajshahi Division" value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    className="h-12 rounded-xl border-border/60" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="area" className="text-sm font-semibold">Estimated area (hectares)</Label>
                  <Input id="area" type="number" placeholder="e.g. 12.8" value={form.area}
                    onChange={e => setForm({ ...form, area: e.target.value })}
                    className="h-12 rounded-xl border-border/60" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Crop Details */}
        {step === 1 && (
          <Card className="glass-panel">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black">Crop & timeline</h2>
                <p className="text-muted-foreground text-sm">This feeds the yield prediction model and helps buyers plan ahead.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-semibold">Crop type</Label>
                  <Select onValueChange={v => setForm({ ...form, crop: v })}>
                    <SelectTrigger className="h-12 rounded-xl border-border/60">
                      <SelectValue placeholder="Select a crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {cropOptions.map(c => (
                        <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sowingDate" className="text-sm font-semibold flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />Sowing date
                  </Label>
                  <Input id="sowingDate" type="date" value={form.sowingDate}
                    onChange={e => setForm({ ...form, sowingDate: e.target.value })}
                    className="h-12 rounded-xl border-border/60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="harvestDate" className="text-sm font-semibold flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />Est. harvest date
                  </Label>
                  <Input id="harvestDate" type="date" value={form.harvestDate}
                    onChange={e => setForm({ ...form, harvestDate: e.target.value })}
                    className="h-12 rounded-xl border-border/60" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes" className="text-sm font-semibold">Additional notes (optional)</Label>
                  <textarea
                    id="notes"
                    placeholder="Irrigation method, soil type, past yield notes..."
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <Card className="glass-panel">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-black">Review & confirm</h2>
                <p className="text-muted-foreground text-sm">Confirm your farm details before submission. The system will begin monitoring within 5 days.</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 divide-y divide-border/60 overflow-hidden">
                {[
                  { label: "Farm name", value: form.farmName || "—" },
                  { label: "Location", value: form.location || "—" },
                  { label: "Area", value: form.area ? `${form.area} ha` : "—" },
                  { label: "Crop", value: form.crop || "—" },
                  { label: "Sowing date", value: form.sowingDate || "—" },
                  { label: "Harvest date", value: form.harvestDate || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold capitalize">{value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-primary/8 border border-primary/20 p-5 flex items-start gap-3">
                <Leaf className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-primary">What happens next?</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-5">
                    Satellite monitoring will begin within 5 days. You'll receive NDVI health scores, yield predictions, and alert notifications directly in your dashboard.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <Button variant="outline" onClick={prev} disabled={step === 0} className="rounded-full gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={next} className="rounded-full gap-1.5">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="rounded-full gap-1.5">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : <><CheckCircle2 className="h-4 w-4" />Register farm</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmRegister;
