import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  role?: "farmer" | "buyer" | "admin";
}

const ProtectedRoute = ({ role }: ProtectedRouteProps) => {
  const { session, loading } = useAuth();
  
  // Demo mode: allow viewing routes if Supabase is completely unconfigured
  const hasSupabaseKeys = import.meta.env.VITE_SUPABASE_URL !== undefined;

  // Supabase Auth takes a millisecond to initialize from localstorage
  if (loading) {
     return (
       <div className="h-screen w-full flex items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 text-primary animate-spin" />
       </div>
     );
  }

  // Pure Supabase Auth enforcement
  if (hasSupabaseKeys && !session) {
    console.warn("🔒 [Supabase Auth] Access Denied: User is not authenticated.");
    return <Navigate to="/login" replace />;
  }
  
  // If the user hasn't configured .env keys yet, we aggressively fallback to demo mode
  // so the website doesn't completely hard-lock them out during setup!
  if (!hasSupabaseKeys) {
    console.log("⚠️ [Demo Mode] Bypassing Auth Gate since VITE_SUPABASE_URL is missing.");
  }

  // Live Role Validation tied explicitly to Native Database Authenticated tokens!
  const userRole = session?.user?.user_metadata?.role || "farmer";
  
  if (role && role !== userRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
