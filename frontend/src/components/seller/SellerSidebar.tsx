import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  BarChart3,
  User,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// ─── Nav items ────────────────────────────────────────────────────────────────

const ICON_SIZE = 18;
const ICON_STROKE = 1.8;

const navItems = [
  { to: '/seller/dashboard', label: 'Dashboard',     icon: <LayoutDashboard size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { to: '/seller/products',  label: 'Sản phẩm',      icon: <Package size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { to: '/seller/orders',    label: 'Đơn hàng',      icon: <ShoppingCart size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { to: '/seller/inventory', label: 'Kho',            icon: <Warehouse size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { to: '/seller/analytics', label: 'Thống kê',      icon: <BarChart3 size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
  { to: '/seller/profile',   label: 'Hồ sơ của tôi', icon: <User size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SellerSidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const initials = user?.name
    ?.trim()
    .split(/\s+/)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase() ?? '?';

  return (
    <aside className="w-60 h-screen flex flex-col shrink-0 bg-lifted border-r border-dust dark:bg-[#1C1C1A] dark:border-[#2E2E2C]">

      {/* User info */}
      <div className="px-4 py-4 flex items-center gap-3 border-b border-dust dark:border-[#2E2E2C]">
        <div className="w-9 h-9 rounded-full bg-ink text-canvas dark:bg-canvas dark:text-ink flex items-center justify-center text-xs font-bold shrink-0 select-none">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink dark:text-canvas truncate leading-tight">
            {user?.name}
          </p>
          <p className="text-xs text-slate dark:text-[#8A8884] truncate leading-tight">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/seller/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-ink text-canvas dark:bg-[#F3F0EE] dark:text-[#141413]'
                  : 'text-slate hover:bg-dust/50 dark:text-[#8A8884] dark:hover:bg-[#262624]'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 pt-2 border-t border-dust dark:border-[#2E2E2C] space-y-0.5">

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate hover:bg-dust/50 dark:text-[#8A8884] dark:hover:bg-[#262624] transition-colors"
        >
          {theme === 'light' ? <Moon size={ICON_SIZE} strokeWidth={ICON_STROKE} /> : <Sun size={ICON_SIZE} strokeWidth={ICON_STROKE} />}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate hover:bg-dust/50 dark:text-[#8A8884] dark:hover:bg-[#262624] transition-colors"
        >
          <LogOut size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          Đăng xuất
        </button>

      </div>
    </aside>
  );
}
