import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CloudRain, ShieldCheck, Leaf, BrainCircuit, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const initialNotifications = [
  {
    id: 1,
    icon: BrainCircuit,
    color: "text-purple-500 bg-purple-100",
    title: "AI Forecast Updated",
    desc: "Bogra Boro Rice model confidence increased to 94.8%",
    time: "2m ago",
    read: false
  },
  {
    id: 2,
    icon: ShieldCheck,
    color: "text-blue-500 bg-blue-100",
    title: "Escrow Payment Reserved",
    desc: "Bengal Agro Ltd locked ৳ 24,000 for your Wheat block.",
    time: "1h ago",
    read: false
  },
  {
    id: 3,
    icon: CloudRain,
    color: "text-amber-500 bg-amber-100",
    title: "Weather Alert",
    desc: "Heavy rainfall expected in Rajshahi in 48 hours.",
    time: "5h ago",
    read: false
  }
];

export function NotificationsPopover() {
  const [notifs, setNotifs] = useState(initialNotifications);
  
  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifs(notifs.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifs(notifs.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted/80">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center p-0 rounded-full bg-destructive text-[10px] ring-2 ring-background">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0 rounded-2xl border-border/60 shadow-xl overflow-hidden glass-panel">
        <div className="bg-muted/50 p-4 border-b border-border/60 flex items-center justify-between">
          <h4 className="font-bold text-sm flex items-center gap-2">
            Intelligence Feed <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary border-none">{unreadCount > 0 ? "Live" : "Synced"}</Badge>
          </h4>
          {unreadCount > 0 && (
            <span onClick={markAllRead} className="text-xs text-muted-foreground cursor-pointer hover:underline hover:text-primary transition-colors">
              Mark all read
            </span>
          )}
        </div>
        <div className="divide-y divide-border/60 max-h-[400px] overflow-y-auto">
          {notifs.length > 0 ? notifs.map((n) => (
            <div 
              key={n.id} 
              onClick={() => markAsRead(n.id)}
              className={`p-4 transition-colors flex gap-3 cursor-pointer ${n.read ? 'opacity-60 bg-transparent' : 'hover:bg-muted/30 bg-primary/5'}`}
            >
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.color}`}>
                <n.icon className="h-4 w-4" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex justify-between items-start">
                  <p className={`text-sm leading-none ${n.read ? 'font-medium' : 'font-bold text-primary'}`}>{n.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{n.desc}</p>
                <p className="text-[10px] text-muted-foreground/70 font-medium mt-1">{n.time}</p>
              </div>
              {!n.read && <div className="h-2 w-2 bg-primary rounded-full mt-1 shrink-0" />}
            </div>
          )) : (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">You're all caught up!</p>
            </div>
          )}
        </div>
        <div className="p-3 bg-muted/20 border-t border-border/60 text-center">
          <Button asChild disabled={notifs.length === 0} variant="ghost" size="sm" className="text-xs w-full text-primary hover:text-primary hover:bg-primary/10 rounded-full">
            <Link to="/notifications">View intelligence archive</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
