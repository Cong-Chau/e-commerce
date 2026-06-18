import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import CustomerDashboard from "../pages/dashboard/CustomerDashboard";
import SellerDashboard from "../pages/dashboard/SellerDashboard";
import SellerProfilePage from "../pages/dashboard/SellerProfilePage";
import SellerProfileEditPage from "../pages/dashboard/SellerProfileEditPage";
import SellerProductPage from "../pages/products/SellerProductPage";
import SellerProductCreatePage from "../pages/products/SellerProductCreatePage";
import SellerProductImportPage from "../pages/products/SellerProductImportPage";
import SellerProductDetailPage from "../pages/products/SellerProductDetailPage";
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
        <Route path="inventory" element={<SellerProductPage />} />
        <Route path="inventory/new" element={<SellerProductCreatePage />} />
        <Route path="inventory/import" element={<SellerProductImportPage />} />
        <Route path="inventory/:id" element={<SellerProductDetailPage />} />
        <Route path="orders" element={<ComingSoon title="Đơn hàng" />} />
        <Route path="analytics" element={<ComingSoon title="Thống kê" />} />
        <Route path="profile" element={<SellerProfilePage />} />
        <Route path="profile/edit" element={<SellerProfileEditPage />} />
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
