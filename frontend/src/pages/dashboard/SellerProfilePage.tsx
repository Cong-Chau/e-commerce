import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Store } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../services/auth.service";
import type { User } from "../../types/auth";
import type { ShippingMethod } from "../../services/seller.service";
import SellerProfileCreateForm from "../../components/seller/SellerProfileCreateForm";
import SellerLogoDialog from "../../components/seller/SellerLogoDialog";

const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  FAST: "Giao nhanh",
  EXPRESS: "Giao hỏa tốc",
  SAME_DAY: "Trong ngày",
};

const CATEGORY_EMOJI_RULES: Array<[RegExp, string]> = [
  [/trẻ em/i, "👶"],
  [/mẹ.*bé/i, "👶"],
  [/balo/i, "🎒"],
  [/túi ví/i, "👜"],
  [/thời trang/i, "👕"],
  [/điện thoại/i, "📱"],
  [/laptop|máy tính/i, "💻"],
  [/máy ảnh|máy quay/i, "📷"],
  [/thiết bị điện tử/i, "🔌"],
  [/thiết bị điện gia dụng/i, "🧺"],
  [/giặt giũ/i, "🧺"],
  [/đồng hồ/i, "⌚"],
  [/giày dép/i, "👟"],
  [/thể thao|du lịch/i, "🏋️"],
  [/ô tô|xe máy|xe đạp/i, "🚗"],
  [/nhà cửa|đời sống/i, "🏠"],
  [/sắc đẹp/i, "💄"],
  [/sức khỏe/i, "💊"],
  [/trang sức/i, "💎"],
  [/sách/i, "📚"],
  [/đồ chơi/i, "🧸"],
  [/thú cưng/i, "🐾"],
  [/dụng cụ|tiện ích/i, "🛠️"],
  [/bách hóa/i, "🛒"],
  [/voucher|dịch vụ/i, "🎫"],
];

function getCategoryEmoji(name: string): string {
  return CATEGORY_EMOJI_RULES.find(([pattern]) => pattern.test(name))?.[1] ?? "🏷️";
}

export default function SellerProfilePage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showLogoDialog, setShowLogoDialog] = useState(false);

  useEffect(() => {
    authService
      .getProfile()
      .then((user) => {
        setProfileData(user);
        setLogoUrl(user.sellerProfile?.shop_logo ?? null);
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleCreated = async () => {
    await refreshProfile();
    navigate("/seller/dashboard", { replace: true });
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-[#161614]">
        <p className="text-sm text-slate dark:text-[#8A8884]">Đang tải hồ sơ...</p>
      </div>
    );
  }

  const profile = profileData?.sellerProfile;

  if (profile) {
    return (
      <>
      <div className="min-h-screen bg-canvas px-6 py-8 dark:bg-[#161614]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.52px] text-slate dark:text-[#8A8884]">
                Hồ sơ của tôi
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-ink dark:text-canvas">
                {profile.shop_name}
              </h1>
            </div>
            <button
              onClick={() => navigate("/seller/profile/edit")}
              className="px-4 py-2 rounded-btn border border-ink/15 dark:border-canvas/15 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/5 dark:hover:bg-canvas/5 transition-colors shrink-0"
            >
              Chỉnh sửa
            </button>
          </div>

          <div className="rounded-lg border border-dust bg-lifted p-6 dark:border-[#2E2E2C] dark:bg-[#1C1C1A]">
            <div className="flex items-start gap-4">
              <div
                className="relative h-36 w-36 shrink-0 rounded-2xl overflow-hidden group cursor-pointer"
                onClick={() => setShowLogoDialog(true)}
              >
                <div className="flex h-full w-full items-center justify-center bg-ink text-canvas dark:bg-canvas dark:text-ink">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Store size={48} strokeWidth={1.4} />
                  )}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={22} className="text-white" strokeWidth={1.8} />
                  <span className="text-[11px] font-semibold text-white">Đổi logo</span>
                </div>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink dark:text-canvas">{profile.shop_name}</h2>
                <p className="mt-1 text-sm text-slate dark:text-[#8A8884]">
                  {profile.shop_description || "Shop chưa có mô tả."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.shippings.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink dark:border-canvas/10 dark:text-canvas"
                    >
                      {SHIPPING_LABELS[item]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-t border-dust pt-6 dark:border-[#2E2E2C] sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">Chủ shop</p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">{profile.owner_name || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">Số điện thoại</p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">{profile.owner_phone || "Chưa cập nhật"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">Địa chỉ lấy hàng</p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">{profile.pickup_address || "Chưa cập nhật"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">Danh mục hàng hóa</p>
                {profile.categories.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink dark:border-canvas/10 dark:text-canvas"
                      >
                        <span aria-hidden="true" className="text-sm leading-none">
                          {getCategoryEmoji(cat.name)}
                        </span>
                        {cat.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-ink dark:text-canvas">Chưa cập nhật</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-dust bg-lifted p-6 dark:border-[#2E2E2C] dark:bg-[#1C1C1A]">
            <p className="text-sm font-bold uppercase tracking-[0.52px] text-slate dark:text-[#8A8884]">Tài khoản</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">Họ tên</p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">{profileData?.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">Email</p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">{profileData?.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">Số điện thoại</p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">{profileData?.phone || "Chưa cập nhật"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">Trạng thái</p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">{profileData?.status || "ACTIVE"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLogoDialog && (
        <SellerLogoDialog
          currentLogo={logoUrl}
          onSuccess={(url) => { setLogoUrl(url); setShowLogoDialog(false); }}
          onClose={() => setShowLogoDialog(false)}
        />
      )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 dark:bg-[#161614] sm:px-6">
      <SellerProfileCreateForm onCreated={handleCreated} />
    </div>
  );
}
