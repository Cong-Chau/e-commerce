import axios, { type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// accessToken/refreshToken sống trong httpOnly cookie, browser tự gửi kèm mọi request.
const NO_RETRY_PATHS = ['/auth/login', '/auth/register', '/auth/google', '/auth/refresh', '/auth/send-otp', '/auth/logout'];

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;

    if (!config || status !== 401 || config._retry || NO_RETRY_PATHS.includes(config.url ?? '')) {
      return Promise.reject(error);
    }

    config._retry = true;
    try {
      refreshPromise ??= api.post('/auth/refresh').finally(() => {
        refreshPromise = null;
      });
      await refreshPromise;
      return api(config);
    } catch (refreshError) {
      await api.post('/auth/logout').catch(() => {});
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  },
);

export default api;
