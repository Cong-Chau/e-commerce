import api from './api';
import type { TokenPair, User } from '../types/auth';

export const authService = {
  async sendOtp(email: string): Promise<void> {
    await api.post('/auth/send-otp', { email });
  },

  async register(data: {
    name: string;
    email: string;
    password: string;
    otp: string;
    role?: 'CUSTOMER' | 'SELLER';
  }): Promise<User> {
    const res = await api.post<{ data: User }>('/auth/register', data);
    return res.data.data;
  },

  async login(data: { email: string; password: string }): Promise<TokenPair> {
    const res = await api.post<{ data: TokenPair }>('/auth/login', data);
    return res.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getProfile(): Promise<User> {
    const res = await api.get<{ data: User }>('/auth/profile');
    return res.data.data;
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    const res = await api.post<{ data: TokenPair }>('/auth/refresh', { refreshToken });
    return res.data.data;
  },

  async googleLogin(token: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const res = await api.post<{ data: { accessToken: string; refreshToken: string; user: User } }>(
      '/auth/google',
      { token },
    );
    return res.data.data;
  },
};
