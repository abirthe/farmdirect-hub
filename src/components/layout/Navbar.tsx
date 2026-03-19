import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import MobileNav from "./MobileNav";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { NotificationsPopover } from "./NotificationsPopover";
import { UserProfileMenu } from "./UserProfileMenu";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const { session } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  const userRole = session?.user?.user_metadata?.role;
  
  // Dynamically resolve Navigation workflows enforcing absolute POV isolation
  // A Farmer sees ZERO trace of Buyer-centric tools like Marketplace/Escrow
  let navLinks = [];
  if (!session) {
    navLinks = [
      { label: "Farmers", href: "/farmer" },
      { label: "Buyers", href: "/buyer" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "About", href: "/about" },
    ];
  } else if (userRole === "farmer") {
    navLinks = [
      { label: "My Farm", href: "/farmer" },
      { label: "About", href: "/about" },
    ];
  } else if (userRole === "admin") {
    navLinks = [
      { label: "Platform Admin", href: "/admin" },
      { label: "Live Marketplace", href: "/marketplace" },
      { label: "Global Escrow", href: "/escrow/demo" },
    ];
  } else {
    navLinks = [
      { label: "Buyer Dashboard", href: "/buyer" },
      { label: "Procurement Market", href: "/marketplace" },
      { label: "Active Escrows", href: "/escrow/demo" },
    ];
  }

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled || !isLanding
            ? "bg-card/90 backdrop-blur-xl border-b border-border/60 shadow-soft"
            : "bg-transparent"
        )}
      >
        <div className="container flex items-center justify-between h-16 md:h-18 gap-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="AgroDirect home">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300",
              scrolled || !isLanding ? "bg-primary text-primary-foreground" : "bg-primary-foreground/20 text-primary-foreground"
            )}>
              <Leaf className="h-4 w-4" />
            </div>
            <div>
              <p className={cn(
                "text-base font-black leading-none transition-colors duration-300",
                scrolled || !isLanding ? "text-foreground" : "text-primary-foreground"
              )}>
                AgroDirect
              </p>
              <p className={cn(
                "text-[10px] uppercase tracking-[0.2em] leading-none mt-0.5 transition-colors duration-300",
                scrolled || !isLanding ? "text-muted-foreground" : "text-primary-foreground/70"
              )}>
                Field intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map(({ label, href }) => {
              const isActive = location.pathname === href || location.pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  to={href}
                  className={cn(
                    "px-3 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    isActive
                      ? scrolled || !isLanding
                        ? "bg-primary/10 text-primary font-semibold"
                        : "bg-primary-foreground/20 text-primary-foreground font-semibold"
                      : scrolled || !isLanding
                        ? "text-muted-foreground hover:text-foreground hover:bg-accent"
                        : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CurrencySwitcher />
            
            {/* Authenticated Dashboard Core UI */}
            {session ? (
              <div className="hidden md:flex items-center gap-2 border-l border-border/60 pl-2 ml-1">
                <NotificationsPopover />
                <UserProfileMenu />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 border-l border-border/60 pl-2 ml-1">
                <Button asChild variant="ghost" size="sm" className="rounded-full font-semibold">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full font-semibold">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </div>
            )}

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "md:hidden rounded-full",
                !scrolled && isLanding && "text-primary-foreground hover:bg-primary-foreground/10"
              )}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
};

export default Navbar;
