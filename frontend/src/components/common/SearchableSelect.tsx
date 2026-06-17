import { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { Check, ChevronDown, Search } from "lucide-react";

export interface SearchableSelectOption {
  value: number;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: number | null;
  onChange: (value: number) => void;
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Tìm kiếm...",
  emptyMessage = "Không tìm thấy kết quả.",
  disabled = false,
  loading = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  const fuse = useMemo(
    () => new Fuse(options, { keys: ["label"], threshold: 0.4 }),
    [options],
  );
  const filteredOptions = search.trim()
    ? fuse.search(search.trim()).map((result) => result.item)
    : options;

  const selectedOption = options.find((option) => option.value === value);

  const handleToggle = () => {
    if (disabled) return;
    setOpen((current) => !current);
    setSearch("");
  };

  const handleSelect = (optionValue: number) => {
    onChange(optionValue);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`flex w-full items-center justify-between gap-2 rounded-full border bg-white px-5 py-3 text-left text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#141413] ${
          open
            ? "border-ink dark:border-canvas"
            : "border-ink/15 hover:border-ink/40 dark:border-[#F3F0EE]/15 dark:hover:border-[#F3F0EE]/40"
        }`}
      >
        <span
          className={`truncate ${
            selectedOption
              ? "text-ink dark:text-canvas"
              : "text-dust dark:text-[#4A4A48]"
          }`}
        >
          {loading
            ? "Đang tải..."
            : selectedOption
              ? selectedOption.label
              : placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`shrink-0 text-slate transition-transform dark:text-[#8A8884] ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-ink/15 bg-white shadow-lg dark:border-[#F3F0EE]/15 dark:bg-[#1C1C1A]">
          <div className="relative border-b border-ink/10 p-2 dark:border-[#F3F0EE]/10">
            <Search
              size={14}
              strokeWidth={1.8}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-dust"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-ink/15 bg-white py-2 pl-8 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-dust focus:border-ink dark:border-[#F3F0EE]/15 dark:bg-[#141413] dark:text-canvas"
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-center text-sm text-slate dark:text-[#8A8884]">
                {emptyMessage}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-ink text-canvas dark:bg-[#F3F0EE] dark:text-[#141413]"
                        : "text-ink hover:bg-ink/5 dark:text-canvas dark:hover:bg-[#F3F0EE]/10"
                    }`}
                  >
                    {option.label}
                    {active && <Check size={14} strokeWidth={2.2} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
