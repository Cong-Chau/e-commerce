import { useState } from 'react';
import { ArrowRight, Check, Store } from 'lucide-react';

const STEPS = [
  { label: 'Đặt tên shop & thêm logo' },
  { label: 'Mô tả cửa hàng của bạn' },
  { label: 'Cung cấp địa chỉ lấy hàng' },
  { label: 'Chọn phương thức vận chuyển' },
];

interface Props {
  onSetup: () => void;
}

export default function SetupProfileBanner({ onSetup }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="flex items-center justify-center h-full min-h-screen bg-canvas dark:bg-[#161614] px-6">
      <div className="w-full max-w-lg">

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-dust dark:border-[#2E2E2C] bg-lifted dark:bg-[#1C1C1A] shadow-xl p-8">

          {/* Decorative gradient blob */}
          <div
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-10 dark:opacity-5 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
          />

          {/* Icon */}
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ink/5 dark:bg-[#F3F0EE]/5 text-ink dark:text-canvas">
            <Store size={48} strokeWidth={1.5} />
          </div>

          {/* Headline */}
          <h1 className="text-2xl font-bold text-ink dark:text-canvas leading-snug mb-2">
            Thiết lập hồ sơ cửa hàng
          </h1>
          <p className="text-sm text-slate dark:text-[#8A8884] mb-8 leading-relaxed">
            Bạn chưa có hồ sơ cửa hàng. Hoàn thiện thông tin để bắt đầu bán hàng và tiếp cận khách hàng ngay hôm nay.
          </p>

          {/* Step list */}
          <ul className="space-y-3 mb-8">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ink/8 dark:bg-[#F3F0EE]/8 flex items-center justify-center text-ink dark:text-canvas">
                  <Check size={16} strokeWidth={2.5} />
                </span>
                <span className="text-sm text-ink dark:text-canvas">{step.label}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <button
            id="btn-setup-seller-profile"
            onClick={onSetup}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-ink dark:bg-[#F3F0EE] text-canvas dark:text-[#141413] text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            Thiết lập ngay
            <span
              className="transition-transform duration-200"
              style={{ transform: hovered ? 'translateX(4px)' : 'translateX(0)' }}
            >
              <ArrowRight size={16} strokeWidth={2} />
            </span>
          </button>

          {/* Sub-text */}
          <p className="mt-4 text-center text-xs text-dust dark:text-[#4A4A48]">
            Chỉ mất vài phút để hoàn thành ✦
          </p>
        </div>

      </div>
    </div>
  );
}
