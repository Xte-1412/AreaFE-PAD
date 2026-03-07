"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SintaFullLogo from '@/components/SintaFullLogo';
import axios from '@/lib/axios';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import AuthFormShell from '@/components/shared/auth/AuthFormShell';
import PasswordField from '@/components/shared/auth/PasswordField';

interface Province {
  id: number;
  nama: string;
}

interface Dinas {
  id: number;
  nama_dinas: string;
  region: string;
}

export default function RegisterKabKotaPage() {
  const router = useRouter();
  
  // State Form
  const [selectedProvinsi, setSelectedProvinsi] = useState('');
  const [selectedDinas, setSelectedDinas] = useState('');
  const [kodeDinas, setKodeDinas] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  // State UI
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // State Data Dropdown
  const [provincesList, setProvincesList] = useState<Province[]>([]);
  const [dinasList, setDinasList] = useState<Dinas[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingDinas, setIsLoadingDinas] = useState(false);

  // Fetch provinces
  useEffect(() => {
    setIsLoadingProvinces(true);
    axios.get('/api/register/provinces')
      .then(res => {
        setProvincesList(res.data.data || []);
      })
      .catch(err => {
        console.error("Gagal mengambil provinsi:", err);
        setFormError("Gagal memuat daftar provinsi.");
      })
      .finally(() => {
        setIsLoadingProvinces(false);
      });
  }, []);

  // Fetch dinas when province changes
  useEffect(() => {
    if (selectedProvinsi) {
      setIsLoadingDinas(true);
      setSelectedDinas('');
      setDinasList([]);
      
      axios.get(`/api/register/dinas/kabkota/${selectedProvinsi}`)
        .then(res => {
          setDinasList(res.data.data || []);
        })
        .catch(err => {
          console.error("Gagal mengambil dinas kab/kota:", err);
          setFormError("Gagal memuat daftar DLH Kab/Kota.");
        })
        .finally(() => {
          setIsLoadingDinas(false);
        });
    } else {
      setSelectedDinas('');
      setDinasList([]);
    }
  }, [selectedProvinsi]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // Validasi
    if (password !== passwordConfirmation) {
      setFormError("Password dan Konfirmasi Password tidak cocok.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password minimal 8 karakter.");
      return;
    }

    if (!selectedProvinsi) {
      setFormError("Silakan pilih Provinsi.");
      return;
    }

    if (!selectedDinas) {
      setFormError("Silakan pilih DLH Kab/Kota.");
      return;
    }

    if (!kodeDinas.trim()) {
      setFormError("Masukkan kode dinas.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/api/register', {
        id_dinas: selectedDinas,
        kode_dinas: kodeDinas,
        email: email,
        password: password,
      });

      setSuccessMessage(response.data.message || 'Registrasi berhasil! Mohon tunggu aktivasi dari admin.');
      
      // Reset form
      setSelectedProvinsi('');
      setSelectedDinas('');
      setKodeDinas('');
      setEmail('');
      setPassword('');
      setPasswordConfirmation('');
      
      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFormShell
      title="Registrasi DLH Kab/Kota"
      logo={<SintaFullLogo />}
      errorMessage={formError}
      className="max-w-lg text-left"
      footer={
        <p className="text-gray-600">
          Sudah memiliki akun?{' '}
          <Link href="/login" className="font-semibold text-[#00A86B] hover:underline">
            Login
          </Link>
        </p>
      }
    >
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Pilih Provinsi */}
          <div>
            <label htmlFor="provinsi" className="block text-left text-sm font-medium text-gray-700">Provinsi</label>
            <select
              id="provinsi"
              value={selectedProvinsi}
              onChange={(e) => setSelectedProvinsi(e.target.value)}
              required
              disabled={isLoadingProvinces}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A86B] focus:border-[#00A86B] sm:text-sm disabled:bg-gray-50"
            >
              <option value="" disabled>
                {isLoadingProvinces ? "Memuat..." : "-- Pilih Provinsi --"}
              </option>
              {provincesList.map(prov => (
                <option key={prov.id} value={prov.id}>
                  {prov.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih DLH Kab/Kota */}
          <div>
            <label htmlFor="dinas" className="block text-left text-sm font-medium text-gray-700">Pilih DLH Kab/Kota</label>
            <select
              id="dinas"
              value={selectedDinas}
              onChange={(e) => setSelectedDinas(e.target.value)}
              required
              disabled={!selectedProvinsi || isLoadingDinas}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A86B] focus:border-[#00A86B] sm:text-sm disabled:bg-gray-50"
            >
              <option value="" disabled>
                {isLoadingDinas ? "Memuat..." : (selectedProvinsi ? "-- Pilih DLH Kab/Kota --" : "-- Pilih Provinsi Dulu --")}
              </option>
              {dinasList.map(dinas => (
                <option key={dinas.id} value={dinas.id}>
                  {dinas.nama_dinas} ({dinas.region})
                </option>
              ))}
            </select>
          </div>

          {/* Kode Dinas */}
          <div>
            <label htmlFor="kodeDinas" className="block text-left text-sm font-medium text-gray-700">Kode Dinas</label>
            <input
              type="text"
              id="kodeDinas"
              value={kodeDinas}
              onChange={(e) => setKodeDinas(e.target.value)}
              placeholder="Masukkan Kode Dinas"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00A86B] focus:border-[#00A86B] sm:text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Kode dinas dapat diperoleh dari admin pusat.</p>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-left text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan Email"
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
              placeholder="Minimal 8 karakter"
              required
            />
          </div>

          <div>
            <PasswordField
              label="Konfirmasi Password"
              id="password_confirmation"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Ulangi password"
              required
            />
          </div>

          {/* Tombol Register */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || isLoadingDinas || !selectedDinas}
              className="w-full bg-[#00A86B] text-white font-bold py-3 px-4 rounded-lg hover:brightness-90 transition duration-300 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Mendaftarkan...' : 'Daftar'}
            </button>
          </div>

        </form>
    </AuthFormShell>
  );
}
