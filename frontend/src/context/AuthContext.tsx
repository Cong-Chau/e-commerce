/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User, AuthState } from '../types/auth';
import { authService } from '../services/auth.service';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string, role?: string) => Promise<{ needsRole: boolean }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    otp: string;
    role?: 'CUSTOMER' | 'SELLER';
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<User>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
  });

  // accessToken/refreshToken sống trong httpOnly cookie — server là nguồn sự thật duy nhất,
  // nên luôn phải hỏi /auth/profile để biết có session hợp lệ hay không.
  useEffect(() => {
    authService
      .getProfile()
      .then((user) => setState({ user, isLoading: false }))
      .catch(() => setState({ user: null, isLoading: false }));
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login({ email, password });
    const user = await authService.getProfile();
    setState({ user, isLoading: false });
  };

  const loginWithGoogle = async (credential: string, role?: string): Promise<{ needsRole: boolean }> => {
    const result = await authService.googleLogin(credential, role);
    if (result.needsRole) return { needsRole: true };
    const user = await authService.getProfile();
    setState({ user, isLoading: false });
    return { needsRole: false };
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    otp: string;
    role?: 'CUSTOMER' | 'SELLER';
  }) => {
    // register() tạo user + xoá OTP — phải thành công trước
    await authService.register(data);
    // Sau khi user đã tạo, login để lấy token
    // Nếu bước này lỗi thì user vẫn tồn tại → không throw, redirect /login
    try {
      await login(data.email, data.password);
    } catch {
      // Auto-login thất bại nhưng tài khoản đã tạo thành công
      throw new Error('__REGISTERED_LOGIN_FAILED__');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setState({ user: null, isLoading: false });
    }
  };

  const refreshProfile = async () => {
    const user = await authService.getProfile();
    setState({ user, isLoading: false });
    return user;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export type { User };
