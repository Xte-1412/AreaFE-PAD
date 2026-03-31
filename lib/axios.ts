import Axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * NORMALISASI BASE URL
 * Membersihkan trailing slash agar tidak terjadi double slash di endpoint.
 */
const getBaseURL = (): string => {
  const envBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim();
  // Hapus slash di akhir dan pastikan tidak duplikat dengan prefix /api
  return envBase.replace(/\/+$/, '').replace(/\/api$/, '');
};

const axios = Axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // Railway biasanya cepat, 30 detik sudah cukup
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  // Aktifkan ini jika pakai Cookie/Session di Railway
  withCredentials: true, 
});

/**
 * REQUEST INTERCEPTOR
 * Ambil token dari localStorage untuk setiap request
 */
axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * Standarisasi error handling untuk Railway environment
 */
axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error.response?.status;

    if (error.code === 'ECONNABORTED') {
      console.error('❌ Request Timeout - Server Railway tidak merespon dalam 30 detik');
    } 
    
    else if (status === 401) {
      // Sesi habis atau token ilegal
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        
        // Paksa ke login jika bukan di halaman auth
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } 
    
    else if (!error.response) {
      console.error('🌐 Network Error - Cek koneksi atau konfigurasi CORS di Railway');
    }

    return Promise.reject(error);
  }
);

export default axios;
