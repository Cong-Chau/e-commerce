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
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: 'CUSTOMER' | 'SELLER';
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    isLoading: true,
  });

  // Restore session on app start
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    authService
      .getProfile()
      .then((user) => setState({ user, accessToken: token, isLoading: false }))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setState({ user: null, accessToken: null, isLoading: false });
      });
  }, []);

  const _setSession = (accessToken: string, refreshToken: string, user: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setState({ user, accessToken, isLoading: false });
  };

  const login = async (email: string, password: string) => {
    const result = await authService.login({ email, password });
    const user = await authService.getProfile();
    _setSession(result.accessToken, result.refreshToken, user);
  };

  const loginWithGoogle = async (credential: string) => {
    const result = await authService.googleLogin(credential);
    // Backend returns the full user object — no need for an extra /profile call
    _setSession(result.accessToken, result.refreshToken, result.user);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: 'CUSTOMER' | 'SELLER';
  }) => {
    await authService.register(data);
    await login(data.email, data.password);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setState({ user: null, accessToken: null, isLoading: false });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, register, logout }}>
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
