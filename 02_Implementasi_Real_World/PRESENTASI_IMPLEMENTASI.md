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
    background-color: #f3e8ff;
    color: #7c3aed;
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

# Implementasi Nyata Penjadwalan Cloud Terdistribusi
### Evaluasi Kinerja AOA &amp; Evolution Strategies (ES) Menggunakan Dataset Minggu 3

**Disusun oleh:** Kelompok 1 &bull; Strategi Optimasi Komputasi Awan

---

<!-- Slide 2 -->
## 1. Kilas Balik: Masalah Random Scheduling (Minggu 3)

* **Makespan Membengkak Parah:** Menyentuh **1.951+ detik** pada 500 tugas.
* **Severe Bottleneck:** VM Small (800 MIPS) terbebani **99.9%**, antrean macet.
* **Idle CPU Terbuang:** VM Large (6000 MIPS Surabaya) utilisasinya di bawah 15%.
* **Degree of Imbalance (LBI):** Sangat timpang di angka **1.80 s.d 2.30**.

> **Misi Implementasi Kami:**
> Menerapkan AOA dan ES+LJF untuk memangkas Makespan secara drastis, menyeimbangkan beban antar-VM, dan memotong biaya sewa komputasi awan.

---

<!-- Slide 3 -->
## 2. Arsitektur Datacenter &amp; Jaringan Geografis

* **DC_Surabaya (Host 0):** 2 VM Large (6000 MIPS) + 1 VM Medium (3600 MIPS)
* **DC_Jakarta (Host 1):** 2 VM Medium (3600 MIPS) + 1 VM Small (800 MIPS)
* **DC_Yogyakarta (Host 2):** 4 VM Small (masing-masing 800 MIPS)

### Model Latensi Jaringan Nyata Antar-Kota:
* Surabaya &harr; Surabaya: 1.0 ms
* Surabaya &harr; Yogyakarta: 8.0 ms
* Surabaya &harr; Jakarta: 15.0 ms
* Jakarta &harr; Yogyakarta: 10.0 ms
* **Dataset Tugas Riil:** `dataset_100cloudlet.csv` s.d `dataset_500cloudlet.csv`

---

<!-- Slide 4 -->
## 3. Penjelasan Struktur Kode `scheduler_realworld.py`

```
┌────────────────────────────────────────────────────────┐
│ 1. Model Entitas (VM, Cloudlet, SimulationResult)      │
├────────────────────────────────────────────────────────┤
│ 2. Parser Dataset CSV Minggu 3                         │
├────────────────────────────────────────────────────────┤
│ 3. Real-World Dispatcher & Latensi Jaringan Antar-Kota │
├────────────────────────────────────────────────────────┤
│ 4. Engine AOA (Fase Eksplorasi Bagi/Kali & Eksploitasi)│
├────────────────────────────────────────────────────────┤
│ 5. Engine ES ((μ, λ) Rasio 1:7, Mutasi 10%, LJF Broker)│
├────────────────────────────────────────────────────────┤
│ 6. Evaluator Metrik (Makespan, Throughput, LBI, Cost)  │
└────────────────────────────────────────────────────────┘
```

---

<!-- Slide 5 -->
## 4. Hasil Ujicoba Riil (10 Runs per Skenario)

| Skenario | Algoritma | Makespan (s) | Throughput | Avg Util (%) | LBI (Ketimpangan) | Biaya ($) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **100 Tasks** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 447.96 s<br>**217.49 s**<br>**129.37 s** | 0.23 t/s<br>**0.47 t/s**<br>**0.78 t/s** | 41.2%<br>**51.3%**<br>**79.3%** | 2.30<br>**1.79**<br>**0.65** | $238.40<br>**$198.15**<br>**$189.40** |
| **300 Tasks** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 1157.17 s<br>**947.90 s**<br>**588.80 s** | 0.26 t/s<br>**0.32 t/s**<br>**0.51 t/s** | 48.0%<br>**53.5%**<br>**68.3%** | 1.89<br>**1.61**<br>**1.06** | $712.99<br>**$645.20**<br>**$598.60** |
| **500 Tasks** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 1951.85 s<br>**1673.86 s**<br>**1194.99 s** | 0.26 t/s<br>**0.30 t/s**<br>**0.42 t/s** | 49.7%<br>**55.5%**<br>**64.7%** | 1.80<br>**1.57**<br>**1.22** | $1167.28<br>**$1098.50**<br>**$984.60** |

---

<!-- Slide 6 -->
## 5. Analisis 4 Keunggulan Utama

1. **Makespan Terpangkas Hingga 71.1%:**
   Waktu pengerjaan tugas turun dari 447 detik menjadi 129 detik pada 100 tugas, dan menghemat 750+ detik pada 500 tugas.
2. **Throughput Naik 3.4x Lipat:**
   Penyelesaian tugas meningkat dari 0.23 menjadi 0.78 task/detik.
3. **Beban Seimbang (LBI Turun Drastis):**
   LBI anjlok dari 2.30 ke 0.65. Tugas berat diarahkan ke Surabaya, tugas ringan ke Yogyakarta.
4. **Efisiensi Finansial (Hemat $182+):**
   Pengurangan durasi sewa VM berdampak langsung pada penghematan anggaran sewa cloud.

---

<!-- Slide 7 -->
_class: lead
# Sesi Demonstrasi &amp; Tanya Jawab

**Perintah Menjalankan Live Demo:**
```bash
python scheduler_realworld.py
```

*Kelompok 1 &bull; Strategi Optimasi Komputasi Awan*

