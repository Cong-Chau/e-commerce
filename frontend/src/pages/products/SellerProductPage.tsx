import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import {
  productService,
  type ProductItem,
  type ProductStatus,
  type GetMyProductsParams,
} from "../../services/product.service";
import { sellerService } from "../../services/seller.service";
import SearchableSelect from "../../components/common/SearchableSelect";
import ProductCard from "../../components/products/ProductCard";
import ProductSkeletonCard from "../../components/products/ProductSkeletonCard";
import ProductEmptyState from "../../components/products/ProductEmptyState";

const LIMIT = 12;

const STATUS_TABS: { value: ProductStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang bán" },
  { value: "OUT_OF_STOCK", label: "Hết hàng" },
  { value: "INACTIVE", label: "Đã ẩn" },
];

export default function SellerProductPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );

  const [refreshKey, setRefreshKey] = useState(0);
  const [confirmItem, setConfirmItem] = useState<ProductItem | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    sellerService
      .getMyCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: GetMyProductsParams = { page, limit: LIMIT };
        if (status) params.status = status;
        if (categoryId !== null) params.category_id = categoryId;
        if (search) params.search = search;
        const res = await productService.getMyProducts(params);
        if (!cancelled) {
          setProducts(res.items);
          setTotal(res.total);
          setTotalPages(res.totalPages);
        }
      } catch {
        if (!cancelled) setError("Không thể tải danh sách sản phẩm.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page, status, categoryId, search, refreshKey]);

  const handleStatusTab = (v: ProductStatus | "") => {
    setStatus(v);
    setPage(1);
  };
  const handleCategoryChange = (v: number) => {
    setCategoryId(v);
    setPage(1);
  };
  const handleSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };
  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatus("");
    setCategoryId(null);
    setPage(1);
  };

  const handleConfirmToggle = async () => {
    if (!confirmItem) return;
    const wasActive = confirmItem.status === "ACTIVE";
    setToggling(true);
    try {
      const result = await productService.toggleProductStatus(confirmItem.id);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === result.id ? { ...p, status: result.status } : p,
        ),
      );
      setConfirmItem(null);
      toast.success(wasActive ? "Đã ngừng bán sản phẩm." : "Đã bật bán lại sản phẩm.");
    } catch {
      toast.error("Thao tác thất bại, thử lại sau.");
    } finally {
      setToggling(false);
    }
  };

  const hasFilter = !!(search || status || categoryId);
  const startItem = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, total);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink dark:text-canvas tracking-tight">
              Sản phẩm
            </h1>
            <p className="text-sm text-slate dark:text-[#8A8884] mt-0.5">
              {loading ? "Đang tải…" : `${total} sản phẩm`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate("/seller/inventory/import")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-btn border border-ink/15 dark:border-canvas/15 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/5 dark:hover:bg-canvas/5 transition-colors"
            >
              <FileSpreadsheet size={15} strokeWidth={1.8} />
              Import Excel
            </button>
            <button
              onClick={() => navigate("/seller/inventory/new")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-ink dark:bg-canvas text-canvas dark:text-ink text-sm font-semibold hover:opacity-85 active:scale-[0.97] transition-all"
            >
              <Plus size={15} strokeWidth={2.5} />
              Thêm sản phẩm
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1 mt-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusTab(tab.value)}
              className={`px-4 py-2 rounded-btn text-sm font-medium transition-all ${
                status === tab.value
                  ? "bg-ink dark:bg-canvas text-canvas dark:text-ink"
                  : "text-slate dark:text-[#8A8884] hover:text-ink dark:hover:text-canvas hover:bg-ink/6 dark:hover:bg-canvas/6"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Category */}
        <div className="flex items-center gap-3 mt-4 pb-5 border-b border-ink/8 dark:border-canvas/8">
          <div className="flex items-center gap-2 flex-1 max-w-sm bg-white dark:bg-[#1C1C1A] border border-ink/10 dark:border-canvas/10 rounded-full px-4 py-2.5">
            <Search
              size={13}
              className="text-ink/30 dark:text-canvas/30 shrink-0"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tìm theo tên sản phẩm..."
              className="flex-1 text-sm bg-transparent text-ink dark:text-canvas placeholder:text-ink/30 dark:placeholder:text-canvas/30 outline-none min-w-0"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                className="text-ink/30 dark:text-canvas/30 hover:text-ink/60 dark:hover:text-canvas/60 text-xs leading-none"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            className="px-5 py-2.5 rounded-full bg-ink/5 dark:bg-canvas/5 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/10 dark:hover:bg-canvas/10 transition-colors"
          >
            Tìm
          </button>

          {categories.length > 0 && (
            <div className="w-48">
              <SearchableSelect
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                value={categoryId}
                onChange={handleCategoryChange}
                placeholder="Tất cả danh mục"
                searchPlaceholder="Tìm danh mục..."
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {error ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-sm text-signal">{error}</p>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="mt-3 text-xs text-slate dark:text-[#8A8884] underline"
            >
              Thử lại
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <ProductSkeletonCard key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <ProductEmptyState hasFilter={hasFilter} onClear={clearFilters} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                onClick={() => navigate(`/seller/inventory/${item.id}`)}
                onToggleStatus={() => setConfirmItem(item)}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-ink/8 dark:border-canvas/8">
            <p className="text-xs text-slate dark:text-[#8A8884]">
              {startItem}–{endItem} / {total} sản phẩm
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-full text-ink/40 dark:text-canvas/40 hover:bg-ink/6 dark:hover:bg-canvas/6 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) < p - 1)
                    acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`el-${idx}`}
                      className="w-8 text-center text-xs text-ink/30 dark:text-canvas/30"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 text-xs rounded-full font-medium transition-colors ${
                        page === p
                          ? "bg-ink dark:bg-canvas text-canvas dark:text-ink"
                          : "text-ink/50 dark:text-canvas/50 hover:bg-ink/6 dark:hover:bg-canvas/6"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full text-ink/40 dark:text-canvas/40 hover:bg-ink/6 dark:hover:bg-canvas/6 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm dialog ── */}
      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !toggling && setConfirmItem(null)}
          />
          <div className="relative w-full max-w-sm mx-4 bg-lifted dark:bg-[#1C1C1A] rounded-[28px] shadow-2xl border border-ink/8 dark:border-canvas/8 p-6">
            <h3 className="text-base font-bold text-ink dark:text-canvas">
              {confirmItem.status === "ACTIVE"
                ? "Ngừng bán sản phẩm?"
                : "Bật bán lại sản phẩm?"}
            </h3>
            <p className="mt-2 text-sm text-slate dark:text-[#8A8884] leading-relaxed">
              {confirmItem.status === "ACTIVE"
                ? "Sản phẩm sẽ bị ẩn, khách hàng không thể tìm thấy hay đặt mua."
                : "Sản phẩm sẽ hiển thị công khai trở lại trên cửa hàng."}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink dark:text-canvas truncate">
              {confirmItem.name}
            </p>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setConfirmItem(null)}
                disabled={toggling}
                className="flex-1 py-2.5 rounded-btn border border-ink/15 dark:border-canvas/15 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/5 dark:hover:bg-canvas/5 disabled:opacity-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleConfirmToggle}
                disabled={toggling}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-semibold disabled:opacity-50 transition-all ${
                  confirmItem.status === "ACTIVE"
                    ? "bg-signal text-white hover:opacity-85"
                    : "bg-emerald-600 text-white hover:opacity-85"
                }`}
              >
                {toggling && <Loader2 size={14} className="animate-spin" />}
                {confirmItem.status === "ACTIVE" ? "Ngừng bán" : "Bật bán lại"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
