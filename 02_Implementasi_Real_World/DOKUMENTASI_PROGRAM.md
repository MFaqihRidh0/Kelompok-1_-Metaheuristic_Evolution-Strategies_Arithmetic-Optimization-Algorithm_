# DOKUMENTASI TEKNIS & PENJELASAN PROGRAM REAL-WORLD
## Optimasi Penjadwalan Tugas Komputasi Awan Heterogen
**Kelompok 1 &bull; Strategi Optimasi Komputasi Awan**

---

## 1. Pendahuluan & Latar Belakang

Dokumen ini merupakan laporan penjelasan teknis program implementasi nyata (*Real-World Cloud Task Scheduler*) yang membandingkan performa tiga pendekatan penjadwalan:
1. **Random Task Scheduling** (Baseline Minggu 3)
2. **Arithmetic Optimization Algorithm (AOA)** berdasarkan formulasi *Laith Abualigah et al. (2021)*
3. **$(\mu, \lambda)$-Evolution Strategies (ES) dengan Longest Job First (LJF)** berdasarkan paper *Petra Lončar & Paula Lončar (IEEE Access 2022)*

Program dirancang secara modular dan mandiri pada berkas [`scheduler_realworld.py`](./scheduler_realworld.py) yang membaca berkas data riil tugas Minggu 3, memodelkan latensi transmisi jaringan nyata, mengeksekusi algoritma optimasi, dan menghitung seluruh metrik komputasi awan.

---

## 2. Spesifikasi Infrastruktur Datacenter (Sesuai Minggu 3)

Infrastruktur dimodelkan secara identik dengan simulasi CloudSim pada tugas Minggu 3, mencakup **3 Pusat Data** dan **10 Mesin Virtual (VM)** dengan karakteristik heterogen:

### Tabel 1. Karakteristik Mesin Virtual & Datacenter
| ID VM | Tipe VM | Datacenter | Lokasi Host | vCPU | MIPS/Core | Total MIPS | RAM (MB) | BW (Mbps) | Biaya Proses ($/s) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | Large | DC_Surabaya | Host 0 | 2 | 3.000 | 6.000 | 8.192 | 2.500 | 0.03 |
| **1** | Large | DC_Surabaya | Host 0 | 2 | 3.000 | 6.000 | 8.192 | 2.500 | 0.03 |
| **2** | Medium | DC_Surabaya | Host 0 | 2 | 1.800 | 3.600 | 4.096 | 1.000 | 0.03 |
| **3** | Medium | DC_Jakarta | Host 1 | 2 | 1.800 | 3.600 | 4.096 | 1.000 | 0.03 |
| **4** | Medium | DC_Jakarta | Host 1 | 2 | 1.800 | 3.600 | 4.096 | 1.000 | 0.03 |
| **5** | Small | DC_Jakarta | Host 1 | 1 | 800 | 800 | 2.048 | 500 | 0.03 |
| **6** | Small | DC_Yogyakarta | Host 2 | 1 | 800 | 800 | 2.048 | 500 | 0.03 |
| **7** | Small | DC_Yogyakarta | Host 2 | 1 | 800 | 800 | 2.048 | 500 | 0.03 |
| **8** | Small | DC_Yogyakarta | Host 2 | 1 | 800 | 800 | 2.048 | 500 | 0.03 |
| **9** | Small | DC_Yogyakarta | Host 2 | 1 | 800 | 800 | 2.048 | 500 | 0.03 |

### Matriks Latensi Jaringan Nyata Antar-Datacenter
Untuk merepresentasikan lingkungan *Real-World Distributed Cloud*, waktu tunda jaringan dihitung berdasarkan jarak geografis riil antar-kota:
* **DC_Surabaya &harr; DC_Surabaya (Intra-DC):** 1.0 ms
* **DC_Surabaya &harr; DC_Yogyakarta:** 8.0 ms
* **DC_Surabaya &harr; DC_Jakarta:** 15.0 ms
* **DC_Jakarta &harr; DC_Yogyakarta:** 10.0 ms

---

## 3. Dataset Tugas Komputasi Awan (Minggu 3)

Dataset disimpan dalam format CSV pada folder [`datasets/`](./datasets/) dengan 5 skenario beban:
1. `dataset_100cloudlet.csv`: 100 tugas (panjang rata-rata 24.835 MI)
2. `dataset_200cloudlet.csv`: 200 tugas (panjang rata-rata 27.180 MI)
3. `dataset_300cloudlet.csv`: 300 tugas (panjang rata-rata 25.076 MI)
4. `dataset_400cloudlet.csv`: 400 tugas (panjang rata-rata 23.767 MI)
5. `dataset_500cloudlet.csv`: 500 tugas (panjang rata-rata 26.212 MI)

Setiap baris tugas memiliki atribut: `CloudletId`, `Length_MI`, `InputSize_MB`, `OutputSize_MB`, dan `PEs`.

---

## 4. Penjelasan Struktur Kode & Arsitektur Program

Program [`scheduler_realworld.py`](./scheduler_realworld.py) tersusun atas 6 bagian utama:

```
┌─────────────────────────────────────────────────────────┐
│               1. MODEL ENTITAS (DATA CLASS)             │
│            VM, Cloudlet, & SimulationResult             │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│              2. DEFINISI TOPOLOGI & JARINGAN            │
│       create_datacenter_vms() & NETWORK_LATENCY         │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│              3. PARSER DATASET CSV MINGGU 3             │
│                load_cloudlets_from_csv()                │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│         4. REAL-WORLD DISPATCHER & EVALUASI METRIK      │
│                   evaluate_schedule()                   │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│              5. IMPLEMENTASI TIGA ALGORITMA             │
│      schedule_random(), AOAScheduler, & ESScheduler     │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│             6. RUNNER BENCHMARK & EXPORT CSV            │
│                     run_benchmarks()                    │
└─────────────────────────────────────────────────────────┘
```

### 4.1. Kelas Entitas & Topologi (Bagian 1 & 2)
* **`VM`:** Menyimpan properti komputasi tiap mesin virtual. Fungsi `execution_time(task_mi)` menghitung durasi eksekusi murni berdasarkan pembagian panjang instruksi tugas ($MI$) dengan total MIPS ($vCPU \times MIPS/core$).
* **`Cloudlet`:** Memodelkan tugas dengan kebutuhan komputasi dan ukuran berkas input/output.
* **`create_datacenter_vms()`:** Membangun instans 10 VM heterogen tepat sesuai pembagian tugas Minggu 3.

### 4.2. Engine Evaluasi Real-World (`evaluate_schedule`)
Fungsi ini memodelkan eksekusi tugas pada sistem terdistribusi nyata:
1. **Transfer Jaringan:** Menghitung waktu kirim berkas masukan dari pengirim ke lokasi datacenter VM yang dituju berdasarkan bandwidth dan latensi rute kota:
   $$T_{transfer} = \frac{InputSize_{MB}}{BW_{MB/s}} + Latency$$
2. **Antrean Pemrosesan:** Tugas dieksekusi secara berurutan pada VM terkait. Waktu selesai (*finish time*) diakumulasikan.
3. **Metrik Komputasi Awan yang Dihitung:**
   * **Makespan ($C_{max}$):** Waktu penyelesaian paling akhir dari seluruh VM:
     $$Makespan = \max_{j \in \{0..9\}} (FinishTime(VM_j))$$
   * **Average Response Time:** Rata-rata durasi sejak tugas diserahkan hingga selesai diproses.
   * **Throughput:** Jumlah tugas yang berhasil diselesaikan per satuan waktu:
     $$Throughput = \frac{\text{Total Cloudlets}}{Makespan} \quad (\text{tasks/detik})$$
   * **Average VM Utilization (%):** Persentase keaktifan rata-rata dari seluruh 10 VM:
     $$Utilisasi = \frac{\sum_{j=0}^{9} BusyTime(VM_j)}{10 \times Makespan} \times 100\%$$
   * **Load Balancing Index (LBI) / Degree of Imbalance (DI):** Mengukur ketidakseimbangan beban kerja:
     $$LBI = \frac{T_{max} - T_{min}}{T_{avg}}$$
     *(Semakin mendekati 0, semakin seimbang beban antar-VM)*.
   * **Total Cost ($):** Menghitung biaya eksekusi komputasi, alokasi memori, dan transmisi data.

---

## 5. Penjelasan Kode Algoritma yang Dipilih

### 5.1. Algoritma 1: Arithmetic Optimization Algorithm (AOA)
Kelas `AOAScheduler` menerapkan logika optimasi aritmatika ciptaan Abualigah et al. (2021):
* **Fungsi Saklar Waktu (MOA):**
  $$MOA(t) = Min + t \times \left(\frac{Max - Min}{Max\_iter}\right) \quad [Min = 0.2, Max = 0.9]$$
  Di awal putaran, $MOA$ bernilai kecil ($0.2$) sehingga peluang eksplorasi ($r_1 > MOA$) sangat dominan. Menjelang akhir putaran, $MOA$ meningkat hingga $0.9$ sehingga peluang eksploitasi ($r_1 \le MOA$) mengambil alih.
* **Fungsi Pengecil Langkah (MOP):**
  $$MOP(t) = 1 - \left(\frac{t^{1/\alpha}}{Max\_iter^{1/\alpha}}\right) \quad [\alpha = 5]$$
* **Fase Eksplorasi (Pembagian $\div$ & Perkalian $\times$):**
  Jika $r_2 < 0.5$, digunakan pembagian:
  $$X_{i,j}(t+1) = X_{best,j} \div (MOP + \epsilon) \times (1 + Perturb)$$
  Jika $r_2 \ge 0.5$, digunakan perkalian:
  $$X_{i,j}(t+1) = X_{best,j} \times MOP \times (1 + Perturb)$$
* **Fase Eksploitasi (Pengurangan $-$ & Penambahan $+$):**
  Jika $r_3 < 0.5$, koordinat dikurangi:
  $$X_{i,j}(t+1) = X_{best,j} - MOP \times Perturb$$
  Jika $r_3 \ge 0.5$, koordinat ditambah:
  $$X_{i,j}(t+1) = X_{best,j} + MOP \times Perturb$$
* **Penanganan Diskret:** Nilai kontinu dibulatkan ke indeks bilangan bulat $0 \le VM \le 9$.

### 5.2. Algoritma 2: Evolution Strategies (ES) + LJF
Kelas `ESScheduler` menerapkan arsitektur $(\mu, \lambda)$-ES berdasarkan jurnal CERN ALICE oleh Lončar & Lončar (2022):
* **Rasio Induk-Anak $1:7$:** Dengan $\mu = 5$ induk, algoritma melahirkan $\lambda = 35$ anak di setiap generasi. Rasio ini terbukti memberikan tekanan seleksi tertinggi.
* **Random Resetting Mutation (10%):** Sekitar 10% tugas pada masing-masing anak secara acak dipindahkan ke VM lain:
  ```python
  for j in range(self.num_tasks):
      if self.rnd.random() < self.mutation_rate:
          child[j] = self.rnd.randint(lb, ub)
  ```
* **Kebijakan Broker LJF (Longest Job First):**
  Di dalam fungsi `evaluate_schedule(..., apply_ljf=True)`, seluruh tugas yang masuk ke antrean VM diurutkan dari instruksi terbesar ke terkecil:
  ```python
  if apply_ljf:
      for vm_id in vm_tasks:
          vm_tasks[vm_id].sort(key=lambda c: c.length_mi, reverse=True)
  ```
  Tugas raksasa diproses lebih awal pada VM Large Surabaya, sehingga VM Small tidak mengalami kemacetan di akhir waktu.
* **Proteksi Elitisme ($S_{best}$):** Solusi Makespan terbaik sepanjang sejarah selalu diabadikan pada posisi indeks ke-0 populasi induk generasi baru.

---

## 6. Hasil Ujicoba Komparasi Riil (Dataset Minggu 3)

Berikut adalah tabel hasil eksekusi riil langsung dari program [`program_aoa_vs_random.py`](./program_aoa_vs_random.py) (10 kali pengujian independen per skenario):

### Tabel 2. Hasil Komparasi Riil: Random Scheduling vs. AOA yang Baru (`program_aoa_vs_random.py`)
| Skenario | Makespan Random | Makespan AOA | Perbaikan (%) | Throughput Rnd &rarr; AOA | LBI Random &rarr; AOA | Biaya Rnd &rarr; AOA | Penghematan Biaya ($) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **100 Cloudlets** | 444.29 s | **206.99 s** | **-53.4%** | 0.23 &rarr; **0.49 t/s** (+113%) | 2.20 &rarr; **1.96** | $92.97 &rarr; **$58.48** | **Hemat $34.49 (37.1%)** |
| **200 Cloudlets** | 939.25 s | **634.92 s** | **-32.4%** | 0.22 &rarr; **0.32 t/s** (+45%) | 2.09 &rarr; **1.64** | $198.09 &rarr; **$167.48** | **Hemat $30.61 (15.5%)** |
| **300 Cloudlets** | 1177.30 s | **931.37 s** | **-20.9%** | 0.26 &rarr; **0.32 t/s** (+23%) | 1.91 &rarr; **1.59** | $274.11 &rarr; **$250.45** | **Hemat $23.66 (8.6%)** |
| **400 Cloudlets** | 1468.63 s | **1202.80 s** | **-18.1%** | 0.27 &rarr; **0.33 t/s** (+22%) | 1.83 &rarr; **1.58** | $353.54 &rarr; **$326.90** | **Hemat $26.64 (7.5%)** |
| **500 Cloudlets** | 1917.29 s | **1682.69 s** | **-12.2%** | 0.26 &rarr; **0.30 t/s** (+15%) | 1.74 &rarr; **1.59** | $467.26 &rarr; **$445.20** | **Hemat $22.06 (4.7%)** |

> *Seluruh data di atas disimpan secara otomatis ke dalam file [`hasil_program_aoa_vs_random.csv`](./hasil_program_aoa_vs_random.csv).*

---

### Tabel 3. Hasil Komparasi Lengkap 3 Algoritma (`scheduler_realworld.py`)
| Skenario Tasks | Algoritma Penjadwalan | Makespan (s) | Throughput (t/s) | Avg VM Util (%) | LBI (Imbalance) | Total Biaya ($) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **100 Cloudlets** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 447.96 &plusmn; 89.67<br>**217.49 &plusmn; 30.63**<br>**129.37 &plusmn; 11.70** | 0.23<br>**0.47**<br>**0.78** | 41.20%<br>**51.32%**<br>**79.27%** | 2.30 &plusmn; 0.48<br>**1.79 &plusmn; 0.39**<br>**0.65 &plusmn; 0.18** | $238.40<br>**$198.15**<br>**$189.40** |
| **200 Cloudlets** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 866.13 &plusmn; 125.73<br>**627.91 &plusmn; 93.26**<br>**386.57 &plusmn; 30.34** | 0.23<br>**0.33**<br>**0.52** | 46.43%<br>**52.35%**<br>**70.18%** | 1.96 &plusmn; 0.27<br>**1.68 &plusmn; 0.14**<br>**0.95 &plusmn; 0.10** | $467.41<br>**$421.30**<br>**$395.80** |
| **300 Cloudlets** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 1157.17 &plusmn; 138.64<br>**947.90 &plusmn; 55.40**<br>**588.80 &plusmn; 47.75** | 0.26<br>**0.32**<br>**0.51** | 48.00%<br>**53.52%**<br>**68.31%** | 1.89 &plusmn; 0.23<br>**1.61 &plusmn; 0.07**<br>**1.06 &plusmn; 0.09** | $712.99<br>**$645.20**<br>**$598.60** |
| **400 Cloudlets** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 1389.41 &plusmn; 100.69<br>**1229.38 &plusmn; 46.49**<br>**820.56 &plusmn; 32.42** | 0.29<br>**0.33**<br>**0.49** | 50.28%<br>**53.89%**<br>**65.29%** | 1.78 &plusmn; 0.12<br>**1.61 &plusmn; 0.07**<br>**1.15 &plusmn; 0.06** | $925.98<br>**$884.70**<br>**$812.30** |
| **500 Cloudlets** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 1951.85 &plusmn; 159.50<br>**1673.86 &plusmn; 33.19**<br>**1194.99 &plusmn; 47.92** | 0.26<br>**0.30**<br>**0.42** | 49.70%<br>**55.51%**<br>**64.73%** | 1.80 &plusmn; 0.13<br>**1.57 &plusmn; 0.05**<br>**1.22 &plusmn; 0.04** | $1167.28<br>**$1098.50**<br>**$984.60** |

---

## 7. Pembahasan & Analisis Ilmiah

### 7.1. Pemangkasan Makespan
* Pada skenario 100 tugas, **ES + LJF memangkas Makespan hingga 71.1%** (turun dari 447.96 detik menjadi 129.37 detik).
* Pada skenario 500 tugas, Makespan turun dari **1.951.85 detik menjadi 1.194.99 detik** pada ES+LJF, dan **1.673.86 detik** pada AOA.
* Keunggulan telak ES didorong oleh kombinasi pengurutan tugas berinstruksi panjang di awal jadwal (LJF) dan mutasi acak 10% yang membebaskan VM yang macet.

### 7.2. Keseimbangan Beban (LBI / Degree of Imbalance)
* Nilai LBI pada Random Scheduling sangat tinggi ($1.80 - 2.30$), mengindikasikan beban kerja timpang di mana VM Small mengalami *overloaded* ekstrem.
* Algoritma **ES + LJF menekan nilai LBI hingga 0.65 - 1.22**, membuktikan bahwa distribusi beban menjadi jauh lebih merata ke 3 Datacenter (Surabaya, Jakarta, Yogyakarta).

### 7.3. Throughput & Utilisasi
* Throughput sistem meningkat dari **0.23 tasks/detik menjadi 0.78 tasks/detik** pada skenario 100 tugas.
* Rata-rata utilisasi VM naik dari **41.2% menjadi 79.27%**, membuktikan kapasitas pemrosesan prosesor dimanfaatkan secara optimal tanpa ada VM yang menganggur lama.

---

## 8. Panduan Menjalankan Program (Cara Eksekusi)

### Prasyarat
* Python versi 3.8 atau lebih baru (menggunakan modul standar: `math`, `random`, `csv`, `time`, `dataclasses`).
* Java OpenJDK 21 & Maven (jika ingin menjalankan engine CloudSim 7.0.1).

### Pilihan Cara Eksekusi:

1. **Launcher Interaktif 1-Klik:**
   Klik ganda berkas batch [`run.bat`](./run.bat) lalu pilih menu `[1]` untuk Python atau `[2]` untuk CloudSim Java.

2. **Program Python Real-World (AOA vs Random):**
   ```bash
   python program_aoa_vs_random.py
   ```
   *Mengeksekusi langsung dataset `dataset_100cloudlet.csv` s.d `500cloudlet.csv`, menampilkan tabel komparasi, dan menyimpan hasil ke `hasil_program_aoa_vs_random.csv`.*

3. **Program Simulator CloudSim Java (AOASchedulingSim.java):**
   ```cmd
   mvn compile exec:java
   ```

### Berkas Hasil yang Diproduksi
1. `hasil_program_aoa_vs_random.csv`: Hasil eksekusi komparasi langsung Random Scheduling vs AOA.
2. `hasil_real_world_per_run.csv`: Rincian metrik untuk seluruh 150 run eksekusi individual.
3. `hasil_real_world_ringkasan.csv`: Rangkuman nilai rata-rata (*mean*) dan simpangan baku (*std dev*) untuk setiap metrik komputasi awan.
