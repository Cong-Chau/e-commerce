import { useEffect, useRef, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cloudinaryService } from "../../services/cloudinary.service";
import { productService } from "../../services/product.service";
import { sellerService } from "../../services/seller.service";
import SearchableSelect from "../../components/common/SearchableSelect";

interface ImageEntry {
  id: string;
  file: File;
  previewUrl: string;
}

const MAX_IMAGES = 8;
const MAX_DESC   = 1000;

// ─── Sortable image item ──────────────────────────────────────────────────────
function SortableImage({
  img,
  idx,
  onRemove,
}: {
  img: ImageEntry;
  idx: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: img.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`relative aspect-square rounded-xl overflow-hidden bg-ink/4 dark:bg-canvas/4 group cursor-grab active:cursor-grabbing transition-all duration-150 ${
        isDragging ? "opacity-40 scale-95 z-50" : ""
      }`}
    >
      <img
        src={img.previewUrl}
        alt={`Ảnh ${idx + 1}`}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      <button
        type="button"
        onClick={onRemove}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>

      {idx === 0 && !isDragging && (
        <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded-full pointer-events-none">
          Ảnh chính
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SellerProductCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName]             = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice]           = useState("");
  const [stock, setStock]           = useState("0");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [images, setImages]         = useState<ImageEntry[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]         = useState<
    Partial<Record<"name" | "price" | "stock" | "category" | "form", string>>
  >({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 1 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  useEffect(() => {
    sellerService.getMyCategories().then(setCategories).catch(() => {});
  }, []);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - images.length;
    const newEntries: ImageEntry[] = files.slice(0, remaining).map((file) => ({
      id:         `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newEntries]);
    e.target.value = "";
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleDndStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDndEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setImages((imgs) => {
      const from = imgs.findIndex((img) => img.id === active.id);
      const to   = imgs.findIndex((img) => img.id === over.id);
      return arrayMove(imgs, from, to);
    });
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim() || name.trim().length < 2) errs.name = "Tên sản phẩm tối thiểu 2 ký tự";
    if (!price || Number(price) <= 0)            errs.price = "Giá phải lớn hơn 0";
    if (stock === "" || Number(stock) < 0)        errs.stock = "Số lượng không hợp lệ";
    if (!categoryId)                              errs.category = "Vui lòng chọn danh mục";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const imageUrls = await Promise.all(
        images.map((img) => cloudinaryService.uploadImage(img.file, "products")),
      );

      await productService.createProduct({
        name:        name.trim(),
        description: description.trim() || undefined,
        price:       Number(price),
        stock:       Number(stock),
        category_id: categoryId!,
        images:      imageUrls.length ? imageUrls : undefined,
      });

      toast.success("Đăng sản phẩm thành công!");
      navigate("/seller/inventory");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra, vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-6 border-b border-ink/8 dark:border-canvas/8 shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/seller/inventory")}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink/6 dark:hover:bg-canvas/6 transition-colors shrink-0"
          >
            <ArrowLeft size={18} className="text-ink dark:text-canvas" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-ink dark:text-canvas tracking-tight">
              Thêm sản phẩm mới
            </h1>
            <p className="text-sm text-slate dark:text-[#8A8884] mt-0.5">
              Điền thông tin và đăng sản phẩm lên cửa hàng của bạn
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

            {/* ── Left: fields ── */}
            <div className="flex flex-col gap-6">

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink dark:text-canvas">
                  Tên sản phẩm <span className="text-signal">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={255}
                  placeholder="VD: Áo thun nam basic cotton..."
                  className="w-full px-4 py-3 rounded-xl border border-ink/12 dark:border-canvas/12 bg-white dark:bg-[#1C1C1A] text-sm text-ink dark:text-canvas placeholder:text-ink/30 dark:placeholder:text-canvas/30 outline-none focus:border-ink/30 dark:focus:border-canvas/30 transition-colors"
                />
                {errors.name && <p className="text-xs text-signal">{errors.name}</p>}
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink dark:text-canvas">Mô tả sản phẩm</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_DESC}
                  rows={5}
                  placeholder="Mô tả chi tiết: chất liệu, kích thước, tính năng nổi bật..."
                  className="w-full px-4 py-3 rounded-xl border border-ink/12 dark:border-canvas/12 bg-white dark:bg-[#1C1C1A] text-sm text-ink dark:text-canvas placeholder:text-ink/30 dark:placeholder:text-canvas/30 outline-none focus:border-ink/30 dark:focus:border-canvas/30 transition-colors resize-none"
                />
                <p className={`text-xs text-right ${description.length >= MAX_DESC ? "text-signal" : "text-ink/30 dark:text-canvas/30"}`}>
                  {description.length}/{MAX_DESC}
                </p>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-ink dark:text-canvas">
                  Danh mục <span className="text-signal">*</span>
                </label>
                <SearchableSelect
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={categoryId}
                  onChange={(v) => setCategoryId(v)}
                  placeholder="Chọn danh mục sản phẩm"
                  searchPlaceholder="Tìm danh mục..."
                />
                {errors.category && <p className="text-xs text-signal">{errors.category}</p>}
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink dark:text-canvas">
                    Giá bán <span className="text-signal">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      min={1}
                      placeholder="0"
                      className="w-full px-4 py-3 pr-8 rounded-xl border border-ink/12 dark:border-canvas/12 bg-white dark:bg-[#1C1C1A] text-sm text-ink dark:text-canvas placeholder:text-ink/30 dark:placeholder:text-canvas/30 outline-none focus:border-ink/30 dark:focus:border-canvas/30 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink/30 dark:text-canvas/30 pointer-events-none">
                      đ
                    </span>
                  </div>
                  {errors.price && <p className="text-xs text-signal">{errors.price}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-ink dark:text-canvas">Số lượng tồn kho</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    min={0}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-ink/12 dark:border-canvas/12 bg-white dark:bg-[#1C1C1A] text-sm text-ink dark:text-canvas placeholder:text-ink/30 dark:placeholder:text-canvas/30 outline-none focus:border-ink/30 dark:focus:border-canvas/30 transition-colors"
                  />
                  {errors.stock && <p className="text-xs text-signal">{errors.stock}</p>}
                </div>
              </div>
            </div>

            {/* ── Right: images ── */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-ink dark:text-canvas">Ảnh sản phẩm</label>
                <span className="text-xs text-ink/30 dark:text-canvas/30">{images.length}/{MAX_IMAGES}</span>
              </div>

              <DndContext sensors={sensors} onDragStart={handleDndStart} onDragEnd={handleDndEnd}>
                <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img, idx) => (
                      <SortableImage
                        key={img.id}
                        img={img}
                        idx={idx}
                        onRemove={() => handleRemoveImage(idx)}
                      />
                    ))}

                    {images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-ink/15 dark:border-canvas/15 flex flex-col items-center justify-center gap-1.5 text-ink/30 dark:text-canvas/30 hover:border-ink/30 dark:hover:border-canvas/30 hover:text-ink/50 dark:hover:text-canvas/50 transition-colors"
                      >
                        <ImagePlus size={22} strokeWidth={1.5} />
                        <span className="text-[11px] font-medium">Thêm ảnh</span>
                      </button>
                    )}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeId ? (() => {
                    const img = images.find((i) => i.id === activeId);
                    return img ? (
                      <div className="aspect-square rounded-xl overflow-hidden shadow-2xl opacity-90 cursor-grabbing ring-2 ring-ink dark:ring-canvas">
                        <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : null;
                  })() : null}
                </DragOverlay>
              </DndContext>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddImages}
                className="hidden"
              />

              <p className="text-[11px] text-ink/30 dark:text-canvas/30 leading-relaxed">
                Tối đa {MAX_IMAGES} ảnh. Kéo để sắp xếp — ảnh đầu tiên là ảnh đại diện.
              </p>
            </div>
          </div>

          {errors.form && (
            <div className="mt-6 px-4 py-3 rounded-xl bg-signal/10 text-sm text-signal">
              {errors.form}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-ink/8 dark:border-canvas/8">
            <button
              type="button"
              onClick={() => navigate("/seller/inventory")}
              className="px-6 py-2.5 rounded-btn border border-ink/15 dark:border-canvas/15 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/5 dark:hover:bg-canvas/5 transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-ink dark:bg-canvas text-canvas dark:text-ink text-sm font-semibold hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] transition-all"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Đang lưu…" : "Đăng sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
