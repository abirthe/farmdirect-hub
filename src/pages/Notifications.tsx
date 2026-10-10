import { useState, useEffect } from "react";
import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { Bell, Info, AlertTriangle, ShieldCheck, Mail, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const INBOX = [
  {
    id: 1,
    type: "alert",
    title: "NDVI Health Alert: Rajshahi Cluster",
    body: "Canopy density dropped by 4% in Sector B. Early signs of potential moisture stress detected by satellite imagery.",
    time: "2 hours ago",
    read: false,
    action: "View Field Map",
    link: "/farmer/yield/001"
  },
  {
    id: 2,
    type: "success",
    title: "Escrow funds locked",
    body: <>Bengal Agro Ltd has locked <CurrencyDisplay amount={3816} /> into escrow for your listed 12t of maize. Prepare harvest for delivery on Mar 19.</>,
    time: "1 day ago",
    read: false,
    action: "View Transaction",
    link: "/escrow/lst-001"
  },
  {
    id: 3,
    type: "info",
    title: "Market Price Update",
    body: <>The floor price for Grade A Maize in Rajshahi Division has risen to <CurrencyDisplay amount={318} />/t (+2% this week).</>,
    time: "3 days ago",
    read: true,
  },
  {
    id: 4,
    type: "sys",
    title: "Account Verifications Approved",
    body: "Your submitted land title and identification have been approved by AgroDirect admins.",
    time: "1 week ago",
    read: true,
  }
];

const NotifTypeStyles = {
  alert: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  success: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
  info: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  sys: "bg-primary/10 text-primary border-primary/20",
};

const NotifTypeIcon = {
  alert: AlertTriangle,
  success: ShieldCheck,
  info: Info,
  sys: Bell,
};

const Notifications = () => {
  const { user } = useAuth();
  const [inbox, setInbox] = useState(INBOX);

  useEffect(() => {
    const fetchLiveEvents = async () => {
      if (!user?.id) return;
      try {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, status, total_price, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (orders && orders.length > 0) {
          const liveItems = orders.map((o, idx) => ({
            id: `ord-${o.id}`,
            type: o.status === "ESCROW_LOCKED" ? "success" : o.status === "DISPUTED" ? "alert" : "info",
            title: `Order #${o.id.substring(0, 6).toUpperCase()} ${o.status.replace("_", " ")}`,
            body: `Transaction update: order status is currently ${o.status}. Escrow protection active.`,
            time: new Date(o.created_at).toLocaleDateString(),
            read: idx > 1,
            action: "View Order",
            link: `/escrow/${o.id}`,
          }));

          setInbox((prev) => [...liveItems, ...prev]);
        }
      } catch (err) {
        console.warn("Could not load live notifications:", err);
      }
    };

    fetchLiveEvents();
  }, [user]);

  const unreadCount = inbox.filter((item) => !item.read).length;

  const handleMarkAllRead = () => {
    setInbox((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="container py-8 max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-gradient-primary text-3xl font-black">Inbox</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread message{unreadCount === 1 ? "" : "s"}</p>
            </div>
          </div>
          <Button variant="outline" 
            size="sm" 
            className="hover-lift rounded-full gap-2"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="container py-8 max-w-4xl space-y-4">
        {inbox.map((item, index) => {
          const Icon = NotifTypeIcon[item.type as keyof typeof NotifTypeIcon];
          const badgeClass = NotifTypeStyles[item.type as keyof typeof NotifTypeStyles];
          
          return (
            <Card key={item.id} className={`glass-panel hover-lift glass-panel overflow-hidden transition-all ${item.read ? "opacity-75 bg-muted/20" : "bg-card/80"}`}>
              {/* Unread indicator bar */}
              {!item.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
              
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row gap-4 p-5 sm:p-6">
                  {/* Icon */}
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${badgeClass} border`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <h2 className={`text-gradient-primary text-lg font-bold ${!item.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {item.title}
                      </h2>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                    </div>
                    
                    <p className={`text-sm leading-relaxed ${!item.read ? "text-muted-foreground font-medium" : "text-muted-foreground"}`}>
                      {item.body}
                    </p>
                    
                    {item.action && item.link && (
                      <div className="pt-2">
                        <Button asChild variant={item.type === "alert" ? "destructive" : "default"} size="sm" className="hover-lift rounded-full">
                          <Link to={item.link}>{item.action}</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty state / End of inbox */}
        <div className="py-12 text-center text-muted-foreground space-y-3">
          <CheckCircle2 className="h-10 w-10 mx-auto opacity-20" />
          <p className="text-sm">You're all caught up</p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
