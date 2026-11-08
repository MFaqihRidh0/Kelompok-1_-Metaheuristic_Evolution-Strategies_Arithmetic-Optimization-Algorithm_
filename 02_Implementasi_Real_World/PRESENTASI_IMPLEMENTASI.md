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
    padding: 36px 56px;
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
  table { font-size: 14px; width: 100%; }
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

AOA (Abualigah et al., 2021) mengoptimalkan alokasi cloud melalui 2 fase matematis:

1. **Eksplorasi Global (Pembagian $\div$ &amp; Perkalian $\times$):**
   * Menghasilkan sebaran lonjakan nilai tinggi (diibaratkan helikopter pengintai).
   * Melompat bebas antar-datacenter &rarr; **Bebas dari jebakan optimum lokal (*local optima avoidance*)**.

2. **Eksploitasi Presisi Lokal (Pengurangan $-$ &amp; Penambahan $+$):**
   * Menghasilkan dispersi rapat untuk menyisir alokasi di sekitar solusi terbaik.
   * Tugas berat dikunci ke VM bertenaga tinggi, tugas ringan mengisi ruang sisa.

* **Pengendali Dinamis:** **MOA** (saklar fase waktu) &amp; **MOP** (pengecil langkah konvergensi non-linear $\alpha = 5$).

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
* **Dataset Ilmiah Riil:** `dataset_100cloudlet.csv` s.d `dataset_500cloudlet.csv` (1.400 - 60.780 MI)

---

<!-- Slide 5 -->
## 4. Bagaimana Program Diterapkan &amp; Dijalankan di Real World?

```
┌─────────────────┐       HTTP / REST API        ┌───────────────────────────────────┐
│ Client Workload │ ───────────────────────────> │  Cloud API Gateway / Broker       │
│ (100-500 Tasks) │                              │  (RabbitMQ / Kafka Task Queue)    │
└─────────────────┘                              └─────────────────┬─────────────────┘
                                                                   │ Metadata (MI, MB)
                                                                   ▼
┌─────────────────────────────────┐   Hasil Mapping    ┌───────────────────────────────────┐
│ Dynamic Telemetry Monitor       │ <────────────────> │  AOA Optimizer Engine             │
│ (MIPS CPU, RAM, Latensi 3 Kota) │   (Indeks VM 0..9) │  (MOA, MOP, 4 Operator Matematika)│
└─────────────────────────────────┘                    └─────────────────┬─────────────────┘
                                                                         │ Remote Dispatch
                                                                         ▼
                      ┌──────────────────────────────────────────────────────────────────────┐
                      │ Dispatcher / Container Executor (Docker / Kubernetes / Celery)       │
                      ├──────────────────┬───────────────────────────┬───────────────────────┤
                      │ DC Surabaya      │ DC Jakarta                │ DC Yogyakarta         │
                      │ 2x Large (6k)    │ 2x Medium (3.6k)          │ 4x Small (800)        │
                      │ 1x Medium (3.6k) │ 1x Small (800)            │                       │
                      └──────────────────┴───────────────────────────┴───────────────────────┘
```

---

<!-- Slide 6 -->
## 5. Langkah Operasional Nyata Eksekusi Program di Industri

1. **Ingestion Layer:** Pengguna mengunggah batch pekerjaan ilmiah melalui REST API. Berkas CSV berisi profil tugas (Length MI, Ukuran Input MB, dan CPU PEs).
2. **Telemetry Ingestion:** Broker membaca kapasitas riil dari 10 Worker VM dan latensi jaringan antarkota via monitoring agent (Prometheus/CloudWatch).
3. **Optimasi Runtime AOA:** Solver AOA mengeksekusi 50 iterasi dalam waktu kurang dari **0.5 detik** untuk menghitung vektor alokasi tugas terbaik ke 10 VM.
4. **Remote Dispatch & Eksekusi Fisik:** 
   * Broker mendispatch pekerjaan ke worker node melalui SSH / Docker Engine API.
   * File input ditransfer dengan kompensasi latensi fisik (Sby-Jkt 15ms, Sby-Yog 8ms).
5. **Akuntansi Biaya:** Menghitung durasi pemrosesan riil ($0.03/s), RAM, dan transmisi data.

---

<!-- Slide 7 -->
## 6. Hasil Ujicoba Empiris: Simulator CloudSim &amp; Real-World

### A. Hasil pada Simulator CloudSim 7.0.1 (Tugas 2, 3, 4):
| Tasks | Makespan Random | Makespan AOA | Perbaikan (%) | Throughput AOA | Utilisasi AOA |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **100** | 464.47 ± 82.5 s | **203.88 ± 28.0 s** | **-56.1%** | **0.50 t/s** (+127%) | **49.51%** |
| **200** | 915.34 ± 103.4 s | **626.68 ± 69.8 s** | **-31.5%** | **0.32 t/s** (+45%) | **50.63%** |
| **300** | 1271.93 ± 121.1 s | **908.69 ± 43.7 s** | **-28.6%** | **0.33 t/s** (+38%) | **54.23%** |
| **400** | 1436.33 ± 135.9 s | **1237.98 ± 47.0 s** | **-13.8%** | **0.32 t/s** (+14%) | **54.32%** |
| **500** | 2000.79 ± 164.0 s | **1645.40 ± 43.3 s** | **-17.8% (Hemat 355s)** | **0.30 t/s** (+20%) | **56.10%** |

### B. Hasil pada Real-World Dispatcher (Tugas 5, 6):
| Tasks | Makespan Random | Makespan AOA | Perbaikan (%) | Throughput AOA | Penghematan Biaya ($) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **100** | 444.29 s | **206.99 s** | **-53.4%** | **0.49 t/s** | **Hemat $34.49 (37.1%)** |
| **300** | 1177.30 s | **931.37 s** | **-20.9%** | **0.32 t/s** | **Hemat $23.66 (8.6%)** |
| **500** | 1917.29 s | **1682.69 s** | **-12.2%** | **0.30 t/s** | **Hemat $22.06 (4.7%)** |

---

<!-- Slide 8 -->
## 7. Analisis 4 Keunggulan Utama AOA

1. **Makespan Terpangkas Hingga 53.4%:**
   Waktu pengerjaan tugas 100 cloudlet terpangkas dari 444.29 detik menjadi 206.99 detik (lebih dari 2x lebih cepat), dan memotong 234.6 detik pada 500 cloudlet.
2. **Throughput Melonjak Lebih Dari 2x Lipat (+113%):**
   Kapasitas pemrosesan naik dari 0.23 menjadi 0.49 tasks/detik tanpa menambah VM baru.
3. **Beban Seimbang (LBI Turun Konsisten):**
   LBI turun dari 2.20 ke 1.96 pada 100 tugas, dan menyentuh 1.58 pada 400 tugas. Beban terdistribusi proporsional sesuai MIPS CPU.
4. **Efisiensi Finansial (Hemat Biaya Sewa Nyata):**
   Biaya sewa prosesor cloud terpangkas di seluruh skenario: hemat $34.49 pada 100 tasks, hemat $30.61 pada 200 tasks, dan hemat hingga ratusan dollar secara kumulatif.

---

<!-- Slide 9 -->
_class: lead
# Sesi Demonstrasi &amp; Tanya Jawab

**Cara Menjalankan Program:**
```bash
# 1. Program Python Real-World:
python program_aoa_vs_random.py

# 2. Program CloudSim Java (Simulator Minggu 3):
mvn exec:java

# Atau klik ganda run.bat
```

*Kelompok 1 &bull; Strategi Optimasi Komputasi Awan*
