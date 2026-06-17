import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Fuse from "fuse.js";
import { Check, ImagePlus, Search, Store } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/auth.service";
import type { User } from "../../types/auth";
import { cloudinaryService } from "../../services/cloudinary.service";
import {
  sellerService,
  type ShippingMethod,
} from "../../services/seller.service";
import {
  categoryService,
  type CategoryItem,
} from "../../services/category.service";
import {
  addressService,
  type Province,
  type Ward,
} from "../../services/address.service";
import SearchableSelect from "../../components/common/SearchableSelect";

const PHONE_PATTERN = /^\+?[0-9]{9,15}$/;

const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  FAST: "Giao nhanh",
  EXPRESS: "Giao hỏa tốc",
  SAME_DAY: "Trong ngày",
};

const SHIPPING_OPTIONS: Array<{ value: ShippingMethod; label: string }> = [
  { value: "FAST", label: "Giao nhanh" },
  { value: "EXPRESS", label: "Giao hỏa tốc" },
  { value: "SAME_DAY", label: "Trong ngày" },
];

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
  return (
    CATEGORY_EMOJI_RULES.find(([pattern]) => pattern.test(name))?.[1] ?? "🏷️"
  );
}

const emptyForm = {
  shop_name: "",
  shop_description: "",
  owner_name: "",
  owner_phone: "",
};

type FormStep = 1 | 2;

const DESC_MIN = 10;
const DESC_MAX = 200;

const FORM_STEPS: Array<{ step: FormStep; label: string }> = [
  { step: 1, label: "Thông tin shop" },
  { step: 2, label: "Liên hệ & vận chuyển" },
];

export default function SellerProfilePage() {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [shippings, setShippings] = useState<ShippingMethod[]>(["FAST"]);
  const [step, setStep] = useState<FormStep>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [suggestingDesc, setSuggestingDesc] = useState(false);
  const [suggestError, setSuggestError] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  const [profileData, setProfileData] = useState<User | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  // Chỉ dùng để điều khiển 2 dropdown phụ thuộc nhau trên UI — khi submit sẽ
  // ghép addressDetail + tên xã/phường + tên tỉnh/thành thành một string duy
  // nhất rồi gửi lên field pickup_address (BE vẫn lưu dạng text như cũ).
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<
    number | null
  >(null);
  const [selectedWardCode, setSelectedWardCode] = useState<number | null>(null);
  const [addressDetail, setAddressDetail] = useState("");

  useEffect(() => {
    Promise.all([authService.getProfile(), categoryService.getAll()])
      .then(([user, categoryList]) => {
        setProfileData(user);
        setCategories(categoryList);
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  // Tách riêng khỏi Promise.all trên — nếu API tỉnh/thành lỗi thì không
  // được kéo sập luồng tải profile/category chính.
  useEffect(() => {
    addressService
      .getProvinces()
      .then(setProvinces)
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Thu hồi object URL cũ mỗi khi chọn ảnh mới hoặc khi unmount
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const profile = profileData?.sellerProfile;

  const categoryOptions = useMemo(
    () =>
      categories.flatMap((root) =>
        root.children?.length ? root.children : [root],
      ),
    [categories],
  );
  const categoryFuse = useMemo(
    () => new Fuse(categoryOptions, { keys: ["name"], threshold: 0.4 }),
    [categoryOptions],
  );
  const filteredCategoryOptions = categorySearch.trim()
    ? categoryFuse.search(categorySearch.trim()).map((result) => result.item)
    : categoryOptions;

  const composePickupAddress = () => {
    const provinceName = provinces.find(
      (p) => p.code === selectedProvinceCode,
    )?.name;
    const wardName = wards.find((w) => w.code === selectedWardCode)?.name;
    return [addressDetail.trim(), wardName, provinceName]
      .filter(Boolean)
      .join(", ");
  };

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleShipping = (value: ShippingMethod) => {
    setShippings((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const handleProvinceChange = (code: number) => {
    setSelectedProvinceCode(code);
    setSelectedWardCode(null);
    setWards([]);

    setLoadingWards(true);
    addressService
      .getWards(code)
      .then(setWards)
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
  };

  const handleWardChange = (code: number) => {
    setSelectedWardCode(code);
  };

  const handleSuggestDescription = async () => {
    if (!form.shop_name.trim() || selectedCategoryIds.length === 0) return;
    setSuggestingDesc(true);
    setSuggestError("");
    try {
      const selectedCategoryNames = categories
        .filter((c) => selectedCategoryIds.includes(c.id))
        .map((c) => c.name);
      const desc = await sellerService.suggestDescription(form.shop_name, selectedCategoryNames);
      updateField("shop_description", desc);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? "Không thể tạo gợi ý lúc này")
        : "Không thể tạo gợi ý lúc này";
      setSuggestError(msg);
    } finally {
      setSuggestingDesc(false);
    }
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh logo không được vượt quá 5MB.");
      event.target.value = "";
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleBack = () => {
    setError("");
    setStep((current) => (current > 1 ? ((current - 1) as FormStep) : current));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (step === 1) {
      const shopName = form.shop_name.trim();
      if (!shopName) {
        setError("Vui lòng nhập tên shop.");
        return;
      }
      if (shopName.length < 2) {
        setError("Tên shop phải có ít nhất 2 ký tự.");
        return;
      }
      if (shopName.length > 255) {
        setError("Tên shop không được vượt quá 255 ký tự.");
        return;
      }
      const descLen = form.shop_description.trim().length;
      if (descLen > 0 && descLen < DESC_MIN) {
        setError(`Mô tả shop phải có ít nhất ${DESC_MIN} ký tự.`);
        return;
      }
      if (selectedCategoryIds.length === 0) {
        setError("Vui lòng chọn ít nhất một danh mục hàng hóa.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (form.owner_name.trim().length > 255) {
        setError("Tên chủ shop không được vượt quá 255 ký tự.");
        return;
      }
      const ownerPhone = form.owner_phone.trim();
      if (ownerPhone && !PHONE_PATTERN.test(ownerPhone)) {
        setError("Số điện thoại không hợp lệ.");
        return;
      }
      if (composePickupAddress().length > 500) {
        setError("Địa chỉ lấy hàng không được vượt quá 500 ký tự.");
        return;
      }
      if (shippings.length === 0) {
        setError("Vui lòng chọn ít nhất một phương thức vận chuyển.");
        return;
      }
    }

    setLoading(true);
    try {
      let shopLogoUrl: string | undefined;

      if (logoFile) {
        setUploadingLogo(true);
        try {
          shopLogoUrl = await cloudinaryService.uploadImage(logoFile);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Tải ảnh lên Cloudinary thất bại.",
          );
          return;
        } finally {
          setUploadingLogo(false);
        }
      }

      const pickupAddress = composePickupAddress() || undefined;

      await sellerService.createProfile({
        shop_name: form.shop_name.trim(),
        shop_logo: shopLogoUrl,
        shop_description: form.shop_description.trim() || undefined,
        pickup_address: pickupAddress,
        owner_name: form.owner_name.trim() || undefined,
        owner_phone: form.owner_phone.trim() || undefined,
        shippings,
        category_ids: selectedCategoryIds,
      });
      await refreshProfile();
      navigate("/seller/dashboard", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Tạo hồ sơ shop thất bại.");
      } else {
        setError("Đã xảy ra lỗi, vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas dark:bg-[#161614]">
        <p className="text-sm text-slate dark:text-[#8A8884]">
          Đang tải hồ sơ...
        </p>
      </div>
    );
  }

  if (profile) {
    return (
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
          </div>

          <div className="rounded-lg border border-dust bg-lifted p-6 dark:border-[#2E2E2C] dark:bg-[#1C1C1A]">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-ink text-canvas dark:bg-canvas dark:text-ink">
                {profile.shop_logo ? (
                  <img
                    src={profile.shop_logo}
                    alt=""
                    className="h-full w-full rounded-lg object-cover"
                  />
                ) : (
                  <Store size={22} strokeWidth={1.8} />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink dark:text-canvas">
                  {profile.shop_name}
                </h2>
                <p className="mt-1 text-sm text-slate dark:text-[#8A8884]">
                  {profile.shop_description || "Shop chưa có mô tả."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {profile.shippings.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink dark:border-[#F3F0EE]/10 dark:text-canvas"
                    >
                      {SHIPPING_LABELS[item]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 border-t border-dust pt-6 dark:border-[#2E2E2C] sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">
                  Chủ shop
                </p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">
                  {profile.owner_name || "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">
                  Số điện thoại
                </p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">
                  {profile.owner_phone || "Chưa cập nhật"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">
                  Địa chỉ lấy hàng
                </p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">
                  {profile.pickup_address || "Chưa cập nhật"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">
                  Danh mục hàng hóa
                </p>
                {profile.categories.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.categories.map((cat) => (
                      <span
                        key={cat.id}
                        className="flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1 text-xs font-semibold text-ink dark:border-[#F3F0EE]/10 dark:text-canvas"
                      >
                        <span
                          aria-hidden="true"
                          className="text-sm leading-none"
                        >
                          {getCategoryEmoji(cat.name)}
                        </span>
                        {cat.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-ink dark:text-canvas">
                    Chưa cập nhật
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-dust bg-lifted p-6 dark:border-[#2E2E2C] dark:bg-[#1C1C1A]">
            <p className="text-sm font-bold uppercase tracking-[0.52px] text-slate dark:text-[#8A8884]">
              Tài khoản
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">
                  Họ tên
                </p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">
                  {profileData?.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">
                  Email
                </p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">
                  {profileData?.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">
                  Số điện thoại
                </p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">
                  {profileData?.phone || "Chưa cập nhật"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4px] text-slate dark:text-[#8A8884]">
                  Trạng thái
                </p>
                <p className="mt-1 text-sm text-ink dark:text-canvas">
                  {profileData?.status || "ACTIVE"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 dark:bg-[#161614] sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-[0.52px] text-slate dark:text-[#8A8884]">
              Thiết lập seller
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-ink dark:text-canvas">
              Tạo hồ sơ cửa hàng
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate dark:text-[#8A8884]">
              Hoàn tất thông tin cơ bản để bắt đầu quản lý sản phẩm, đơn hàng và
              vận chuyển trong khu vực seller.
            </p>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            {FORM_STEPS.map(({ step: s, label }, idx) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      step >= s
                        ? "bg-ink text-canvas dark:bg-[#F3F0EE] dark:text-[#141413]"
                        : "bg-ink/10 text-slate dark:bg-[#F3F0EE]/10 dark:text-[#8A8884]"
                    }`}
                  >
                    {step > s ? <Check size={14} strokeWidth={2.4} /> : s}
                  </div>
                  {step === s && (
                    <span className="text-[13px] font-medium text-ink dark:text-canvas">
                      {label}
                    </span>
                  )}
                </div>
                {idx < FORM_STEPS.length - 1 && (
                  <div
                    className={`h-px w-6 transition-colors sm:w-10 ${
                      step > s
                        ? "bg-ink dark:bg-[#F3F0EE]"
                        : "bg-ink/15 dark:bg-[#F3F0EE]/15"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                event.target instanceof HTMLInputElement
              ) {
                event.preventDefault();
              }
            }}
            className="rounded-lg border border-dust bg-lifted p-5 dark:border-[#2E2E2C] dark:bg-[#1C1C1A] sm:p-6"
          >
            {step === 1 && (
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Cột trái: Tên shop + Mô tả | Cột phải: Logo */}
                <div className="flex items-stretch gap-4 sm:col-span-2">
                  <div className="flex flex-1 flex-col gap-4">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-ink dark:text-canvas">
                        Tên shop
                      </span>
                      <input
                        value={form.shop_name}
                        onChange={(event) =>
                          updateField("shop_name", event.target.value)
                        }
                        placeholder="Ví dụ: Mina Home"
                        className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-canvas/15 dark:bg-ink dark:text-canvas"
                        required
                      />
                    </label>

                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink dark:text-canvas">
                          Mô tả shop
                        </span>
                        <div className="relative group">
                          <button
                            type="button"
                            onClick={handleSuggestDescription}
                            disabled={!form.shop_name.trim() || selectedCategoryIds.length === 0 || suggestingDesc}
                            className="flex items-center gap-1.5 text-xs font-medium text-ink/50 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors dark:text-canvas/50 dark:hover:text-canvas"
                          >
                            {suggestingDesc ? (
                              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span>✨</span>
                            )}
                            {suggestingDesc ? "Đang tạo…" : "Gợi ý AI"}
                          </button>
                          <div className="pointer-events-none absolute right-0 top-full z-10 mt-1.5 w-max max-w-55 rounded-lg bg-ink px-3 py-1.5 text-xs text-canvas opacity-0 transition-opacity group-hover:opacity-100 dark:bg-canvas dark:text-ink">
                            {!form.shop_name.trim() && selectedCategoryIds.length === 0
                              ? "Nhập tên shop và chọn danh mục để dùng tính năng này"
                              : !form.shop_name.trim()
                                ? "Nhập tên shop để dùng tính năng này"
                                : selectedCategoryIds.length === 0
                                  ? "Chọn ít nhất 1 danh mục để dùng tính năng này"
                                  : "Tạo mô tả tự động bằng AI dựa trên tên shop và danh mục"}
                          </div>
                        </div>
                      </div>
                      <textarea
                        value={form.shop_description}
                        onChange={(event) =>
                          updateField("shop_description", event.target.value)
                        }
                        placeholder="Shop chuyên cung cấp sản phẩm..."
                        rows={4}
                        maxLength={DESC_MAX}
                        className="resize-none rounded-lg border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-canvas/15 dark:bg-ink dark:text-canvas"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-signal">
                          {form.shop_description.length > 0 && form.shop_description.length < DESC_MIN
                            ? `Tối thiểu ${DESC_MIN} ký tự`
                            : suggestError || ""}
                        </p>
                        <p className={`text-xs tabular-nums ${form.shop_description.length >= DESC_MAX ? "text-signal" : "text-dust"}`}>
                          {form.shop_description.length}/{DESC_MAX}
                        </p>
                      </div>
                    </div>
                  </div>

                  <label className="relative aspect-square h-full shrink-0 cursor-pointer overflow-hidden rounded-xl border border-ink/15 bg-white transition-opacity hover:opacity-75 dark:border-canvas/15 dark:bg-ink">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                        <ImagePlus size={18} strokeWidth={1.6} className="text-dust" />
                        <span className="text-center text-[10px] leading-tight text-dust">Logo</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      disabled={uploadingLogo || loading}
                      className="sr-only"
                    />
                  </label>
                </div>

                {/* Danh mục hàng hóa */}
                <div className="sm:col-span-2">
                  <p className="mb-3 text-sm font-semibold text-ink dark:text-canvas">
                    Danh mục hàng hóa
                  </p>
                  {categories.length === 0 ? (
                    <p className="text-sm text-slate dark:text-[#8A8884]">
                      Chưa có danh mục nào để chọn.
                    </p>
                  ) : (
                    <div className="rounded-lg border border-ink/15 bg-white p-4 dark:border-[#F3F0EE]/15 dark:bg-[#141413]">
                      <div className="relative mb-3">
                        <Search
                          size={15}
                          strokeWidth={1.8}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dust"
                        />
                        <input
                          type="text"
                          value={categorySearch}
                          onChange={(event) =>
                            setCategorySearch(event.target.value)
                          }
                          placeholder="Tìm danh mục..."
                          className="w-full rounded-full border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-[#F3F0EE]/15 dark:bg-[#1C1C1A] dark:text-canvas"
                        />
                      </div>
                      {filteredCategoryOptions.length === 0 ? (
                        <p className="text-sm text-slate dark:text-[#8A8884]">
                          Không tìm thấy danh mục phù hợp.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {filteredCategoryOptions.map((cat) => {
                            const active = selectedCategoryIds.includes(cat.id);
                            return (
                              <button
                                type="button"
                                key={cat.id}
                                onClick={() => toggleCategory(cat.id)}
                                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                                  active
                                    ? "border-ink bg-ink text-canvas dark:border-[#F3F0EE] dark:bg-[#F3F0EE] dark:text-[#141413]"
                                    : "border-ink/15 bg-white text-ink hover:border-ink/40 dark:border-[#F3F0EE]/15 dark:bg-[#141413] dark:text-canvas"
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className="text-base leading-none"
                                >
                                  {getCategoryEmoji(cat.name)}
                                </span>
                                {cat.name}
                                {active && <Check size={14} strokeWidth={2.2} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-ink dark:text-canvas">
                      Tên chủ shop
                    </span>
                    <input
                      value={form.owner_name}
                      onChange={(event) =>
                        updateField("owner_name", event.target.value)
                      }
                      placeholder="Nguyễn Văn A"
                      className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-[#F3F0EE]/15 dark:bg-[#141413] dark:text-canvas"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-ink dark:text-canvas">
                      Số điện thoại
                    </span>
                    <input
                      value={form.owner_phone}
                      onChange={(event) =>
                        updateField("owner_phone", event.target.value)
                      }
                      placeholder="0901234567"
                      className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-[#F3F0EE]/15 dark:bg-[#141413] dark:text-canvas"
                    />
                  </label>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <span className="text-sm font-semibold text-ink dark:text-canvas">
                      Địa chỉ lấy hàng
                    </span>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <SearchableSelect
                        options={provinces.map((p) => ({
                          value: p.code,
                          label: p.name,
                        }))}
                        value={selectedProvinceCode}
                        onChange={handleProvinceChange}
                        placeholder="Chọn tỉnh/thành phố"
                        searchPlaceholder="Tìm tỉnh/thành..."
                        emptyMessage="Không tìm thấy tỉnh/thành phù hợp."
                        loading={loadingProvinces}
                      />

                      <SearchableSelect
                        options={wards.map((w) => ({
                          value: w.code,
                          label: w.name,
                        }))}
                        value={selectedWardCode}
                        onChange={handleWardChange}
                        placeholder="Chọn xã/phường"
                        searchPlaceholder="Tìm xã/phường..."
                        emptyMessage="Không tìm thấy xã/phường phù hợp."
                        disabled={!selectedProvinceCode}
                        loading={loadingWards}
                      />
                    </div>
                    <input
                      value={addressDetail}
                      onChange={(event) => setAddressDetail(event.target.value)}
                      placeholder="Số nhà, tên đường..."
                      className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-[#F3F0EE]/15 dark:bg-[#141413] dark:text-canvas"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold text-ink dark:text-canvas">
                    Phương thức vận chuyển
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {SHIPPING_OPTIONS.map((option) => {
                      const active = shippings.includes(option.value);
                      return (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => toggleShipping(option.value)}
                          className={`flex h-12 items-center justify-between rounded-lg border px-4 text-sm font-semibold transition-colors ${
                            active
                              ? "border-ink bg-ink text-canvas dark:border-[#F3F0EE] dark:bg-[#F3F0EE] dark:text-[#141413]"
                              : "border-ink/15 bg-white text-ink hover:border-ink/40 dark:border-[#F3F0EE]/15 dark:bg-[#141413] dark:text-canvas"
                          }`}
                        >
                          {option.label}
                          {active && <Check size={18} strokeWidth={2.2} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="mt-5 rounded-[20px] bg-signal/[0.06] px-5 py-3 text-sm font-medium text-signal">
                {error}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => navigate("/seller/dashboard")}
                  className="rounded-[20px] border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/50 dark:border-[#F3F0EE]/20 dark:text-canvas"
                >
                  Để sau
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-[20px] border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/50 dark:border-[#F3F0EE]/20 dark:text-canvas"
                >
                  Quay lại
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="rounded-[20px] bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#F3F0EE] dark:text-[#141413]"
              >
                {step < 2
                  ? "Tiếp tục"
                  : uploadingLogo
                    ? "Đang tải ảnh lên Cloudinary..."
                    : loading
                      ? "Đang tạo hồ sơ..."
                      : "Tạo hồ sơ shop"}
              </button>
            </div>
          </form>
        </section>

        {/* Xem trước hồ sơ shop */}
        <aside className="self-start lg:sticky lg:top-8 lg:pt-[116px]">
          <div className="rounded-lg border border-dust bg-lifted p-5 dark:border-[#2E2E2C] dark:bg-[#1C1C1A]">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-ink text-canvas dark:bg-canvas dark:text-ink">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Store size={22} strokeWidth={1.8} />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-ink dark:text-canvas">
                  {form.shop_name || "Tên shop"}
                </p>
                <p className="text-xs text-slate dark:text-[#8A8884]">
                  Xem trước hồ sơ
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate dark:text-[#8A8884]">
              {form.shop_description ||
                "Mô tả ngắn giúp khách hàng hiểu shop đang bán gì và vì sao nên mua ở đây."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {shippings.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink dark:bg-[#F3F0EE]/8 dark:text-canvas"
                >
                  {SHIPPING_LABELS[item]}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
