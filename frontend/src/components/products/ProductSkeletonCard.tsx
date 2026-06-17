export default function ProductSkeletonCard() {
  return (
    <div className="animate-pulse rounded-[28px] bg-lifted dark:bg-[#1C1C1A] overflow-hidden">
      <div className="aspect-square bg-ink/6 dark:bg-canvas/6" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-ink/8 dark:bg-canvas/8 rounded-full w-3/4" />
        <div className="h-3 bg-ink/5 dark:bg-canvas/5 rounded-full w-1/3" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 bg-ink/8 dark:bg-canvas/8 rounded-full w-20" />
          <div className="h-5 bg-ink/5 dark:bg-canvas/5 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}
