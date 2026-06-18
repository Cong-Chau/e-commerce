import { ImageOff, Package } from "lucide-react";
import type { ProductItem, ProductStatus } from "../../services/product.service";

const STATUS_BADGE: Record<ProductStatus, { label: string; cls: string }> = {
  ACTIVE: {
    label: "Đang bán",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  INACTIVE: {
    label: "Đã ẩn",
    cls: "bg-ink/8 text-slate dark:bg-canvas/8 dark:text-[#8A8884]",
  },
  OUT_OF_STOCK: {
    label: "Hết hàng",
    cls: "bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400",
  },
};

function formatPrice(price: string) {
  return Number(price).toLocaleString("vi-VN") + "đ";
}

export default function ProductCard({
  item,
  onClick,
  onToggleStatus,
}: {
  item: ProductItem;
  onClick?: () => void;
  onToggleStatus?: () => void;
}) {
  const badge = STATUS_BADGE[item.status];
  const thumb = item.images?.[0]?.image_url;
  const stockLow = item.stock > 0 && item.stock < 10;

  return (
    <div onClick={onClick} className="group rounded-[28px] bg-lifted dark:bg-[#1C1C1A] overflow-hidden border border-ink/6 dark:border-canvas/6 hover:border-ink/16 dark:hover:border-canvas/16 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer">
      <div className="relative aspect-square overflow-hidden bg-ink/4 dark:bg-canvas/4">
        {thumb ? (
          <img
            src={thumb}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={32} strokeWidth={1.2} className="text-ink/15 dark:text-canvas/15" />
          </div>
        )}

        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-sm ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {stockLow && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-orange-50/90 text-orange-500 backdrop-blur-sm dark:bg-orange-900/40 dark:text-orange-400">
              Sắp hết
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-sm font-semibold text-ink dark:text-canvas truncate leading-snug">
          {item.name}
        </p>
        <p className="text-[11px] text-ink/35 dark:text-canvas/35 mt-0.5">#{item.id}</p>

        <div className="flex items-center justify-between mt-3">
          <p className="text-base font-bold text-ink dark:text-canvas tracking-tight">
            {formatPrice(item.price)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-ink/40 dark:text-canvas/40">
            <Package size={11} strokeWidth={1.8} />
            <span>{item.stock}</span>
          </div>
        </div>

        {onToggleStatus && (
          <div
            className="mt-3 flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[11px] text-ink/40 dark:text-canvas/40">
              {item.status === "ACTIVE" ? "Đang bán" : "Đã ẩn"}
            </span>
            <button
              onClick={onToggleStatus}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                item.status === "ACTIVE"
                  ? "bg-emerald-500"
                  : "bg-ink/15 dark:bg-canvas/15"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  item.status === "ACTIVE" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
