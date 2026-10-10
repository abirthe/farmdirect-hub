import { Link, useLocation } from "react-router-dom";
import { X, Leaf, LayoutDashboard, ShoppingBag, Map, ShieldCheck, LogIn, UserPlus, Info } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const baseMobileNavLinks = [
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Escrow", href: "/escrow/demo", icon: ShieldCheck },
  { label: "About", href: "/about", icon: Info },
];

const mobileAuthLinks = [
  { label: "Sign In", href: "/login", icon: LogIn, variant: "outline" as const },
  { label: "Get Started", href: "/signup", icon: UserPlus, variant: "default" as const },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const MobileNav = ({ open, onClose }: MobileNavProps) => {
  const location = useLocation();
  const { session, role, isAdmin } = useAuth();
  
  // Dynamically resolve Navigation links based on strict mutual exclusivity
  let mobileNavLinks = [];
  if (!session) {
    mobileNavLinks = [
      { label: "Farmer Portal", href: "/farmer", icon: Map },
      { label: "Buyer Dashboard", href: "/buyer", icon: LayoutDashboard },
      { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
      { label: "About", href: "/about", icon: Info },
    ];
  } else if (isAdmin) {
    mobileNavLinks = [
      { label: "Platform Admin", href: "/admin", icon: ShieldCheck },
      { label: "Live Marketplace", href: "/marketplace", icon: ShoppingBag },
      { label: "Global Escrow", href: "/escrow/demo", icon: ShieldCheck },
    ];
  } else if (role === "farmer") {
    mobileNavLinks = [
      { label: "My Farm", href: "/farmer", icon: Map },
      { label: "About", href: "/about", icon: Info },
    ];
  } else {
    // buyer
    mobileNavLinks = [
      { label: "Buyer Dashboard", href: "/buyer", icon: LayoutDashboard },
      { label: "Procurement Market", href: "/marketplace", icon: ShoppingBag },
      { label: "Active Escrows", href: "/escrow/demo", icon: ShieldCheck },
    ];
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-80 p-0 bg-card border-border/60">
        <SheetHeader className="px-6 py-5 border-b border-border/60">
          <SheetTitle className="flex items-center gap-2 text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <div>
              <p className="text-base font-black">AgroDirect</p>
              <p className="text-xs text-muted-foreground font-normal">Field intelligence platform</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
          {mobileNavLinks.map(({ label, href, icon: Icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Show Auth Buttons only when NOT logged in */}
        {!session && (
          <div className="border-t border-border/60 p-4 space-y-2">
            {mobileAuthLinks.map(({ label, href, icon: Icon, variant }) => (
              <Button key={href} asChild variant={variant} className="hover-lift w-full justify-start gap-2" onClick={onClose}>
                <Link to={href}>
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </Button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;
