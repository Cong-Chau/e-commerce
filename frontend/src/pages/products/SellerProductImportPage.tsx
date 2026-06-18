import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Download,
  FileSpreadsheet,
  Loader2,
  X,
} from "lucide-react";
import { productService } from "../../services/product.service";
import { sellerService } from "../../services/seller.service";
import SearchableSelect from "../../components/common/SearchableSelect";

// ─── Types ────────────────────────────────────────────────────────────────────

type RowStatus = "valid" | "invalid" | "importing" | "done" | "failed";

interface ImportRow {
  row: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  errors: string[];
  status: RowStatus;
  errorMsg?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SellerProductImportPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    sellerService.getMyCategories().then(setCategories).catch(() => {});
  }, []);

  // ── Template download ─────────────────────────────────────────────────────

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Tên sản phẩm", "Mô tả", "Giá (đ)", "Số lượng"],
      ["Áo thun nam basic", "Cotton 100%, thoáng mát", 150000, 50],
      ["Áo polo trắng", "", 220000, 30],
    ]);
    ws["!cols"] = [{ wch: 30 }, { wch: 40 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, "Sản phẩm");
    XLSX.writeFile(wb, "mau-nhap-san-pham.xlsx");
  };

  // ── File parsing ──────────────────────────────────────────────────────────

  const processFile = async (file: File) => {
    setParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) return;

      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

      const result: ImportRow[] = [];

      for (let i = 1; i < rawRows.length; i++) {
        const r = rawRows[i];
        const name = String(r[0] ?? "").trim();
        const description = String(r[1] ?? "").trim();
        const priceRaw = r[2];
        const stockRaw = r[3];

        if (!name && !priceRaw && !stockRaw) continue;

        const price = Number(priceRaw);
        const stock = stockRaw != null ? Math.max(0, Number(stockRaw)) : 0;

        const errs: string[] = [];
        if (!name || name.length < 2) errs.push("Tên thiếu hoặc quá ngắn");
        if (!priceRaw || isNaN(price) || price <= 0) errs.push("Giá không hợp lệ (phải > 0)");

        result.push({
          row: i + 1,
          name: name || "(trống)",
          description: description || undefined,
          price: isNaN(price) ? 0 : price,
          stock: isNaN(stock) ? 0 : stock,
          errors: errs,
          status: errs.length === 0 ? "valid" : "invalid",
        });
      }

      setRows(result);
      setImportDone(false);
    } catch (err) {
      console.error("Excel parse error:", err);
    } finally {
      setParsing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && /\.(xlsx|xls)$/i.test(f.name)) processFile(f);
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const runImport = async () => {
    if (!categoryId) return;
    const toImport = rows.filter((r) => r.status === "valid");
    if (!toImport.length) return;

    setImporting(true);
    for (const row of toImport) {
      setRows((prev) =>
        prev.map((r) => (r.row === row.row ? { ...r, status: "importing" } : r)),
      );
      try {
        await productService.createProduct({
          name: row.name,
          description: row.description,
          price: row.price,
          stock: row.stock,
          category_id: categoryId,
        });
        setRows((prev) =>
          prev.map((r) => (r.row === row.row ? { ...r, status: "done" } : r)),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Lỗi không xác định";
        setRows((prev) =>
          prev.map((r) => (r.row === row.row ? { ...r, status: "failed", errorMsg: msg } : r)),
        );
      }
    }
    setImporting(false);
    setImportDone(true);
  };

  // ── Derived counts ────────────────────────────────────────────────────────

  const validCount = rows.filter((r) =>
    ["valid", "importing", "done", "failed"].includes(r.status),
  ).length;
  const invalidCount = rows.filter((r) => r.status === "invalid").length;
  const doneCount = rows.filter((r) => r.status === "done").length;
  const failedCount = rows.filter((r) => r.status === "failed").length;

  const canImport = !!categoryId && validCount > 0 && !importing;
  const selectedCategory = categories.find((c) => c.id === categoryId);

  // ── Render ────────────────────────────────────────────────────────────────

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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-ink dark:text-canvas tracking-tight">
              Nhập sản phẩm từ Excel
            </h1>
            <p className="text-sm text-slate dark:text-[#8A8884] mt-0.5">
              Chọn danh mục, tải file lên — hệ thống tự tạo sản phẩm hàng loạt
            </p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-btn border border-ink/15 dark:border-canvas/15 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/5 dark:hover:bg-canvas/5 transition-colors shrink-0"
          >
            <Download size={14} />
            Tải file mẫu
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          {/* Category selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-ink dark:text-canvas">
              Danh mục <span className="text-signal">*</span>
            </label>
            <div className="max-w-xs">
              <SearchableSelect
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Chọn danh mục cho toàn bộ file"
                searchPlaceholder="Tìm danh mục..."
              />
            </div>
            <p className="text-xs text-slate dark:text-[#8A8884]">
              Tất cả sản phẩm trong file sẽ thuộc danh mục này
            </p>
          </div>

          {/* Upload zone */}
          {rows.length === 0 && !parsing && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[28px] flex flex-col items-center justify-center gap-4 py-20 cursor-pointer transition-colors ${
                  dragging
                    ? "border-ink/40 bg-ink/4 dark:border-canvas/40 dark:bg-canvas/4"
                    : "border-ink/15 dark:border-canvas/15 hover:border-ink/30 dark:hover:border-canvas/30"
                }`}
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-ink/6 dark:bg-canvas/6">
                  <FileSpreadsheet size={30} className="text-ink/40 dark:text-canvas/40" strokeWidth={1.4} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-ink dark:text-canvas">
                    Kéo thả file vào đây hoặc click để chọn
                  </p>
                  <p className="text-xs text-slate dark:text-[#8A8884] mt-1.5">
                    Hỗ trợ .xlsx, .xls
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              {/* Format hint */}
              <div className="rounded-xl bg-ink/4 dark:bg-canvas/4 px-5 py-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-ink dark:text-canvas">Cấu trúc file Excel</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    "A — Tên sản phẩm *",
                    "B — Mô tả",
                    "C — Giá (đ) *",
                    "D — Số lượng",
                  ].map((label) => (
                    <span
                      key={label}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium border bg-white dark:bg-[#1C1C1A] border-ink/10 dark:border-canvas/10 text-ink/70 dark:text-canvas/70"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate dark:text-[#8A8884] leading-relaxed">
                  * bắt buộc · Danh mục được chọn ở trên, không cần cột riêng trong file.
                </p>
              </div>
            </>
          )}

          {/* Parsing loader */}
          {parsing && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={28} className="animate-spin text-ink/30 dark:text-canvas/30" />
              <p className="text-sm text-slate dark:text-[#8A8884]">Đang đọc file…</p>
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <>
              {/* Summary */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1.5 rounded-full bg-ink/5 dark:bg-canvas/5 text-xs font-medium text-ink dark:text-canvas">
                  {rows.length} dòng
                </span>
                <span className="px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Check size={10} className="inline -mt-0.5 mr-1" />
                  {validCount} hợp lệ
                </span>
                {invalidCount > 0 && (
                  <span className="px-3 py-1.5 rounded-full bg-signal/8 text-xs font-medium text-signal">
                    <AlertCircle size={10} className="inline -mt-0.5 mr-1" />
                    {invalidCount} lỗi
                  </span>
                )}
                {selectedCategory && (
                  <span className="px-3 py-1.5 rounded-full bg-ink/5 dark:bg-canvas/5 text-xs text-slate dark:text-[#8A8884]">
                    Danh mục: <strong className="text-ink dark:text-canvas">{selectedCategory.name}</strong>
                  </span>
                )}
                {!importing && !importDone && (
                  <button
                    type="button"
                    onClick={() => setRows([])}
                    className="ml-auto text-xs text-slate dark:text-[#8A8884] underline"
                  >
                    Chọn file khác
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="rounded-btn border border-ink/8 dark:border-canvas/8 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ink/4 dark:bg-canvas/4">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate dark:text-[#8A8884] w-10">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate dark:text-[#8A8884]">Tên sản phẩm</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate dark:text-[#8A8884]">Giá</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate dark:text-[#8A8884]">SL</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold text-slate dark:text-[#8A8884] w-24">Kết quả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.row}
                          className={`border-t border-ink/6 dark:border-canvas/6 ${
                            row.status === "invalid" ? "bg-signal/4" : ""
                          }`}
                        >
                          <td className="px-4 py-3 text-xs text-slate dark:text-[#8A8884] align-top pt-3.5">
                            {row.row}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <p className="text-ink dark:text-canvas font-medium text-sm truncate max-w-64">
                              {row.name}
                            </p>
                            {row.description && (
                              <p className="text-[11px] text-slate dark:text-[#8A8884] mt-0.5 truncate max-w-64">
                                {row.description}
                              </p>
                            )}
                            {row.errors.length > 0 && (
                              <p className="text-[11px] text-signal mt-0.5">{row.errors[0]}</p>
                            )}
                            {row.status === "failed" && (
                              <p className="text-[11px] text-signal mt-0.5">{row.errorMsg}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-medium text-ink dark:text-canvas align-top pt-3.5 whitespace-nowrap">
                            {row.price > 0 ? row.price.toLocaleString("vi-VN") + "đ" : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-ink/60 dark:text-canvas/60 align-top pt-3.5">
                            {row.stock}
                          </td>
                          <td className="px-4 py-3 text-center align-top pt-3.5">
                            {row.status === "valid" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <Check size={11} /> Hợp lệ
                              </span>
                            )}
                            {row.status === "invalid" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-signal">
                                <X size={11} /> Lỗi
                              </span>
                            )}
                            {row.status === "importing" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate dark:text-[#8A8884]">
                                <Loader2 size={11} className="animate-spin" /> Đang lưu
                              </span>
                            )}
                            {row.status === "done" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                <Check size={11} /> Đã lưu
                              </span>
                            )}
                            {row.status === "failed" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-signal">
                                <X size={11} /> Thất bại
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action bar */}
              {!importDone ? (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-slate dark:text-[#8A8884]">
                    {!categoryId && (
                      <span className="text-signal">Vui lòng chọn danh mục trước khi nhập.</span>
                    )}
                    {categoryId && invalidCount > 0 && `${invalidCount} dòng lỗi sẽ bị bỏ qua.`}
                  </p>
                  <button
                    type="button"
                    onClick={runImport}
                    disabled={!canImport}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-ink dark:bg-canvas text-canvas dark:text-ink text-sm font-semibold hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    {importing && <Loader2 size={14} className="animate-spin" />}
                    {importing
                      ? `Đang nhập ${doneCount}/${validCount}…`
                      : `Nhập ${validCount} sản phẩm`}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 p-5 rounded-[28px] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      Hoàn tất! Đã tạo {doneCount} sản phẩm
                      {failedCount > 0 && `, ${failedCount} thất bại`}.
                    </p>
                    {failedCount > 0 && (
                      <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">
                        Xem chi tiết lỗi ở các dòng màu đỏ phía trên.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/seller/inventory")}
                    className="shrink-0 px-5 py-2.5 rounded-btn bg-ink dark:bg-canvas text-canvas dark:text-ink text-sm font-semibold hover:opacity-85 transition-all"
                  >
                    Xem sản phẩm
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
