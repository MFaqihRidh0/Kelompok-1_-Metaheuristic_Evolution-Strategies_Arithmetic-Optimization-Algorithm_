import React, { useEffect } from 'react';
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
  // Helper for rendering KaTeX equations safely
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
      <div className="border-b border-cyber-800 pb-3 flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <span className="text-xs font-mono text-cyber-cyan uppercase tracking-wider font-semibold">
            Kurikulum Sains Komputasi
          </span>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Memahami Logika & Filosofi Arithmetic Optimization Algorithm (AOA)
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Berdasarkan paper rujukan Laith Abualigah et al. (2021)
        </span>
      </div>

      {/* Grid: Analogi Harta Karun & Mekanisme Target */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Analogi Sederhana */}
        <div className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                Analogi: Tim Pencari Harta Karun di Kepulauan Misterius
              </h4>
              <span className="text-xs font-mono text-cyber-cyan">
                Bagaimana 4 operator matematika bekerja secara intuitif
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-cyber-900/80 border border-cyber-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-cyber-sky text-sm">
                <PlaneTakeoff className="w-4 h-4" />
                <span>Perkalian (&times;) & Pembagian (&divide;) &mdash; Helikopter & Parasut</span>
              </div>
              <p className="text-xs text-slate-300">
                Hasil perhitungan perkalian dan pembagian menghasilkan lonjakan angka yang sangat
                besar dan tersebar luas. Ini mengantarkan regu drone melompat jauh melintasi
                gugusan kepulauan server baru agar tidak terjebak di bukit kecil yang salah (
                <em>local optima trap</em>).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-900/80 border border-cyber-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-cyber-emerald text-sm">
                <Crosshair className="w-4 h-4" />
                <span>Penjumlahan (+) & Pengurangan (-) &mdash; Cangkul & Detektor Logam</span>
              </div>
              <p className="text-xs text-slate-300">
                Hasil perhitungan penjumlahan dan pengurangan menghasilkan sebaran yang sangat
                rapat dan presisi tinggi. Begitu lokasi sinyal server terbaik terdeteksi, agen turun
                menyisir tanah jengkal demi jengkal dengan laser pemindai untuk memoles koordinat
                optimum.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Mekanisme Target */}
        <div className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyber-gold/10 border border-cyber-gold/30 text-cyber-gold">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                Mekanisme Target: Mengapa "Best" Sudah Ada Sejak Awal?
              </h4>
              <span className="text-xs font-mono text-cyber-gold">
                Konsep suar dinamis yang terus berpindah
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              Banyak pemula bertanya:{' '}
              <em>
                "Jika solusi terbaik (<span className="font-mono text-cyber-gold">best solution</span>
                ) sudah diketahui sejak iterasi 0, mengapa kita masih perlu mencari?"
              </em>
            </p>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2 p-2 rounded-lg bg-cyber-900/60 border border-cyber-800">
                <ArrowRightCircle className="w-4 h-4 text-cyber-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Nilai awal hanyalah tebakan acak terbaik:</strong>{' '}
                  Pada putaran pertama, agen menyebar acak. Siapa pun yang secara kebetulan
                  memiliki latensi paling rendah saat itu langsung ditunjuk sementara sebagai "tiang
                  suar".
                </div>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-lg bg-cyber-900/60 border border-cyber-800">
                <ArrowRightCircle className="w-4 h-4 text-cyber-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Target berpindah seketika:</strong> Setiap kali ada
                  agen lain yang menemukan koordinat server dengan latensi lebih baik di putaran
                  berikutnya, suar emas langsung berpindah ke titik baru tersebut.
                </div>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-lg bg-cyber-900/60 border border-cyber-800">
                <ArrowRightCircle className="w-4 h-4 text-cyber-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Konvergensi ke Global Optimum:</strong> Melalui
                  ratusan putaran, suar target terus bermigrasi mendekati lokasi minimum global sejati
                  di seluruh lanskap datacenter.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Grid: 6 Langkah Iterasi & Kriteria Penghentian */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alur 6 Langkah Iterasi */}
        <div className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyber-800 text-cyber-cyan border border-cyber-700">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-bold text-white">
                Alur Langkah-demi-Langkah Iterasi AOA
              </h4>
              <span className="text-xs font-mono text-slate-400">
                Siklus komputasi dari inisialisasi hingga solusi final
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyber-cyan font-bold">LANGKAH 01</span>
                <Shuffle className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <h5 className="text-xs font-bold text-white">Inisialisasi Acak</h5>
              <p className="text-[11px] text-slate-400">
                Sebar populasi agen pada sembarang koordinat dalam batasan ruang masalah.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyber-cyan font-bold">LANGKAH 02</span>
                <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <h5 className="text-xs font-bold text-white">Evaluasi & Suar Awal</h5>
              <p className="text-[11px] text-slate-400">
                Hitung performa latensi tiap agen, pilih agen terbaik sebagai target sementara.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyber-cyan font-bold">LANGKAH 03</span>
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <h5 className="text-xs font-bold text-white">Pembaruan MOA & MOP</h5>
              <p className="text-[11px] text-slate-400">
                Hitung nilai saklar fase (MOA) dan nilai pengecil langkah (MOP) nomor putaran.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyber-cyan font-bold">LANGKAH 04</span>
                <ToggleRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <h5 className="text-xs font-bold text-white">Pemilihan Fase Agen</h5>
              <p className="text-[11px] text-slate-400">
                Peluang Eksplorasi (÷, ×) besar di awal; peluang Eksploitasi (-, +) mendominasi di
                akhir.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyber-cyan font-bold">LANGKAH 05</span>
                <Move className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <h5 className="text-xs font-bold text-white">Update Koordinat</h5>
              <p className="text-[11px] text-slate-400">
                Terapkan rumus aritmatika, pastikan posisi tidak melanggar batas alokasi server.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyber-cyan font-bold">LANGKAH 06</span>
                <Repeat className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <h5 className="text-xs font-bold text-white">Penggantian Target</h5>
              <p className="text-[11px] text-slate-400">
                Jika ada skor agen yang mengalahkan target lama, perbarui posisi target terbaik.
              </p>
            </div>
          </div>
        </div>

        {/* Kapan Dikatakan Optimum & Retraining */}
        <div className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyber-800 text-cyber-gold border border-cyber-700">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-bold text-white">
                Kapan Dikatakan "Optimum"?
              </h4>
              <span className="text-xs font-mono text-slate-400">
                3 Kriteria penyelesaian praktis
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-2.5 rounded-lg bg-cyber-900/60 border border-cyber-800">
              <strong className="text-white block mb-0.5">1. Batas Putaran Habis:</strong>
              Menyelesaikan batas iterasi yang ditentukan (misal 100 putaran). Posisi target terakhir
              diambil sebagai solusi final.
            </div>
            <div className="p-2.5 rounded-lg bg-cyber-900/60 border border-cyber-800">
              <strong className="text-white block mb-0.5">2. Kurva Sudah Mendatar:</strong>
              Selama puluhan putaran berturut-turut, perbaikan nilai sudah sangat kecil atau nihil
              (stagnasi konvergensi).
            </div>
            <div className="p-2.5 rounded-lg bg-cyber-900/60 border border-cyber-800">
              <strong className="text-white block mb-0.5">3. Memenuhi Batasan Teknis:</strong>
              Biaya/latensi paling minimum tanpa melanggar batasan kapasitas server (feasibility
              check).
            </div>
          </div>

          <div className="pt-2 border-t border-cyber-800">
            <div className="flex items-center gap-2 text-cyber-mint text-xs font-bold mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>Apakah Perlu di-Training Ulang?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              AOA <strong>bukanlah model Machine Learning biasa</strong>. AOA tidak mempelajari pola
              masa lalu untuk disimpan sebagai file model permanen, melainkan sebuah{' '}
              <em>numerical solver mandiri</em> yang dijalankan berkala setiap ada tugas baru.
            </p>
          </div>
        </div>
      </div>

      {/* Formulasi Matematika Resmi (KaTeX) */}
      <div className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30">
              <Binary className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Formulasi Matematika Resmi AOA (Abualigah et al., 2021)
              </h4>
              <span className="text-xs font-mono text-slate-400">
                Persamaan yang dieksekusi pada simulator ini
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-cyber-cyan">KaTeX Rendered</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-cyber-950 border border-cyber-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Fungsi Saklar Waktu (MOA)</span>
            <div
              className="text-cyber-cyan py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                'MOA(t) = Min + t \\times \\left(\\frac{Max - Min}{M_{iter}}\\right)',
                true
              )}
            />
            <span className="text-[10px] text-slate-400 block">$Min = 0.2, Max = 0.9$</span>
          </div>

          <div className="p-3 rounded-xl bg-cyber-950 border border-cyber-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Pengecil Langkah (MOP)</span>
            <div
              className="text-cyber-mint py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                'MOP(t) = 1 - \\left(\\frac{t^{1/\\alpha}}{M_{iter}^{1/\\alpha}}\\right)',
                true
              )}
            />
            <span className="text-[10px] text-slate-400 block">Sensitivitas $\alpha = 5$</span>
          </div>

          <div className="p-3 rounded-xl bg-cyber-950 border border-cyber-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Eksplorasi (Bagi & Kali)</span>
            <div
              className="text-cyber-sky py-1 text-center font-bold text-[10px]"
              dangerouslySetInnerHTML={renderFormula(
                'X_{i,j} = \\begin{cases} X_{best} \\div (MOP + \\epsilon) \\times S, & r_2 < 0.5 \\\\ X_{best} \\times MOP \\times S, & r_2 \\ge 0.5 \\end{cases}',
                true
              )}
            />
            <span className="text-[10px] text-slate-400 block">Digunakan saat r₁ &gt; MOA</span>
          </div>

          <div className="p-3 rounded-xl bg-cyber-950 border border-cyber-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Eksploitasi (Kurang & Tambah)</span>
            <div
              className="text-cyber-emerald py-1 text-center font-bold text-[10px]"
              dangerouslySetInnerHTML={renderFormula(
                'X_{i,j} = \\begin{cases} X_{best} - MOP \\times S, & r_3 < 0.5 \\\\ X_{best} + MOP \\times S, & r_3 \\ge 0.5 \\end{cases}',
                true
              )}
            />
            <span className="text-[10px] text-slate-400 block">Digunakan saat r₁ &le; MOA</span>
          </div>
        </div>
      </div>
    </section>
  );
};
