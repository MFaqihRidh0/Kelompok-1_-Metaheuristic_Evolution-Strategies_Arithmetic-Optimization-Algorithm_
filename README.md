# Optimasi Penjadwalan Cloud: Random Scheduling vs AOA (Arithmetic Optimization Algorithm)

Proyek ini menyajikan implementasi empiris dan simulasi 3D interaktif untuk komparasi performa antara **Baseline Random Scheduling (Minggu 3)** dan **Algoritma AOA (Arithmetic Optimization Algorithm) yang Baru**.

## 🚀 Fitur Utama
1. **Presentasi Interaktif 3D (Three.js):**
   - Visualisasi topologi 3 Datacenter (Surabaya 6.000 MIPS, Jakarta 3.600 MIPS, Yogyakarta 800 MIPS).
   - Animasi aliran tugas (*flight physics* kurva Bezier) dan demonstrasi bottleneck Random vs keseimbangan beban AOA.
   - Panel kontrol simulator langsung dengan metrik Makespan, LBI, Throughput, dan Estimasi Biaya.
2. **Program Implementasi Riil:**
   - Python Real-World Dispatcher: `program_aoa_vs_random.py`
   - Java CloudSim 7.0.1 Simulation: `AOASchedulingSim.java`
   - Dataset ilmiah riil: `dataset_100cloudlet.csv` s.d. `dataset_500cloudlet.csv`

---

## 🌐 Panduan Deploy ke Vercel

Proyek ini telah dikonfigurasi secara modular (`HTML`, `CSS`, `JS`) dan siap dideploy langsung ke **Vercel** dengan 2 pilihan cara:

### Cara 1: Menggunakan Vercel Dashboard (Rekomendasi / Paling Mudah)
1. Push repositori ini ke GitHub / GitLab / Bitbucket.
2. Buka [Vercel Dashboard](https://vercel.com/) dan klik **"Add New Project"** > **"Import Git Repository"**.
3. Pilih repositori proyek ini.
4. Pada form konfigurasi:
   - **Framework Preset:** Pilih `Other`
   - **Root Directory:** Biarkan `./` (karena sudah ada `vercel.json` dan `index.html` otomatis di root) atau isi `02_Implementasi_Real_World` jika hanya ingin mengekspos folder implementasi.
5. Klik **"Deploy"**.
6. Dalam hitungan detik, aplikasi presentasi 3D dan simulator Anda aktif di URL `https://<nama-proyek>.vercel.app`.

### Cara 2: Menggunakan Vercel CLI
1. Pastikan Vercel CLI terpasang di terminal:
   ```bash
   npm install -g vercel
   ```
2. Jalankan perintah deploy di folder root:
   ```bash
   vercel
   ```
3. Ikuti konfirmasi di terminal dan pilih default (`Enter` untuk setiap pertanyaan).
4. Untuk deploy ke production:
   ```bash
   vercel --prod
   ```

---

## 📁 Struktur Berkas Modular

```text
├── index.html                   # Entry point root dengan direct routing
├── vercel.json                  # Konfigurasi rewrite & routing Vercel
├── 01_Presentasi/               # Slide teori (React / Vite)
└── 02_Implementasi_Real_World/  # Modul implementasi & simulasi 3D
    ├── index.html               # File utama presentasi interaktif
    ├── presentasi_implementasi.html
    ├── css/
    │   └── style.css            # Seluruh styling presentasi, cockpit, & HUD
    ├── js/
    │   ├── data.js              # Data empiris pengujian (Python & CloudSim)
    │   ├── scene3d.js           # Three.js 3D rendering, mesh, drone, & animasi
    │   ├── simulation.js        # Logika simulator, kalkulasi KPI, & meter beban
    │   └── presentation.js      # Navigasi slide deck & keyboard shortcuts
    ├── program_aoa_vs_random.py # Program Python real-world
    ├── AOASchedulingSim.java    # Program CloudSim Java
    └── datasets/                # Dataset 100-500 cloudlets
```

