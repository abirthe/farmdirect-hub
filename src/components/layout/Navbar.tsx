import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Leaf, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import MobileNav from "./MobileNav";
import { CurrencySwitcher } from "./CurrencySwitcher";

const navLinks = [
  { label: "Farmers", href: "/farmer" },
  { label: "Buyers", href: "/buyer" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Escrow", href: "/escrow/demo" },
  { label: "About", href: "/about" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

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
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "hidden md:inline-flex gap-1.5 rounded-full",
                !scrolled && isLanding && "text-primary-foreground hover:bg-primary-foreground/10"
              )}
            >
              <Link to="/login">
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            </Button>
            <Button
              asChild
              variant={scrolled || !isLanding ? "default" : "hero"}
              size="sm"
              className="hidden md:inline-flex rounded-full"
            >
              <Link to="/signup">Get started</Link>
            </Button>

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
