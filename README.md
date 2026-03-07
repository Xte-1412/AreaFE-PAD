# SIPELITA (Sistem Informasi Penilaian Nirwasita Tantra)

| [🏠 Home](./README.md) | [📈 Progress Project](./Progress%20PAD2.md) | [📑 Dokumentasi](./DOCS.md) |
| :--- | :--- | :--- |

---

## Frontend

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![React Query](https://img.shields.io/badge/React_Query-5-FF4154?logo=reactquery&logoColor=white)
![License](https://img.shields.io/badge/license-Internal-informational)

</div>

---

## 🛠️ Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **Data Fetching** | Axios + React Query |
| **Validation** | Zod |
| **Charts** | Chart.js + react-chartjs-2 |
| **Maps** | Leaflet + react-leaflet |
| **Animation** | Framer Motion |
| **Icons** | Lucide React + React Icons + Heroicons |
| **Linting** | ESLint 9 + eslint-config-next |

---

## ⚙️ Persyaratan Sistem

- Node.js `>= 20.x` (disarankan LTS terbaru)
- pnpm `>= 9.x`
- Backend SIPELITA aktif (Laravel API)

---

## 🔐 Credential & Konfigurasi FE

### 1) Environment Variable
Buat file `.env.local` di root `AreaFE-PAD`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Catatan:
- `NEXT_PUBLIC_API_URL` dipakai oleh `lib/axios.ts` sebagai base URL API.
- Jika deploy, arahkan ke URL API environment masing-masing.

### 2) Credential Akun Uji (Isi Sesuai Environment)
Gunakan akun uji dari backend untuk masing-masing role:

| Role | Email | Password | Catatan |
|---|---|---|---|
| Admin | `____________` | `____________` | Akses admin dashboard |
| Pusdatin | `____________` | `____________` | Akses panel penerimaan/penilaian |
| DLH Provinsi | `____________` | `____________` | Akses dashboard DLH provinsi |
| DLH Kab/Kota | `____________` | `____________` | Akses dashboard DLH kab/kota |

### 3) Auth Storage (dikelola otomatis FE)
- `auth_token` (localStorage)
- `user_data` (localStorage)

---

## 💻 Cara Install & Menjalankan

### 1. Masuk ke folder frontend

```bash
cd AreaFE-PAD
```

### 2. Install dependensi

```bash
pnpm install
```

### 3. Jalankan development server

```bash
pnpm dev
```

App berjalan di: [http://localhost:3000](http://localhost:3000)

### 4. Lint

```bash
pnpm lint
```

### 5. Build production

```bash
pnpm build
```

### 6. Jalankan production server

```bash
pnpm start
```

Jika port `3000` sedang dipakai:

```bash
pnpm start -- -p 3001
```

---

## 📜 Scripts

| Command | Fungsi |
|---|---|
| `pnpm dev` | Menjalankan Next.js dev server |
| `pnpm build` | Build aplikasi untuk production |
| `pnpm start` | Menjalankan hasil build production |
| `pnpm lint` | Menjalankan ESLint |

---

## 📁 Struktur Folder (Ringkas)

```text
AreaFE-PAD/
├── app/                  # App Router pages & layouts
│   ├── (dashboard)/      # Area dashboard per role
│   ├── login/            # Login user
│   ├── admin/login/      # Login admin
│   └── register/         # Register provinsi & kab/kota
├── components/
│   ├── shared/           # Komponen reusable (auth/filter/pagination)
│   ├── ui/               # Primitive UI (modal, toast, badge)
│   ├── penerimaan/       # Komponen domain penerimaan data
│   └── ...
├── context/              # Auth context aktif
├── lib/                  # Axios instance, helper schema, utility
├── public/               # Static assets
└── types/                # Type declarations
```

---

## 👥 Contributor

<table>
	<tr>
		<td align="center" width="25%">
			<img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" width="72" alt="GitHub Placeholder" />
			<br />
			<b>PM</b>
			<br />
			Safira Dwita Ramadhani
			<br />
			<img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" width="14" alt="GitHub" /> GitHub belum diisi
		</td>
		<td align="center" width="25%">
			<a href="https://github.com/titoalla17">
				<img src="https://github.com/titoalla17.png?size=96" width="96" alt="UI/UX" />
			</a>
			<br />
			<b>UI/UX</b>
			<br />
			Tito Alla Khairi
			<br />
			<a href="https://github.com/titoalla17">@titoalla17</a>
		</td>
		<td align="center" width="25%">
			<a href="https://github.com/Avin1731">
				<img src="https://github.com/Avin1731.png?size=96" width="96" alt="FE" />
			</a>
			<br />
			<b>FE</b>
			<br />
			Hilarius Christiano Avin Paliling
			<br />
			<a href="https://github.com/Avin1731">@Avin1731</a>
		</td>
		<td align="center" width="25%">
			<a href="https://github.com/Nazirii">
				<img src="https://github.com/Nazirii.png?size=96" width="96" alt="BE" />
			</a>
			<br />
			<b>BE</b>
			<br />
			Muhammad Adib Naziri
			<br />
			<a href="https://github.com/Nazirii">@Nazirii</a>
		</td>
	</tr>
</table>

---

## 🔗 Project Links
- Notion Workspace (Timeline & Dokumentasi): [Link Notion](https://www.notion.so/54a585afdbda823b8c0701e999826ebc?v=654585afdbda837396b688bd10e646a1)
- Figma Design: [Link Figma](https://www.figma.com/design/qQjTmsjI656sd6HcWI7L79/PAD?node-id=0-1&p=f&t=MB9MHa8OGdCYaLUF-0)
- Repository Frontend (FE): [Link Repo FE](https://github.com/Nazirii/FE_PAD)
- Repository Backend (BE): [Link Repo BE](https://github.com/Nazirii/SIPELITA)

---

## 📌 Catatan

- README ini khusus **frontend (`AreaFE-PAD`)**.
- Pastikan backend SIPELITA aktif agar flow autentikasi dan data dashboard berjalan normal.
