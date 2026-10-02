import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { UserRole } from "../types/api";

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50">
        <p className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm">
          Recuperando tu sesión…
        </p>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role))
    return <Navigate to="/access-denied" replace />;
  return <Outlet />;
}
