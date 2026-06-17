import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SellerSidebar from '../../components/seller/SellerSidebar';
import SetupProfileBanner from '../../components/seller/SetupProfileBanner';

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Nếu chưa có hồ sơ shop → hiển thị màn hình yêu cầu thiết lập
  if (
    (user?.sellerProfile === null || user?.sellerProfile === undefined) &&
    location.pathname !== '/seller/profile'
  ) {
    return (
      <SetupProfileBanner onSetup={() => navigate('/seller/profile')} />
    );
  }

  return (
    <div className="flex h-screen bg-canvas dark:bg-[#161614] overflow-hidden">
      <SellerSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
