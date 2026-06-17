import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import axios from 'axios';

type Role = 'CUSTOMER' | 'SELLER';
type Step = 1 | 2;

const RESEND_COOLDOWN = 60; // seconds

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('CUSTOMER');

  const [error, setError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 60-second resend cooldown
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Step 1: Send OTP ───────────────────────────────────────────
  const handleSendOtp = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setOtpLoading(true);
    try {
      await authService.sendOtp(email);
      setStep(2);
      startCooldown();
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Không thể gửi OTP')
          : 'Đã xảy ra lỗi, vui lòng thử lại',
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError('');
    setOtpLoading(true);
    try {
      await authService.sendOtp(email);
      startCooldown();
      setOtp('');
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'Không thể gửi lại OTP')
          : 'Đã xảy ra lỗi, vui lòng thử lại',
      );
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Step 2: Register ───────────────────────────────────────────
  const handleRegister = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setRegisterLoading(true);
    try {
      await register({ name, email, password, otp, role });
      navigate('/');
    } catch (err) {
      // Tài khoản đã tạo thành công nhưng auto-login thất bại
      if (err instanceof Error && err.message === '__REGISTERED_LOGIN_FAILED__') {
        navigate('/login?registered=1');
        return;
      }
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Đăng ký thất bại'));
      } else {
        setError('Đã xảy ra lỗi, vui lòng thử lại');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  // ── Shared UI pieces ───────────────────────────────────────────
  const inputClass =
    'w-full px-5 py-3.5 rounded-full border border-ink/20 bg-white text-ink text-base font-normal outline-none focus:border-ink placeholder:text-dust transition-colors';

  const errorEl = error && (
    <p className="text-sm font-medium text-signal bg-signal/6 rounded-btn px-5 py-2.5">
      {error}
    </p>
  );

  return (
    <div className="flex min-h-screen bg-canvas font-sans">

      {/* ── Decorative left panel ── */}
      <div className="hidden lg:flex flex-1 relative bg-ink overflow-hidden items-center justify-center">
        <div className="absolute rounded-full border border-signal-light/20"
          style={{ width: 600, height: 600, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="absolute rounded-full border border-signal-light/30"
          style={{ width: 380, height: 380, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
        <span className="absolute select-none pointer-events-none whitespace-nowrap font-medium text-canvas/4"
          style={{ fontSize: 180, letterSpacing: '-3.6px', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          Join
        </span>
        <div className="relative z-10 flex flex-col items-center gap-10 px-16">
          <div className="relative w-56 h-56 rounded-full bg-linear-to-br from-[#2a2a28] to-[#181816] border border-canvas/10 flex items-center justify-center text-[72px]"
            style={{ boxShadow: 'rgba(0,0,0,0.25) 0px 70px 110px 0px' }}>
            ✨
            <div className="absolute -bottom-2 -right-2 w-14 h-14 rounded-full bg-white flex items-center justify-center text-ink font-semibold text-xl"
              style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 8px 24px 0px' }}>
              →
            </div>
          </div>
          <div className="text-center">
            <p className="flex items-center justify-center gap-2 text-[13px] font-bold tracking-[0.52px] uppercase text-canvas/60 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-signal-light shrink-0" />
              {step === 1 ? 'BƯỚC 1 / 2' : 'BƯỚC 2 / 2'}
            </p>
            <p className="text-base font-normal leading-relaxed text-canvas/50 max-w-xs">
              {step === 1
                ? 'Nhập email để nhận mã xác thực OTP.'
                : 'Nhập mã OTP và hoàn tất thông tin tài khoản.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-110">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            {([1, 2] as Step[]).map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                  ${step >= s ? 'bg-ink text-canvas' : 'bg-ink/10 text-slate'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 2 && (
                  <div className={`h-px w-12 transition-colors ${step > s ? 'bg-ink' : 'bg-ink/15'}`} />
                )}
              </div>
            ))}
            <span className="ml-1 text-[13px] font-medium text-slate">
              {step === 1 ? 'Xác thực email' : 'Tạo tài khoản'}
            </span>
          </div>

          {/* Eyebrow */}
          <div className="flex items-center gap-2 text-[13px] font-bold tracking-[0.52px] uppercase text-ink mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-light shrink-0" />
            ĐĂNG KÝ
          </div>

          {step === 1 ? (
            /* ── STEP 1: Email ── */
            <>
              <h1 className="text-[40px] font-medium leading-none tracking-[-0.8px] text-ink mb-3">
                Nhập email của bạn
              </h1>
              <p className="text-base font-normal text-slate mb-10">
                Chúng tôi sẽ gửi mã OTP 6 chữ số đến địa chỉ email này.
              </p>

              <form onSubmit={handleSendOtp} noValidate className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-[13px] font-bold text-ink">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className={inputClass}
                  />
                </div>

                {errorEl}

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="mt-2 w-full py-4 bg-ink text-canvas border-[1.5px] border-ink rounded-[20px] text-base font-medium tracking-[-0.32px] cursor-pointer transition-opacity hover:opacity-85 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-canvas/30 border-t-canvas rounded-full animate-spin" />
                      Đang gửi OTP…
                    </span>
                  ) : 'Gửi mã OTP'}
                </button>
              </form>
            </>
          ) : (
            /* ── STEP 2: OTP + Info ── */
            <>
              <h1 className="text-[40px] font-medium leading-none tracking-[-0.8px] text-ink mb-2">
                Hoàn tất đăng ký
              </h1>
              <p className="text-base font-normal text-slate mb-8">
                Mã OTP đã gửi tới{' '}
                <span className="font-medium text-ink">{email}</span>.
              </p>

              {/* OTP input + resend */}
              <div className="mb-6 p-5 bg-lifted rounded-3xl border border-ink/8">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="otp" className="text-[13px] font-bold text-ink">
                    Mã OTP
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || otpLoading}
                    className="text-[13px] font-medium text-ink underline underline-offset-2 disabled:no-underline disabled:text-slate disabled:cursor-not-allowed transition-opacity hover:opacity-60"
                  >
                    {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại OTP'}
                  </button>
                </div>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                  className="w-full px-5 py-3.5 rounded-full border border-ink/20 bg-white text-ink text-2xl font-bold text-center tracking-[0.6em] outline-none focus:border-ink placeholder:text-dust placeholder:tracking-normal placeholder:text-base placeholder:font-normal transition-colors"
                />
                {cooldown > 0 && (
                  <p className="mt-2 text-[12px] text-slate text-center">
                    OTP hết hạn sau 5 phút. Có hiệu lực cho đến khi bạn yêu cầu mã mới.
                  </p>
                )}
              </div>

              <form onSubmit={handleRegister} noValidate className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-[13px] font-bold text-ink">
                    Họ và tên
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="password" className="text-[13px] font-bold text-ink">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ít nhất 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full pl-5 pr-12 py-3.5 rounded-full border border-ink/20 bg-white text-ink text-base font-normal outline-none focus:border-ink placeholder:text-dust transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate text-lg cursor-pointer"
                    >
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-ink">Loại tài khoản</label>
                  <div className="flex gap-3">
                    {(['CUSTOMER', 'SELLER'] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 py-3 px-5 rounded-[20px] border-[1.5px] text-[15px] font-medium transition-colors
                          ${role === r
                            ? 'bg-ink text-canvas border-ink'
                            : 'bg-white text-ink border-ink/20 hover:border-ink'
                          }`}
                      >
                        {r === 'CUSTOMER' ? 'Khách hàng' : 'Người bán'}
                      </button>
                    ))}
                  </div>
                </div>

                {errorEl}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); setOtp(''); }}
                    className="flex-none py-4 px-6 bg-white text-ink border-[1.5px] border-ink/20 rounded-[20px] text-base font-medium hover:border-ink transition-colors"
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={registerLoading || otp.length < 6}
                    className="flex-1 py-4 bg-ink text-canvas border-[1.5px] border-ink rounded-[20px] text-base font-medium tracking-[-0.32px] cursor-pointer transition-opacity hover:opacity-85 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registerLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-canvas/30 border-t-canvas rounded-full animate-spin" />
                        Đang tạo tài khoản…
                      </span>
                    ) : 'Tạo tài khoản'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Divider + switch */}
          <div className="flex items-center gap-4 my-7 text-sm font-normal text-dust">
            <span className="flex-1 h-px bg-ink/10" />
            hoặc
            <span className="flex-1 h-px bg-ink/10" />
          </div>
          <p className="text-center text-[15px] font-normal text-slate">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-ink font-medium underline underline-offset-[3px] hover:opacity-60 transition-opacity">
              Đăng nhập
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
