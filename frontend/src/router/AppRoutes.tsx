import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import CustomerDashboard from "../pages/dashboard/CustomerDashboard";
import SellerDashboard from "../pages/dashboard/SellerDashboard";
import SellerProfilePage from "../pages/dashboard/SellerProfilePage";
import SellerProductPage from "../pages/products/SellerProductPage";
import ComingSoon from "../pages/ComingSoon";
import { GuestRoute, ProtectedRoute, RootRedirect } from "./RouteGuards";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["CUSTOMER"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller"
        element={
          <ProtectedRoute roles={["SELLER"]}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ComingSoon title="Dashboard" />} />
        <Route path="products" element={<SellerProductPage />} />
        <Route path="orders" element={<ComingSoon title="Đơn hàng" />} />
        <Route path="inventory" element={<ComingSoon title="Kho" />} />
        <Route path="analytics" element={<ComingSoon title="Thống kê" />} />
        <Route path="profile" element={<SellerProfilePage />} />
      </Route>

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
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
