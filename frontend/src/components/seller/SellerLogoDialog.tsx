import { useEffect, useRef, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { ImagePlus, Loader2, Store, X } from "lucide-react";
import { cloudinaryService } from "../../services/cloudinary.service";
import { sellerService } from "../../services/seller.service";

interface Props {
  currentLogo: string | null;
  onSuccess: (url: string) => void;
  onClose: () => void;
}

export default function SellerLogoDialog({
  currentLogo,
  onSuccess,
  onClose,
}: Props) {
  const toast = useToast();
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (newPreview) URL.revokeObjectURL(newPreview);
    };
  }, [newPreview]);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const pickFile = (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 5MB.");
      return;
    }
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewFile(file);
    setNewPreview(URL.createObjectURL(file));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) pickFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) pickFile(file);
  };

  const handleConfirm = async () => {
    if (!newFile) return;
    setUploading(true);
    setError("");
    try {
      const url = await cloudinaryService.uploadImage(
        newFile,
        "seller-profiles",
      );
      await sellerService.updateLogo(url);
      toast.success("Cập nhật logo thành công!");
      onSuccess(url);
    } catch {
      toast.error("Tải ảnh thất bại, vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const displayLogo = newPreview || currentLogo;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-canvas dark:bg-[#1C1C1A] border border-ink/10 dark:border-canvas/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/8 dark:border-canvas/8">
          <h2 className="text-sm font-semibold text-ink dark:text-canvas">
            Cập nhật logo cửa hàng
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-ink/8 dark:hover:bg-canvas/8 transition-colors"
          >
            <X size={15} className="text-ink/50 dark:text-canvas/50" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-5 py-5">
          {/* Logo preview */}
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-ink/6 dark:bg-canvas/6 flex items-center justify-center shrink-0">
              {displayLogo ? (
                <img
                  src={displayLogo}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store
                  size={40}
                  strokeWidth={1.4}
                  className="text-ink/30 dark:text-canvas/30"
                />
              )}
            </div>
          </div>

          {/* Upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              dragging
                ? "border-ink/40 bg-ink/4 dark:border-canvas/40 dark:bg-canvas/4"
                : "border-ink/15 dark:border-canvas/15 hover:border-ink/30 dark:hover:border-canvas/30"
            }`}
          >
            <ImagePlus
              size={22}
              strokeWidth={1.6}
              className="text-ink/30 dark:text-canvas/30"
            />
            <p className="text-xs font-medium text-ink/50 dark:text-canvas/50">
              {newFile ? newFile.name : "Kéo thả hoặc click để chọn ảnh"}
            </p>
            <p className="text-[11px] text-ink/30 dark:text-canvas/30">
              PNG, JPG, WEBP · Tối đa 5MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {error && <p className="text-xs text-signal text-center">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-2.5 rounded-btn border border-ink/15 dark:border-canvas/15 text-sm font-medium text-ink dark:text-canvas hover:bg-ink/5 dark:hover:bg-canvas/5 disabled:opacity-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleConfirm}
            disabled={!newFile || uploading}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-btn bg-ink dark:bg-canvas text-canvas dark:text-ink text-sm font-semibold hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {uploading && <Loader2 size={14} className="animate-spin" />}
            {uploading ? "Đang tải…" : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
