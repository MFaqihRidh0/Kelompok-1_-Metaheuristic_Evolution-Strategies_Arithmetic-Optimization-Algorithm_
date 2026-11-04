# Design & Visual Briefing: Website Edukasi Interaktif Dual-Algoritma (AOA & Evolution Strategies)

Dokumen ini adalah instruksi kerja dan acuan desain bagi AI Agent / Frontend Engineer untuk membangun antarmuka web edukatif interaktif bertema **Optimasi Komputasi Awan (Cloud Computing Optimization)**. Platform ini dirancang untuk membandingkan dan mendemonstrasikan dua algoritma metaheuristik utama:
1. **Arithmetic Optimization Algorithm (AOA)**
2. **Evolution Strategies (ES)**

---

## 1. Konsep Tema, Narasi & Identitas Visual

* **Tema Utama:** *"Cloud Optimization Matrix: Arithmetic vs Biological Evolution"*
* **Konteks Masalah Dunia Nyata:** Alokasi sumber daya komputasi awan (*Cloud Task Scheduling & Resource Allocation*) — bagaimana algoritma mendistribusikan beban server (*virtual machines*) agar latensi minimum dan hemat energi tanpa server mengalami *overload*.
* **Nuansa Antarmuka:** *Cyber-Deck Operation System* (bersih, gelap/dark-mode, terstruktur, responsif, dan berbasis metrik sains real-time).

### Palet Warna Global
* **Latar Belakang:** *Deep Server Space* (`#0b0f17`, `#0f172a`, `#1e293b`)
* **Warna Algoritma AOA (Matematis/Aritmatika):**
  * Eksplorasi ($\div, \times$): *Cyan / Sky Blue* (`#06b6d4`, `#38bdf8`)
  * Eksploitasi ($-, +$): *Emerald / Mint* (`#10b981`, `#059669`)
  * Target Terbaik: *Radiant Gold* (`#f59e0b`, `#fbbf24`)
* **Warna Algoritma Evolution Strategies (Biologis/Generasi):**
  * Orang Tua / Genotipe Induk ($\mu$): *Electric Purple / Violet* (`#8b5cf6`, `#a855f7`)
  * Keturunan Mutasi ($\lambda$): *Magenta / Neon Pink* (`#ec4899`, `#f43f5e`)
  * Seleksi Alam Terbaik: *Bright Green Lime* (`#84cc16`)

---

## 2. Fitur Pengalih Algoritma (Algorithm Switcher Mechanism)

Website memiliki navigasi utama berupa **Dual-Algorithm Controller** yang terletak di posisi teratas atau di atas kanvas 3D:

1. **Mode A: Tab Switcher (Fokus Tunggal)**
   * Pengguna mengklik tombol toggle: `[ Mode AOA ]` atau `[ Mode Evolution Strategies ]`.
   * Saat tombol diklik, kanvas 3D, instrumen HUD, dan kartu narasi berganti mulus (*smooth cross-fade*) menampilkan simulasi algoritma yang aktif.
2. **Mode B: Split Arena (Bandingkan Berdampingan / Side-by-Side)**
   * Terdapat opsi `[ Mode Komparasi Bersamaan ]` yang membagi viewport menjadi 2 kanvas atau 2 cluster populasi di lanskap yang sama untuk melihat balapan konvergensi AOA vs ES secara langsung.

---

## 3. Spesifikasi Animasi 3D Three.js Berbasis Populasi

### A. Animasi 1: Arithmetic Optimization Algorithm (AOA)
* **Karakter Agen:** **Regu Drone / Bot Penjelajah Logika (*Arithmetic Explorers*)**
* **Perilaku Animasi:**
  * **Fase Eksplorasi ($\div, \times$):** Drone mengaktifkan *booster* vertikal, melonjak tinggi ke langit, lalu menyebar ke kluster server/pegunungan acak yang jauh (*high dispersion jump*).
  * **Fase Eksploitasi ($-, +$):** Drone mendarat di tanah, menembakkan sinar pemindai laser hijau, dan melangkah rapat menyisir koordinat terdekat dari titik terbaik saat ini (*dense local step*).
  * **Target Terbaik ($\text{best}$):** Tiang suar emas (*Golden Beacon Beam*) yang terus bergerak jika ada agen menemukan latensi cloud yang lebih rendah.

---

### B. Animasi 2: Evolution Strategies (ES)
*(Placeholder visual siap-pakai selagi materi lengkap disiapkan)*
* **Karakter Agen:** **Kromosom Data / Humanoid Bio-Digital (*Mutating Entities*)**
* **Perilaku Animasi:**
  * **Populasi Induk (Parent Pool $\mu$):** Sekelompok karakter inti berwarna ungu yang berada di posisi dengan performa terbaik saat ini.
  * **Fase Mutasi & Rekombinasi ($\lambda$ Offspring):** Karakter induk "membelah diri" atau memancarkan cincin partikel pink/magenta (*Gaussian Mutation Cloud*) di sekitarnya. Karakter anak muncul dengan variasi acak (ada yang lebih tinggi, lebih rendah, atau bergeser koordinatnya).
  * **Fase Seleksi Alam (*Selection*):** Karakter anak yang skornya buruk memudar/larut (*dissolve particle effect*), sedangkan anak terbaik yang mengalahkan induknya berubah warna menjadi hijau terang dan diangkat menjadi induk generasi berikutnya.
  * **Evolusi Langkah Adaptif:** Radius sebaran anak mengecil secara otomatis seiring bertambahnya generasi (meniru *Step-size Control / 1/5th success rule*).

---

## 4. Struktur Tata Letak Website (Wireframe & UI Structure)

```
+-----------------------------------------------------------------------------------+
|  [Logo Cloud Matrix]  AOA vs ES Visualizer        [Toggle: AOA] [Toggle: ES]     |
+-----------------------------------------------------------------------------------+
|  HERO / CONTEXT: Penjadwalan Tugas Komputasi Awan (Cloud Computing Optimization) |
+-----------------------------------------------------------------------------------+
|  VIEWPORT 3D (Three.js):                                                          |
|  +-----------------------------------------------------------------------------+  |
|  |  [HUD: Algoritma Aktif]                      [HUD: Latensi / Fitness Terbaik]|  |
|  |                                                                             |  |
|  |             Lanskap Server 3D / Populasi Agen (AOA / ES)                    |  |
|  |                                                                             |  |
|  |  [Status Fase: Eksplorasi / Mutasi]                   [Iterasi: 42 / 100]   |  |
|  +-----------------------------------------------------------------------------+  |
|  KONTROL: [Play] [Pause] [Step] [Reset]  |  Kecepatan: [====|====] 4x            |
+-----------------------------------------------------------------------------------+
|  DASHBOARD METRIK DINAMIS (Menyesuaikan Algoritma yang Dipilih):                  |
|  - Jika AOA: Tampilkan Slider MOA, MOP, dan 4 Counter Operator (÷, ×, -, +)       |
|  - Jika ES: Tampilkan Generasi (G), Rasio Mutasi (σ), dan Status Induk vs Anak   |
+-----------------------------------------------------------------------------------+
|  KARTU ANALOGI & EDUKASI:                                                         |
|  [ Kartu Cara Kerja AOA ]                     [ Kartu Cara Kerja ES ]             |
|  (Helikopter vs Sekop)                        (Seleksi Alam & Mutasi Genetik)    |
+-----------------------------------------------------------------------------------+
|  SANDBOX INTERAKTIF: Uji Coba Input Parameter Sendiri                             |
+-----------------------------------------------------------------------------------+
```

---

## 5. Implementasi Teknis (Murni Standalone / Tanpa Node.js)

1. **Framework Tanpa Build Step:** Cukup gunakan file `.html` tunggal dengan pemanggilan CDN:
   * **Tailwind CSS CDN:** Desain antarmuka responsif dan tema gelap modern.
   * **Three.js Core CDN:** Rendering lingkungan 3D, material, dan tata cahaya.
   * **OrbitControls CDN:** Navigasi kamera 360 derajat menggunakan mouse atau gestur sentuh.
   * **KaTeX CDN:** Menampilkan rumus AOA dan ES secara estetis.
2. **Pengelolaan State Algoritma:**
   * Buat variabel state `currentAlgorithm = 'AOA' | 'ES'`.
   * Fungsi `switchAlgorithm(target)` akan mengosongkan partikel lama dari scene 3D, meregenerasi populasi sesuai karakter algoritma yang dipilih, serta mengganti teks penjelasan dan instrumen metrik secara otomatis.
3. **Optimasi Performa 60 FPS:**
   * Gunakan objek geometri gabungan sederhana (*Low-Poly Box, Capsule, Cylinder*) untuk merakit figur agen/karakter sehingga tetap ringan saat dijalankan di browser perangkat apa pun.