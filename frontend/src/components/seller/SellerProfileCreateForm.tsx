import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useToast } from "../../hooks/useToast";
import axios from "axios";
import Fuse from "fuse.js";
import { Check, ImagePlus, Search, Store } from "lucide-react";
import { cloudinaryService } from "../../services/cloudinary.service";
import { sellerService, type ShippingMethod } from "../../services/seller.service";
import { categoryService, type CategoryItem } from "../../services/category.service";
import { addressService, type Province, type Ward } from "../../services/address.service";
import SearchableSelect from "../common/SearchableSelect";

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
  return CATEGORY_EMOJI_RULES.find(([pattern]) => pattern.test(name))?.[1] ?? "🏷️";
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

interface Props {
  onCreated: () => Promise<void>;
}

export default function SellerProfileCreateForm({ onCreated }: Props) {
  const toast = useToast();
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

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [selectedWardCode, setSelectedWardCode] = useState<number | null>(null);
  const [addressDetail, setAddressDetail] = useState("");

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    addressService
      .getProvinces()
      .then(setProvinces)
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const categoryOptions = useMemo(
    () => categories.flatMap((root) => (root.children?.length ? root.children : [root])),
    [categories],
  );
  const categoryFuse = useMemo(
    () => new Fuse(categoryOptions, { keys: ["name"], threshold: 0.4 }),
    [categoryOptions],
  );
  const filteredCategoryOptions = categorySearch.trim()
    ? categoryFuse.search(categorySearch.trim()).map((r) => r.item)
    : categoryOptions;

  const composePickupAddress = () => {
    const provinceName = provinces.find((p) => p.code === selectedProvinceCode)?.name;
    const wardName = wards.find((w) => w.code === selectedWardCode)?.name;
    return [addressDetail.trim(), wardName, provinceName].filter(Boolean).join(", ");
  };

  const updateField = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleShipping = (value: ShippingMethod) => {
    setShippings((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  };

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
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
    setStep((prev) => (prev > 1 ? ((prev - 1) as FormStep) : prev));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (step === 1) {
      const shopName = form.shop_name.trim();
      if (!shopName) { setError("Vui lòng nhập tên shop."); return; }
      if (shopName.length < 2) { setError("Tên shop phải có ít nhất 2 ký tự."); return; }
      if (shopName.length > 255) { setError("Tên shop không được vượt quá 255 ký tự."); return; }
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

    setLoading(true);
    try {
      let shopLogoUrl: string | undefined;
      if (logoFile) {
        setUploadingLogo(true);
        try {
          shopLogoUrl = await cloudinaryService.uploadImage(logoFile);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Tải ảnh lên Cloudinary thất bại.");
          return;
        } finally {
          setUploadingLogo(false);
        }
      }

      await sellerService.createProfile({
        shop_name: form.shop_name.trim(),
        shop_logo: shopLogoUrl,
        shop_description: form.shop_description.trim() || undefined,
        pickup_address: composePickupAddress() || undefined,
        owner_name: form.owner_name.trim() || undefined,
        owner_phone: form.owner_phone.trim() || undefined,
        shippings,
        category_ids: selectedCategoryIds,
      });

      toast.success("Tạo hồ sơ cửa hàng thành công!");
      await onCreated();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message ?? "Tạo hồ sơ shop thất bại.");
      } else {
        toast.error("Đã xảy ra lỗi, vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
            Hoàn tất thông tin cơ bản để bắt đầu quản lý sản phẩm, đơn hàng và vận chuyển trong khu vực seller.
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {FORM_STEPS.map(({ step: s, label }, idx) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step >= s
                      ? "bg-ink text-canvas dark:bg-canvas dark:text-ink"
                      : "bg-ink/10 text-slate dark:bg-canvas/10 dark:text-[#8A8884]"
                  }`}
                >
                  {step > s ? <Check size={14} strokeWidth={2.4} /> : s}
                </div>
                {step === s && (
                  <span className="text-[13px] font-medium text-ink dark:text-canvas">{label}</span>
                )}
              </div>
              {idx < FORM_STEPS.length - 1 && (
                <div
                  className={`h-px w-6 transition-colors sm:w-10 ${
                    step > s ? "bg-ink dark:bg-canvas" : "bg-ink/15 dark:bg-canvas/15"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault();
          }}
          className="rounded-lg border border-dust bg-lifted p-5 dark:border-[#2E2E2C] dark:bg-[#1C1C1A] sm:p-6"
        >
          {step === 1 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex items-stretch gap-4 sm:col-span-2">
                <div className="flex flex-1 flex-col gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-ink dark:text-canvas">Tên shop</span>
                    <input
                      value={form.shop_name}
                      onChange={(e) => updateField("shop_name", e.target.value)}
                      placeholder="Ví dụ: Mina Home"
                      className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-canvas/15 dark:bg-ink dark:text-canvas"
                      required
                    />
                  </label>

                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink dark:text-canvas">Mô tả shop</span>
                      <div className="group relative">
                        <button
                          type="button"
                          onClick={handleSuggestDescription}
                          disabled={!form.shop_name.trim() || selectedCategoryIds.length === 0 || suggestingDesc}
                          className="flex items-center gap-1.5 text-xs font-medium text-ink/50 transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 dark:text-canvas/50 dark:hover:text-canvas"
                        >
                          {suggestingDesc
                            ? <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            : <span>✨</span>}
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
                      onChange={(e) => updateField("shop_description", e.target.value)}
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

              <div className="sm:col-span-2">
                <p className="mb-3 text-sm font-semibold text-ink dark:text-canvas">Danh mục hàng hóa</p>
                {categories.length === 0 ? (
                  <p className="text-sm text-slate dark:text-[#8A8884]">Chưa có danh mục nào để chọn.</p>
                ) : (
                  <div className="rounded-lg border border-ink/15 bg-white p-4 dark:border-canvas/15 dark:bg-ink">
                    <div className="relative mb-3">
                      <Search size={15} strokeWidth={1.8} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dust" />
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Tìm danh mục..."
                        className="w-full rounded-full border border-ink/15 bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-canvas/15 dark:bg-[#1C1C1A] dark:text-canvas"
                      />
                    </div>
                    {filteredCategoryOptions.length === 0 ? (
                      <p className="text-sm text-slate dark:text-[#8A8884]">Không tìm thấy danh mục phù hợp.</p>
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
                                  ? "border-ink bg-ink text-canvas dark:border-canvas dark:bg-canvas dark:text-ink"
                                  : "border-ink/15 bg-white text-ink hover:border-ink/40 dark:border-canvas/15 dark:bg-ink dark:text-canvas"
                              }`}
                            >
                              <span aria-hidden="true" className="text-base leading-none">
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
                  <span className="text-sm font-semibold text-ink dark:text-canvas">Tên chủ shop</span>
                  <input
                    value={form.owner_name}
                    onChange={(e) => updateField("owner_name", e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-canvas/15 dark:bg-ink dark:text-canvas"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-ink dark:text-canvas">Số điện thoại</span>
                  <input
                    value={form.owner_phone}
                    onChange={(e) => updateField("owner_phone", e.target.value)}
                    placeholder="0901234567"
                    className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-canvas/15 dark:bg-ink dark:text-canvas"
                  />
                </label>

                <div className="flex flex-col gap-2 sm:col-span-2">
                  <span className="text-sm font-semibold text-ink dark:text-canvas">Địa chỉ lấy hàng</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SearchableSelect
                      options={provinces.map((p) => ({ value: p.code, label: p.name }))}
                      value={selectedProvinceCode}
                      onChange={handleProvinceChange}
                      placeholder="Chọn tỉnh/thành phố"
                      searchPlaceholder="Tìm tỉnh/thành..."
                      emptyMessage="Không tìm thấy tỉnh/thành phù hợp."
                      loading={loadingProvinces}
                    />
                    <SearchableSelect
                      options={wards.map((w) => ({ value: w.code, label: w.name }))}
                      value={selectedWardCode}
                      onChange={(code) => setSelectedWardCode(code)}
                      placeholder="Chọn xã/phường"
                      searchPlaceholder="Tìm xã/phường..."
                      emptyMessage="Không tìm thấy xã/phường phù hợp."
                      disabled={!selectedProvinceCode}
                      loading={loadingWards}
                    />
                  </div>
                  <input
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder="Số nhà, tên đường..."
                    className="rounded-full border border-ink/15 bg-white px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-canvas/15 dark:bg-ink dark:text-canvas"
                  />
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-sm font-semibold text-ink dark:text-canvas">Phương thức vận chuyển</p>
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
                            ? "border-ink bg-ink text-canvas dark:border-canvas dark:bg-canvas dark:text-ink"
                            : "border-ink/15 bg-white text-ink hover:border-ink/40 dark:border-canvas/15 dark:bg-ink dark:text-canvas"
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
            <p className="mt-5 rounded-btn bg-signal/6 px-5 py-3 text-sm font-medium text-signal">
              {error}
            </p>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => window.history.back()}
                className="rounded-btn border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/50 dark:border-canvas/20 dark:text-canvas"
              >
                Để sau
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-btn border border-ink/20 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/50 dark:border-canvas/20 dark:text-canvas"
              >
                Quay lại
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-btn bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-50 dark:text-ink"
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

      {/* Preview */}
      <aside className="self-start lg:sticky lg:top-8 lg:pt-29">
        <div className="rounded-lg border border-dust bg-lifted p-5 dark:border-[#2E2E2C] dark:bg-[#1C1C1A]">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-ink text-canvas dark:bg-canvas dark:text-ink">
              {logoPreview
                ? <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                : <Store size={22} strokeWidth={1.8} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink dark:text-canvas">
                {form.shop_name || "Tên shop"}
              </p>
              <p className="text-xs text-slate dark:text-[#8A8884]">Xem trước hồ sơ</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate dark:text-[#8A8884]">
            {form.shop_description || "Mô tả ngắn giúp khách hàng hiểu shop đang bán gì và vì sao nên mua ở đây."}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {shippings.map((item) => (
              <span key={item} className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink dark:bg-canvas/8 dark:text-canvas">
                {SHIPPING_LABELS[item]}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
