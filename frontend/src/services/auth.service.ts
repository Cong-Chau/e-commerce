import api from './api';
import type { User } from '../types/auth';

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

  async login(data: { email: string; password: string }): Promise<void> {
    await api.post('/auth/login', data);
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getProfile(): Promise<User> {
    const res = await api.get<{ data: User }>('/auth/profile');
    return res.data.data;
  },

  async refresh(): Promise<void> {
    await api.post('/auth/refresh');
  },

  async googleLogin(token: string, role?: string): Promise<{ needsRole?: boolean }> {
    const res = await api.post<{ data: { needsRole?: boolean } }>('/auth/google', { token, role });
    return res.data.data ?? {};
  },
};
