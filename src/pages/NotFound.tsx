import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home, ShoppingBag, Map, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const quickLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { label: "Farmer Portal", href: "/farmer", icon: Map },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-background">
      {/* Decorative field grid */}
      <div className="field-grid absolute inset-0 opacity-30 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 text-center px-6 space-y-8 max-w-lg">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto motion-safe:animate-float">
          <Leaf className="h-10 w-10" />
        </div>

        {/* Text */}
        <div className="space-y-3">
          <p className="text-8xl font-black text-primary/20 leading-none select-none">404</p>
          <h1 className="text-gradient-primary text-3xl font-black -mt-2">Field not found</h1>
          <p className="text-muted-foreground leading-7">
            This page seems to have been harvested already — or it never existed.
            Head back to familiar ground.
          </p>
        </div>

        {/* Quick links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" className="hover-lift rounded-full gap-2">
            <Link to="/"><Home className="h-4 w-4" />Go home</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="hover-lift rounded-full gap-2">
            <Link to="/marketplace"><ShoppingBag className="h-4 w-4" />Browse marketplace</Link>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6">
          {quickLinks.map(({ label, href }) => (
            <Link key={href} to={href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
