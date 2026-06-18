import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Fuse from "fuse.js";
import { ArrowLeft, Check, Loader2, Search } from "lucide-react";
import { sellerService, type ShippingMethod } from "../../services/seller.service";
import { categoryService, type CategoryItem } from "../../services/category.service";
import { authService } from "../../services/auth.service";
import type { SellerProfile } from "../../types/auth";

const PHONE_PATTERN = /^\+?[0-9]{9,15}$/;

const SHIPPING_OPTIONS: Array<{ value: ShippingMethod; label: string }> = [
  { value: "FAST", label: "Giao nhanh" },
  { value: "EXPRESS", label: "Giao hỏa tốc" },
  { value: "SAME_DAY", label: "Trong ngày" },
];

const CATEGORY_EMOJI_RULES: Array<[RegExp, string]> = [
  [/trẻ em/i, "👶"], [/mẹ.*bé/i, "👶"], [/balo/i, "🎒"], [/túi ví/i, "👜"],
  [/thời trang/i, "👕"], [/điện thoại/i, "📱"], [/laptop|máy tính/i, "💻"],
  [/máy ảnh|máy quay/i, "📷"], [/thiết bị điện tử/i, "🔌"],
  [/thiết bị điện gia dụng/i, "🧺"], [/giặt giũ/i, "🧺"], [/đồng hồ/i, "⌚"],
  [/giày dép/i, "👟"], [/thể thao|du lịch/i, "🏋️"], [/ô tô|xe máy|xe đạp/i, "🚗"],
  [/nhà cửa|đời sống/i, "🏠"], [/sắc đẹp/i, "💄"], [/sức khỏe/i, "💊"],
  [/trang sức/i, "💎"], [/sách/i, "📚"], [/đồ chơi/i, "🧸"], [/thú cưng/i, "🐾"],
  [/dụng cụ|tiện ích/i, "🛠️"], [/bách hóa/i, "🛒"], [/voucher|dịch vụ/i, "🎫"],
];

function getCategoryEmoji(name: string) {
  return CATEGORY_EMOJI_RULES.find(([p]) => p.test(name))?.[1] ?? "🏷️";
}

export default function SellerProfileEditPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [shippings, setShippings] = useState<ShippingMethod[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([authService.getProfile(), categoryService.getAll()])
      .then(([user, cats]) => {
        const p = user.sellerProfile;
        if (!p) { navigate("/seller/profile", { replace: true }); return; }
        setProfile(p);
        setShopName(p.shop_name);
        setShopDescription(p.shop_description ?? "");
        setOwnerName(p.owner_name ?? "");
        setOwnerPhone(p.owner_phone ?? "");
        setPickupAddress(p.pickup_address ?? "");
        setShippings(p.shippings as ShippingMethod[]);
        setSelectedCategoryIds(p.categories.map((c) => c.id));
        setCategories(cats);
      })
      .finally(() => setLoadingProfile(false));
  }, [navigate]);

  const categoryOptions = useMemo(
    () => categories.flatMap((root) => (root.children?.length ? root.children : [root])),
    [categories],
  );
  const fuse = useMemo(
    () => new Fuse(categoryOptions, { keys: ["name"], threshold: 0.4 }),
    [categoryOptions],
  );
  const filtered = categorySearch.trim()
    ? fuse.search(categorySearch.trim()).map((r) => r.item)
    : categoryOptions;

  const toggleShipping = (v: ShippingMethod) =>
    setShippings((prev) => prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]);

  const toggleCategory = (id: number) =>
    setSelectedCategoryIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!shopName.trim() || shopName.trim().length < 2) {
      setError("Tên shop tối thiểu 2 ký tự."); return;
    }
    if (ownerPhone.trim() && !PHONE_PATTERN.test(ownerPhone.trim())) {
      setError("Số điện thoại không hợp lệ."); return;
    }
    if (shippings.length === 0) {
      setError("Vui lòng chọn ít nhất một phương thức vận chuyển."); return;
    }
    if (selectedCategoryIds.length === 0) {
      setError("Vui lòng chọn ít nhất một danh mục."); return;
    }

    setSaving(true);
    try {
      await sellerService.updateProfile({
        shop_name: shopName.trim(),
        shop_description: shopDescription.trim() || undefined,
        owner_name: ownerName.trim() || undefined,
        owner_phone: ownerPhone.trim() || undefined,
        pickup_address: pickupAddress.trim() || undefined,
        shippings,
        category_ids: selectedCategoryIds,
      });
      toast.success("Cập nhật hồ sơ thành công!");
      navigate("/seller/profile");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? "Cập nhật thất bại.")
        : "Cập nhật thất bại.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-[#161614]">
        <p className="text-sm text-slate dark:text-[#8A8884]">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-ink/8 dark:border-canvas/8 shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/seller/profile")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink/6 dark:hover:bg-canvas/6 transition-colors shrink-0"
          >
            <ArrowLeft size={18} className="text-ink dark:text-canvas" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-ink dark:text-canvas tracking-tight">
              Chỉnh sửa hồ sơ
            </h1>
            <p className="text-sm text-slate dark:text-[#8A8884] mt-0.5">
              Cập nhật thông tin cửa hàng của bạn
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-8 py-8 flex flex-col gap-6">

          {/* Tên shop */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink dark:text-canvas">
              Tên shop <span className="text-signal">*</span>
            </label>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              maxLength={255}
              className="rounded-xl border border-ink/12 dark:border-canvas/12 bg-white dark:bg-[#1C1C1A] px-4 py-3 text-sm text-ink dark:text-canvas outline-none focus:border-ink/30 dark:focus:border-canvas/30 transition-colors"
            />
          </div>

          {/* Mô tả */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink dark:text-canvas">Mô tả shop</label>
            <textarea
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              className="resize-none rounded-xl border border-ink/12 dark:border-canvas/12 bg-white dark:bg-[#1C1C1A] px-4 py-3 text-sm text-ink dark:text-canvas outline-none focus:border-ink/30 dark:focus:border-canvas/30 transition-colors"
            />
            <p className="text-xs text-right text-ink/30 dark:text-canvas/30">{shopDescription.length}/1000</p>
          </div>

          {/* Chủ shop + SĐT */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink dark:text-canvas">Tên chủ shop</label>
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                maxLength={255}
                placeholder="Nguyễn Văn A"
                className="rounded-xl border border-ink/12 dark:border-canvas/12 bg-white dark:bg-[#1C1C1A] px-4 py-3 text-sm text-ink dark:text-canvas outline-none focus:border-ink/30 dark:focus:border-canvas/30 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-ink dark:text-canvas">Số điện thoại</label>
              <input
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                maxLength={20}
                placeholder="0901234567"
                className="rounded-xl border border-ink/12 dark:border-canvas/12 bg-white dark:bg-[#1C1C1A] px-4 py-3 text-sm text-ink dark:text-canvas outline-none focus:border-ink/30 dark:focus:border-canvas/30 transition-colors"
              />
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink dark:text-canvas">Địa chỉ lấy hàng</label>
            <input
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              maxLength={500}
              placeholder="Số nhà, đường, phường, quận, tỉnh..."
              className="rounded-xl border border-ink/12 dark:border-canvas/12 bg-white dark:bg-[#1C1C1A] px-4 py-3 text-sm text-ink dark:text-canvas outline-none focus:border-ink/30 dark:focus:border-canvas/30 transition-colors"
            />
          </div>

          {/* Vận chuyển */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-ink dark:text-canvas">
              Phương thức vận chuyển <span className="text-signal">*</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {SHIPPING_OPTIONS.map((opt) => {
                const active = shippings.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleShipping(opt.value)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-btn border text-sm font-medium transition-colors ${
                      active
                        ? "border-ink bg-ink text-canvas dark:border-canvas dark:bg-canvas dark:text-ink"
                        : "border-ink/15 dark:border-canvas/15 text-ink dark:text-canvas hover:border-ink/40 dark:hover:border-canvas/40"
                    }`}
                  >
                    {opt.label}
                    {active && <Check size={13} strokeWidth={2.2} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Danh mục */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-ink dark:text-canvas">
              Danh mục hàng hóa <span className="text-signal">*</span>
            </label>
            <div className="rounded-xl border border-ink/12 dark:border-canvas/12 bg-white dark:bg-[#1C1C1A] p-4">
              <div className="relative mb-3">
                <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 dark:text-canvas/30" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Tìm danh mục..."
                  className="w-full rounded-full border border-ink/12 dark:border-canvas/12 bg-ink/4 dark:bg-canvas/4 py-2 pl-8 pr-3 text-xs text-ink dark:text-canvas outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filtered.map((cat) => {
                  const active = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-ink bg-ink text-canvas dark:border-canvas dark:bg-canvas dark:text-ink"
                          : "border-ink/12 dark:border-canvas/12 text-ink dark:text-canvas hover:border-ink/30 dark:hover:border-canvas/30"
                      }`}
                    >
                      <span className="leading-none">{getCategoryEmoji(cat.name)}</span>
                      {cat.name}
                      {active && <Check size={11} strokeWidth={2.2} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-signal/8 px-4 py-3 text-sm font-medium text-signal">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-4 border-t border-ink/8 dark:border-canvas/8">
            <button
              type="button"
              onClick={() => navigate("/seller/profile")}
              className="px-6 py-2.5 rounded-btn border border-ink/15 dark:border-canvas/15 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/5 dark:hover:bg-canvas/5 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-ink dark:bg-canvas text-canvas dark:text-ink text-sm font-semibold hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
