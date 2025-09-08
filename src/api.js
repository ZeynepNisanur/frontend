import axios from 'axios';

// Base URL'yi ayarlayın
const BASE_URL = 'http://localhost:8081';

// Basit JWT kontrolü
const isLikelyJwt = (token) => {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  return parts.length === 3 && parts.every(Boolean);
};

// Axios instance oluşturun
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Token gerektirmeyen endpoint'ler
const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/public/',
  '/api/health',
  // Diğer public endpoint'leri buraya ekleyin
];

// Request interceptor - Sadece gerekli isteklerde token ekle
api.interceptors.request.use(
  (config) => {
    const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint =>
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint) {
      const raw = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      const token = isLikelyJwt(raw) ? raw : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (raw) {
        // Geçersiz değer saklanmışsa temizle
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
      }
    }

    console.log('API Request:', config.method?.toUpperCase(), config.url, isPublicEndpoint ? '(Public)' : '(Auth Required)');
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Esnek hata yönetimi
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);

    // 401 hatası için esnek yaklaşım
    if (error.response?.status === 401) {
      const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint =>
        error.config?.url?.includes(endpoint)
      );

      if (!isPublicEndpoint) {
        console.warn('401 alındı (token silinmeyecek):', error.config?.url);
        error.isAuthError = true;
        error.authMessage = 'Yetkisiz erişim veya oturum süresi doldu olabilir';
      }
    }

    return Promise.reject(error);
  }
);

// Farklı auth seviyeleri için helper fonksiyonlar
export const apiWithAuth = {
  get: (url, config = {}) => {
    const raw = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const token = isLikelyJwt(raw) ? raw : null;
    return api.get(url, {
      ...config,
      headers: {
        ...config.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  },

  post: (url, data, config = {}) => {
    const raw = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const token = isLikelyJwt(raw) ? raw : null;
    return api.post(url, data, {
      ...config,
      headers: {
        ...config.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  },

  put: (url, data, config = {}) => {
    const raw = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const token = isLikelyJwt(raw) ? raw : null;
    return api.put(url, data, {
      ...config,
      headers: {
        ...config.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  },

  delete: (url, config = {}) => {
    const raw = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const token = isLikelyJwt(raw) ? raw : null;
    return api.delete(url, {
      ...config,
      headers: {
        ...config.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
  }
};

// Public API (token gerektirmez)
export const apiPublic = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  delete: (url, config = {}) => api.delete(url, config)
};

// Auth headers fonksiyonu - opsiyonel
export const getAuthHeaders = () => {
  const raw = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const token = isLikelyJwt(raw) ? raw : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Token kontrolü
export const isTokenValid = () => {
  const raw = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  return isLikelyJwt(raw);
};

// Token'ı kaydet
export const saveToken = (token, rememberMe = false) => {
  if (!isLikelyJwt(token)) return;
  if (rememberMe) {
    localStorage.setItem('accessToken', token);
  } else {
    sessionStorage.setItem('accessToken', token);
  }
};

// Token'ı temizle
export const clearToken = () => {
  localStorage.removeItem('accessToken');
  sessionStorage.removeItem('accessToken');
};

// API instance'ını export et
export default api;