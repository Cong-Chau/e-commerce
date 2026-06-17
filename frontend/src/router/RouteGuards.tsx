import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type RoleName = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export function RootRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const role = user.roles?.[0];
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'SELLER') return <Navigate to="/seller/dashboard" replace />;
  if (role === 'CUSTOMER') return <Navigate to="/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: RoleName[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.some((role) => user.roles?.includes(role))) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return !user ? <>{children}</> : <Navigate to="/" replace />;
}
