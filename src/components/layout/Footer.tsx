import { Link } from "react-router-dom";
import { Leaf, Twitter, Instagram, Linkedin, Github } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const footerLinks = {
  Platform: [
    { label: "Marketplace", href: "/marketplace" },
    { label: "Escrow", href: "/escrow/demo" },
    { label: "Monitoring", href: "/farmer" },
    { label: "Price Intelligence", href: "/marketplace" },
  ],
  Farmers: [
    { label: "Dashboard", href: "/farmer" },
    { label: "Register Farm", href: "/farmer/register" },
    { label: "Yield Forecast", href: "/farmer" },
    { label: "Satellite Alerts", href: "/farmer" },
  ],
  Buyers: [
    { label: "Browse Listings", href: "/marketplace" },
    { label: "Buyer Dashboard", href: "/buyer" },
    { label: "Bulk Filters", href: "/marketplace" },
    { label: "Quality Certs", href: "/marketplace" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Mission", href: "/about" },
    { label: "Contact", href: "/about" },
    { label: "Sign Up", href: "/signup" },
  ],
};

const socialLinks = [
  { icon: Twitter, label: "Twitter / X", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Github, label: "GitHub", href: "#" },
];

const Footer = () => {
  return (
    <footer className="border-t border-border/60 bg-card/50 backdrop-blur-sm">
      <div className="container py-16 md:py-20">
        {/* Top: Brand + Links */}
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand */}
          <div className="space-y-5">
            <Link to="/" className="flex items-center gap-2.5" aria-label="AgroDirect home">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Leaf className="h-4 w-4" />
              </div>
              <div>
                <p className="text-base font-black">AgroDirect</p>
                <p className="text-xs text-muted-foreground">Field intelligence marketplace</p>
              </div>
            </Link>
            <p className="text-sm leading-6 text-muted-foreground max-w-xs">
              Turning field boundaries, crop signals, and market pricing into a direct trade engine — eliminating middlemen from agriculture.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">{category}</h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-sm text-muted-foreground transition-colors duration-150 hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10 bg-border/60" />

        {/* Bottom Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © 2026 AgroDirect. Building the infrastructure for fair agricultural trade.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors duration-150">Privacy Policy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors duration-150">Terms of Service</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors duration-150">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
