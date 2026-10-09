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
    return <Navigate to="/login" replace />;
  }

  const email = session?.user?.email?.toLowerCase();
  const rawRole = (session?.user?.user_metadata?.role || "").toLowerCase();
  const isAdmin = email === "md.abirsharif68@gmail.com" || rawRole === "admin";
  const userRole = isAdmin ? "admin" : (rawRole || "farmer");
  
  if (role && role !== userRole && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
