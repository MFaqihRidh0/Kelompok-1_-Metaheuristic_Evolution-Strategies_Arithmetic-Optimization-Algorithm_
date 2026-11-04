import React from 'react';
import katex from 'katex';
import {
  Compass,
  Radio,
  GitMerge,
  HelpCircle,
  Cpu,
  PlaneTakeoff,
  Crosshair,
  ArrowRightCircle,
  Binary,
  Shuffle,
  CheckSquare,
  Sliders,
  ToggleRight,
  Move,
  Repeat,
} from 'lucide-react';

export const EducationalCards: React.FC = () => {
  const renderFormula = (latex: string, displayMode = false) => {
    try {
      return {
        __html: katex.renderToString(latex, {
          displayMode,
          throwOnError: false,
        }),
      };
    } catch {
      return { __html: latex };
    }
  };

  return (
    <section className="space-y-6 pt-4">
      {/* Section Header */}
      <div className="border-b border-sand-300 pb-3 flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <span className="text-xs font-mono text-amber-800 uppercase tracking-wider font-semibold">
            Kurikulum Sains Komputasi
          </span>
          <h3 className="text-2xl font-bold text-coffee-950 tracking-tight flex items-center gap-2">
            Memahami Logika & Filosofi Arithmetic Optimization Algorithm (AOA)
          </h3>
        </div>
        <span className="text-xs font-mono text-coffee-600">
          Berdasarkan paper rujukan Laith Abualigah et al. (2021)
        </span>
      </div>

      {/* Grid: Analogi Harta Karun & Mekanisme Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Analogi Sederhana */}
        <div className="warm-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-coffee-950">
                Analogi: Tim Pencari Harta Karun di Kepulauan Misterius
              </h4>
              <span className="text-xs font-mono text-amber-800">
                Bagaimana 4 operator matematika bekerja secara intuitif
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-coffee-800 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-cream-50 border border-sand-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sky-800 text-sm">
                <PlaneTakeoff className="w-4 h-4 text-sky-700" />
                <span>Perkalian (&times;) & Pembagian (&divide;) &mdash; Helikopter & Parasut</span>
              </div>
              <p className="text-xs text-coffee-700">
                Hasil perhitungan perkalian dan pembagian menghasilkan lonjakan angka yang sangat
                besar dan tersebar luas. Ini mengantarkan regu drone melompat jauh melintasi
                gugusan kepulauan server baru agar tidak terjebak di bukit kecil yang salah (
                <em>local optima trap</em>).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-cream-50 border border-sand-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                <Crosshair className="w-4 h-4 text-emerald-700" />
                <span>Penjumlahan (+) & Pengurangan (-) &mdash; Cangkul & Detektor Logam</span>
              </div>
              <p className="text-xs text-coffee-700">
                Hasil perhitungan penjumlahan dan pengurangan menghasilkan sebaran yang sangat
                rapat dan presisi tinggi. Begitu lokasi sinyal server terbaik terdeteksi, agen turun
                menyisir tanah jengkal demi jengkal dengan laser pemindai untuk memoles koordinat
                optimum.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Mekanisme Target */}
        <div className="warm-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-coffee-950">
                Mekanisme Target: Mengapa "Best" Sudah Ada Sejak Awal?
              </h4>
              <span className="text-xs font-mono text-amber-800">
                Konsep suar dinamis yang terus berpindah
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-coffee-800 leading-relaxed">
            <p>
              Banyak pemula bertanya:{' '}
              <em>
                "Jika solusi terbaik (<span className="font-mono text-amber-800 font-semibold">best solution</span>
                ) sudah diketahui sejak iterasi 0, mengapa kita masih perlu mencari?"
              </em>
            </p>

            <ul className="space-y-2 text-xs text-coffee-700">
              <li className="flex items-start gap-2 p-2 rounded-lg bg-sand-50 border border-sand-200">
                <ArrowRightCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-coffee-950">Nilai awal hanyalah tebakan acak terbaik:</strong>{' '}
                  Pada putaran pertama, agen menyebar acak. Siapa pun yang secara kebetulan
                  memiliki latensi paling rendah saat itu langsung ditunjuk sementara sebagai "tiang
                  suar".
                </div>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-lg bg-sand-50 border border-sand-200">
                <ArrowRightCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-coffee-950">Target berpindah seketika:</strong> Setiap kali ada
                  agen lain yang menemukan koordinat server dengan latensi lebih baik di putaran
                  berikutnya, suar emas langsung berpindah ke titik baru tersebut.
                </div>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-lg bg-sand-50 border border-sand-200">
                <ArrowRightCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-coffee-950">Konvergensi ke Global Optimum:</strong> Melalui
                  ratusan putaran, suar target terus bermigrasi mendekati lokasi minimum global sejati
                  di seluruh lanskap datacenter.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SPECIAL DEEP DIVE: MENGAPA REKOR BISA PECAH DI TITIK SUAR YANG SAMA */}
      <div className="warm-panel p-6 md:p-7 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/60 via-white to-cream-100 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-200 text-amber-950 font-bold border border-amber-300 shadow-sm">
              <HelpCircle className="w-6 h-6 text-amber-900" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                Pertanyaan Kritis Optimasi Awan
              </div>
              <h4 className="text-base md:text-lg font-bold text-coffee-950">
                "Mengapa Drone pada Repetisi Kesekian yang Berada Tepat di Suar Masih Bisa Memecahkan Rekor Baru?"
              </h4>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-900 font-semibold px-2 py-1 rounded bg-white border border-amber-200">
            Penjelasan Matematis & Fisik
          </span>
        </div>

        <div className="text-xs md:text-sm text-coffee-900 leading-relaxed space-y-3">
          <p>
            Secara visual di kanvas 3D, mata kita melihat drone pertama (iterasi 5) dan drone kedua (iterasi 40) tampak <strong>sama-sama menyentuh tiang suar emas yang sama</strong>. Namun mengapa latensi pada repetisi kesekian bisa turun lebih tajam (misal dari <strong>7.91 ms</strong> menjadi <strong>6.80 ms</strong>)? Ada 3 faktor ilmiah di baliknya:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-1.5 shadow-sm">
              <div className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                <span>1. Analogi Bor Tambang Emas</span>
              </div>
              <p className="text-coffee-700 leading-normal">
                Drone pertama menemukan urat emas di kedalaman 1 meter (latensi 7.91 ms) lalu menancapkan suar. Drone di repetisi kesekian <strong>mengebor lebih dalam di titik yang sama</strong> hingga kedalaman 5 meter (latensi 6.80 ms). Lokasi petanya sama, namun kualitas temuannya jauh lebih murni.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-1.5 shadow-sm">
              <div className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                <span>2. Presisi Langkah MOP Mengecil</span>
              </div>
              <p className="text-coffee-700 leading-normal">
                Di awal iterasi, nilai <strong>MOP</strong> masih besar (~0.8), tebakan koordinat masih kasar. Di repetisi kesekian, MOP mengecil (~0.12), gerakan drone menyisir dengan <strong>presisi desimal mikro</strong> tepat di titik <em>sweet-spot</em> inti server yang sebelumnya terlewat.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-amber-200 space-y-1.5 shadow-sm">
              <div className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                <span>3. Dimensi Riil Alokasi Cloud</span>
              </div>
              <p className="text-coffee-700 leading-normal">
                Alokasi cloud bukan sekadar posisi fisik 2D di lantai, melainkan kombinasi alokasi <strong>Core CPU, kapasitas RAM, dan pembagian antrean MIPS</strong>. Drone kedua menemukan konfigurasi alokasi internal yang lebih efisien di gedung server yang sama.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 6 Langkah Iterasi & Kriteria Penghentian */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alur 6 Langkah Iterasi */}
        <div className="warm-panel p-6 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sand-200 text-coffee-900 border border-sand-300">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-bold text-coffee-950">
                Alur Langkah-demi-Langkah Iterasi AOA
              </h4>
              <span className="text-xs font-mono text-coffee-600">
                Siklus komputasi dari inisialisasi hingga solusi final
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-800 font-bold">LANGKAH 01</span>
                <Shuffle className="w-3.5 h-3.5 text-coffee-400" />
              </div>
              <h5 className="text-xs font-bold text-coffee-950">Inisialisasi Acak</h5>
              <p className="text-[11px] text-coffee-700">
                Sebar populasi agen pada sembarang koordinat dalam batasan ruang masalah.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-800 font-bold">LANGKAH 02</span>
                <CheckSquare className="w-3.5 h-3.5 text-coffee-400" />
              </div>
              <h5 className="text-xs font-bold text-coffee-950">Evaluasi & Suar Awal</h5>
              <p className="text-[11px] text-coffee-700">
                Hitung performa latensi tiap agen, pilih agen terbaik sebagai target sementara.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-800 font-bold">LANGKAH 03</span>
                <Sliders className="w-3.5 h-3.5 text-coffee-400" />
              </div>
              <h5 className="text-xs font-bold text-coffee-950">Pembaruan MOA & MOP</h5>
              <p className="text-[11px] text-coffee-700">
                Hitung nilai saklar fase (MOA) dan nilai pengecil langkah (MOP) nomor putaran.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-800 font-bold">LANGKAH 04</span>
                <ToggleRight className="w-3.5 h-3.5 text-coffee-400" />
              </div>
              <h5 className="text-xs font-bold text-coffee-950">Pemilihan Fase Agen</h5>
              <p className="text-[11px] text-coffee-700">
                Peluang Eksplorasi (÷, ×) besar di awal; peluang Eksploitasi (-, +) mendominasi di
                akhir.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-800 font-bold">LANGKAH 05</span>
                <Move className="w-3.5 h-3.5 text-coffee-400" />
              </div>
              <h5 className="text-xs font-bold text-coffee-950">Update Koordinat</h5>
              <p className="text-[11px] text-coffee-700">
                Terapkan rumus aritmatika, pastikan posisi tidak melanggar batas alokasi server.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-800 font-bold">LANGKAH 06</span>
                <Repeat className="w-3.5 h-3.5 text-coffee-400" />
              </div>
              <h5 className="text-xs font-bold text-coffee-950">Penggantian Target</h5>
              <p className="text-[11px] text-coffee-700">
                Jika ada skor agen yang mengalahkan target lama, perbarui posisi target terbaik.
              </p>
            </div>
          </div>
        </div>

        {/* Kapan Dikatakan Optimum & Retraining */}
        <div className="warm-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-bold text-coffee-950">
                Kapan Dikatakan "Optimum"?
              </h4>
              <span className="text-xs font-mono text-coffee-600">
                3 Kriteria penyelesaian praktis
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-coffee-700">
            <div className="p-2.5 rounded-lg bg-sand-50 border border-sand-200">
              <strong className="text-coffee-950 block mb-0.5">1. Batas Putaran Habis:</strong>
              Menyelesaikan batas iterasi yang ditentukan (misal 100 putaran). Posisi target terakhir
              diambil sebagai solusi final.
            </div>
            <div className="p-2.5 rounded-lg bg-sand-50 border border-sand-200">
              <strong className="text-coffee-950 block mb-0.5">2. Kurva Sudah Mendatar:</strong>
              Selama puluhan putaran berturut-turut, perbaikan nilai sudah sangat kecil atau nihil
              (stagnasi konvergensi).
            </div>
            <div className="p-2.5 rounded-lg bg-sand-50 border border-sand-200">
              <strong className="text-coffee-950 block mb-0.5">3. Memenuhi Batasan Teknis:</strong>
              Biaya/latensi paling minimum tanpa melanggar batasan kapasitas server (feasibility
              check).
            </div>
          </div>

          <div className="pt-2 border-t border-sand-200">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-700" />
              <span>Apakah Perlu di-Training Ulang?</span>
            </div>
            <p className="text-[11px] text-coffee-700 leading-tight">
              AOA <strong>bukanlah model Machine Learning biasa</strong>. AOA tidak mempelajari pola
              masa lalu untuk disimpan sebagai file model permanen, melainkan sebuah{' '}
              <em>numerical solver mandiri</em> yang dijalankan berkala setiap ada tugas baru.
            </p>
          </div>
        </div>
      </div>

      {/* Formulasi Matematika Resmi (KaTeX) */}
      <div className="warm-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-coffee-950">
                Formulasi Matematika Resmi AOA (Abualigah et al., 2021)
              </h4>
              <span className="text-xs font-mono text-coffee-600">
                Persamaan yang dieksekusi pada simulator ini
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-800">KaTeX Rendered</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-cream-50 border border-sand-200 space-y-1">
            <span className="text-coffee-600 text-[10px] uppercase">Fungsi Saklar Waktu (MOA)</span>
            <div
              className="text-amber-900 py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                'MOA(t) = Min + t \\times \\left(\\frac{Max - Min}{M_{iter}}\\right)',
                true
              )}
            />
            <span className="text-[10px] text-coffee-600 block">$Min = 0.2, Max = 0.9$</span>
          </div>

          <div className="p-3 rounded-xl bg-cream-50 border border-sand-200 space-y-1">
            <span className="text-coffee-600 text-[10px] uppercase">Pengecil Langkah (MOP)</span>
            <div
              className="text-emerald-800 py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                'MOP(t) = 1 - \\left(\\frac{t^{1/\\alpha}}{M_{iter}^{1/\\alpha}}\\right)',
                true
              )}
            />
            <span className="text-[10px] text-coffee-600 block">Sensitivitas $\alpha = 5$</span>
          </div>

          <div className="p-3 rounded-xl bg-cream-50 border border-sand-200 space-y-1">
            <span className="text-coffee-600 text-[10px] uppercase">Eksplorasi (Bagi & Kali)</span>
            <div
              className="text-sky-800 py-1 text-center font-bold text-[10px]"
              dangerouslySetInnerHTML={renderFormula(
                'X_{i,j} = \\begin{cases} X_{best} \\div (MOP + \\epsilon) \\times S, & r_2 < 0.5 \\\\ X_{best} \\times MOP \\times S, & r_2 \\ge 0.5 \\end{cases}',
                true
              )}
            />
            <span className="text-[10px] text-coffee-600 block">Digunakan saat r₁ &gt; MOA</span>
          </div>

          <div className="p-3 rounded-xl bg-cream-50 border border-sand-200 space-y-1">
            <span className="text-coffee-600 text-[10px] uppercase">Eksploitasi (Kurang & Tambah)</span>
            <div
              className="text-emerald-800 py-1 text-center font-bold text-[10px]"
              dangerouslySetInnerHTML={renderFormula(
                'X_{i,j} = \\begin{cases} X_{best} - MOP \\times S, & r_3 < 0.5 \\\\ X_{best} + MOP \\times S, & r_3 \\ge 0.5 \\end{cases}',
                true
              )}
            />
            <span className="text-[10px] text-coffee-600 block">Digunakan saat r₁ &le; MOA</span>
          </div>
        </div>
      </div>
    </section>
  );
};
