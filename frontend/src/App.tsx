import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import SellerDashboard from './pages/dashboard/SellerDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';

// ─── Placeholder pages (sẽ implement sau) ────────────────────────────────────

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[calc(100vh-0px)]">
      <div className="text-center">
        <p className="text-sm font-bold tracking-widest uppercase text-slate dark:text-[#8A8884] mb-2">
          {title}
        </p>
        <p className="text-sm text-dust dark:text-[#4A4A48]">Trang đang được xây dựng.</p>
      </div>
    </div>
  );
}

// ─── Route guards ─────────────────────────────────────────────────────────────

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const role = user.roles?.[0];
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'SELLER') return <Navigate to="/seller/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

type RoleName = 'CUSTOMER' | 'SELLER' | 'ADMIN';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: RoleName[] }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.some(r => user.roles?.includes(r))) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return !user ? <>{children}</> : <Navigate to="/" replace />;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Customer */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute roles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute>}
      />

      {/* Seller — layout với sidebar */}
      <Route
        path="/seller"
        element={<ProtectedRoute roles={['SELLER']}><SellerDashboard /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"  element={<ComingSoon title="Dashboard" />} />
        <Route path="products"   element={<ComingSoon title="Sản phẩm" />} />
        <Route path="orders"     element={<ComingSoon title="Đơn hàng" />} />
        <Route path="inventory"  element={<ComingSoon title="Kho" />} />
        <Route path="analytics"  element={<ComingSoon title="Thống kê" />} />
        <Route path="settings"   element={<ComingSoon title="Cài đặt" />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>}
      />

      {/* Auth */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
