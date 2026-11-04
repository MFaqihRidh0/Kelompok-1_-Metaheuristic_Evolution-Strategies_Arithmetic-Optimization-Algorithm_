# Cloud Optimization Matrix: AOA vs Evolution Strategies

Website interaktif edukatif berbasis visualisasi 3D untuk membandingkan dan mendemonstrasikan dua algoritma metaheuristik utama dalam memecahkan masalah optimasi komputasi awan (*Cloud Task Scheduling & Resource Allocation*):
1. **Arithmetic Optimization Algorithm (AOA)**
2. **Evolution Strategies (ES)**

---

## 📸 Preview Website

<!-- Silakan letakkan tangkapan layar (screenshot) website Anda di bawah ini -->
![Preview Website](https://via.placeholder.com/1200x630/0b0f17/38bdf8?text=Placeholder+Screenshot+Website)

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
│   │   ├── es.ts                  # Logika Evolution Strategies
│   │   └── benchmarks.ts          # Fungsi evaluasi latensi server cloud
│   ├── components/
│   │   ├── Header.tsx             # Navigasi & switch mode algoritma (AOA, ES, Split)
│   │   ├── ThreeCanvas.tsx        # Viewport 3D Three.js 60 FPS & OrbitControls
│   │   ├── MetricsDashboard.tsx   # Dashboard MOA, MOP, Counter 4 Operator, & Grafik
│   │   ├── EducationalCards.tsx   # Kartu penjelasan analogi & kurikulum AOA
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

### 2. Evolution Strategies (ES)
* **Pencipta:** Ingo Rechenberg & Hans-Paul Schwefel.
* **Prinsip Utama:** Terinspirasi dari teori evolusi biologis dan seleksi alam berbasis mutasi acak:
  * **Kumpulan Induk ($\mu$ Parents):** Sekelompok individu yang memiliki performa alokasi server terbaik saat ini.
  * **Mutasi Keturunan ($\lambda$ Offspring):** Induk menghasilkan anak dengan variasi acak berdistribusi normal (Gaussian Mutation Cloud) dengan *step size* ($\sigma$).
  * **Seleksi Alam (*Environmental Selection*):** Keturunan dengan nilai latensi terbaik dipilih untuk menjadi generasi induk berikutnya, sedangkan solusi yang tidak efisien akan gugur.

---

## ☁️ Konteks Kasus Nyata: Cloud Task Scheduling
Dalam sistem komputasi awan, tugas komputasi (*workloads*) datang secara kontinu dan harus dipetakan ke sejumlah mesin virtual (*Virtual Machines* / VM). Kedua algoritma di atas bertindak sebagai *numerical solver* mandiri untuk mencari konfigurasi alokasi yang menghasilkan **latensi minimum (ms)**, beban seimbang, dan hemat energi tanpa menyebabkan server mengalami kelebihan beban (*server overload*).
