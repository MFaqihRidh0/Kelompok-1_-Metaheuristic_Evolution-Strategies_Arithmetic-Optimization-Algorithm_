# Optimasi Penjadwalan Cloud: Random Scheduling vs AOA (Arithmetic Optimization Algorithm)

> **Tugas Mata Kuliah:** Strategi Optimasi Komputasi Awan (Semester 5)  
> **Kelompok 1:** Metaheuristic — Arithmetic Optimization Algorithm (AOA) & Evolution Strategies

---

## 🌐 Tautan Akses Live Demo (Vercel)

| Aplikasi | URL Live Deployment | Deskripsi |
| :--- | :--- | :--- |
| **Slide Presentasi Teori** | [metaheuristic.vercel.app](https://metaheuristic.vercel.app/) | Slide presentasi interaktif teori AOA & Evolution Strategies (React + Vite) |
| **Modul Implementasi & Game 3D Dual-Mode** | [metaheuristicimplementasi.vercel.app](https://metaheuristicimplementasi.vercel.app/) | **Mode Game 3D (*AOA Cloud Battle Arena*)** + **Mode Presentasi Standar** (Three.js: Random Scheduling vs AOA pada 3 Datacenter Riil) |

---

## 👥 Anggota Kelompok 1

Diurutkan berdasarkan kontribusi jumlah commit di repositori GitHub (`git shortlog -sn`):

| Nama | NRP | Jumlah Commit di GitHub |
| :--- | :---: | :---: |
| **M. Faqih Ridho** | 5027241123 | 44 |
| **Dimas Satya A** | 5027241032 | 0 |
| **Hanif Mawla Faizi** | 5027241064 | 0 |
| **Muhammad Ardiansyah Tri Wibowo** | 5027241091 | 0 |
| **Elgracito Iryanda Endia** | 5027231057 | 0 |
| **Moch. Rizki Masrullah** | 5027241038 | 0 |

---

## 🚀 Fitur Utama

### 1. 🎮 Mode Game 3D Interaktif (*AOA Cloud Battle Arena* — Dual-Mode)
- **Layar Beranda *Spotlight Intro* (`CLICK TO START`):** Mengaktifkan musik latar sintetis (*WebAudio Cloud Ops Synth* dengan *DynamicsCompressor*) yang otomatis *pause* ketika jendela materi presentasi dibuka dan *resume* saat kembali ke arena game.
- **Karakter Utama 3D (*3D Action RPG Cyber-Mage*):**
  - Desain anatomi multi-sendi (bahu, siku, pinggul, lutut) dengan rambut putih *spiky*, *Cyber Visor* bercahaya, zirah emas-hitam, jubah merah berkibar, *Solar Fire Chakram* di tangan kanan, serta **5 Raijin Lightning Orbs** melayang dalam formasi kurva ke atas di belakang punggung.
- **Sistem Pertarungan Cepat 2-Hit & Buka Materi (`[O]`):**
  - Setiap Pos dijaga oleh monster (100 HP) yang dapat dikalahkan dengan **2x serangan** (`Tombol J`: 🔥 Jurus Api 50 HP + `Tombol K`: ⚡ Jurus Listrik 50 HP, atau `Tombol L`: 💥 Ultimate 100 HP).
  - Saat kalah, monster roboh menjadi mayat tetap di arena dengan lencana **`🔓 [O] / Klik : Buka Slide`**, dan membuka **Jendela Slide Mengambang di Tengah Layar** (dilengkapi tombol **Layar Penuh `⛶`** dan **Tutup `✕`**).
- **8 Karakter Monster 3D Organik Unik di Sepanjang Rute Berkelok (*S-Curve Trail*):**
  1. **Pos 1 — 🐍 Ular Kobra Abyssal:** Tubuh & leher S-curve utuh mulus tanpa potongan bertumpuk, tudung kobra lebar menyatu, kepala ular segitiga pipih dengan mata *slit-pupil* kuning, taring berbisa panjang, dan lidah merah bercabang dua.
  2. **Pos 2 — 🦅 Elang Raja Langit:** Warna coklat elang asli, kepala & ekor kipas putih bersih, paruh bengkok kuning emas, serta sayap berlapis 3 baris bulu lebar membulat.
  3. **Pos 3 — 🕷️ Laba-Laba Jaringan:** 8 kaki beruas multi-sendi dengan gerakan *tetrapod gait* dan capit mandibula.
  4. **Pos 4 — 🐺 Serigala Abu-Abu Fenrir:** Anatomi serigala *quadruped* asli berwarna abu-abu (*charcoal/slate/silver-grey*), moncong serigala panjang berhidung hitam, telinga segitiga tegak, rahang bertaring, dan ekor lebat berujung perak.
  5. **Pos 5 — 🦂 Kalajengking Besi:** 2 capit besar yang menjepit dan ekor melengkung bersegmen dengan sengat.
  6. **Pos 6 — 👹 Minotaur Dataset:** Otot dada kekar, tanduk banteng melengkung, serta lengan berotot multi-sendi lengkap dengan gelang pelindung dan **tangan 5 jari** yang menggenggam Kapak Perang Raksasa.
  7. **Pos 7 — 🐙 Kraken Gurita Raksasa:** Bentuk **gurita raksasa berwarna coklat** dengan kantung kepala/mantel bulat besar bertotol coklat, 2 mata gurita berlensa horizontal, corong *siphon*, dan **8 tentakel gurita coklat melengkung** lengkap dengan barisan alat hisap (*suction cups*).
  8. **Pos 8 — 🐉 Raja Naga Merah Bahamut (Final Boss):** Naga merah menyala bersisik perisai 3D berlapis di tubuh/leher/ekor, sisik perut emas, serta wajah naga merah lengkap dengan alis berduri, mata *slit-pupil* kuning emas, cula & lubang hidung, 12 taring tajam, dan 4 tanduk mahkota.
- **Kamera Orbit 360° Stabil & Panorama Langit Malam Berbulan Purnama:**
  - Kamera mendukung rotasi **360° penuh** yang stabil (*damped spherical coordinates*) menggunakan *geser 2 jari di touchpad*, *drag mouse*, atau tombol `Q / E`, serta *zoom in/out* dan pembatas jalan otomatis agar karakter tidak keluar rute.
  - Dilengkapi panorama pegunungan 360°, hutan pohon & tebing batu di tepi jalan, 3 Menara Datacenter (Surabaya, Jakarta, Yogyakarta), kubah bintang, dan **Bulan Purnama bersinar lengkap dengan kawah & halo cahaya** di langit game.

### 2. 📊 Mode Presentasi Standar & Simulator Live
- Dapat diakses kapan saja melalui tombol **`📊 Mode Standar`** di pojok kiri atas tanpa kehilangan progres.
- Menyajikan topologi 3 Datacenter (Surabaya 6.000 MIPS, Jakarta 3.600 MIPS, Yogyakarta 800 MIPS), konsol simulator langsung (Makespan, LBI, Throughput, dan Estimasi Biaya), serta **Modal Kode Utuh 349 Baris (`program_aoa_vs_random.py`)**.

### 3. 💻 Program Implementasi Riil & Dataset
- Python Real-World Dispatcher: `program_aoa_vs_random.py` (349 baris, 10 *independent runs*)
- Java CloudSim 7.0.1 Simulation: `AOASchedulingSim.java`
- Dataset ilmiah riil: `dataset_100cloudlet.csv` s.d. `dataset_500cloudlet.csv`

---

## 📁 Struktur Berkas Modular

```text
├── index.html                        # Entry point root dengan direct routing
├── vercel.json                       # Konfigurasi rewrite & routing Vercel
├── 01_Presentasi/                    # Slide teori AOA & ES (React / Vite)
├── 02_Implementasi_Real_World/       # Modul produksi Vercel (Dual-Mode: Game 3D & Mode Standar)
│   ├── index.html                    # Entry utama Mode Game 3D (AOA Cloud Battle Arena)
│   ├── presentasi_game.html          # Halaman Mode Game 3D
│   ├── presentasi_standar.html       # Halaman Mode Presentasi Standar (Dashboard 2 Kolom)
│   ├── THIRD_PARTY_NOTICES.md        # Lisensi & kredit pustaka pihak ketiga
│   ├── css/
│   │   ├── game.css                  # Styling HUD Game 3D, Floating Slide Modal, & Corpse Badge
│   │   └── style.css                 # Styling Mode Presentasi Standar & Simulator
│   ├── js/
│   │   ├── data.js                   # Data benchmark 100-500 cloudlets, 8 Pos, & 349 baris kode Python
│   │   ├── audio.js                  # WebAudio Cloud Ops Synth BGM & SFX (auto-pause saat slide buka)
│   │   ├── datacenter-sim-3d.js      # Panggung 3D tersemat: 3 Datacenter, Cloud Dispatcher, Drone & Tugas Melayang
│   │   ├── game-engine.js            # Engine 3D: Rute S-Curve, Kamera 360°, Bulan, Hero, & 8 Monster
│   │   ├── game-ui.js                # HUD, Slide Modal Mengambang, Konsol Simulasi & Sinkronisasi Stage 3D
│   │   ├── scene3d.js                # Three.js visualisasi 3 Datacenter (Mode Standar)
│   │   ├── simulation.js             # Logika simulator KPI & progress bar Datacenter
│   │   └── presentation.js           # Navigasi slide deck Mode Standar
│   ├── program_aoa_vs_random.py      # Program Python real-world dispatcher
│   ├── AOASchedulingSim.java         # Program CloudSim 7.0.1 Java
│   └── datasets/                     # Dataset CSV 100-500 cloudlets
└── 03_Implementasi_Real_World_Game/  # Direktori pengembangan khusus Game 3D (tersinkronisasi penuh)
```

---

## 🌐 Panduan Deploy ke Vercel

Proyek ini telah dikonfigurasi secara modular (`HTML`, `CSS`, `JS`) dan dapat dideploy ke **Vercel**:

### 1. Deploy Presentasi Teori (`metaheuristic.vercel.app`)
- **Root Directory:** `01_Presentasi`
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 2. Deploy Modul Implementasi & Game 3D (`metaheuristicimplementasi.vercel.app`)
- **Root Directory:** `02_Implementasi_Real_World` (atau `./` dengan `vercel.json`)
- **Framework Preset:** `Other`
- **Output Directory:** `./`
