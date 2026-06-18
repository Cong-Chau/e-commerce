import { useAuth } from '../../hooks/useAuth';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex items-center justify-between px-8 py-4 border-b border-dust bg-lifted">
        <span className="text-sm font-bold tracking-widest uppercase text-ink">
          Customer Dashboard
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate">{user?.name} · {user?.email}</span>
          <button
            onClick={logout}
            className="px-5 py-2 text-sm font-medium bg-ink text-canvas rounded-btn hover:opacity-80 transition-opacity"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-65px)]">
        <p className="text-slate text-sm">Trang đang được xây dựng.</p>
      </main>
    </div>
  );
}
