interface Props {
  open: boolean;
  message?: string;
}

export default function LoadingDialog({
  open,
  message = "Đang xử lý...",
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex flex-col items-center gap-3.5 px-8 py-6 rounded-2xl bg-canvas dark:bg-[#1C1C1A] border border-ink/10 dark:border-canvas/10 shadow-2xl min-w-40">
        <span className="w-7 h-7 border-[2.5px] border-ink/15 dark:border-canvas/15 border-t-ink dark:border-t-canvas rounded-full animate-spin" />
        <p className="text-sm font-medium text-ink dark:text-canvas">
          {message}
        </p>
      </div>
    </div>
  );
}
