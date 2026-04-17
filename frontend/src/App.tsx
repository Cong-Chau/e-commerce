import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

function HomePage() {
  const { user, logout } = useAuth();
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F3F0EE',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Sofia Sans', 'Inter', Arial, sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.56px', textTransform: 'uppercase', color: '#141413', marginBottom: 12 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#F37338', marginRight: 8, verticalAlign: 'middle' }} />
          TRANG CHỦ
        </p>
        <h1 style={{ fontSize: 48, fontWeight: 500, letterSpacing: '-0.96px', color: '#141413', margin: '0 0 16px' }}>
          Xin chào, {user?.name}!
        </h1>
        <p style={{ fontSize: 16, color: '#696969', marginBottom: 40 }}>
          Vai trò: <strong>{user?.role}</strong> · {user?.email}
        </p>
        <button
          onClick={logout}
          style={{
            padding: '12px 32px',
            background: '#141413',
            color: '#F3F0EE',
            border: '1.5px solid #141413',
            borderRadius: 20,
            fontSize: 16,
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '-0.32px',
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return !user ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
