import React from 'react';
import katex from 'katex';
import {
  ShieldAlert,
  Dna,
  Zap,
  Layers,
  ArrowRightCircle,
  Activity,
  Server,
  TrendingDown,
  Scale,
  Cpu,
  BarChart3,
  GitBranch,
  RefreshCw,
  Award,
} from 'lucide-react';

export const ESEducationalCards: React.FC = () => {
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
          <span className="text-xs font-mono text-cyber-purple uppercase tracking-wider font-semibold">
            Arsitektur Optimasi Sistem Terdistribusi
          </span>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Evolution Strategies (ES) dalam Alokasi Komputasi Awan Heterogen
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Rujukan Jurnal: Petra Lončar & Paula Lončar (2022) &bull; IEEE Access
        </span>
      </div>

      {/* Grid: Analogi Pasukan Khusus & Target S_best */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Analogi Pasukan Khusus */}
        <div className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                Analogi: Pelatihan Pasukan Khusus di Medan Tempur Ekstrem
              </h4>
              <span className="text-xs font-mono text-cyber-purple">
                Bagaimana seleksi alam dan mutasi acak bekerja tanpa kawin silang (crossover)
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-cyber-900/80 border border-cyber-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-cyber-violet text-sm">
                <Dna className="w-4 h-4" />
                <span>Seleksi Tanpa Kompromi & Bibit Induk (&mu;)</span>
              </div>
              <p className="text-xs text-slate-300">
                Dari ratusan strategi, hanya sedikit komandan terbaik (&mu;) yang dipertahankan. Setiap komandan melatih banyak regu taktis baru (&lambda;) dengan rasio optimal <strong>1 : 7</strong> melalui improvisasi peran acak (<em>random resetting mutation</em>).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-cyber-900/80 border border-cyber-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-cyber-pink text-sm">
                <Zap className="w-4 h-4" />
                <span>Ujian Nyata & Kebijakan LJF (Ransel Terberat Lebih Dulu)</span>
              </div>
              <p className="text-xs text-slate-300">
                Seluruh regu anak diuji di simulasi beban tugas. Hanya anak terbaik yang bertahan dan menggantikan generasi lama secara penuh. Ditambah kebijakan <strong>Longest Job First (LJF)</strong>, tugas terberat diselesaikan paling awal oleh VM terkuat sehingga tidak ada server yang menganggur di akhir waktu.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Mekanisme Target & Elitisme */}
        <div className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyber-gold/10 border border-cyber-gold/30 text-cyber-gold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">
                Mekanisme Target S<sub>best</sub> & Proteksi Elitisme
              </h4>
              <span className="text-xs font-mono text-cyber-gold">
                Mengapa progres optimasi komputasi awan tidak pernah mundur
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
            <p>
              Di dunia komputasi awan berskala puluhan ribu tugas, keandalan alokasi adalah kunci utama:
            </p>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2 p-2 rounded-lg bg-cyber-900/60 border border-cyber-800">
                <ArrowRightCircle className="w-4 h-4 text-cyber-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Standar Awal Acak (Generasi 0):</strong> Di putaran pertama, tugas dipetakan secara acak ke VM. Kombinasi yang secara kebetulan memiliki durasi paling singkat dinobatkan sebagai standar terbaik sementara (S<sub>best</sub>).
                </div>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-lg bg-cyber-900/60 border border-cyber-800">
                <ArrowRightCircle className="w-4 h-4 text-cyber-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Ujian di Setiap Generasi:</strong> Seluruh keturunan mutasi (&lambda;) dievaluasi. Jika ada anak yang memecahkan rekor waktu Makespan lebih cepat dari S<sub>best</sub>, suar emas langsung berpindah ke anak tersebut.
                </div>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-lg bg-cyber-900/60 border border-cyber-800">
                <ArrowRightCircle className="w-4 h-4 text-cyber-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Perisai Elitisme (Elitism):</strong> Jika seluruh anak di suatu generasi berkinerja lebih buruk, sistem tetap mengamankan konfigurasi S<sub>best</sub> sebelumnya. Hal ini menjamin kualitas penjadwalan selalu meningkat atau setidaknya konstan.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* DATA RIIL DARI JURNAL CERN LHC ALICE */}
      <div className="cyber-panel p-6 rounded-2xl border border-cyber-purple/40 bg-gradient-to-br from-cyber-900/90 via-cyber-950 to-cyber-900/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyber-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyber-purple/20 border border-cyber-purple/40 text-cyber-purple">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                Studi Kasus Kelas Dunia: Eksperimen CERN LHC ALICE
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyber-purple/20 text-cyber-violet border border-cyber-purple/40">
                  IEEE Access 2022
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Data empiris dari paper Petra Lončar & Paula Lončar (Februari 2022)
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyber-cyan">49.026 Real Particle Physics Jobs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>SKALA BEBAN RIIL</span>
              <Server className="w-4 h-4 text-cyber-cyan" />
            </div>
            <div className="text-lg font-bold text-white">49.026 Tugas</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Log komputasi Monte Carlo dari 60+ lokasi global, 2.340 &ndash; 60.780 MI per tugas.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>ARSITEKTUR SERVER</span>
              <Layers className="w-4 h-4 text-cyber-purple" />
            </div>
            <div className="text-lg font-bold text-white">5 Data Center / 2.100 VM</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Heterogen: HPC (high MIPS), HTC, HSC, dan Storage dengan konfigurasi 1&ndash;8 Core CPU.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>RASIO OPTIMAL</span>
              <Scale className="w-4 h-4 text-cyber-mint" />
            </div>
            <div className="text-lg font-bold text-cyber-mint">&mu; / &lambda; = 1 : 7 Rule</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Terbukti menghasilkan tekanan seleksi (*selective pressure*) tertinggi melampaui rasio 1:4 dan 1:10.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>VERSUS GENETIC ALGO</span>
              <TrendingDown className="w-4 h-4 text-cyber-gold" />
            </div>
            <div className="text-lg font-bold text-cyber-gold">Makespan & DI Lebih Rendah</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Throughput lebih tinggi dan pembagian beban kerja antar-VM jauh lebih adil tanpa kelebihan beban.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 8 Langkah Iterasi & Elastisitas Auto-Scaling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alur 8 Langkah Iterasi ES */}
        <div className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyber-800 text-cyber-purple border border-cyber-700">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-bold text-white">
                Alur 8 Langkah (&mu;, &lambda;)-Evolution Strategies di Cloud
              </h4>
              <span className="text-xs font-mono text-slate-400">
                Siklus reproduksi, mutasi 10%, seleksi lingkungan, dan eksekusi broker LJF
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <span className="text-[10px] font-mono text-cyber-purple font-bold">LANGKAH 01</span>
              <h5 className="text-xs font-bold text-white">Inisialisasi Acak</h5>
              <p className="text-[11px] text-slate-400">Pasangkan antrean cloudlets ke VM heterogen secara acak.</p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <span className="text-[10px] font-mono text-cyber-purple font-bold">LANGKAH 02</span>
              <h5 className="text-xs font-bold text-white">Evaluasi Kelayakan</h5>
              <p className="text-[11px] text-slate-400">Hitung waktu eksekusi: panjang instruksi dibagi MIPS VM.</p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <span className="text-[10px] font-mono text-cyber-purple font-bold">LANGKAH 03</span>
              <h5 className="text-xs font-bold text-white">Rekor S<sub>best</sub></h5>
              <p className="text-[11px] text-slate-400">Simpan jadwal tercepat awal ke penampung elitisme.</p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <span className="text-[10px] font-mono text-cyber-purple font-bold">LANGKAH 04</span>
              <h5 className="text-xs font-bold text-white">Seleksi Induk (&mu;)</h5>
              <p className="text-[11px] text-slate-400">Saring &mu; strategi terbaik untuk dijadikan bibit variasi.</p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <span className="text-[10px] font-mono text-cyber-purple font-bold">LANGKAH 05</span>
              <h5 className="text-xs font-bold text-white">Mutasi Acak (&lambda;)</h5>
              <p className="text-[11px] text-slate-400">Gandakan rasio 1:7. Geser 10% alokasi tugas ke VM lain.</p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <span className="text-[10px] font-mono text-cyber-purple font-bold">LANGKAH 06</span>
              <h5 className="text-xs font-bold text-white">Seleksi Alam Baru</h5>
              <p className="text-[11px] text-slate-400">Pilih &mu; anak terbaik; generasi induk lama dipensiunkan.</p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <span className="text-[10px] font-mono text-cyber-purple font-bold">LANGKAH 07</span>
              <h5 className="text-xs font-bold text-white">Update Suar Emas</h5>
              <p className="text-[11px] text-slate-400">Perbarui rekor jika ada Makespan yang lebih cepat.</p>
            </div>

            <div className="p-3 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-1">
              <span className="text-[10px] font-mono text-cyber-purple font-bold">LANGKAH 08</span>
              <h5 className="text-xs font-bold text-white">Eksekusi Broker LJF</h5>
              <p className="text-[11px] text-slate-400">Urutkan tugas terpanjang lebih dahulu untuk eksekusi VM.</p>
            </div>
          </div>
        </div>

        {/* Elastisitas Auto-Scaling & Tanpa Training Ulang */}
        <div className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyber-800 text-cyber-mint border border-cyber-700">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-bold text-white">
                Elastisitas & Auto-Scaling Riil
              </h4>
              <span className="text-xs font-mono text-slate-400">
                Penskalaan VM dinamis & hemat biaya
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-2.5 rounded-lg bg-cyber-900/60 border border-cyber-800">
              <strong className="text-white block mb-0.5">Scale-Out Dinamis:</strong>
              Saat antrean melonjak tajam (hingga 20.000 tugas pada uji coba CERN), instans VM aktif secara otomatis bertambah hingga mendekati 900 VM untuk mencegah antrean macet.
            </div>
            <div className="p-2.5 rounded-lg bg-cyber-900/60 border border-cyber-800">
              <strong className="text-white block mb-0.5">Scale-In ke Nol:</strong>
              Ketika tugas-tugas selesai diproses, alokasi VM otomatis menyusut kembali ke 0 untuk mencegah pemborosan biaya sewa *cloud provider*.
            </div>
            <div className="p-2.5 rounded-lg bg-cyber-900/60 border border-cyber-800">
              <strong className="text-white block mb-0.5">Bukan Model Hafalan Bobot:</strong>
              ES tidak memerlukan proses training dataset seperti Neural Network/LLM. ES adalah *solver* optimasi mandiri yang dijalankan berkala untuk tiap *batch job* baru.
            </div>
          </div>
        </div>
      </div>

      {/* FORMULA REFERENCE WITH KATEX */}
      <div className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Formulasi Metrik Resmi (Lončar & Lončar, 2022)
              </h4>
              <span className="text-xs font-mono text-slate-400">
                Metrik evaluasi efisiensi komputasi awan yang dihitung pada engine ini
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-cyber-purple">KaTeX Rendered</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-cyber-950 border border-cyber-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Makespan (Durasi Total)</span>
            <div
              className="text-cyber-cyan py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                'C_{max} = \\max_{j \\in VMs} (T_j)',
                true
              )}
            />
            <span className="text-[10px] text-slate-400 block">Waktu VM terakhir selesai bekerja</span>
          </div>

          <div className="p-3 rounded-xl bg-cyber-950 border border-cyber-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Degree of Imbalance (DI)</span>
            <div
              className="text-cyber-pink py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                'DI = \\frac{T_{max} - T_{min}}{T_{avg}}',
                true
              )}
            />
            <span className="text-[10px] text-slate-400 block">Makin mendekati 0, beban makin adil</span>
          </div>

          <div className="p-3 rounded-xl bg-cyber-950 border border-cyber-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Rasio Keturunan (&mu;, &lambda;)</span>
            <div
              className="text-cyber-purple py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                '\\lambda = 7 \\times \\mu',
                true
              )}
            />
            <span className="text-[10px] text-slate-400 block">Tekanan seleksi optimal jurnal 1/7</span>
          </div>

          <div className="p-3 rounded-xl bg-cyber-950 border border-cyber-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Random Resetting Mutation</span>
            <div
              className="text-cyber-mint py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                'P_{mut} \\approx 0.10 \\; (10\\%)',
                true
              )}
            />
            <span className="text-[10px] text-slate-400 block">Pemindahan tugas acak antar-VM</span>
          </div>
        </div>
      </div>
    </section>
  );
};
