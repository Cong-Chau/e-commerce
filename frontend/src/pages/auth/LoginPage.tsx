import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';

type Role = 'CUSTOMER' | 'SELLER';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [pendingCredential, setPendingCredential] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('CUSTOMER');

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Đăng nhập thất bại');
      } else {
        setError('Đã xảy ra lỗi, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    setError('');
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      if (result.needsRole) {
        setPendingCredential(credentialResponse.credential);
        setGoogleLoading(false);
        return;
      }
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Đăng nhập Google thất bại');
      } else {
        setError('Đăng nhập Google thất bại, vui lòng thử lại');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleConfirmRole = async () => {
    if (!pendingCredential) return;
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle(pendingCredential, selectedRole);
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Đăng nhập Google thất bại');
      } else {
        setError('Đăng nhập Google thất bại, vui lòng thử lại');
      }
      setPendingCredential(null);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-canvas font-sans">

      {/* ── Role selection overlay (new Google users only) ── */}
      {pendingCredential && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-canvas rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-2 text-[13px] font-bold tracking-[0.52px] uppercase text-ink mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-light shrink-0" />
              CHỌN VAI TRÒ
            </div>
            <h2 className="text-2xl font-medium tracking-[-0.5px] text-ink mb-2">
              Bạn muốn dùng tài khoản này để làm gì?
            </h2>
            <p className="text-sm text-slate mb-6">
              Lựa chọn này không thể thay đổi sau khi tạo tài khoản.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {(['CUSTOMER', 'SELLER'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRole(r)}
                  className={`w-full py-4 px-5 rounded-2xl border-[1.5px] text-left transition-colors ${
                    selectedRole === r
                      ? 'bg-ink text-canvas border-ink'
                      : 'bg-white text-ink border-ink/20 hover:border-ink'
                  }`}
                >
                  <p className="font-medium text-[15px]">
                    {r === 'CUSTOMER' ? 'Khách hàng' : 'Người bán'}
                  </p>
                  <p className={`text-[13px] mt-0.5 ${selectedRole === r ? 'text-canvas/60' : 'text-slate'}`}>
                    {r === 'CUSTOMER'
                      ? 'Mua sắm và theo dõi đơn hàng'
                      : 'Đăng bán sản phẩm và quản lý cửa hàng'}
                  </p>
                </button>
              ))}
            </div>

            {error && (
              <p className="text-sm font-medium text-signal bg-signal/6 rounded-btn px-5 py-2.5 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setPendingCredential(null); setError(''); }}
                className="flex-none py-3 px-5 bg-white text-ink border-[1.5px] border-ink/20 rounded-btn text-sm font-medium hover:border-ink transition-colors"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleConfirmRole}
                disabled={googleLoading}
                className="flex-1 py-3 bg-ink text-canvas rounded-btn text-sm font-medium hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-canvas/30 border-t-canvas rounded-full animate-spin" />
                    Đang tạo tài khoản…
                  </span>
                ) : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Decorative left panel (desktop only) ── */}
      <div className="hidden lg:flex flex-1 relative bg-ink overflow-hidden items-center justify-center">

        {/* Orbital rings */}
        <div className="absolute rounded-full border border-signal-light/20"
          style={{ width: 600, height: 600, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="absolute rounded-full border border-signal-light/30"
          style={{ width: 380, height: 380, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

        {/* Ghost watermark */}
        <span className="absolute select-none pointer-events-none whitespace-nowrap font-medium text-canvas/4"
          style={{ fontSize: 180, letterSpacing: '-3.6px', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          Login
        </span>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-10 px-16">
          {/* Circular portrait */}
          <div className="relative w-56 h-56 rounded-full bg-linear-to-br from-[#2a2a28] to-[#181816] border border-canvas/10 flex items-center justify-center text-[72px]"
            style={{ boxShadow: 'rgba(0,0,0,0.25) 0px 70px 110px 0px' }}>
            🛍️
            {/* Satellite CTA */}
            <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-full bg-white flex items-center justify-center text-ink font-semibold text-xl"
              style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 8px 24px 0px' }}>
              →
            </div>
          </div>

          {/* Eyebrow + tagline */}
          <div className="text-center">
            <p className="flex items-center justify-center gap-2 text-[13px] font-bold tracking-[0.52px] uppercase text-canvas/60 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-light shrink-0" />
              WELCOME BACK
            </p>
            <p className="text-base font-normal leading-relaxed text-canvas/50 max-w-xs">
              Khám phá hàng ngàn sản phẩm chất lượng, giao hàng tận nơi.
            </p>
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-110">

          {/* Eyebrow */}
          <div className="flex items-center gap-2 text-[13px] font-bold tracking-[0.52px] uppercase text-ink mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-light shrink-0" />
            ĐĂNG NHẬP
          </div>

          {/* Title */}
          <h1 className="text-[40px] font-medium leading-none tracking-[-0.8px] text-ink mb-3">
            Chào mừng trở lại
          </h1>
          <p className="text-base font-normal text-slate mb-10">
            Đăng nhập để tiếp tục mua sắm và quản lý đơn hàng của bạn.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[13px] font-bold text-ink tracking-[0.13px]">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-5 py-3.5 rounded-full border border-ink/20 bg-white text-ink text-base font-normal outline-none focus:border-ink placeholder:text-dust transition-colors"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[13px] font-bold text-ink tracking-[0.13px]">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-5 pr-12 py-3.5 rounded-full border border-ink/20 bg-white text-ink text-base font-normal outline-none focus:border-ink placeholder:text-dust transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate text-lg leading-none cursor-pointer"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm font-medium text-signal bg-signal/6 rounded-btn px-5 py-2.5">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-2 w-full py-4 bg-ink text-canvas border-[1.5px] border-ink rounded-btn text-base font-medium tracking-[-0.32px] cursor-pointer transition-opacity hover:opacity-85 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7 text-sm font-normal text-dust">
            <span className="flex-1 h-px bg-ink/10" />
            hoặc
            <span className="flex-1 h-px bg-ink/10" />
          </div>

          {/* Google Login */}
          <div className="flex flex-col items-center gap-4">
            {googleLoading ? (
              <div className="w-full py-3 flex items-center justify-center gap-3 rounded-btn border border-ink/20 bg-white text-ink/50 text-sm font-medium">
                <span className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                Đang xác thực với Google…
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Đăng nhập Google thất bại, vui lòng thử lại')}
                  shape="pill"
                  theme="outline"
                  size="large"
                  text="signin_with"
                  width="400"
                />
              </div>
            )}
          </div>

          {/* Switch */}
          <p className="text-center text-[15px] font-normal text-slate mt-7">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-ink font-medium underline underline-offset-[3px] hover:opacity-60 transition-opacity">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
