import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ImageOff, Package, Tag, Star, Plus, X } from "lucide-react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cloudinaryService } from "../../services/cloudinary.service";
import LoadingDialog from "../../components/common/LoadingDialog";
import { useToast } from "../../hooks/useToast";
import {
  productService,
  type ProductDetail,
  type ProductImage,
  type ProductStatus,
} from "../../services/product.service";

interface EditImage extends ProductImage {
  file?: File;
}
import { sellerService } from "../../services/seller.service";
import SearchableSelect from "../../components/common/SearchableSelect";

// ─── Sortable thumbnail item ──────────────────────────────────────────────────
function SortableThumbnail({
  img,
  index,
  isActive,
  onSelect,
  onRemove,
}: {
  img: ProductImage;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(img.id) });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative group shrink-0 ${isDragging ? "z-50" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div
        onClick={onSelect}
        className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing select-none ${
          isDragging
            ? "opacity-40 scale-95"
            : isActive
            ? "border-ink dark:border-canvas"
            : "border-transparent opacity-50 hover:opacity-80"
        }`}
      >
        <img
          src={img.image_url}
          alt=""
          className="w-full h-full object-cover pointer-events-none"
        />
      </div>

      {index === 0 && !isDragging && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-ink dark:bg-canvas text-canvas dark:text-ink text-[9px] font-semibold whitespace-nowrap leading-tight pointer-events-none">
          Đại diện
        </span>
      )}

      <button
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-signal text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<ProductStatus, { label: string; cls: string }> = {
  ACTIVE:       { label: "Đang bán",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  INACTIVE:     { label: "Đã ẩn",     cls: "bg-ink/8 text-slate dark:bg-canvas/8 dark:text-[#8A8884]" },
  OUT_OF_STOCK: { label: "Hết hàng",  cls: "bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400" },
};

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "ACTIVE",       label: "Đang bán" },
  { value: "INACTIVE",     label: "Đã ẩn" },
  { value: "OUT_OF_STOCK", label: "Hết hàng" },
];

function formatPrice(price: string) {
  return Number(price).toLocaleString("vi-VN") + "đ";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

const inputCls =
  "w-full rounded-xl bg-white dark:bg-[#2A2A28] border border-ink/12 dark:border-canvas/12 px-3.5 py-2.5 text-sm text-ink dark:text-canvas placeholder:text-ink/30 dark:placeholder:text-canvas/30 outline-none focus:border-ink/30 dark:focus:border-canvas/30 transition-colors";

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SellerProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const [product, setProduct]         = useState<ProductDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeImg, setActiveImg]     = useState(0);

  const [categories, setCategories]   = useState<{ id: number; name: string }[]>([]);
  const [isEditing, setIsEditing]     = useState(false);
  const [saving, setSaving]           = useState(false);

  // form fields
  const [editName, setEditName]             = useState("");
  const [editDesc, setEditDesc]             = useState("");
  const [editPrice, setEditPrice]           = useState("");
  const [editStock, setEditStock]           = useState("");
  const [editStatus, setEditStatus]         = useState<ProductStatus>("ACTIVE");
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editImages, setEditImages]         = useState<EditImage[]>([]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 1 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const productId = id ? Number(id) : NaN;

  useEffect(() => {
    if (isNaN(productId)) return;
    let cancelled = false;
    productService
      .getProductById(productId)
      .then((d)  => { if (!cancelled) { setProduct(d); setLoading(false); } })
      .catch(()  => { if (!cancelled) { setError("Không thể tải thông tin sản phẩm."); setLoading(false); } });
    return () => { cancelled = true; };
  }, [productId]);

  useEffect(() => {
    sellerService.getMyCategories().then(setCategories).catch(() => {});
  }, []);

  // ── Edit helpers ──
  const startEdit = () => {
    if (!product) return;
    setEditName(product.name);
    setEditDesc(product.description ?? "");
    setEditPrice(String(Number(product.price)));
    setEditStock(String(product.stock));
    setEditStatus(product.status);
    setEditCategoryId(product.category.id);
    setEditImages(product.images ?? []);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    editImages.forEach((img) => { if (img.file) URL.revokeObjectURL(img.image_url); });
    setIsEditing(false);
  };

  const removeImage = (index: number) => {
    setEditImages((prev) => {
      const img = prev[index];
      if (img.file) URL.revokeObjectURL(img.image_url);
      return prev.filter((_, i) => i !== index);
    });
    if (activeImg >= index && activeImg > 0) setActiveImg((a) => a - 1);
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setEditImages((prev) => [
      ...prev,
      ...files.map((file, i) => ({
        id: Date.now() + i,
        image_url: URL.createObjectURL(file),
        file,
      })),
    ]);
    e.target.value = "";
  };

  const handleDndEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEditImages((imgs) => {
      const from = imgs.findIndex((img) => String(img.id) === active.id);
      const to   = imgs.findIndex((img) => String(img.id) === over.id);
      return arrayMove(imgs, from, to);
    });
    setActiveImg(0);
  };

  const handleSave = async () => {
    if (!product) return;
    const price = Number(editPrice);
    const stock = Number(editStock);
    if (!editName.trim() || editName.trim().length < 2) { toast.error("Tên sản phẩm tối thiểu 2 ký tự."); return; }
    if (!price || price <= 0) { toast.error("Giá phải lớn hơn 0."); return; }
    if (isNaN(stock) || stock < 0) { toast.error("Số lượng không hợp lệ."); return; }

    setSaving(true);
    try {
      const resolvedImages = await Promise.all(
        editImages.map(async (img) => {
          if (!img.file) return img;
          const url = await cloudinaryService.uploadImage(img.file, "products");
          URL.revokeObjectURL(img.image_url);
          return { id: img.id, image_url: url };
        }),
      );

      const updated = await productService.updateProduct(product.id, {
        name:        editName.trim(),
        description: editDesc.trim() || undefined,
        price,
        stock,
        status:      editStatus,
        category_id: editCategoryId ?? undefined,
      });

      const originalUrls = (product.images ?? []).map((i) => i.image_url).join(",");
      const resolvedUrls = resolvedImages.map((i) => i.image_url).join(",");
      if (originalUrls !== resolvedUrls) {
        await productService.updateProductImages(
          product.id,
          resolvedImages.map((i) => i.image_url),
        );
      }

      setProduct({ ...updated, images: resolvedImages });
      setActiveImg(0);
      setIsEditing(false);
      toast.success("Cập nhật sản phẩm thành công!");
    } catch {
      toast.error("Cập nhật thất bại, thử lại sau.");
    } finally {
      setSaving(false);
    }
  };

  // ── Early returns ──
  if (isNaN(productId)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 gap-4">
        <p className="text-sm text-slate dark:text-[#8A8884]">ID sản phẩm không hợp lệ.</p>
        <button onClick={() => navigate("/seller/inventory")} className="text-xs text-ink/50 dark:text-canvas/50 underline">
          Quay lại kho
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="w-6 h-6 border-2 border-ink/20 dark:border-canvas/20 border-t-ink dark:border-t-canvas rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 gap-4">
        <p className="text-sm text-slate dark:text-[#8A8884]">{error ?? "Sản phẩm không tồn tại."}</p>
        <button onClick={() => navigate("/seller/inventory")} className="text-xs text-ink/50 dark:text-canvas/50 underline">
          Quay lại kho
        </button>
      </div>
    );
  }

  const viewImages   = product.images ?? [];
  const displayImages = isEditing ? editImages : viewImages;
  const badge        = STATUS_BADGE[product.status];

  return (
    <div className="flex flex-col h-full">
      <LoadingDialog open={saving} message="Đang lưu sản phẩm..." />

      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-6 border-b border-ink/8 dark:border-canvas/8 shrink-0">
        <button
          onClick={() => navigate("/seller/inventory")}
          className="inline-flex items-center gap-2 text-sm text-slate dark:text-[#8A8884] hover:text-ink dark:hover:text-canvas transition-colors mb-5"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Kho hàng
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge.cls}`}>
              {badge.label}
            </span>
            <h1 className="text-2xl font-bold text-ink dark:text-canvas truncate">{product.name}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-2 rounded-btn border border-ink/15 dark:border-canvas/15 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/5 dark:hover:bg-canvas/5 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 rounded-btn bg-ink dark:bg-canvas text-canvas dark:text-ink text-sm font-semibold hover:opacity-85 active:scale-[0.97] transition-all disabled:opacity-50"
                >
                  Lưu
                </button>
              </>
            ) : (
              <button
                onClick={startEdit}
                className="px-4 py-2 rounded-btn border border-ink/15 dark:border-canvas/15 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/5 dark:hover:bg-canvas/5 transition-colors"
              >
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl flex flex-col lg:flex-row gap-10">

          {/* ── Images ── */}
          <div className="shrink-0 flex flex-col gap-4 lg:w-72">
            {/* Main preview */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-ink/4 dark:bg-canvas/4 flex items-center justify-center">
              {displayImages.length > 0 ? (
                <img
                  src={displayImages[Math.min(activeImg, displayImages.length - 1)]?.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageOff size={40} strokeWidth={1.2} className="text-ink/15 dark:text-canvas/15" />
              )}
            </div>

            {/* Thumbnails */}
            {isEditing ? (
              <DndContext sensors={sensors} onDragEnd={handleDndEnd}>
                <SortableContext
                  items={editImages.map((img) => String(img.id))}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex gap-2 flex-wrap">
                    {editImages.map((img, i) => (
                      <SortableThumbnail
                        key={img.id}
                        img={img}
                        index={i}
                        isActive={i === activeImg}
                        onSelect={() => setActiveImg(i)}
                        onRemove={() => removeImage(i)}
                      />
                    ))}

                    {/* Add button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving}
                      className="w-14 h-14 rounded-xl border-2 border-dashed border-ink/20 dark:border-canvas/20 flex items-center justify-center hover:border-ink/40 dark:hover:border-canvas/40 transition-colors disabled:opacity-40 shrink-0"
                    >
                      <Plus size={18} strokeWidth={1.8} className="text-ink/30 dark:text-canvas/30" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleAddImage}
                    />
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              viewImages.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {viewImages.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImg(i)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        i === activeImg
                          ? "border-ink dark:border-canvas"
                          : "border-transparent opacity-50 hover:opacity-80"
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {/* ── Info / Form ── */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {isEditing ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ink/50 dark:text-canvas/50 uppercase tracking-wide">
                    Tên sản phẩm
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={255}
                    placeholder="Tên sản phẩm"
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-ink/50 dark:text-canvas/50 uppercase tracking-wide">Giá (đ)</label>
                    <input type="number" min={1} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="0" className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-ink/50 dark:text-canvas/50 uppercase tracking-wide">Tồn kho</label>
                    <input type="number" min={0} value={editStock} onChange={(e) => setEditStock(e.target.value)} placeholder="0" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-ink/50 dark:text-canvas/50 uppercase tracking-wide">Trạng thái</label>
                    <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as ProductStatus)} className={inputCls}>
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-ink/50 dark:text-canvas/50 uppercase tracking-wide">Danh mục</label>
                    <SearchableSelect
                      options={categories.map((c) => ({ value: c.id, label: c.name }))}
                      value={editCategoryId}
                      onChange={(v) => setEditCategoryId(v)}
                      placeholder="Chọn danh mục"
                      searchPlaceholder="Tìm danh mục..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ink/50 dark:text-canvas/50 uppercase tracking-wide">Mô tả</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={5}
                    maxLength={1000}
                    placeholder="Mô tả sản phẩm..."
                    className={`${inputCls} resize-none`}
                  />
                  <p className="text-[11px] text-ink/30 dark:text-canvas/30 text-right">{editDesc.length}/1000</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-ink dark:text-canvas tracking-tight">
                  {formatPrice(product.price)}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-ink/4 dark:bg-canvas/4 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-canvas/40 mb-1.5">Tồn kho</p>
                    <div className="flex items-center gap-1.5">
                      <Package size={14} strokeWidth={1.8} className="text-ink/50 dark:text-canvas/50" />
                      <span className={`text-sm font-bold ${product.stock > 0 && product.stock < 10 ? "text-orange-500" : "text-ink dark:text-canvas"}`}>
                        {product.stock}
                        {product.stock > 0 && product.stock < 10 && (
                          <span className="ml-1 text-[11px] font-medium">(sắp hết)</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-ink/4 dark:bg-canvas/4 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-canvas/40 mb-1.5">Danh mục</p>
                    <div className="flex items-center gap-1.5">
                      <Tag size={13} strokeWidth={1.8} className="text-ink/50 dark:text-canvas/50 shrink-0" />
                      <span className="text-sm font-medium text-ink dark:text-canvas truncate">{product.category.name}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-ink/4 dark:bg-canvas/4 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-canvas/40 mb-1.5">Đánh giá</p>
                    <div className="flex items-center gap-1.5">
                      <Star size={13} strokeWidth={1.8} className="text-ink/50 dark:text-canvas/50" />
                      <span className="text-sm font-medium text-ink dark:text-canvas">{product._count.reviews} đánh giá</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-ink/4 dark:bg-canvas/4 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-canvas/40 mb-1.5">Đã bán</p>
                    <span className="text-sm font-medium text-ink dark:text-canvas">{product._count.orderItems} đơn</span>
                  </div>
                </div>

                {product.description && (
                  <div className="border-t border-ink/8 dark:border-canvas/8 pt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40 dark:text-canvas/40 mb-2">Mô tả sản phẩm</p>
                    <p className="text-sm text-ink dark:text-canvas leading-relaxed whitespace-pre-line">{product.description}</p>
                  </div>
                )}

                <div className="border-t border-ink/8 dark:border-canvas/8 pt-4">
                  <p className="text-[11px] text-ink/30 dark:text-canvas/30">Ngày tạo: {formatDate(product.created_at)}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
