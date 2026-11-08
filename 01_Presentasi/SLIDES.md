---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #fcfaf6
color: #292524
style: |
  section {
    font-family: 'Inter', system-ui, sans-serif;
    padding: 40px 60px;
  }
  h1, h2, h3 {
    color: #1c1917;
  }
  .highlight {
    color: #b45309;
    font-weight: bold;
  }
  .badge {
    background-color: #fef3c7;
    color: #92400e;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 600;
  }
  table {
    font-size: 16px;
    width: 100%;
  }
  th {
    background-color: #f5eedf;
    color: #443024;
  }
  td {
    border-bottom: 1px solid #e7ded3;
  }
---

<!-- Slide 1: Title -->
<span class="badge">TUGAS STRATEGI OPTIMASI KOMPUTASI AWAN</span>

# Optimasi Penjadwalan Tugas Komputasi Awan Heterogen
### Menggunakan Arithmetic Optimization Algorithm (AOA) & Evolution Strategies (ES)

**Kelompok 1:**
* M. Faqih Ridho & Tim
* Departemen Teknik Informatika / Sistem Informasi
* Institut Teknologi Sepuluh Nopember (ITS)

---

<!-- Slide 2: Latar Belakang & Masalah -->
## 1. Latar Belakang & Permasalahan

* **Tantangan Utama:** 
  Pada komputasi awan skala besar, ribuan tugas ilmiah (*cloudlets*) harus dipetakan ke puluhan hingga ribuan Virtual Machines (VM) heterogen.
* **Evaluasi Baseline Minggu 3 (Random Scheduling):**
  * Pemetaan tugas dilakukan secara acak tanpa mempertimbangkan kapasitas MIPS.
  * **Makespan Sangat Tinggi:** Menyentuh **2.000 detik** pada 500 tugas.
  * **Beban Tidak Seimbang:** VM berkecepatan rendah (Small) *overloaded* 99.9%, sementara VM Large *idle* dengan utilisasi di bawah 15%.
  * **Degree of Imbalance (DI):** Berkisar di angka 0.33 - 0.37 (tidak merata).
* **Solusi yang Diajukan:**
  Menerapkan algoritma metaheuristik cerdas:
  1. **Arithmetic Optimization Algorithm (AOA)**
  2. **Evolution Strategies (ES)** dengan kebijakan **Longest Job First (LJF)**

---

<!-- Slide 3: Arsitektur Datacenter Tugas Minggu 3 -->
## 2. Topologi Datacenter & VM Heterogen

Sesuai spesifikasi tugas Minggu 3, lingkungan terdiri dari **3 Datacenter** dan **10 VM Heterogen**:

| Datacenter | Host | Spesifikasi Host | VM ID & Tipe | vCPU | MIPS/CPU | RAM | Bandwidth |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DC_Surabaya** | Host 0 | 8 Core @ 3000 MIPS, 64GB RAM | VM 0, 1 (Large)<br>VM 2 (Medium) | 2<br>2 | 3000<br>1800 | 8 GB<br>4 GB | 2500 Mbps<br>1000 Mbps |
| **DC_Jakarta** | Host 1 | 8 Core @ 2400 MIPS, 48GB RAM | VM 3, 4 (Medium)<br>VM 5 (Small) | 2<br>1 | 1800<br>800 | 4 GB<br>2 GB | 1000 Mbps<br>500 Mbps |
| **DC_Yogyakarta**| Host 2 | 8 Core @ 1800 MIPS, 32GB RAM | VM 6, 7, 8, 9 (Small) | 1 | 800 | 2 GB | 500 Mbps |

* **Dataset Tugas (Bag-of-Tasks):** 5 skenario (100, 200, 300, 400, 500 Cloudlets) dengan panjang instruksi berkisar antara **1.400 hingga 60.000+ MI**.

---

<!-- Slide 4: Algoritma 1 - AOA Filosofi -->
## 3. Algoritma 1: Arithmetic Optimization Algorithm (AOA)
* **Penemu:** Laith Abualigah et al. (2021) &bull; *Computer Methods in Applied Mechanics and Engineering*
* **Filosofi Inti:** Memanfaatkan sifat matematis dari 4 operator aritmatika dasar:
  * **Perkalian ($\times$) & Pembagian ($\div$):** Menghasilkan lonjakan angka besar dan sebaran luas $\rightarrow$ **Fase Eksplorasi Global** (melompat antar-datacenter).
  * **Pengurangan ($-$) & Penjumlahan ($+$):** Menghasilkan variasi selisih kecil dan rapat $\rightarrow$ **Fase Eksploitasi Lokal** (menyisir VM optimal secara presisi).
* **Mekanisme Transisi Waktu:**
  * **Math Optimizer Accelerated (MOA):** Fungsi linier pembagi peluang eksplorasi vs eksploitasi ($MOA = Min + t \times \frac{Max - Min}{M_{iter}}$).
  * **Math Optimizer Probability (MOP):** Koefisien pengecil langkah dinamis ($MOP = 1 - \frac{t^{1/\alpha}}{M_{iter}^{1/\alpha}}$).

---

<!-- Slide 5: Langkah-demi-Langkah AOA -->
## 4. Alur Langkah-demi-Langkah Eksekusi AOA

```
[Inisialisasi Agen (Populasi Alokasi Acak)]
                     │
                     ▼
       [Evaluasi Makespan Awal -> Tetapkan X_best (Suar Emas)]
                     │
                     ▼
         [Hitung Nilai MOA(t) & MOP(t) untuk Putaran ke-t]
                     │
     ┌───────────────┴───────────────┐
     ▼ (r1 > MOA)                    ▼ (r1 <= MOA)
[FASE EKSPLORASI GLOBAL]       [FASE EKSPLOITASI LOKAL]
 • Pembagian (÷) if r2 < 0.5    • Pengurangan (-) if r3 < 0.5
 • Perkalian (×) if r2 >= 0.5   • Penjumlahan (+) if r3 >= 0.5
     └───────────────┬───────────────┘
                     ▼
      [Batasi Indeks VM (0..9) & Evaluasi Solusi Baru]
                     │
                     ▼
  [Update X_best Jika Ada Rekor Makespan Lebih Cepat]
```

---

<!-- Slide 6: Algoritma 2 - Evolution Strategies -->
## 5. Algoritma 2: Evolution Strategies (ES) + LJF
* **Rujukan Jurnal:** Petra Lončar & Paula Lončar (2022) &bull; *IEEE Access*
* **Mekanisme $(\mu, \lambda)$-ES:**
  * **Induk ($\mu$):** Sejumlah strategi alokasi terbaik disaring dari generasi sebelumnya.
  * **Keturunan ($\lambda$):** Dihasilkan melalui rasio optimal **$1 : 7$** ($\lambda = 7 \times \mu$) sesuai pembuktian empiris jurnal CERN ALICE.
  * **Random Resetting Mutation (~10%):** Tanpa kawin silang (*crossover*), sekitar 10% tugas secara acak dipindahkan ke VM lain untuk melepaskan beban yang menumpuk.
  * **Kebijakan LJF (Longest Job First):** Di tingkat broker, tugas berinstruksi terbesar dieksekusi lebih awal pada prosesor VM berkemampuan MIPS tertinggi (Surabaya Large VM).
  * **Proteksi Elitisme ($S_{best}$):** Solusi Makespan tercepat sepanjang masa selalu diabadikan agar performa tidak pernah mundur.

---

<!-- Slide 7: Alur Langkah ES + LJF -->
## 6. Alur Langkah-demi-Langkah Eksekusi $(\mu, \lambda)$-ES

1. **Inisialisasi Bibit Induk ($\mu$ Parents):**
   Membentuk $\mu$ kandidat jadwal alokasi tugas ke 10 VM.
2. **Evaluasi Kelayakan Awal & Tetapkan $S_{best}$:**
   Hitung Makespan dengan simulasi eksekusi LJF broker.
3. **Ledakan Keturunan Mutasi ($\lambda = \mu \times 7$):**
   Setiap induk melahirkan 7 anak. Sekitar 10% tugas dipindah acak (*Random Resetting*).
4. **Evaluasi & Pengurutan:**
   Seluruh $\lambda$ anak dievaluasi durasi Makespan totalnya.
5. **Seleksi Alam Tanpa Kompromi:**
   Hanya $\mu$ anak terbaik yang bertahan hidup. Seluruh induk lama dan anak yang lambat dieliminasi (*dissolve*).
6. **Pembaruan Rekor Elitisme:**
   Jika anak juara generasi ini mengalahkan $S_{best}$, rekor diperbarui.

---

<!-- Slide 8: Hasil Komparasi Benchmark -->
## 7. Hasil Ujicoba Komparasi Riil (Dataset Minggu 3)

Rata-rata 10 kali pengujian (*10 independent runs*) pada 10 VM:

| Skenario Tasks | Algoritma | Makespan (s) | Throughput (t/s) | Avg VM Util (%) | LBI (Imbalance) | Total Cost ($) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **100 Cloudlets** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 464.47 ± 82.5<br>**145.20 ± 12.4**<br>**122.80 ± 8.1** | 0.22<br>**0.69**<br>**0.81** | 42.0%<br>**74.5%**<br>**82.3%** | 0.3338<br>**0.1820**<br>**0.1140** | $238.40<br>**$198.50**<br>**$189.20** |
| **300 Cloudlets** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 1271.93 ± 121<br>**392.50 ± 24.1**<br>**328.40 ± 15.6** | 0.24<br>**0.76**<br>**0.91** | 45.9%<br>**78.2%**<br>**86.5%** | 0.3456<br>**0.1650**<br>**0.0980** | $712.99<br>**$582.10**<br>**$548.60** |
| **500 Cloudlets** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 2000.79 ± 164<br>**635.80 ± 32.5**<br>**521.10 ± 21.4** | 0.25<br>**0.79**<br>**0.96** | 49.9%<br>**81.6%**<br>**89.4%** | 0.3599<br>**0.1510**<br>**0.0820** | $1167.28<br>**$945.30**<br>**$892.40** |

---

<!-- Slide 9: Analisis Keunggulan -->
## 8. Analisis Performa & Pembahasan Ilmiah

1. **Pemangkasan Makespan Sangat Masif (Hingga ~74% Lebih Cepat):**
   * Pada 500 tugas, Makespan terpangkas dari **2.000 detik (Random)** menjadi **521 detik (ES+LJF)** dan **635 detik (AOA)**.
2. **Keseimbangan Beban (LBI Menurun Drastis):**
   * LBI turun dari **0.3599 menjadi 0.0820**. Artinya, beban kerja terdistribusi proporsional: VM Large (Surabaya) memproses tugas besar, sementara VM Small (Yogyakarta) hanya memproses tugas ringan.
3. **Peningkatan Throughput & Utilisasi VM:**
   * Throughput meningkat dari **0.25 task/detik menjadi hampir 1.0 task/detik**.
   * Utilisasi rata-rata melonjak dari **49% menjadi ~89%**, membuktikan tidak ada VM yang menganggur berlama-lama.
4. **Efisiensi Biaya Finansial (Total Cost):**
   * Pengurangan waktu Makespan secara langsung menurunkan durasi sewa komputasi VM, menghemat biaya sewa hingga **$275+ per eksekusi batch**.

---

<!-- Slide 10: Kesimpulan -->
## 9. Kesimpulan & Rekomendasi

* **AOA:** Sangat tangguh dalam menghindari jebakan lokal (*local optima*) berkat lonjakan operator perkalian dan pembagian, menghasilkan konvergensi cepat pada penjadwalan komputasi awan.
* **ES + LJF:** Menghasilkan performa terbaik secara keseluruhan (*champion*) karena rasio induk-anak 1:7 dan mutasi acak 10% dikombinasikan dengan pengurutan tugas berinstruksi terpanjang lebih dahulu di broker.
* **Integrasi Simulator & Real-World:**
  * Simulator 3D berbasis Web/Three.js memberikan transparansi edukasi visual per putaran.
  * Program Real-World Dispatcher membuktikan efektivitas algoritma pada dataset nyata tugas Minggu 3.

---

<!-- Slide 11: Q&A -->
_class: lead
# Terima Kasih!
### Ada Pertanyaan atau Diskusi?

**Kelompok 1 &bull; Strategi Optimasi Komputasi Awan**
*Repositori GitHub:* [Kelompok-1_-Metaheuristic_Evolution-Strategies_Arithmetic-Optimization-Algorithm_](https://github.com/MFaqihRidh0/Kelompok-1_-Metaheuristic_Evolution-Strategies_Arithmetic-Optimization-Algorithm_)
