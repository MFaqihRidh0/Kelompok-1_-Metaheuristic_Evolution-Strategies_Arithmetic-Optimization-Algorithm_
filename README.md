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

## 🛠️ Struktur Direktori Proyek

```
├── .github/workflows/deploy.yml   # Workflow otomatis deployment ke GitHub Pages
├── src/
│   ├── algorithms/
│   │   ├── aoa.ts                 # Logika matematika AOA (Abualigah et al., 2021)
│   │   ├── es.ts                  # Logika (μ, λ)-ES & Elitisme (Lončar & Lončar, 2022)
│   │   └── benchmarks.ts          # Evaluasi 5 Data Center CERN LHC ALICE heterogen
│   ├── components/
│   │   ├── Header.tsx             # Navigasi & switch mode algoritma (AOA, ES, Split)
│   │   ├── ThreeCanvas.tsx        # Viewport 3D Three.js 60 FPS & OrbitControls
│   │   ├── MetricsDashboard.tsx   # Dashboard Makespan, Imbalance (DI), MOA/MOP, & Grafik
│   │   ├── EducationalCards.tsx   # Kartu penjelasan materi AOA (Analogi helikopter vs cangkul)
│   │   ├── ESEducationalCards.tsx # Kartu penjelasan materi ES (Jurnal CERN ALICE, LJF, & 1:7 rule)
│   │   └── InteractiveSandbox.tsx # Slider uji parameter interaktif
│   ├── types/
│   │   └── index.ts               # Interface TypeScript
│   ├── App.tsx                    # Komponen utama & state manager simulasi
│   ├── main.tsx                   # Entry point React
│   └── index.css                  # Styling tema Cyber-Deck & KaTeX
├── index.html                     # Entry point HTML Vite
├── package.json                   # Dependensi dan skrip proyek
├── tailwind.config.js             # Konfigurasi Tailwind CSS
└── vite.config.ts                 # Konfigurasi Vite bundler
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
