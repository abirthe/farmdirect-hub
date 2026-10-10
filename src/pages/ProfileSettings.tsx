import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Mail, Phone, MapPin, Bell, Shield, Save, Loader2,
  Leaf, Camera, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const ProfileSettings = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({ variant: "destructive", title: "Invalid Password", description: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Mismatch", description: "New passwords do not match." });
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password Updated", description: "Your security credentials have been updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Update Failed", description: (err as Error).message });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    toast({
      variant: "destructive",
      title: "Account Deletion Request",
      description: "For security and escrow audit integrity, account removal must be approved by platform administration.",
    });
  };
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || "Rafiqul Islam",
    email: user?.email || "user@agrodirect.farm",
    phone: "+880 1712 345678",
    location: "Bogra, Rajshahi Division, Bangladesh",
    bio: "Smallholder maize and wheat farmer with experience in the Padma River basin.",
  });

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const [notifications, setNotifications] = useState({
    ndviAlerts: true,
    priceUpdates: true,
    buyerInterest: true,
    weeklyReport: false,
    marketNews: true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user?.id) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: profile.name },
        });
        if (authError) throw authError;
        const { error: dbError } = await supabase.from("users").update({ full_name: profile.name }).eq("id", user.id);
        if (dbError) throw dbError;
        await refreshProfile();
      }
      setSaved(true);
      toast({ title: "Settings saved", description: "Your profile details have been successfully updated." });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast({ variant: "destructive", title: "Update failed", description: "Could not save preferences." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-gradient-primary text-2xl font-black">Profile & Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and notification preferences.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-3xl">
        <Tabs defaultValue="profile">
          <TabsList className="rounded-full bg-muted p-1 mb-8">
            <TabsTrigger value="profile" className="rounded-full gap-1.5 text-sm">
              <User className="h-4 w-4" />Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full gap-1.5 text-sm">
              <Bell className="h-4 w-4" />Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-full gap-1.5 text-sm">
              <Shield className="h-4 w-4" />Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Avatar */}
            <Card className="glass-panel hover-lift glass-panel">
              <CardContent className="p-6 flex items-center gap-6">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-3xl font-black">
                    {profile.name.charAt(0)}
                  </div>
                  <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-soft hover:brightness-95 transition-all">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="font-black text-xl">{profile.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Leaf className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm text-muted-foreground">Verified Farmer · AgroDirect since 2024</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form */}
            <Card className="glass-panel hover-lift glass-panel">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black">Personal information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pName" className="text-sm font-semibold">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="pName" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                        className="pl-10 h-12 rounded-xl border-border/60" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pEmail" className="text-sm font-semibold">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="pEmail" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })}
                        className="pl-10 h-12 rounded-xl border-border/60" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pPhone" className="text-sm font-semibold">Phone number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="pPhone" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })}
                        className="pl-10 h-12 rounded-xl border-border/60" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pLocation" className="text-sm font-semibold">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="pLocation" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })}
                        className="pl-10 h-12 rounded-xl border-border/60" />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="pBio" className="text-sm font-semibold">Bio</Label>
                    <textarea id="pBio" value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3}
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving || saved} className="hover-lift rounded-full gap-2">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> :
                    saved ? <><CheckCircle2 className="h-4 w-4" />Saved!</> :
                    <><Save className="h-4 w-4" />Save changes</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-5">
            <Card className="glass-panel hover-lift glass-panel">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black">Notification preferences</CardTitle>
                <p className="text-sm text-muted-foreground">Choose what updates you receive from AgroDirect.</p>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { key: "ndviAlerts", label: "Satellite NDVI alerts", desc: "Get notified when field health changes significantly." },
                  { key: "priceUpdates", label: "Price intelligence updates", desc: "Weekly floor price changes for your crop types." },
                  { key: "buyerInterest", label: "Buyer interest notifications", desc: "Alert when a buyer shows interest in your listings." },
                  { key: "weeklyReport", label: "Weekly field report", desc: "Summary of your farm's satellite readings every Monday." },
                  { key: "marketNews", label: "Market news digest", desc: "Agricultural news relevant to your crops and region." },
                ].map((n, i, arr) => (
                  <div key={n.key}>
                    <div className="flex items-center justify-between gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{n.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[n.key as keyof typeof notifications]}
                        onCheckedChange={v => setNotifications({ ...notifications, [n.key]: v })}
                        aria-label={n.label}
                      />
                    </div>
                    {i < arr.length - 1 && <Separator className="bg-border/60" />}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Button onClick={handleSave} disabled={saving || saved} className="hover-lift rounded-full gap-2">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> :
                saved ? <><CheckCircle2 className="h-4 w-4" />Saved!</> :
                <><Save className="h-4 w-4" />Save preferences</>}
            </Button>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-5">
            <Card className="glass-panel hover-lift glass-panel">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black">Change password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-w-sm">
                {["Current password", "New password", "Confirm new password"].map(label => (
                  <div key={label} className="space-y-2">
                    <Label className="text-sm font-semibold">{label}</Label>
                    <Input type="password" placeholder="••••••••" className="h-12 rounded-xl border-border/60" />
                  </div>
                ))}
                <Button className="hover-lift rounded-full gap-2">
                  <Shield className="h-4 w-4" />Update password
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-panel hover-lift glass-panel border-destructive/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-black text-destructive">Danger zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm">Delete account</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all farm data. This cannot be undone.</p>
                  </div>
                  <Button variant="destructive" size="sm" className="hover-lift rounded-full shrink-0" onClick={handleDeleteAccount}>Delete account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileSettings;
