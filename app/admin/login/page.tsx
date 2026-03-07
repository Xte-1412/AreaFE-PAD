// src/app/admin/login/page.tsx
"use client";

import { useState } from 'react'; // Hapus useEffect karena tidak digunakan di sini
import Link from 'next/link';
import SintaFullLogo from '@/components/SintaFullLogo';
import { useAuth } from '@/context/AuthContext';
import { isAxiosError } from 'axios';
import { parseApiErrorMessage } from '@/lib/zod-schemas';
import AuthFormShell from '@/components/shared/auth/AuthFormShell';
import PasswordField from '@/components/shared/auth/PasswordField';


export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ 
        email, 
        password,
      });
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const message = parseApiErrorMessage(err.response?.data, 'Login gagal. Silakan coba lagi.');
        setError(message);
      } else {
        setError('Terjadi kesalahan yang tidak terduga.');
      }
    }
  };

  // Fungsi renderRegisterSection diubah (Admin tidak boleh register)
  const renderRegisterSection = () => (
    <div className="mt-8 text-sm text-center">
      <p className="text-gray-600 mb-4">Belum memiliki akun?</p>
          {/* UBAH INI MENJADI LINK KE HALAMAN BARU */}
          <Link
            href="/hubungi-admin" 
            className="inline-block bg-[#00A86B] text-white font-bold py-3 px-6 rounded-lg shadow-sm hover:brightness-90 transition duration-300"
          >
            Hubungi Developer
          </Link>
    </div>
  );

  return (
    <AuthFormShell
      title="Admin Login"
      logo={<SintaFullLogo />}
      errorMessage={error}
      footer={renderRegisterSection()}
      className="border-gray-300"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan Email Admin"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A86B] focus:border-[#00A86B] sm:text-sm"
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
            className="w-full bg-[#00A86B] text-white font-bold py-3 px-4 rounded-lg hover:brightness-90 transition duration-300 shadow-sm"
          >
            Login Admin
          </button>
        </div>
      </form>
    </AuthFormShell>
  );
}