# 📘 PENJELASAN KODE PROGRAM SLIDE 4: ALGORITMA ARITHMETIC OPTIMIZATION ALGORITHM (AOA)
**Kelompok 1 • Strategi Optimasi Komputasi Awan**  
*Pos 4 • Serigala Abu-Abu Fenrir • Slide 4: Matematika AOA (MOA, MOP, ÷, ×, -, +)*

---

## 1. Kode Program Utuh (Slide 4)

Berikut adalah potongan kode Python dari fungsi `AOAScheduler.optimize()` yang ditampilkan pada Slide 4:

```python
# 1. Math Optimizer Accelerated (MOA): Penentu transisi Eksplorasi -> Eksploitasi
moa = 0.2 + t * ((0.9 - 0.2) / self.max_iter)

# 2. Math Optimizer Probability (MOP): Koefisien presisi penyesuaian posisi
mop = 1.0 - (math.pow(t, 1.0 / self.alpha) / math.pow(self.max_iter, 1.0 / self.alpha))

for i in range(self.pop_size):
    new_ind = list(population[i])
    for j in range(self.num_tasks):
        r1, r2, r3 = self.rnd.random(), self.rnd.random(), self.rnd.random()
        perturb = (ub - lb) * self.mu_rate * (self.rnd.random() - 0.5) * 2.0

        if r1 > moa:
            # ⚡ FASE EKSPLORASI LUAS: Operator Pembagian (/) dan Perkalian (*)
            val = best_schedule[j] / (mop + 1e-5) * (1.0 + perturb * 0.1) if r2 < 0.5 \
                  else best_schedule[j] * mop * (1.0 + perturb * 0.1)
        else:
            # 🔥 FASE EKSPLOITASI INTENSIF: Operator Pengurangan (-) dan Penambahan (+)
            val = best_schedule[j] - mop * perturb if r3 < 0.5 \
                  else best_schedule[j] + mop * perturb

        # Continuous-to-Discrete Mapping: Bulatkan ke Indeks VM valid [0..9]
        new_ind[j] = max(0, min(9, int(round(val))))

    # Update Best Solution bila Makespan jadwal baru lebih singkat
    res = evaluate_schedule(new_ind, self.cloudlets, self.vms)
    if res.makespan < best_fitness:
        best_fitness = res.makespan
        best_schedule = list(new_ind)
```

---

## 2. Bedah Logika Baris demi Baris

### 🔹 Baris 1–2: Math Optimizer Accelerated (MOA)
```python
moa = 0.2 + t * ((0.9 - 0.2) / self.max_iter)
```
* **Fungsi:** Menghitung nilai fungsi percepatan $MOA$ pada iterasi saat ini ($t$).
* **Cara Kerja:**
  * Nilai $MOA$ bergerak naik secara linier dari batas bawah **$C_1 = 0.2$** hingga batas atas **$C_2 = 0.9$**.
  * **Saat iterasi awal ($t = 0$):** $MOA = 0.2$. Karena kecil, kemungkinan bilangan acak $r_1 > MOA$ mencapai **80%**, sehingga algoritma mengutamakan **Eksplorasi Global**.
  * **Saat iterasi akhir ($t = \text{max\_iter}$):** $MOA = 0.9$. Kemungkinan $r_1 \le MOA$ mencapai **90%**, sehingga algoritma secara otomatis beralih haluan ke **Eksploitasi Intensif**.

---

### 🔹 Baris 4–5: Math Optimizer Probability (MOP)
```python
mop = 1.0 - (math.pow(t, 1.0 / self.alpha) / math.pow(self.max_iter, 1.0 / self.alpha))
```
* **Fungsi:** Menghitung koefisien probabilitas penyesuaian posisi ($MOP$) yang meluruh secara non-linear.
* **Cara Kerja:**
  * Parameter $\alpha = 5$ mengontrol derajat non-linearitas kurva peluruhan.
  * Di iterasi awal, $MOP \approx 1.0$, menyebabkan langkah perpindahan posisi solusi sangat besar.
  * Menjelang akhir iterasi, nilai $MOP$ meluruh mendekati $0.0$, bertindak sebagai peredam presisi agar solusi baru tidak melompati titik optimum global (*fine-tuning*).

---

### 🔹 Baris 7–8: Inisialisasi Individu dalam Populasi
```python
for i in range(self.pop_size):
    new_ind = list(population[i])
```
* **Fungsi:** Mengulang proses optimasi untuk setiap agen/jadwal kandidat ($i$) di dalam populasi (misal $\text{pop\_size} = 25$ agen).
* `new_ind`: Membuat salinan independen dari jadwal ke-$i$ agar perubahan posisi tidak menimpa susunan jadwal lama sebelum diverifikasi nilai kebugarannya (*fitness*).

---

### 🔹 Baris 9–11: Loop Penugasan Tugas & Bilangan Stokastik
```python
    for j in range(self.num_tasks):
        r1, r2, r3 = self.rnd.random(), self.rnd.random(), self.rnd.random()
        perturb = (ub - lb) * self.mu_rate * (self.rnd.random() - 0.5) * 2.0
```
* **Fungsi:** Menentukan penempatan VM untuk setiap tugas $j$ (dari $100$ hingga $500$ *cloudlet*).
* `r1, r2, r3`: Tiga angka acak seragam $\in [0, 1)$ untuk mengambil keputusan probabilistik:
  * $r_1$: Memilih antara fase Eksplorasi atau Eksploitasi.
  * $r_2$: Memilih antara operator Pembagian ($\div$) atau Perkalian ($\times$).
  * $r_3$: Memilih antara operator Pengurangan ($-$) atau Penjumlahan ($+$).
* `perturb`: Nilai gangguan acak (*random perturbation*) dalam rentang batas pencarian $[lb, ub]$ yang dikalikan laju mutasi $\mu$ untuk mencegah kepunahan keragaman solusi.

---

### 🔹 Baris 13–16: ⚡ Fase Eksplorasi Global (Jurus Listrik)
```python
        if r1 > moa:
            val = best_schedule[j] / (mop + 1e-5) * (1.0 + perturb * 0.1) if r2 < 0.5 \
                  else best_schedule[j] * mop * (1.0 + perturb * 0.1)
```
* **Kondisi:** Terpicu ketika $r_1 > MOA$ (dominan di iterasi awal).
* **Karakteristik Matematis:**
  * Operator **Pembagian ($\div$)** dan **Perkalian ($\times$)** memiliki sifat **ekspansif**, yaitu menghasilkan lonjakan nilai posisi yang sangat besar.
  * Nilai $1\text{e-}5$ ditambahkan pada penyebut untuk mencegah *error divide-by-zero*.
* **Tujuan di Komputasi Awan:** Menyebarkan alokasi tugas ke berbagai kemungkinan kombinasi antrean server yang belum pernah dicoba, sehingga algoritma **tidak terjebak pada solusi lokal semu (*local optima trap*)**.

---

### 🔹 Baris 17–20: 🔥 Fase Eksploitasi Presisi (Jurus Api)
```python
        else:
            val = best_schedule[j] - mop * perturb if r3 < 0.5 \
                  else best_schedule[j] + mop * perturb
```
* **Kondisi:** Terpicu ketika $r_1 \le MOA$ (dominan di iterasi pertengahan hingga akhir).
* **Karakteristik Matematis:**
  * Operator **Pengurangan ($-$)** dan **Penjumlahan ($+$)** memiliki sifat **konvergen/inkremental**, yaitu menghasilkan pergeseran nilai posisi yang sangat rapat dan bertahap di sekitar posisi rekor terbaik (`best_schedule`).
* **Tujuan di Komputasi Awan:** Memperhalus susunan antrean, mengarahkan tugas-tugas berukuran komputasi raksasa ($40.000$–$60.000\text{ MI}$) secara presisi ke VM berkapasitas terbesar di Surabaya ($6.000\text{ MIPS}$) guna memangkas *Makespan*.

---

### 🔹 Baris 22–23: Continuous-to-Discrete Mapping
```python
        # Continuous-to-Discrete Mapping: Bulatkan ke Indeks VM valid [0..9]
        new_ind[j] = max(0, min(9, int(round(val))))
```
* **Latar Belakang:** Persamaan matematika AOA berasal dari domain optimasi kontinu, sehingga hasil $val$ berupa bilangan desimal pecahan (misal: $1.74$, $8.32$, atau $-0.45$).
* **Fungsi:** 
  1. `round(val)` membulatkan ke bilangan bulat terdekat (misal: $1.74 \rightarrow 2$).
  2. `max(0, min(9, ...))` melakukan *clamping* (penjepitan batas) agar hasil indeks selalu berada dalam rentang valid ID 10 VM, yaitu indeks **`0` sampai `9`**.

---

### 🔹 Baris 25–29: Seleksi Elitisme (Update Best Solution)
```python
    # Update Best Solution bila Makespan jadwal baru lebih singkat
    res = evaluate_schedule(new_ind, self.cloudlets, self.vms)
    if res.makespan < best_fitness:
        best_fitness = res.makespan
        best_schedule = list(new_ind)
```
* **Fungsi:** Mengevaluasi kinerja jadwal baru menggunakan fungsi evaluator riil (yang memperhitungkan MIPS CPU, ukuran berkas I/O, bandwidth VM, dan latensi fisik antarkota).
* **Logika:** Jika nilai `res.makespan` dari jadwal baru **lebih rendah (lebih cepat)** dibanding rekor Makespan terbaik sebelumnya (`best_fitness`), maka jadwal baru tersebut resmi dikukuhkan sebagai **Solusi Terbaik Global Baru** (`best_schedule`).

---

## 3. Tabel Ringkasan Komponen Algoritma

| Komponen | Simbol / Kode | Rentang Nilai | Peran Matematis di Cloud Scheduling |
| :--- | :---: | :---: | :--- |
| **Math Optimizer Accelerated** | `moa` | $0.2 \rightarrow 0.9$ | Mengatur sakelar transisi otomatis dari Eksplorasi ke Eksploitasi. |
| **Math Optimizer Probability** | `mop` | $1.0 \rightarrow \approx 0.0$ | Mengatur kehalusan dan jangkauan langkah perpindahan posisi. |
| **Operator Pembagian & Perkalian** | $\div, \times$ | Skala Besar | **Eksplorasi Global:** Lonjakan acak untuk menjelajahi kombinasi baru. |
| **Operator Pengurangan & Penjumlahan** | $-, +$ | Skala Presisi | **Eksploitasi Intensif:** Pemfokusan tugas ke VM Surabaya 6.000 MIPS. |
| **Mapping Diskrit** | `round & clamp` | $[0, 9]$ | Mengubah nilai kontinu desimal menjadi indeks fisik 10 VM valid. |
| **Elitisme** | `best_schedule` | List of VM ID | Menjaga agar solusi terbaik yang telah ditemukan tidak pernah hilang. |

---

## 4. Panduan Menjawab Pertanyaan Dosen Penguji

> **T: Mengapa AOA menggunakan operator Pembagian dan Perkalian untuk Eksplorasi?**  
> **J:** Karena pembagian ($\div$) dan perkalian ($\times$) menghasilkan faktor perubahan yang sangat besar dan tersebar tinggi (*high dispersion*). Dalam konteks penjadwalan cloud, lonjakan ini memungkinkan tugas-tugas berpindah acak ke berbagai VM alternatif sehingga algoritma terhindar dari jebakan lokal optimum (*local optima*).

> **T: Mengapa operator Pengurangan dan Penambahan digunakan untuk Eksploitasi?**  
> **J:** Karena pengurangan ($-$) dan penambahan ($+$) menghasilkan perubahan posisi yang halus dan bertahap (*low dispersion*). Ini sangat efektif untuk menyempurnakan jadwal terbaik yang sudah ada di sekitar area optimal, seperti memindahkan tugas berat dari VM kecil ke VM besar.

> **T: Bagaimana algoritma tahu kapan harus beralih dari fase Eksplorasi ke Eksploitasi?**  
> **J:** Melalui fungsi matematis $MOA$. Di iterasi awal, nilai $MOA = 0.2$ sehingga peluang $r_1 > MOA$ (Eksplorasi) dominan sebesar 80%. Seiring bertambahnya iterasi, nilai $MOA$ naik linier hingga $0.9$, sehingga peluang $r_1 \le MOA$ (Eksploitasi) mendominasi sebesar 90%.
