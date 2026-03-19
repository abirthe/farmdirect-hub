import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import FarmerDashboard from "./pages/FarmerDashboard";
import FarmRegister from "./pages/FarmRegister";
import BuyerDashboard from "./pages/BuyerDashboard";
import Marketplace from "./pages/Marketplace";
import ListingDetail from "./pages/ListingDetail";
import EscrowPage from "./pages/EscrowPage";
import About from "./pages/About";
import AdminDashboard from "./pages/AdminDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import YieldDetail from "./pages/YieldDetail";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/layout/ProtectedRoute";

const queryClient = new QueryClient();

// Pages where we hide the site footer (standalone/auth layouts)
const NO_FOOTER_PATHS = ["/login", "/signup"];
// Pages where Navbar shows transparent against a dark hero
const HERO_PATHS = ["/"];

const AppLayout = () => {
  const location = useLocation();
  const hideFooter = NO_FOOTER_PATHS.some((p) => location.pathname === p);
  const isHero = HERO_PATHS.some((p) => location.pathname === p);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-nav">Skip to main content</a>
      <Navbar />
      <main id="main-content" className={cn("flex-1", !isHero && "pt-16 md:pt-[72px]")}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<ListingDetail />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/farmer/register" element={<FarmRegister />} />
            <Route path="/farmer/yield/:farmId" element={<YieldDetail />} />
            <Route path="/buyer" element={<BuyerDashboard />} />
            <Route path="/escrow/:id" element={<EscrowPage />} />
            <Route path="/settings" element={<ProfileSettings />} />
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          {/* Admin Routes - simulating an admin role check */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          
          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
