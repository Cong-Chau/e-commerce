import { Package } from "lucide-react";

interface Props {
  hasFilter: boolean;
  onClear: () => void;
}

export default function ProductEmptyState({ hasFilter, onClear }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-20 h-20 rounded-full bg-ink/5 dark:bg-canvas/5 flex items-center justify-center mb-5">
        <Package size={32} strokeWidth={1.1} className="text-ink/25 dark:text-canvas/25" />
      </div>
      <p className="text-base font-semibold text-ink dark:text-canvas">
        {hasFilter ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm nào"}
      </p>
      <p className="text-sm text-slate dark:text-[#8A8884] mt-1.5 max-w-xs">
        {hasFilter
          ? "Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm"
          : "Thêm sản phẩm đầu tiên để bắt đầu bán hàng"}
      </p>
      {hasFilter && (
        <button
          onClick={onClear}
          className="mt-5 px-5 py-2 rounded-[20px] border border-ink/15 dark:border-canvas/15 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/5 dark:hover:bg-canvas/5 transition-colors"
        >
          Xoá bộ lọc
        </button>
      )}
    </div>
  );
}
