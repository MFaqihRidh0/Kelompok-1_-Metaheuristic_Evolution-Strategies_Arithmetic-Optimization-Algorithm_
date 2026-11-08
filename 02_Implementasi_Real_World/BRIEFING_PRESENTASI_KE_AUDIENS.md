# BRIEFING & PANDUAN PRESENTASI KE AUDIENS
## Cara Menjelaskan Pengimplementasian Algoritma (AOA & ES) di Datacenter Real-World
**Mata Kuliah: Strategi Optimasi Komputasi Awan &bull; Kelompok 1**

---

> **Tujuan Dokumen:**
> Dokumen ini disusun sebagai *speaker notes* (panduan berbicara) dan skenario presentasi bagi Anda saat mendemonstrasikan hasil implementasi tugas komputasi awan (AOA dan Evolution Strategies) di hadapan dosen penguji dan audiens kelas.

---

## DAFTAR ISI SKENARIO PRESENTASI

1. [Babak 1: Pembuka & Konteks Tugas (Durasi: 1 - 2 Menit)](#babak-1-pembuka--konteks-tugas)
2. [Babak 2: Mengingatkan Masalah Baseline Minggu 3 (Durasi: 2 Menit)](#babak-2-mengingatkan-masalah-baseline-minggu-3)
3. [Babak 3: Arsitektur Datacenter & Dataset Real-World (Durasi: 2 - 3 Menit)](#babak-3-arsitektur-datacenter--dataset-real-world)
4. [Babak 4: Cara Kerja Program Implementasi (Code Walkthrough) (Durasi: 3 - 4 Menit)](#babak-4-cara-kerja-program-implementasi)
5. [Babak 5: Live Demo Eksekusi Program (Durasi: 2 Menit)](#babak-5-live-demo-eksekusi-program)
6. [Babak 6: Membedah Hasil Ujicoba (Tabel Komparasi) (Durasi: 3 Menit)](#babak-6-membedah-hasil-ujicoba)
7. [Babak 7: Penutup & Kesimpulan Kunci (Durasi: 1 Menit)](#babak-7-penutup--kesimpulan-kunci)
8. [Antisipasi Pertanyaan Dosen (Q&A Cheat-Sheet)](#antisipasi-pertanyaan-dosen-qa-cheat-sheet)

---

## Babak 1: Pembuka & Konteks Tugas

### 🎙️ Apa yang Harus Anda Ucapkan:
> *"Selamat pagi/siang Bapak/Ibu dosen dan rekan-rekan sekalian. Kami dari Kelompok 1 akan mempresentasikan dan mendemonstrasikan implementasi nyata dari dua algoritma metaheuristik, yaitu **Arithmetic Optimization Algorithm (AOA)** dan **Evolution Strategies (ES)**, untuk menyelesaikan permasalahan penjadwalan tugas komputasi awan heterogen.*
>
> *Pada pertemuan ini, fokus kami bukan lagi sekadar teori rumus, melainkan **bagaimana kedua algoritma tersebut benar-benar kami bangun, kami kodekan, dan kami ujicobakan secara langsung** menggunakan dataset tugas komputasi awan riil dari tugas Minggu 3 pada infrastruktur datacenter heterogen yang telah ditentukan."*

---

## Babak 2: Mengingatkan Masalah Baseline Minggu 3

### 💡 Inti yang Harus Dipahami Audiens:
Sebelum memamerkan hasil bagus, ingatkan audiens seberapa buruk metode acak (*Random Scheduling*) yang kita gunakan di Minggu 3.

### 🎙️ Apa yang Harus Anda Ucapkan:
> *"Bapak/Ibu, mari kita kilas balik ke tugas Minggu 3. Saat itu kita menggunakan penjadwalan acak (Random Scheduling) pada CloudSim. Masalah terbesarnya adalah:*
> 1. *Tugas berukuran raksasa sering terlempar ke VM Small yang hanya punya 800 MIPS. Akibatnya, VM Small mengalami **overloaded hingga 99.9%**, antrean macet, dan Makespan membengkak hingga **2.000 detik** pada 500 tugas.*
> 2. *Di sisi lain, VM Large di Surabaya yang punya kekuatan 6.000 MIPS justru **menganggur (idle)** dengan utilisasi di bawah 15%.*
> 3. *Derajat ketimpangan beban (Load Balancing Index / DI) sangat buruk di angka **1.8 hingga 2.3**.*
>
> *Inilah masalah yang kami selesaikan hari ini menggunakan optimasi metaheuristik cerdas."*

---

## Babak 3: Arsitektur Datacenter & Dataset Real-World

### 💡 Tampilkan Tabel Spesifikasi VM & Peta Kota:
Tunjukkan bahwa implementasi kita 100% mematuhi parameter tugas Minggu 3.

### 🎙️ Apa yang Harus Anda Ucapkan:
> *"Dalam program real-world ini, kami memodelkan 3 Datacenter dengan 10 VM Heterogen persis sesuai spesifikasi tugas:*
> * **DC Surabaya (Host 0):** Memegang 2 VM Large (6.000 MIPS) dan 1 VM Medium (3.600 MIPS). Ini adalah pusat komputasi terkuat.
> * **DC Jakarta (Host 1):** Memegang 2 VM Medium (3.600 MIPS) dan 1 VM Small (800 MIPS).
> * **DC Yogyakarta (Host 2):** Memegang 4 VM Small (masing-masing 800 MIPS) untuk komputasi ringan.
>
> *Tidak hanya MIPS prosesor, program kami juga memodelkan **Real-World Network Transfer Delay**:*
> * Pengiriman tugas antar-datacenter dihitung berdasarkan ukuran berkas masukan (*Input Size MB*) dibagi Bandwidth, ditambah latensi geografis nyata antar-kota (Surabaya-Jakarta 15 ms, Surabaya-Yogya 8 ms).
> * Dataset yang kami gunakan adalah berkas riil `dataset_100cloudlet.csv` hingga `dataset_500cloudlet.csv` yang berisi ribuan instruksi ilmiah dari 1.400 hingga 60.000+ Million Instructions (MI)."*

---

## Babak 4: Cara Kerja Program Implementasi

### 💡 Buka File `scheduler_realworld.py` atau Slide Arsitektur:
Jelaskan modul program secara singkat dan jelas tanpa berbelit-belit.

### 🎙️ Apa yang Harus Anda Ucapkan:
> *"Program kami, `scheduler_realworld.py`, dibangun secara modular dengan 4 komponen utama:*
>
> 1. **Parser & Data Model:** Membaca file CSV dataset dan menginisialisasi 10 VM heterogen beserta biaya sewa ($0.03/detik pemrosesan, RAM, dan Bandwidth).
> 2. **Real-World Evaluator (`evaluate_schedule`):** Menghitung clock waktu transfer, waktu eksekusi VM, Makespan, Throughput, utilisasi rata-rata, dan Degree of Imbalance (LBI).
> 3. **Engine Algoritma 1 - AOA:** 
>    * Menggunakan saklar waktu **MOA** dan pengecil langkah **MOP**. 
>    * Pada putaran awal, AOA melakukan lompatan besar melintasi datacenter dengan operator **Pembagian dan Perkalian** agar tidak terjebak di solusi lokal.
>    * Menjelang putaran akhir, AOA menyisir dengan operator **Pengurangan dan Penambahan** untuk memoles alokasi di VM terbaik.
> 4. **Engine Algoritma 2 - Evolution Strategies (ES) + LJF:**
>    * Menggunakan aturan biologis $(\mu, \lambda)$-ES dengan rasio **1:7** sesuai paper Lončar & Lončar (IEEE Access 2022).
>    * Menerapkan **Random Resetting Mutation 10%** untuk memindahkan tugas macet ke VM idle tanpa perlu kawin silang (crossover).
>    * Mengintegrasikan kebijakan broker **Longest Job First (LJF)**: tugas terberat (60.000 MI) otomatis ditaruh di awal antrean VM Surabaya, sementara tugas kecil dialirkan ke Yogya.
>    * Dilengkapi **Proteksi Elitisme ($S_{best}$)** agar jadwal tercepat tidak pernah hilang."*

---

## Babak 5: Live Demo Eksekusi Program

### 🖥️ Aksi Presenter di Layar:
Buka terminal di folder `02_Implementasi_Real_World` lalu jalankan:
```bash
python scheduler_realworld.py
```
*(Atau klik file `run.bat`)*

### 🎙️ Apa yang Harus Anda Ucapkan Saat Script Berjalan:
> *"Sekarang mari kita buktikan secara langsung. Saya menjalankan script `scheduler_realworld.py`.*
> 
> *(Sambil menunjuk terminal yang bergerak)*:
> * Program sedang mengeksekusi 5 skenario (100, 200, 300, 400, dan 500 tugas).
> * Untuk memastikan keabsahan statistik (*statistical significance*), setiap skenario diulang sebanyak **10 kali pengujian independen (10 runs)** dengan seed acak berbeda.
> * Total ada 150 kali simulasi penuh yang selesai hanya dalam hitungan detik.
> * Program langsung menghasilkan dua file keluaran: `hasil_real_world_per_run.csv` dan `hasil_real_world_ringkasan.csv` yang merangkum mean dan standar deviasi seluruh metrik."*

---

## Babak 6: Membedah Hasil Ujicoba (Tabel Komparasi)

### 💡 Tampilkan Tabel Ringkasan Hasil Ujicoba:

| Skenario | Algoritma | Makespan (detik) | Throughput (tasks/s) | Avg VM Util (%) | LBI (Imbalance) | Total Biaya ($) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **100 Tasks** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 447.96 s<br>**217.49 s**<br>**129.37 s** | 0.23<br>**0.47**<br>**0.78** | 41.2%<br>**51.3%**<br>**79.3%** | 2.30<br>**1.79**<br>**0.65** | $238.40<br>**$198.15**<br>**$189.40** |
| **300 Tasks** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 1157.17 s<br>**947.90 s**<br>**588.80 s** | 0.26<br>**0.32**<br>**0.51** | 48.0%<br>**53.5%**<br>**68.3%** | 1.89<br>**1.61**<br>**1.06** | $712.99<br>**$645.20**<br>**$598.60** |
| **500 Tasks** | Random (Minggu 3)<br>**AOA**<br>**ES + LJF** | 1951.85 s<br>**1673.86 s**<br>**1194.99 s** | 0.26<br>**0.30**<br>**0.42** | 49.7%<br>**55.5%**<br>**64.7%** | 1.80<br>**1.57**<br>**1.22** | $1167.28<br>**$1098.50**<br>**$984.60** |

### 🎙️ Poin Kunci yang Wajib Anda Tegaskan ke Dosen:
> *"Bapak/Ibu dosen, mari kita perhatikan angka empiris hasil eksekusi riil ini:*
>
> 1. **Makespan Terpangkas Luar Biasa:**
>    * Pada 100 tugas: Random butuh 447 detik. AOA memangkasnya menjadi 217 detik. Dan **ES + LJF memangkasnya hingga 129 detik (lebih cepat ~71%)**.
>    * Pada 500 tugas: Dari hampir 2.000 detik pada Random, ES+LJF memangkas waktu proses hingga tersisa 1.194 detik!
> 2. **Throughput Melonjak Drastis:**
>    * Kecepatan penyelesaian tugas naik dari 0.23 task/detik menjadi **0.78 task/detik (naik 3.4 kali lipat)**.
> 3. **Beban Sangat Seimbang (LBI Turun Signifikan):**
>    * Tingkat ketimpangan (LBI) yang tadinya 2.30 pada Random, berhasil ditekan oleh ES+LJF menjadi **0.65**. Artinya seluruh VM bekerja proporsional tanpa ada yang menganggur atau kelebihan beban.
> 4. **Efisiensi Finansial (Biaya Turun):**
>    * Karena waktu sewa prosesor VM jauh lebih singkat, total biaya komputasi pada 500 tugas hemat hingga hampir **$200 per batch eksekusi**."*

---

## Babak 7: Penutup & Kesimpulan Kunci

### 🎙️ Apa yang Harus Anda Ucapkan:
> *"Sebagai kesimpulan:*
> 1. *Kedua algoritma metaheuristik yang kami pilih (**AOA dan ES**) terbukti secara nyata melampaui performa baseline Random Scheduling Minggu 3 di seluruh metrik pengujian.*
> 2. ***AOA** unggul dalam konvergensi cepat dan kemampuan melompat keluar dari optimum lokal berkat sifat perkalian dan pembagian.*
> 3. ***Evolution Strategies (ES) yang dikombinasikan dengan kebijakan LJF** menjadi pemenang utama (overall champion) dengan efisiensi pemangkasan Makespan terbaik dan distribusi beban paling seimbang.*
> 4. *Seluruh implementasi kode, dataset, dan hasil per-run telah kami dokumentasikan secara lengkap dan terstruktur.*
>
> *Sekian presentasi dari Kelompok 1. Kami membuka sesi tanya jawab jika ada masukan atau pertanyaan dari Bapak/Ibu dosen dan rekan-rekan sekalian. Terima kasih."*

---

## Antisipasi Pertanyaan Dosen (Q&A Cheat-Sheet)

Berikut adalah daftar pertanyaan yang paling sering ditanyakan dosen penguji beserta jawaban cerdas yang tepat:

### Q1: Mengapa kalian memilih AOA dan Evolution Strategies (ES)?
> **Jawaban:** 
> *"AOA mewakili algoritma metaheuristik modern berbasis hukum aritmatika (Abualigah, 2021) yang unik karena tidak memerlukan penyesuaian parameter rumit, sedangkan ES mewakili algoritma berbasis evolusi murni (Lončar & Lončar, IEEE Access 2022) yang terbukti unggul pada data komputasi awan CERN ALICE. Membandingkan keduanya memberikan perspektif komprehensif antara pendekatan matematika vs pendekatan seleksi alam."*

### Q2: Mengapa hasil ES + LJF bisa lebih cepat daripada AOA?
> **Jawaban:** 
> *"Karena pada ES, kami mengintegrasikan kebijakan **Longest Job First (LJF)** pada level broker. Dalam penjadwalan komputasi awan heterogen, jika tugas terberat (panjang instruksi besar) diselesaikan paling awal oleh prosesor tercepat (VM Large Surabaya), maka waktu tunggu (*idle delay*) di akhir eksekusi terminimalisasi. AOA mengoptimalkan pemetaan, namun ES+LJF mengoptimalkan pemetaan sekaligus urutan antrean eksekusi."*

### Q3: Bagaimana kalian memastikan program ini merefleksikan 'Real-World'?
> **Jawaban:** 
> *"Pertama, dataset yang digunakan bukan angka rekaan acak, melainkan dataset tugas komputasi awan riil dari tugas Minggu 3. Kedua, kami memodelkan **latensi geografis jaringan nyata** antar-kota (Surabaya, Jakarta, Yogyakarta) dan bandwidth transfer berkas input/output. Ketiga, biaya sewa dihitung dengan tarif per-detik ($0.03/s) dan alokasi memori/storage sesuai standar komputasi awan komersial."*

### Q4: Apakah algoritma ini memerlukan training dataset (seperti AI Machine Learning)?
> **Jawaban:** 
> *"Tidak, Bapak/Ibu. AOA dan ES adalah **Numerical Solvers / Metaheuristic Search**, bukan model Machine Learning dengan bobot tetap. Keduanya tidak perlu ditraining di awal. Keduanya dijalankan secara adaptif setiap kali ada batch tugas baru yang masuk ke cloud dispatcher."*

