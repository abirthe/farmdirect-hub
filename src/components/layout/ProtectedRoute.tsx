import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  role?: "farmer" | "buyer" | "admin";
}

const ProtectedRoute = ({ role }: ProtectedRouteProps) => {
  // In a real app, this would check an auth context or global state
  // For the frontend demo, we simulate a logged-in user who has access to everything
  const isAuthenticated = true;
  const userRole = "admin"; // Simulated role

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && role !== userRole && userRole !== "admin") {
    // If a specific role is required, and the user doesn't have it (and isn't admin)
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
