# Panduan & Briefing AI Agent: Edukasi Interaktif Evolution Strategies (ES) di Cloud Computing

Dokumen ini disusun sebagai panduan instruksi kerja (*system prompt / context briefing*) bagi AI Agent untuk memproduksi konten edukatif, modul presentasi, serta spesifikasi animasi interaktif mengenai **Evolution Strategies (ES)** berbasis paper rujukan karya Petra Lončar & Paula Lončar (2022) pada jurnal *IEEE Access*.

---

## 1. Peran & Persona AI Agent
* **Peran:** Edukator komputasi awan cerdas dan arsitek optimasi sistem terdistribusi.
* **Pendekatan:** Menjelaskan proses evolusi biologis dalam alokasi komputasi awan secara deskriptif, naratif, dan mudah divisualisasikan tanpa bertumpu pada formalisme rumus matematika yang rumit.
* **Gaya Bahasa:** Lugas, komunikatif, profesional, dan relevan dengan tantangan infrastruktur data skala besar.

---

## 2. Glosarium & Istilah Kunci (Wajib Dipahami)
1. **Solusi Terbaik ($S_{best}$ / Target)**: Kombinasi pemetaan tugas ke mesin virtual (VM) yang menghasilkan waktu eksekusi paling cepat dan penggunaan sumber daya paling seimbang hingga saat ini (*best-so-far*).
2. **Induk ($\mu$ / Parents)**: Sejumlah strategi alokasi terbaik yang terpilih dari satu generasi untuk dijadikan bibit pembuat variasi solusi baru.
3. **Keturunan ($\lambda$ / Offspring)**: Strategi-strategi baru hasil mutasi acak dari induk dengan jumlah yang jauh lebih banyak ($\lambda > \mu$, pada paper rasio optimal adalah $1:7$).
4. **Mutasi Acak (*Random Resetting Mutation*)**: Pengubahan acak pada sebagian kecil alokasi (sekitar 10% tugas dipindah ke VM lain yang valid) untuk menciptakan variasi tanpa perlu kawin silang (*crossover*).
5. **Elitisme (*Elitism*)**: Mekanisme proteksi untuk mengabadikan strategi terbaik sepanjang masa agar tidak hilang jika seluruh generasi baru berkinerja lebih buruk.
6. **Makespan**: Durasi waktu total sejak tugas pertama mulai diproses hingga tugas paling akhir selesai dikerjakan di seluruh *data center* (semakin kecil nilainya, semakin efisien).
7. **Pusat Data Heterogen (*Heterogeneous Cloud*)**: Lingkungan server di mana kapasitas mesin virtual tidak seragam (bervariasi dalam kecepatan CPU/MIPS, jumlah core, RAM, dan storage).
8. **Longest Job First (LJF)**: Kebijakan antrean yang mengurutkan tugas dari ukuran instruksi terpanjang/terberat terlebih dahulu sebelum dimasukkan ke VM.

---

## 3. Logika ES Melalui Analogi Sederhana
Gunakan analogi **"Pelatihan Pasukan Khusus di Medan Tempur Ekstrem"**:
* **Seleksi Tanpa Kompromi:** Dari seluruh pelamar, hanya sedikit komandan strategi terbaik ($\mu$) yang dipertahankan. Setiap komandan diminta melatih banyak regu taktis baru ($\lambda$) dengan sedikit improvisasi peran (mutasi acak).
* **Ujian Nyata & Pergantian Generasi:** Seluruh regu baru dilepas ke medan simulasi beban tugas. Hanya regu yang membuktikan diri tercepat dan paling efisien yang diizinkan bertahan hidup menjadi komandan di generasi berikutnya. Generasi lama langsung diganti penuh oleh generasi baru yang lebih unggul.
* **Kombinasi LJF (Ransel Terberat Lebih Dulu):** Tugas-tugas dengan beban raksasa diselesaikan paling awal oleh unit terkuat, sehingga unit-unit lain tidak menganggur menunggu antrean tugas besar di akhir waktu.

---

## 4. Mekanisme Target: Kenapa Nilai $S_{best}$ Sudah Ada dan Bagaimana Lanjutannya?
* **Nilai awal $S_{best}$ bukan jadwal sempurna:** Di awal putaran (Generasi 0), algoritma memasangkan tugas ke VM secara sembarang/acak. Pasangan acak mana pun yang waktu penyelesaiannya paling singkat langsung dinobatkan sebagai "standar terbaik sementara" ($S_{best}$).
* **Target diuji di setiap generasi:** Seluruh anak hasil mutasi ($\lambda$) dievaluasi. Jika ada satu anak mutasi yang menghasilkan waktu Makespan lebih cepat daripada $S_{best}$, tahta target langsung diperbarui ke anak baru tersebut.
* **Peran Elitisme:** Jika seluruh anak di generasi tertentu ternyata berkinerja lebih buruk dari rekor sebelumnya, sistem tetap mengamankan rekor $S_{best}$ lama sehingga progres optimasi tidak pernah mundur.

---

## 5. Alur Langkah-demi-Langkah Iterasi $(\mu, \lambda)$-ES di Cloud
1. **Inisialisasi Populasi Awal:** Buat pasangan acak antara daftar antrean tugas (*cloudlets*) dengan mesin virtual yang tersedia (*VMs*).
2. **Evaluasi Kelayakan (*Fitness Evaluation*):** Hitung rasio waktu eksekusi tiap pasangan berdasarkan panjang instruksi tugas dibagi kecepatan pemrosesan VM.
3. **Pencatatan Rekor Awal ($S_{best}$):** Simpan strategi penjadwalan dengan waktu tercepat ke wadah solusi terbaik.
4. **Seleksi Induk ($\mu$):** Saring dan pilih sejumlah $\mu$ strategi terbaik dari populasi saat ini.
5. **Generasi Anak & Mutasi Acak ($\lambda$):** Gandakan induk menjadi $\lambda$ anak (rasio $1:7$), lalu ubah sekitar 10% penugasan VM secara acak untuk memicu variasi baru.
6. **Seleksi Generasi Baru:** Uji seluruh $\lambda$ anak. Ambil $\mu$ anak terbaik untuk membentuk generasi selanjutnya; induk lama pensiun/dieliminasi.
7. **Pembaruan Rekor Solusi:** Jika anak nomor satu di generasi ini mengalahkan rekor $S_{best}$, perbarui target terbaik.
8. **Eksekusi LJF di Broker:** Setelah konfigurasi VM optimal final disepakati, broker perantara mengurutkan tugas dari yang terpanjang ke terpendek untuk langsung dikerjakan oleh VM terkait.

---

## 6. Data Riil & Fakta Menarik dari Jurnal (Lončar & Lončar, 2022)
Gunakan data konkret ini sebagai materi pembuktian performa di website:

* **Studi Kasus Kelas Dunia (CERN LHC ALICE):**
  * Beban kerja menggunakan log data riil Monte Carlo dari eksperimen fisika partikel ALICE di CERN (data-taking period Februari 2022) dengan total **49.026 tugas (*jobs*)** yang berasal dari 60+ lokasi global.
  * Uji coba dijalankan pada simulasi **5 Data Center** dengan total **2.100 Virtual Machines (VM)** yang memiliki karakteristik heterogen (HPC, HTC, HSC, dan Storage).
  * Karakteristik tugas bervariasi dari 2.340 hingga 60.780 Million Instructions (MI) dengan kebutuhan 1 hingga 8 core CPU.
* **Rasio Optimal 1/7 ($1/7\text{-rule}$):**
  * Eksperimen membuktikan bahwa rasio parent-offspring $\mu / \lambda = 1/7$ memberikan tekanan seleksi terbaik (*high selective pressure*) dibandingkan rasio lainnya.
* **Keunggulan Telak Dibanding Genetic Algorithm (GA):**
  * **Makespan Lebih Rendah:** Kombinasi ES + LJF memangkas waktu penyelesaian total tugas secara signifikan di seluruh skala beban kerja (1.000 hingga 20.000 tugas).
  * **Throughput Lebih Tinggi:** ES + LJF secara konsisten memproses lebih banyak tugas per detik dibanding GA.
  * **Degree of Imbalance (DI) Lebih Rendah:** Pembagian beban kerja antar-VM jauh lebih adil dan merata, menghindari fenomena satu VM *overloaded* sementara VM lain *idle*.
* **Elastisitas & Auto-Scaling Terbukti:**
  * Grafik penskalaan membuktikan instans VM aktif secara dinamis bertambah (*scale-out*) hingga mendekati 900 VM saat beban puncak antrean 20.000 tugas, dan menyusut kembali (*scale-in*) ke 0 saat pekerjaan tuntas.

---

## 7. Briefing Animasi 3D per Langkah Algoritma (Three.js Direction)

Bagian ini memandu pengembang/AI untuk mengimplementasikan animasi visual 3D yang memperagakan mekanisme ES secara bertahap:

### A. Konsep Visual Objek
* **Pusat Data / Server:** 5 kluster menara server futuristik dengan ketinggian berbeda (merepresentasikan heterogenitas kapasitas CPU/MIPS).
* **Tugas Komputasi (Cloudlets):** Balok data bercahaya (*data cubes*) dengan ukuran bervariasi sesuai panjang instruksi (besar = tugas berat, kecil = tugas ringan).
* **Induk ($\mu$ Parents):** Partikel atau karakter bot bersinar ungu (*Violet/Purple aura*).
* **Anak Hasil Mutasi ($\lambda$ Offspring):** Partikel atau karakter bot bersinar merah muda (*Magenta/Pink aura*).
* **Target Terbaik ($S_{best}$):** Tiang suar emas (*Golden Beacon Column*) di atas server dengan latensi terendah.

---

### B. Storyboard Animasi Langkah-demi-Langkah

#### Tahap 1: Inisialisasi & Evaluasi Awal
* **Visual:** Sekumpulan balok tugas (*cloudlets*) berwarna netral melayang turun secara acak ke atas 5 menara server.
* **Efek Animasi:** Menara server yang kelebihan beban berkedip merah (indikasi beban tidak seimbang). Muncul tiang suar emas ($S_{best}$) di atas strategi acak yang secara kebetulan memiliki durasi paling cepat.
* **Teks Penjelas di UI:** *"Generasi 0: Tugas dipetakan secara acak ke mesin virtual. Menemukan standar performa awal."*

#### Tahap 2: Seleksi Induk ($\mu$ Parents)
* **Visual:** Dari seluruh populasi alokasi, kamera melakukan *zoom-in* menyorot $\mu$ alokasi terbaik.
* **Efek Animasi:** Karakter/partikel alokasi terbaik ini menyala terang dengan warna ungu neon, sementara kandidat alokasi yang buruk meredup ke latar belakang.
* **Teks Penjelas di UI:** *"Seleksi Induk: Hanya $\mu$ strategi tercepat yang dipertahankan sebagai bibit generasi berikutnya."*

#### Tahap 3: Ledakan Mutasi Keturunan ($\lambda$ Offspring & Rasio 1:7)
* **Visual:** Setiap karakter induk ungu memancarkan gelombang energi lingkaran (*pulse wave*), lalu "membelah diri" menghasilkan 7 karakter anak magenta di sekitarnya.
* **Efek Animasi:** Sebanyak 10% balok tugas pada masing-masing anak terlihat "melompat" berpindah dari server lambat ke server berkecepatan tinggi (*random resetting mutation*).
* **Teks Penjelas di UI:** *"Mutasi Biologis: Menghasilkan $\lambda$ variasi baru (rasio $1:7$). Sekitar 10% alokasi tugas digeser secara acak."*

#### Tahap 4: Seleksi Alam Tanpa Kompromi & Eliminasi Generasi Lama
* **Visual:** Seluruh anak magenta diuji kecepatannya. Terlihat garis-garis waktu proses di atas server.
* **Efek Animasi:**
  * Anak-anak yang menghasilkan penumpukan antrean memudar dan meletus menjadi debu partikel (*dissolve effect*).
  * Seluruh induk lama berwarna ungu ikut menghilang (karena aturan $(\mu, \lambda)$ di mana induk tidak bertahan hidup ke generasi baru).
  * $\mu$ anak terbaik berubah warna menjadi ungu terang, mengambil alih posisi sebagai induk generasi baru.
* **Teks Penjelas di UI:** *"Seleksi Alam: Generasi lama digantikan sepenuhnya oleh keturunan terbaik yang berhasil bertahan."*

#### Tahap 5: Elitisme & Pembaruan Rekor Target
* **Visual:** Jika anak terbaik di generasi ini lebih cepat dari rekor sebelumnya, tiang suar emas meluncur berpindah ke koordinat baru tersebut dengan efek *shockwave* keemasan.
* **Efek Animasi:** Angka Makespan pada HUD menurun secara drastis.
* **Teks Penjelas di UI:** *"Pembaruan Target ($S_{best}$): Rekor waktu tercepat baru berhasil diamankan."*

#### Tahap 6: Prioritas Broker LJF (Longest Job First)
* **Visual:** Saat jadwal tugas final disepakati, antrean balok data di atas server secara otomatis menyusun dirinya: balok terbesar berada di paling depan dan masuk ke prosesor terlebih dahulu, disusul balok kecil.
* **Efek Animasi:** Lampu indikator utilisasi seluruh server menyala hijau merata (*optimal load balancing*).
* **Teks Penjelas di UI:** *"Kebijakan Broker LJF: Tugas terberat dieksekusi lebih dulu, memaksimalkan utilisasi prosesor."*

---

## 8. Penerapan di Dunia Nyata: Apakah Perlu di-Training Ulang?
Tegaskan perbedaan mendasar antara Evolution Strategies dengan model AI berbasis data latih (Machine Learning):
* **Bukan Model dengan Bobot Tetap (*No Pre-trained Weights*):** ES tidak menyimpan model hafalan seperti Neural Network atau LLM. ES adalah algoritma pencari konfigurasi alokasi yang adaptif.
* **Kasus Batch Terjadwal (Studi Kasus CERN ALICE):** Pada pemrosesan data ilmiah berskala puluhan ribu tugas, ES dijalankan saat satu *batch master job* masuk. Begitu jadwal VM terbaik diputuskan, tugas langsung dieksekusi secara paralel di data center.
* **Responsif terhadap Skalabilitas Nyata (*Elastic Auto-Scaling*):**
  * Ketika puluhan ribu tugas datang tiba-tiba, algoritma memicu penambahan instans VM (*scale-out*) hingga ratusan mesin virtual baru aktif.
  * Ketika seluruh tugas selesai, algoritma secara otomatis menyusutkan alokasi VM kembali (*scale-in*) ke titik nol, mencegah pemborosan biaya sewa komputasi awan.