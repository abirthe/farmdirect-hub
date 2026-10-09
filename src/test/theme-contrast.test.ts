import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Theme Contrast & Mode Compatibility Audit", () => {
  it("should ensure Index hero uses high-contrast text rather than text-primary-foreground on dark hero background", () => {
    const indexPath = path.resolve(__dirname, "../pages/Index.tsx");
    const content = fs.readFileSync(indexPath, "utf-8");
    
    // In dark mode, text-primary-foreground is dark green (hsl 126 28% 16%),
    // making it invisible on the dark hero image.
    // The hero heading, paragraph, eyebrow, and stats must use text-white or bright text.
    expect(content).not.toMatch(/h1[^>]*text-primary-foreground/);
    expect(content).not.toMatch(/eyebrow[^>]*text-primary-foreground/);
    expect(content).toContain("text-white");
  });

  it("should ensure Navbar landing state uses white text on transparent dark hero", () => {
    const navPath = path.resolve(__dirname, "../components/layout/Navbar.tsx");
    const content = fs.readFileSync(navPath, "utf-8");
    
    // Transparent landing navbar must not use text-primary-foreground (invisible in dark mode)
    expect(content).not.toMatch(/scrolled \|\| !isLanding \? "text-foreground" : "text-primary-foreground"/);
    expect(content).toContain("scrolled || !isLanding ? \"text-foreground\" : \"text-white\"");
  });

  it("should ensure marketplace status badges define dark mode variants", () => {
    const cardPath = path.resolve(__dirname, "../components/marketplace/MarketplaceCard.tsx");
    const content = fs.readFileSync(cardPath, "utf-8");
    
    expect(content).toContain("dark:text-green");
    expect(content).toContain("dark:text-amber");
    expect(content).toContain("dark:text-blue");
  });

  it("should ensure Marketplace page status badges define dark mode variants", () => {
    const pagePath = path.resolve(__dirname, "../pages/Marketplace.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");
    
    expect(content).toContain("dark:text-green");
    expect(content).toContain("dark:text-amber");
    expect(content).toContain("dark:text-blue");
  });

  it("should ensure BuyerDashboard and FarmerDashboard define dark mode variants for status", () => {
    const buyerPath = path.resolve(__dirname, "../pages/BuyerDashboard.tsx");
    const buyerContent = fs.readFileSync(buyerPath, "utf-8");
    expect(buyerContent).toContain("dark:text-blue");
    expect(buyerContent).toContain("dark:text-green");
    expect(buyerContent).toContain("dark:text-amber");

    const farmerPath = path.resolve(__dirname, "../pages/FarmerDashboard.tsx");
    const farmerContent = fs.readFileSync(farmerPath, "utf-8");
    expect(farmerContent).toContain("dark:text-green-300");
    expect(farmerContent).toContain("dark:text-amber-300");
  });

  it("should ensure glass-panel sets text-card-foreground default in index.css", () => {
    const cssPath = path.resolve(__dirname, "../index.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");
    expect(cssContent).toContain(".glass-panel {");
    expect(cssContent).toContain("text-card-foreground");
  });
});
