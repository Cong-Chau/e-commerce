import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SellerSidebar from './SellerSidebar';
import SetupProfileBanner from '../../components/seller/SetupProfileBanner';

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Nếu chưa có hồ sơ shop → hiển thị màn hình yêu cầu thiết lập
  if (user?.sellerProfile === null || user?.sellerProfile === undefined) {
    return (
      <SetupProfileBanner onSetup={() => navigate('/seller/settings')} />
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
