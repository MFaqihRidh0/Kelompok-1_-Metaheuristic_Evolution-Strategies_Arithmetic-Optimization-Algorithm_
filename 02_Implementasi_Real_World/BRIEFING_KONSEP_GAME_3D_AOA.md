# 🎮 MASTER BRIEFING & AI AGENT BLUEPRINT: "AOA CLOUD BATTLE ARENA (3D GAME PRESENTATION)"
**Dokumen Penuntun Eksekusi Kode (*Single Source of Truth* untuk AI Coding Agent)**  
**Proyek:** Strategi Optimasi Komputasi Awan (SOKA) — Kelompok 1  
**Target Direktori Kerja:** `03_Implementasi_Real_World_Game/`  
**Sumber Materi & Data Referensi Wajib:** `02_Implementasi_Real_World/` (`presentasi_implementasi.html`, `program_aoa_vs_random.py`, `js/data.js`, `js/simulation.js`)  
**Referensi Estetika & Pustaka:** Adaptasi gaya interaktif *Cloud Ops: Scheduling Adventure* (*Three.js & TSL-style Shaders, Rapier/Spring Physics, Howler.js, Kounine BGM, font Amatic SC & Nunito SIL OFL, serta efek suara sintetis Cloud Ops*).

---

## 1. Visi Utama & Alur Pengalaman Pengguna (Core Game Loop)

Presentasi implementasi **Arithmetic Optimization Algorithm (AOA) vs Random Scheduling** dikemas menjadi **Game Pertarungan 3D (*3D Action Training Arena*)**. Perpindahan antar-slide tidak lagi menggunakan tombol biasa, melainkan **harus berjalan di dunia 3D dan mengalahkan Musuh Dummy di setiap Pos menggunakan Jurus Elemen Api & Listrik**.

```mermaid
flowchart TD
    A["1. Beranda Spotlight Intro\n(Layar Gelap + Sorotan Lampu + 'CLICK TO START')"] -->|Klik Layar & Aktifkan Audio| B["2. Main Hub: Cloud Ops Sanctuary\n(Karakter Pendekar Siber / Cyber-Mage)"]
    B -->|Jalan WASD / Arrow Keys| C["3. Dekati Pos Musuh (Pos 1 s.d. Pos 8)\nMusuh Diam (Stationary Training Dummy)"]
    C -->|Lancarkan 2x Serangan:\n1x Jurus Api (J) + 1x Jurus Listrik (K)| D["4. Musuh Kalah (HP = 0)\nMayat Musuh Roboh & Tetap Ada di Arena"]
    D -->|Otomatis Muncul Saat Kalah| E["5. Jendela Slide Mengambang di Depan Layar\n(82% Layar, Tombol Layar Penuh ⛶ & Tombol Keluar ✕)"]
    E -->|Klik Tombol ✕ / ESC| F["6. Kembali ke Dunia 3D\nDi Atas Mayat Musuh Muncul Simbol:\n'Klik / Tekan [O] untuk Membuka Presentasi'"]
    F -->|Jalan ke Pos Berikutnya| C
    F -->|Tekan [O] / Klik Mayat Musuh| E
```

---

## 2. Keputusan Desain & Mekanika Inti (Hasil Konfirmasi User)

Setiap *Agent Code* yang mengeksekusi proyek ini **WAJIB** mematuhi 5 aturan mekanika berikut tanpa terkecuali:

### 1. Tema Karakter Utama & Lawan: *Pendekar Siber (Cyber-Mage) vs Robot/Golem Dummy Server*
* **Karakter Utama (*The AOA Cyber-Mage*):**
  * Menggunakan model 3D *stylized articulated character* (kepala dengan visor siber menyala, jubah/zirah taktis gelap beraksen neon, tangan & kaki yang beranimasi halus saat berjalan dan merapal jurus).
  * **Tangan Kanan** dikelilingi **Orb Api (🔥 Merah-Oranye)** yang berputar dan memancarkan partikel bara.
  * **Tangan Kiri** dikelilingi **Orb Listrik (⚡ Biru-Ungu Elektrik)** yang memercikkan kilat statis.
* **Karakter Musuh (*Stationary Server Golem / Robot Dummy*):**
  * Terdapat **8 Musuh Dummy** yang berjaga di **Pos 1 s.d. Pos 8**.
  * Musuh **diam di tempat** (seperti *Training Dummy* di arena latihan) — tidak mengejar dan tidak menyerang balik agar presentasi di depan dosen 100% terkendali.
  * Saat terkena serangan, tubuh musuh bergoyang membal (*spring physics wobble*), berkedip merah/biru, dan memunculkan *Floating Damage Text* (`-50% HP 🔥` / `-50% HP ⚡`).

### 2. Sistem Pertarungan Cepat: *2x Serangan Langsung Kalah (Fast 2-Hit Defeat)*
* Setiap Musuh Dummy memiliki **100 HP** (ditampilkan pada *Floating 3D Health Bar* di atas kepala musuh).
* **🔥 Jurus 1 — Elemen Api (`Tombol J` / `Klik Kiri` / `Tombol 1`):**
  * Menembakkan *Fireball / Gelombang Semburan Api* dari Orb tangan kanan ke arah musuh terdekat.
  * Memberikan **50 Damage (50% HP)** + efek ledakan cincin api & *PointLight* oranye.
* **⚡ Jurus 2 — Elemen Listrik (`Tombol K` / `Klik Kanan` / `Tombol 2`):**
  * Menyambar musuh dengan *Petir Prosedural (Jagged Lightning Bolt)* dari Orb tangan kiri.
  * Memberikan **50 Damage (50% HP)** + efek kilatan elektrik biru-ungu.
* **💥 Jurus Pamungkas / Instant Finisher (`Tombol L` / `Spasi`):**
  * Menggabungkan Api + Listrik, memberikan **100 Damage (1x pukul langsung kalah)** jika presenter ingin membuka slide secara instan.
* Dengan demikian, kombo **1x Jurus Api + 1x Jurus Listrik (total 2 serangan)** langsung mengalahkan musuh dengan cepat, memamerkan kedua elemen tanpa membuat dosen menunggu lama!

### 3. Mekanika Mayat Musuh & Re-Open Slide: *Simbol `"Klik / Tekan [O] untuk Membuka Presentasi"`*
* Ketika HP musuh mencapai `0`:
  * Musuh **TIDAK menghilang sepenuhnya**, melainkan **roboh/berlutut menjadi mayat rongsokan robot (*Defeated Corpse State*)** di atas lingkaran pos yang berubah warna dari **Merah** menjadi **Hijau Emerald**.
  * Tepat di atas mayat musuh yang sudah dikalahkan, muncul **Ikon & Label Hologram Melayang** yang selalu menghadap kamera (*billboard*):
    > **`🔓 [O] / Klik : Buka Presentasi (Pos X)`**
  * Kapan saja pemain mendekati mayat musuh tersebut dan menekan tombol **`O`** di keyboard (atau **mengklik mayat musuh dengan mouse**), jendela slide presentasi untuk Pos tersebut akan **terbuka kembali**!

### 4. Tampilan Slide Presentasi: *Jendela Mengambang di Depan (Centered Floating Window) + Layar Penuh (`⛶`) + Tutup (`✕`)*
* **Bukan Drawer di Sisi Kanan**, melainkan **muncul di depan/tengah layar (*Centered Floating Modal Card*)** tepat setelah musuh dikalahkan (atau saat menekan `O` di dekat mayat musuh).
* **Ukuran Proporsional (Tidak Menutupi Semua Layar):**
  * Secara default berukuran **`width: 84vw` (maks `1080px`)** dan **`height: 82vh`**, berada di tengah layar dengan *backdrop blur* tipis sehingga **pemandangan dunia 3D dan karakter di sekeliling tepi layar tetap terlihat hidup**.
* **Header Bar Jendela Presentasi Wajib Memiliki:**
  1. **Badge Pos & Judul Stasiun** (misal: `POS 4 TERBUKA • MATEMATIKA AOA YANG BARU`).
  2. **Tombol `⛶ Layar Penuh` (*Fullscreen / Maximize Toggle*):** Saat diklik, jendela slide melebar menjadi **100% layar penuh (`100vw x 100vh`)** agar kode program atau tabel terlihat sangat besar dan jelas bagi audiens/dosen. Klik lagi untuk kembali ke ukuran mengambang (`84vw x 82vh`).
  3. **Tombol `✕` (*Close Button*):** Menutup jendela presentasi (juga bisa dengan tombol `Esc`) agar pemain bisa lanjut berjalan ke Pos musuh berikutnya.

---

## 3. Analisa & Adopsi Visual dari 6 Gambar Referensi (`Cloud Ops`)

Untuk memastikan kualitas artistik setara dengan proyek referensi teman Anda, berikut komponen visual yang wajib diadopsi:

1. **Layar Beranda / Spotlight Intro (Referensi Gambar 1):**
   * Kanvas 3D gelap (`#120e24`) dengan lantai berpola grid tanda tambah (`+`) berwarna biru-ungu redup.
   * Satu lampu sorot melingkar (*Spotlight* hangat) menyorot karakter **Pendekar Siber** di tengah bersama lentera dan rak server mini.
   * Teks tulisan tangan menggunakan font **`Amatic SC`**: **`CLICK TO START`** dilengkapi panah melengkung dan ikon speaker audio. Saat diklik, musik latar & suara sintetis aktif, lalu lampu dunia menyala terang.
2. **HUD & Navigasi Dunia 3D (Referensi Gambar 2, 3, 4):**
   * **Kartu Kiri Atas (Krem Hangat `#f7f2e7`):** Bertuliskan `KELOMPOK 1 / SOKA`, judul `AOA BATTLE ARENA`, dan tombol `MULAI PRESENTASI →` (otomatis mengarahkan/menggerakkan ke Pos yang belum dikalahkan).
   * **Tombol Kanan Atas:**
     * Tombol `☰` (**Menu & Kredit**): Membuka modal *split-screen* seperti **Gambar 6** (Berisi informasi Kelompok 1, panduan kontrol, daftar pos, dan kredit pihak ketiga).
     * Tombol `📍` (**Teleport & Buka Cepat Slide 1–8**): Menu pintasan bagi presenter untuk langsung melompat ke Pos mana pun atau membuka Slide 1–8 + Konsol Simulator tanpa harus berjalan jika sedang sesi tanya jawab dosen.
   * **Kartu Progres Kiri Bawah:** Menampilkan `Arena Progress • X/8 Musuh Dikalahkan`, bar tombol jurus (`[J] 🔥 Api`, `[K] ⚡ Listrik`, `[L] 💥 Ultimate`, `[O] 📖 Buka Slide`), dan instruksi target saat ini.
   * **Pill Bantuan Tengah Bawah:** Bar hitam transparan (`Arena World • WASD: Jalan • J/Klik Kiri: 🔥 Api • K/Klik Kanan: ⚡ Listrik • O: Buka Slide Mayat • Esc: Tutup Panel`).

---

## 4. Pemetaan 8 Pos Musuh ke 8 Slide Materi (`02_Implementasi_Real_World`)

Seluruh konten materi, potongan kode Python, tabel empiris, hingga simulator **WAJIB diambil secara utuh dari `02_Implementasi_Real_World/`**:

| Pos Arena | Nama Musuh Dummy (100 HP) | Judul Slide yang Terbuka (`02_Implementasi_Real_World`) | Konten Materi & Bedah Kode di Dalam Jendela Slide |
| :---: | :--- | :--- | :--- |
| **Pos 1** | **Dummy 01: *Unconfigured Node*** | **Slide 1: Komparasi Kinerja Penjadwalan Cloud** (`DEMO IMPLEMENTASI • TUGAS 1 S.D 6`) | Kartu *3 Datacenter Heterogen* (Surabaya 6.000 MIPS, Jakarta 3.600 MIPS, Yogya 800 MIPS) & *Dataset Tugas Ilmiah Riil* (100–500 cloudlet) + Kode `build_datacenter_vms()` + Tombol **📄 Buka Kode Utuh (349 Baris)**. |
| **Pos 2** | **Dummy 02: *Blind Random Imp*** | **Slide 2: Kilas Balik Inefisiensi Fatal Random Scheduling** (`BAGIAN 01 • PROBLEM STATEMENT`) | Kartu *1. Alokasi Buta Kapasitas* & *2. Pemborosan Sumber Daya* + Kode fungsi `schedule_random()` dan analisis bottleneck VM Yogya vs IDLE VM Surabaya. |
| **Pos 3** | **Dummy 03: *Latency Phantom*** | **Slide 3: Arsitektur 3 Datacenter & Jaringan Geografis Riil** (`BAGIAN 02 • TOPOLOGI REAL-WORLD`) | Penjelasan distribusi geografis antarkota + Kode matriks `NETWORK_LATENCY` (Intra-DC 1ms, Sby-Yog 8ms, Sby-Jkt 15ms, Jkt-Yog 10ms) & rumus `tx_time`. |
| **Pos 4** | **Dummy 04: *Arithmetic Guardian*** | **Slide 4: Mengapa Memilih AOA? Keunggulan 4 Operator Aritmatika** (`BAGIAN 03 • MATEMATIKA AOA YANG BARU`) | Penjelasan dua fase adaptif AOA (Abualigah et al., 2021) + Kode lengkap `AOAScheduler.optimize()` (`moa`, `mop`, eksplorasi $\div, \times$, eksploitasi $-, +$, dan *continuous-to-discrete mapping*). |
| **Pos 5** | **Dummy 05: *Imbalance Golem*** | **Slide 5: Bagaimana Program AOA Diterapkan & Dievaluasi?** (`BAGIAN 04 • DEPLOYMENT REAL-WORLD`) | Penjelasan kerja AOA di layer *Cloud Controller Dispatcher* + Kode `evaluate_schedule()` (rumus *Makespan*, *Throughput*, *Load Balancing Index / LBI*, dan *Total Cost*). |
| **Pos 6** | **Dummy 06: *Dataset Sentinel*** | **Slide 6: Metodologi Pengujian: Loop 10 Runs & Dataset CSV** (`BAGIAN 05 • VALIDASI RIIL 10 RUNS`) | Kode parser `load_dataset_csv()` & loop 10 *independent runs* (`for seed in range(10)`) + Tombol interaktif `⚠️ Uji Coba Random`, `✨ Uji Coba AOA`, dan `📄 Buka Source Code Utuh`. |
| **Pos 7** | **Dummy 07: *Dual-Env Colossus*** | **Slide 7: Hasil Ujicoba Empiris: Simulator CloudSim & Real-World** (`BAGIAN 06 • VALIDASI DUA LINGKUNGAN`) | Tabel lengkap **🅰️ Simulator CloudSim 7.0.1 (100–500 Tasks, pangkas Makespan -56.1%)** dan **🅱️ Real-World Dispatcher (pangkas Makespan -53.4%, hemat biaya $34.49)**. |
| **Pos 8** | **Boss 08: *Bottleneck Overlord*** | **Slide 8: Kesimpulan Akademik, Live Simulator & Tanya Jawab** (`BAGIAN 07 • KESIMPULAN & Q&A`) | 4 Poin kesimpulan utama + Perintah eksekusi program + **🎮 Konsol Simulasi Penjadwalan Interaktif (Pilih Algoritma, Dataset 100–500, Lingkungan, 4 Kartu KPI, dan 3 Progress Bar Datacenter)**. |

> **Catatan Penting Integrasi Simulator & Kode Utuh:**  
> Di dalam Jendela Slide Mengambang (terutama pada Slide 6, 7, 8, atau melalui tab di bagian bawah jendela slide), pengguna juga dapat langsung mengklik tombol **"🎮 Buka Konsol Simulator Live"** atau **"📄 Buka Kode Utuh (349 Baris)"** tanpa harus meninggalkan game!

---

## 5. Spesifikasi Teknis & Pustaka (Tech Stack & Audio/Visual Synth)

1. **Three.js + Custom Procedural Shaders (TSL-inspired GLSL):**
   * **Shader Api (🔥):** Bola api dengan *glow* berlapis, partikel bara berterbangan, dan cincin gelombang panas saat mengenai musuh.
   * **Shader Listrik (⚡):** Geometri petir bercabang (*procedural jagged polyline/cylinder segments*) yang diperbarui setiap *frame* saat menyambar, lengkap dengan *flash* cahaya biru elektrik.
   * **Lingkungan Arena:** Jalur batu arena dengan lentera hangat, pohon *stylized low-poly*, 3 Menara Datacenter (Surabaya, Jakarta, Yogyakarta) di sisi arena, dan papan penunjuk 3D di setiap Pos.
2. **Fisika & Animasi Hitbox (Rapier-style Spring & Impulse Physics):**
   * Pergerakan karakter mulus dengan *acceleration/deceleration* dan batasan arena.
   * Deteksi jarak & tumbukan proyektil ke musuh.
   * Efek *Spring Wobble* ketika musuh terkena pukulan, serta animasi roboh (*corpse state*) saat `HP == 0`.
3. **Audio & Sound Effects (Howler.js + Procedural WebAudio Cloud Ops Synth):**
   * Musik latar (*ambient synth / adventure loop* bergaya Kounine).
   * Efek suara sintetis mandiri berbasis `AudioContext` (tidak akan *broken link*):
     * `playFireCast()` & `playFireImpact()` (deru api & ledakan bass hangat).
     * `playLightningCast()` & `playLightningImpact()` (sambaran listrik frekuensi tinggi & guntur).
     * `playEnemyDefeat()` (suara robot roboh + *victory chord chime*).
     * `playSlideOpen()` & `playUIClick()` (efek suara antarmuka lembut).
4. **Tipografi (SIL Open Font License):**
   * `Amatic SC` (untuk teks penunjuk dunia 3D & layar *Click to Start*).
   * `Nunito` & `Plus Jakarta Sans` (untuk teks kartu presentasi & HUD).
   * `JetBrains Mono` (untuk kode Python 349 baris & angka metrik).

---

## 6. Arsitektur Dual-Mode (Opsi A: Mode Game 3D & Mode Presentasi Standar)

Sesuai keputusan akhir (**Opsi A**), sistem ini dirancang dengan **Arsitektur Dual-Mode Terintegrasi**:
1. **Default Saat Dibuka (`Mode Game 3D`):**
   * Pengunjung yang membuka `metaheuristicimplementasi.vercel.app` langsung disambut oleh **Beranda Spotlight Intro (`CLICK TO START`)** dan masuk ke **Arena Pertarungan 3D**.
   * Di pojok atas HUD terdapat tombol cepat **`📊 Beralih ke Mode Standar`** jika sewaktu-waktu presenter atau dosen ingin melihat tampilan *Split-Screen Dashboard* klasik.
2. **Mode Presentasi Standar (`presentasi_standar.html` / Toggle View):**
   * Menampilkan antarmuka *2-Column Slide + 3D Stage + Konsol Simulator* yang sudah ada di `02_Implementasi_Real_World/`, dilengkapi tombol **`🎮 Mainkan Mode Game 3D`** di bagian header atas untuk berpindah kembali ke arena pertarungan kapan saja.
3. **Sinkronisasi Direktori (`02_Implementasi_Real_World/` & `03_Implementasi_Real_World_Game/`):**
   * Kode dibangun dan disimpan secara rapi di `03_Implementasi_Real_World_Game/` sekaligus diintegrasikan ke `02_Implementasi_Real_World/` agar otomatis ter-deploy ke link produksi Vercel (`metaheuristicimplementasi.vercel.app`) tanpa mengubah konfigurasi server.

---

## 7. Struktur File Proyek

```text
03_Implementasi_Real_World_Game/ (dan terintegrasi ke 02_Implementasi_Real_World/)
├── BRIEFING_KONSEP_GAME_3D_AOA.md   <-- Dokumen Master Blueprint ini
├── THIRD_PARTY_NOTICES.md           <-- Lisensi MIT & Kredit Pihak Ketiga (seperti Gambar 6)
├── index.html                       <-- Entry utama: Mode Game 3D + Switcher ke Mode Presentasi Standar
├── presentasi_game.html             <-- Mode Game 3D (AOA Cloud Battle Arena)
├── presentasi_standar.html          <-- Mode Presentasi Standar (Dashboard 2 Kolom + Simulator)
├── css/
│   ├── style.css                    <-- Styling Mode Presentasi Standar
│   └── game.css                     <-- Styling HUD Cloud Ops, Spotlight Intro, & Jendela Slide Mengambang
└── js/
    ├── data.js                      <-- Data Benchmark 100-500 Cloudlets + Kode Utuh 349 Baris Python
    ├── audio.js                     <-- Howler.js + WebAudio Procedural SFX (Api, Listrik, Defeat, UI, BGM)
    ├── game-world.js                <-- Three.js World, Spotlight Intro, 3 Menara DC, Pohon, Lentera, & 8 Pos
    ├── game-combat.js               <-- Karakter Cyber-Mage, 8 Robot Dummy, Jurus Api & Listrik, Mayat [O]
    └── game-ui.js                   <-- Controller Jendela Slide (Fullscreen/Close), Simulator, & Modal Menu
```
