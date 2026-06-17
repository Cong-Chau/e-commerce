export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full min-h-[calc(100vh-0px)] items-center justify-center">
      <div className="text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-slate dark:text-[#8A8884]">
          {title}
        </p>
        <p className="text-sm text-dust dark:text-[#4A4A48]">
          Trang đang được xây dựng.
        </p>
      </div>
    </div>
  );
}
