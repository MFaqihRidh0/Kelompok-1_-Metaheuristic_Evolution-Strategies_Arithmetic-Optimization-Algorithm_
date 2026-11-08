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
  h1, h2, h3 { color: #1c1917; }
  .badge {
    background-color: #e0f2fe;
    color: #0369a1;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 700;
  }
  table { font-size: 15px; width: 100%; }
  th { background-color: #f5eedf; color: #443024; }
  td { border-bottom: 1px solid #e7ded3; }
---

<!-- Slide 1 -->
<span class="badge">DEMO IMPLEMENTASI REAL-WORLD &bull; KELOMPOK 1</span>

# Komparasi Kinerja Penjadwalan Cloud
### Baseline Random Scheduling (Minggu 3) vs. Algoritma AOA yang Baru &amp; Lebih Baik

**Disusun oleh:** Kelompok 1 &bull; Strategi Optimasi Komputasi Awan

---

<!-- Slide 2 -->
## 1. Kilas Balik: Masalah Fatal Random Scheduling (Minggu 3)

* **Bottleneck Ekstrem:** Tugas raksasa (>60.000 MI) terlempar acak ke VM Small (800 MIPS) di Yogyakarta &rarr; antrean macet total, utilisasi 99.9%.
* **CPU Idle Terbuang:** VM Large (6.000 MIPS di Surabaya) banyak menganggur dengan utilisasi di bawah 15%.
* **Makespan Meledak:** Menyentuh **1.951+ detik** (lebih dari 32 menit) pada 500 tugas.
* **Tingkat Ketimpangan Beban (LBI):** Sangat timpang di angka **1.80 s.d 2.30**.

> **Misi Kami:** Mengimplementasikan **Arithmetic Optimization Algorithm (AOA)** yang baru untuk memangkas Makespan, menyeimbangkan beban VM, dan menghemat biaya sewa cloud.

---

<!-- Slide 3 -->
## 2. Mengapa AOA? Sifat Unik Operator Aritmatika

AOA (Abualigah et al., 2021) mengoptimalkan alokasi melalui 2 fase matematis:

1. **Eksplorasi Global (Pembagian $\div$ &amp; Perkalian $\times$):**
   * Menghasilkan sebaran lonjakan nilai tinggi (diibaratkan helikopter pengintai).
   * Melompat bebas antar-datacenter &rarr; **Bebas dari jebakan optimum lokal (*local optima avoidance*)**.

2. **Eksploitasi Presisi Lokal (Pengurangan $-$ &amp; Penambahan $+$):**
   * Menghasilkan dispersi rapat untuk menyisir alokasi di sekitar solusi terbaik.
   * Tugas berat dikunci ke VM bertenaga tinggi, tugas ringan mengisi ruang sisa.

* **Pengendali Dinamis:** **MOA** (saklar fase waktu) &amp; **MOP** (pengecil langkah konvergensi).

---

<!-- Slide 4 -->
## 3. Arsitektur Datacenter &amp; Jaringan Real-World

* **DC_Surabaya (Host 0):** 2 VM Large (6.000 MIPS) + 1 VM Medium (3.600 MIPS)
* **DC_Jakarta (Host 1):** 2 VM Medium (3.600 MIPS) + 1 VM Small (800 MIPS)
* **DC_Yogyakarta (Host 2):** 4 VM Small (masing-masing 800 MIPS)

### Model Latensi Fisik Jaringan Antarkota:
* Surabaya &harr; Surabaya: 1.0 ms
* Surabaya &harr; Yogyakarta: 8.0 ms
* Surabaya &harr; Jakarta: 15.0 ms
* **Dataset Ilmiah Riil:** `dataset_100cloudlet.csv` s.d `dataset_500cloudlet.csv`

---

<!-- Slide 5 -->
## 4. Hasil Ujicoba Empiris: Random vs. AOA yang Baru

*Data rata-rata dari 10 independent runs per skenario (100 total simulasi):*

| Skenario | Algoritma | Makespan (s) | Throughput | Avg Util (%) | LBI (Ketimpangan) | Biaya ($) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **100 Tasks** | Random (Minggu 3)<br>**AOA yang Baru** | 447.96 s<br>**217.49 s** | 0.23 t/s<br>**0.47 t/s** | 41.2%<br>**51.3%** | 2.30<br>**1.79** | $91.01<br>**$63.96** |
| **200 Tasks** | Random (Minggu 3)<br>**AOA yang Baru** | 866.13 s<br>**627.91 s** | 0.23 t/s<br>**0.33 t/s** | 46.4%<br>**52.4%** | 1.96<br>**1.68** | $191.70<br>**$163.73** |
| **300 Tasks** | Random (Minggu 3)<br>**AOA yang Baru** | 1157.17 s<br>**947.90 s** | 0.26 t/s<br>**0.32 t/s** | 48.0%<br>**53.5%** | 1.89<br>**1.61** | $271.05<br>**$251.80** |
| **400 Tasks** | Random (Minggu 3)<br>**AOA yang Baru** | 1389.41 s<br>**1229.38 s** | 0.29 t/s<br>**0.33 t/s** | 50.3%<br>**53.9%** | 1.78<br>**1.61** | $343.24<br>**$328.30** |
| **500 Tasks** | Random (Minggu 3)<br>**AOA yang Baru** | 1951.85 s<br>**1673.86 s** | 0.26 t/s<br>**0.30 t/s** | 49.7%<br>**55.5%** | 1.80<br>**1.57** | $465.28<br>**$445.71** |

---

<!-- Slide 6 -->
## 5. Analisis 4 Keunggulan Utama AOA

1. **Makespan Terpangkas Hingga 51.5%:**
   Waktu pengerjaan tugas 100 cloudlet terpangkas dari 447 detik menjadi 217 detik (2x lebih cepat), dan menghemat hampir 300 detik pada 500 cloudlet.
2. **Throughput Melonjak 104%:**
   Kapasitas pemrosesan naik dari 0.23 menjadi 0.47 tasks/detik tanpa menambah VM.
3. **Beban Seimbang (LBI Turun Konsisten):**
   LBI turun dari 2.30 ke 1.79. Beban terdistribusi proporsional sesuai MIPS CPU.
4. **Efisiensi Finansial:**
   Biaya sewa prosesor cloud terpangkas di seluruh skenario karena durasi eksekusi jauh lebih singkat.

---

<!-- Slide 7 -->
_class: lead
# Sesi Demonstrasi &amp; Tanya Jawab

**Perintah Menjalankan Live Demo:**
```bash
python scheduler_realworld.py
# atau klik ganda run.bat
```

*Kelompok 1 &bull; Strategi Optimasi Komputasi Awan*
