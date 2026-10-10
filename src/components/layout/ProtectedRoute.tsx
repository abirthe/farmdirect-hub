// Route guard enforcing authentication and role-based permissions with superuser admin access.
import { Navigate, Outlet } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  role?: UserRole;
}

const ProtectedRoute = ({ role }: ProtectedRouteProps) => {
  const { session, loading, role: userRole, isAdmin } = useAuth();

  // Supabase Auth takes a moment to initialize from storage
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background" data-testid="auth-loading">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Pure Supabase Auth enforcement
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Superuser platform administrators can view all routes
  if (isAdmin) {
    return <Outlet />;
  }

  // Strictly enforce role boundaries for non-admins
  if (role && role !== userRole) {
    if (userRole === "farmer") return <Navigate to="/farmer" replace />;
    if (userRole === "buyer") return <Navigate to="/buyer" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
