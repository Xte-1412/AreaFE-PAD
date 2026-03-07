"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import axios from '@/lib/axios';
import { parseApiErrorMessage } from '@/lib/zod-schemas';
import SintaFullLogo from '@/components/SintaFullLogo.js';
import AuthFormShell from '@/components/shared/auth/AuthFormShell';
import PasswordField from '@/components/shared/auth/PasswordField';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post('/api/login', { email, password });
      
      // Save token & user data
      const token = response.data.user.token;
      const user = response.data.user;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
      
      // Redirect based on role
      const roleName = user.role?.name?.toLowerCase();
      console.log('🔐 Login successful, role:', roleName);
      
      if (roleName === 'admin') {
        router.push('/admin-dashboard');
      } else if (roleName === 'pusdatin') {
        router.push('/pusdatin-dashboard');
      } else if (roleName === 'provinsi' || roleName === 'kabupaten/kota') {
        router.push('/dlh-dashboard');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const message = parseApiErrorMessage(err.response?.data, 'Login gagal. Silakan coba lagi.');
        setError(message);
      } else {
        setError('Terjadi kesalahan yang tidak terduga.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFormShell
      title="Login"
      logo={<SintaFullLogo />}
      errorMessage={error}
      footer={
        <>
          <p className="text-gray-600 mb-4">Belum memiliki akun?</p>
          <Link
            href="/register"
            className="inline-block bg-[#00A86B] text-white font-bold py-3 px-6 rounded-lg hover:brightness-90 transition duration-300 shadow-sm"
          >
            Daftar Sekarang
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan Email"
            required
            disabled={loading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A86B] focus:border-[#00A86B] sm:text-sm disabled:bg-gray-50"
          />
        </div>

        <div>
          <PasswordField
            label="Password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={loading}
          />
          <div className="text-right mt-2 text-sm">
            <Link href="/lupa-password" className="font-semibold text-[#00A86B] hover:underline">
              Lupa password?
            </Link>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00A86B] text-white font-bold py-3 px-4 rounded-lg hover:brightness-90 transition duration-300 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </div>
      </form>
    </AuthFormShell>
  );
}
