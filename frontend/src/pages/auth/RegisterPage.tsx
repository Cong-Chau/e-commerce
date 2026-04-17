import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import styles from './Auth.module.css';

type Role = 'CUSTOMER' | 'SELLER';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ name, email, password, role });
      navigate('/');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message;
        if (Array.isArray(msg)) {
          setError(msg.join(', '));
        } else {
          setError(msg ?? 'Đăng ký thất bại');
        }
      } else {
        setError('Đã xảy ra lỗi, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authLayout}>
      {/* Decorative left panel */}
      <div className={styles.decorPanel}>
        <div className={styles.decorContent}>
          <div className={styles.orbitCircle} />
          <div className={styles.orbitArc} />
          <div className={styles.ghostText}>Join</div>
          <div className={styles.decorCircle}>
            <span>✨</span>
            <div className={styles.satellite}>→</div>
          </div>
          <p className={styles.decorTagline}>
            Tạo tài khoản và bắt đầu hành trình mua sắm của bạn ngay hôm nay.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            ĐĂNG KÝ
          </div>

          <h1 className={styles.formTitle}>Tạo tài khoản mới</h1>
          <p className={styles.formSubtitle}>
            Điền thông tin bên dưới để bắt đầu trải nghiệm mua sắm.
          </p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="name">
                Họ và tên
              </label>
              <input
                id="name"
                type="text"
                className={styles.input}
                placeholder="Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="password">
                Mật khẩu
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="Ít nhất 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Loại tài khoản</label>
              <div className={styles.roleGroup}>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${role === 'CUSTOMER' ? styles.roleActive : ''}`}
                  onClick={() => setRole('CUSTOMER')}
                >
                  Khách hàng
                </button>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${role === 'SELLER' ? styles.roleActive : ''}`}
                  onClick={() => setRole('SELLER')}
                >
                  Người bán
                </button>
              </div>
            </div>

            {error && <p className={styles.errorMsg}>{error}</p>}

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className={styles.divider}>
            <span>hoặc</span>
          </div>

          <p className={styles.switchText}>
            Đã có tài khoản?{' '}
            <Link to="/login" className={styles.link}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
