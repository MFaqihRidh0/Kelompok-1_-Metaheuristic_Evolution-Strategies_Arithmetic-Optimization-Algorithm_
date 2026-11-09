# Optimasi Penjadwalan Cloud: Random Scheduling vs AOA (Arithmetic Optimization Algorithm)

> **Tugas Mata Kuliah:** Strategi Optimasi Komputasi Awan (Semester 5)  
> **Kelompok 1:** Metaheuristic - Arithmetic Optimization Algorithm (AOA) & Evolution Strategies

---

## 🌐 Tautan Akses Live Demo (Vercel)

| Aplikasi | URL Live Deployment | Deskripsi |
| :--- | :--- | :--- |
| **Slide Presentasi Teori** | [metaheuristic.vercel.app](https://metaheuristic.vercel.app/) | Slide presentasi interaktif teori AOA & Evolution Strategies (React + Vite) |
| **Modul Implementasi & Simulasi 3D** | [metaheuristicimplementasi.vercel.app](https://metaheuristicimplementasi.vercel.app/) | Simulasi interaktif 3D Three.js: Random Scheduling vs AOA pada 3 Datacenter Riil |

---

## 👥 Anggota Kelompok 1

Diurutkan berdasarkan kontribusi jumlah commit di repositori GitHub (`git shortlog -sn`):

| Nama | NRP | Jumlah Commit di GitHub |
| :--- | :---: | :---: |
| **M. Faqih Ridho** | 5027241123 | 26 |
| **Dimas Satya A** | 5027241032 | 0 |
| **Hanif Mawla Faizi** | 5027241064 | 0 |
| **Muhammad Ardiansyah Tri Wibowo** | 5027241091 | 0 |
| **Elgracito Iryanda Endia** | 5027231057 | 0 |
| **Moch. Rizki Masrullah** | 5027241038 | 0 |

---

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

---

## 🌐 Panduan Deploy ke Vercel

Proyek ini telah dikonfigurasi secara modular (`HTML`, `CSS`, `JS`) dan dapat dideploy ke **Vercel** dengan pengaturan terpisah untuk masing-masing modul:

### 1. Deploy Presentasi Teori (`metaheuristic.vercel.app`)
- **Root Directory:** `01_Presentasi`
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 2. Deploy Modul Implementasi & Simulasi 3D (`metaheuristicimplementasi.vercel.app`)
- **Root Directory:** `02_Implementasi_Real_World` (atau `./` dengan `vercel.json`)
- **Framework Preset:** `Other`
- **Output Directory:** `./`
