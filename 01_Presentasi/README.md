# Cloud Optimization Matrix: AOA vs Evolution Strategies

Website interaktif edukatif berbasis visualisasi 3D untuk membandingkan dan mendemonstrasikan dua algoritma metaheuristik utama dalam memecahkan masalah alokasi komputasi awan (*Cloud Task Scheduling & Resource Allocation*):
1. **Arithmetic Optimization Algorithm (AOA)** — Abualigah et al. (2021)
2. **Evolution Strategies (ES)** — Petra Lončar & Paula Lončar (2022, *IEEE Access*)

---

## 📸 Preview Website

<!-- Silakan letakkan tangkapan layar (screenshot) website Anda di bawah ini -->
![Preview Website](https://via.placeholder.com/1200x630/0b0f17/a855f7?text=Placeholder+Screenshot+Website)

> *Tambahkan foto atau GIF demonstrasi visualisasi 3D di sini (misal: simpan gambar di folder `public/screenshot.png` lalu tautkan dengan `![Preview Website](./public/screenshot.png)`).*

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

Pastikan komputer Anda telah terinstal **Node.js** (versi 18 ke atas) dan **npm**.

### 1. Masuk ke Direktori Proyek
Buka terminal dan arahkan ke folder proyek ini:
```bash
cd "D:\Institut Teknologi Sepuluh Nopember\Semester 5\Strategi Optimasi Komputasi Awan\Proggram Metaheuristic"
```

### 2. Instalasi Dependensi
Jalankan perintah berikut untuk mengunduh pustaka yang dibutuhkan:
```bash
npm install
```

### 3. Menjalankan Server Pengembangan (Dev Server)
Mulai aplikasi dalam mode lokal:
```bash
npm run dev
```
Setelah server menyala, buka tautan yang muncul di terminal (biasanya **`http://localhost:5173/`**) di browser Anda.

### 4. Build untuk Produksi & GitHub Pages
Jika ingin mengompilasi file siap deploy:
```bash
npm run build
```
File hasil build akan berada di direktori `dist/` dan siap diunggah ke GitHub Pages secara otomatis via GitHub Actions.

---

## 📁 Struktur Direktori Proyek & Pemenuhan Tugas

Proyek ini telah memenuhi seluruh 6 poin tugas perkuliahan yang diorganisasikan ke dalam modul-modul berikut:

```
├── 01_Presentasi/                     # [TUGAS 1] Modul Slide Presentasi Lengkap
│   ├── index.html                     # Slide presentasi interaktif HTML (Bisa dibuka langsung di browser)
│   ├── SLIDES.md                      # Format naskah presentasi Markdown (Marp ready)
│   └── README.md                      # Panduan navigasi dan materi slide
│
├── 02_Implementasi_Real_World/        # [TUGAS 5 & 6] Implementasi Nyata & Ujicoba Dataset Minggu 3
│   ├── datasets/                      # Dataset tugas Minggu 3 (100, 200, 300, 400, 500 Cloudlets)
│   ├── scheduler_realworld.py         # Program Python Real-World Scheduler (AOA, ES, Random)
│   ├── DOKUMENTASI_PROGRAM.md         # Dokumentasi teknis & penjelasan kode program mendalam
│   ├── hasil_real_world_per_run.csv   # Hasil lengkap 150 run pengujian independen
│   ├── hasil_real_world_ringkasan.csv # Ringkasan statistik performa (Mean & Std Dev)
│   └── run.bat                        # Script eksekusi instan 1-klik
│
├── src/                               # [TUGAS 2, 3, 4] Simulator Interaktif 3D (Vite + React + Three.js)
│   ├── algorithms/
│   │   ├── aoa.ts                     # Engine algoritma AOA
│   │   ├── es.ts                      # Engine algoritma (μ, λ)-ES & LJF
│   │   └── benchmarks.ts              # Topologi Data Center & pemetaan beban
│   ├── components/
│   │   ├── ThreeCanvas.tsx            # Visualisasi 3D Three.js & animasi seleksi dissolve
│   │   ├── DatacenterLoadCard.tsx     # Kartu pembagian beban 5 Data Center & % utilisasi
│   │   ├── LJFQueueVisualizer.tsx     # Animasi antrean sorting Longest Job First (LJF)
│   │   ├── VisualFAQ.tsx              # Pusat Tanya-Jawab Visual 3D dinamis
│   │   ├── StepInspector.tsx          # Inspektur langkah per putaran
│   │   ├── MetricsDashboard.tsx       # Metrik Makespan, Imbalance (DI), & grafik
│   │   └── InteractiveSandbox.tsx     # Parameter tuning slider
│   ├── App.tsx                        # Root application logic
│   └── main.tsx                       # Entry point React
├── .github/workflows/deploy.yml       # Otomasi deployment ke GitHub Pages
├── package.json
└── README.md
```

---

## 🧠 Penjelasan Singkat Mengenai Algoritma

### 1. Arithmetic Optimization Algorithm (AOA)
* **Pencipta:** Laith Abualigah et al. (2021).
* **Prinsip Utama:** Memanfaatkan perilaku matematis dari empat operator aritmatika dasar:
  * **Eksplorasi ($\div, \times$):** Operasi perkalian dan pembagian menghasilkan rentang angka dan lonjakan nilai yang sangat besar. Pada visualisasi, ini dianalogikan sebagai **helikopter atau parasut** yang melontarkan agen drone melompati gugusan server yang jauh agar tidak terjebak di optimum lokal (*local optima trap*).
  * **Eksploitasi ($-, +$):** Operasi pengurangan dan penjumlahan menghasilkan sebaran rapat berpresisi tinggi. Dianalogikan sebagai **cangkul dan detektor logam** yang menyisir tanah jengkal demi jengkal dengan sinar pemindai laser untuk menyempurnakan koordinat solusi terbaik (*best solution*).
* **Parameter Kunci:**
  * **MOA (*Math Optimizer Accelerated*):** Saklar otomatis yang secara bertahap mengalihkan dominasi fase dari eksplorasi di awal menuju eksploitasi di akhir.
  * **MOP (*Math Optimizer Probability*):** Pengecil langkah non-linear yang membuat pergerakan agen makin halus saat mendekati iterasi akhir.

### 2. Evolution Strategies (ES) di Komputasi Awan
* **Rujukan Jurnal:** Petra Lončar & Paula Lončar (2022), *"Optimization of Cloud Task Scheduling Using Evolution Strategies"*, *IEEE Access*.
* **Prinsip Utama:** Mengadopsi seleksi alam biologis $(\mu, \lambda)$-ES tanpa kawin silang (*crossover*):
  * **Bibit Induk ($\mu$ Parents):** Komandan strategi terbaik yang disaring dari setiap generasi (aura ungu/violet).
  * **Keturunan Mutasi ($\lambda$ Offspring) & Aturan 1:7:** Induk membelah diri menghasilkan $\lambda$ anak dengan rasio optimal $1 : 7$. Sekitar 10% tugas dipindahkan secara acak ke VM lain (*Random Resetting Mutation*).
  * **Seleksi Alam Tanpa Kompromi:** Generasi induk lama digantikan penuh oleh $\mu$ anak terbaik. Anak berkinerja buruk memudar (*dissolve*).
  * **Perisai Elitisme ($S_{best}$):** Mengamankan jadwal terbaik sepanjang masa agar progres optimasi tidak pernah mundur.
  * **Kebijakan Broker LJF (*Longest Job First*):** Tugas-tugas terberat dieksekusi lebih dahulu oleh VM berkecepatan tinggi, sehingga tidak ada server yang menganggur di akhir antrean.
* **Pembuktian Empiris Skala Dunia (CERN LHC ALICE):**
  * Diuji pada **49.026 tugas Monte Carlo** nyata dari 60+ lokasi global pada **5 Data Center (2.100 VM heterogen)**.
  * Terbukti mengungguli Genetic Algorithm (GA) dalam menghasilkan **Makespan lebih singkat**, **Throughput lebih tinggi**, dan **Degree of Imbalance (DI) lebih rendah**.
  * **Elastisitas Auto-Scaling:** VM otomatis bertambah (*scale-out*) hingga ~900 VM pada beban puncak antrean 20.000 tugas, dan menyusut kembali (*scale-in*) ke 0 saat pekerjaan tuntas.

---

## ☁️ Konteks Kasus Nyata: Cloud Task Scheduling
Dalam sistem komputasi awan heterogen, kedua algoritma bertindak sebagai *numerical solver* mandiri (tanpa perlu *training dataset*) yang dijalankan adaptif setiap ada *batch job* baru untuk memetakan tugas ke mesin virtual tercepat, seimbang, dan hemat energi.
