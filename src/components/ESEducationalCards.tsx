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
      <div className="border-b border-sand-300 pb-3 flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <span className="text-xs font-mono text-purple-800 uppercase tracking-wider font-semibold">
            Arsitektur Optimasi Sistem Terdistribusi
          </span>
          <h3 className="text-2xl font-bold text-coffee-950 tracking-tight flex items-center gap-2">
            Evolution Strategies (ES) dalam Alokasi Komputasi Awan Heterogen
          </h3>
        </div>
        <span className="text-xs font-mono text-coffee-600">
          Rujukan Jurnal: Petra Lončar & Paula Lončar (2022) &bull; IEEE Access
        </span>
      </div>

      {/* Grid: Analogi Pasukan Khusus & Target S_best */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Analogi Pasukan Khusus */}
        <div className="warm-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-900 border border-purple-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-coffee-950">
                Analogi: Pelatihan Pasukan Khusus di Medan Tempur Ekstrem
              </h4>
              <span className="text-xs font-mono text-purple-800">
                Bagaimana seleksi alam dan mutasi acak bekerja tanpa kawin silang (crossover)
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-coffee-800 leading-relaxed">
            <div className="p-3.5 rounded-xl bg-cream-50 border border-sand-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-purple-900 text-sm">
                <Dna className="w-4 h-4 text-purple-700" />
                <span>Seleksi Tanpa Kompromi & Bibit Induk (&mu;)</span>
              </div>
              <p className="text-xs text-coffee-700">
                Dari ratusan strategi, hanya sedikit komandan terbaik (&mu;) yang dipertahankan. Setiap komandan melatih banyak regu taktis baru (&lambda;) dengan rasio optimal <strong>1 : 7</strong> melalui improvisasi peran acak (<em>random resetting mutation</em>).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-cream-50 border border-sand-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                <Zap className="w-4 h-4 text-rose-700" />
                <span>Ujian Nyata & Kebijakan LJF (Ransel Terberat Lebih Dulu)</span>
              </div>
              <p className="text-xs text-coffee-700">
                Seluruh regu anak diuji di medan tugas. Hanya anak terbaik yang bertahan dan menggantikan generasi lama. Ditambah kebijakan <strong>Longest Job First (LJF)</strong>, tugas terberat diselesaikan paling awal oleh VM terkuat sehingga tidak ada server yang menganggur di akhir waktu.
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Mekanisme Target & Elitisme */}
        <div className="warm-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-coffee-950">
                Mekanisme Target S<sub>best</sub> & Proteksi Elitisme
              </h4>
              <span className="text-xs font-mono text-amber-800">
                Mengapa progres optimasi komputasi awan tidak pernah mundur
              </span>
            </div>
          </div>

          <div className="space-y-3 text-sm text-coffee-800 leading-relaxed">
            <p>
              Di dunia komputasi awan berskala puluhan ribu tugas, keandalan alokasi adalah kunci utama:
            </p>

            <ul className="space-y-2 text-xs text-coffee-700">
              <li className="flex items-start gap-2 p-2 rounded-lg bg-sand-50 border border-sand-200">
                <ArrowRightCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-coffee-950">Standar Awal Acak (Generasi 0):</strong> Di putaran pertama, tugas dipetakan secara acak ke VM. Kombinasi yang secara kebetulan memiliki durasi paling singkat dinobatkan sebagai standar terbaik sementara (S<sub>best</sub>).
                </div>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-lg bg-sand-50 border border-sand-200">
                <ArrowRightCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-coffee-950">Ujian di Setiap Generasi:</strong> Seluruh keturunan mutasi (&lambda;) dievaluasi. Jika ada anak yang memecahkan rekor waktu Makespan lebih cepat dari S<sub>best</sub>, suar emas langsung berpindah ke anak tersebut.
                </div>
              </li>
              <li className="flex items-start gap-2 p-2 rounded-lg bg-sand-50 border border-sand-200">
                <ArrowRightCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-coffee-950">Perisai Elitisme (Elitism):</strong> Jika seluruh anak di suatu generasi berkinerja lebih buruk, sistem tetap mengamankan konfigurasi S<sub>best</sub> sebelumnya. Hal ini menjamin kualitas penjadwalan selalu meningkat atau setidaknya konstan.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* DATA RIIL DARI JURNAL CERN LHC ALICE */}
      <div className="warm-panel p-6 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 via-white to-sand-50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-900 border border-purple-300">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-coffee-950 flex items-center gap-2">
                Studi Kasus Kelas Dunia: Eksperimen CERN LHC ALICE
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                  IEEE Access 2022
                </span>
              </h4>
              <p className="text-xs text-coffee-600">
                Data empiris dari paper Petra Lončar & Paula Lončar (Februari 2022)
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-purple-900 font-semibold">49.026 Real Particle Physics Jobs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-white border border-sand-200 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-coffee-600">
              <span>SKALA BEBAN RIIL</span>
              <Server className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-lg font-bold text-coffee-950">49.026 Tugas</div>
            <p className="text-[11px] text-coffee-700 font-sans">
              Log komputasi Monte Carlo dari 60+ lokasi global, 2.340 &ndash; 60.780 MI per tugas.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-sand-200 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-coffee-600">
              <span>ARSITEKTUR SERVER</span>
              <Layers className="w-4 h-4 text-purple-700" />
            </div>
            <div className="text-lg font-bold text-coffee-950">5 Data Center / 2.100 VM</div>
            <p className="text-[11px] text-coffee-700 font-sans">
              Heterogen: HPC (high MIPS), HTC, HSC, dan Storage dengan konfigurasi 1&ndash;8 Core CPU.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-sand-200 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-coffee-600">
              <span>RASIO OPTIMAL</span>
              <Scale className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-lg font-bold text-emerald-800">&mu; / &lambda; = 1 : 7 Rule</div>
            <p className="text-[11px] text-coffee-700 font-sans">
              Terbukti menghasilkan tekanan seleksi (*selective pressure*) tertinggi melampaui rasio 1:4 dan 1:10.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-sand-200 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-coffee-600">
              <span>VERSUS GENETIC ALGO</span>
              <TrendingDown className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-lg font-bold text-amber-800">Makespan & DI Lebih Rendah</div>
            <p className="text-[11px] text-coffee-700 font-sans">
              Throughput lebih tinggi dan pembagian beban kerja antar-VM jauh lebih adil tanpa kelebihan beban.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: 8 Langkah Iterasi & Elastisitas Auto-Scaling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alur 8 Langkah Iterasi ES */}
        <div className="warm-panel p-6 rounded-2xl space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-200">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-bold text-coffee-950">
                Alur 8 Langkah (&mu;, &lambda;)-Evolution Strategies di Cloud
              </h4>
              <span className="text-xs font-mono text-coffee-600">
                Siklus reproduksi, mutasi 10%, seleksi lingkungan, dan eksekusi broker LJF
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-mono text-purple-800 font-bold">LANGKAH 01</span>
              <h5 className="text-xs font-bold text-coffee-950">Inisialisasi Acak</h5>
              <p className="text-[11px] text-coffee-700">Pasangkan antrean cloudlets ke VM heterogen secara acak.</p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-mono text-purple-800 font-bold">LANGKAH 02</span>
              <h5 className="text-xs font-bold text-coffee-950">Evaluasi Kelayakan</h5>
              <p className="text-[11px] text-coffee-700">Hitung waktu eksekusi: panjang instruksi dibagi MIPS VM.</p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-mono text-purple-800 font-bold">LANGKAH 03</span>
              <h5 className="text-xs font-bold text-coffee-950">Rekor S<sub>best</sub></h5>
              <p className="text-[11px] text-coffee-700">Simpan jadwal tercepat awal ke penampung elitisme.</p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-mono text-purple-800 font-bold">LANGKAH 04</span>
              <h5 className="text-xs font-bold text-coffee-950">Seleksi Induk (&mu;)</h5>
              <p className="text-[11px] text-coffee-700">Saring &mu; strategi terbaik untuk dijadikan bibit variasi.</p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-mono text-purple-800 font-bold">LANGKAH 05</span>
              <h5 className="text-xs font-bold text-coffee-950">Mutasi Acak (&lambda;)</h5>
              <p className="text-[11px] text-coffee-700">Gandakan rasio 1:7. Geser 10% alokasi tugas ke VM lain.</p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-mono text-purple-800 font-bold">LANGKAH 06</span>
              <h5 className="text-xs font-bold text-coffee-950">Seleksi Alam Baru</h5>
              <p className="text-[11px] text-coffee-700">Pilih &mu; anak terbaik; generasi induk lama dipensiunkan.</p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-mono text-purple-800 font-bold">LANGKAH 07</span>
              <h5 className="text-xs font-bold text-coffee-950">Update Suar Emas</h5>
              <p className="text-[11px] text-coffee-700">Perbarui rekor jika ada Makespan yang lebih cepat.</p>
            </div>

            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
              <span className="text-[10px] font-mono text-purple-800 font-bold">LANGKAH 08</span>
              <h5 className="text-xs font-bold text-coffee-950">Eksekusi Broker LJF</h5>
              <p className="text-[11px] text-coffee-700">Urutkan tugas terpanjang lebih dahulu untuk eksekusi VM.</p>
            </div>
          </div>
        </div>

        {/* Elastisitas Auto-Scaling & Tanpa Training Ulang */}
        <div className="warm-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base md:text-lg font-bold text-coffee-950">
                Elastisitas & Auto-Scaling Riil
              </h4>
              <span className="text-xs font-mono text-coffee-600">
                Penskalaan VM dinamis & hemat biaya
              </span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-coffee-700">
            <div className="p-2.5 rounded-lg bg-sand-50 border border-sand-200">
              <strong className="text-coffee-950 block mb-0.5">Scale-Out Dinamis:</strong>
              Saat antrean melonjak tajam (hingga 20.000 tugas pada uji coba CERN), instans VM aktif secara otomatis bertambah hingga mendekati 900 VM untuk mencegah antrean macet.
            </div>
            <div className="p-2.5 rounded-lg bg-sand-50 border border-sand-200">
              <strong className="text-coffee-950 block mb-0.5">Scale-In ke Nol:</strong>
              Ketika tugas-tugas selesai diproses, alokasi VM otomatis menyusut kembali ke 0 untuk mencegah pemborosan biaya sewa *cloud provider*.
            </div>
            <div className="p-2.5 rounded-lg bg-sand-50 border border-sand-200">
              <strong className="text-coffee-950 block mb-0.5">Bukan Model Hafalan Bobot:</strong>
              ES tidak memerlukan proses training dataset seperti Neural Network/LLM. ES adalah *solver* optimasi mandiri yang dijalankan berkala untuk tiap *batch job* baru.
            </div>
          </div>
        </div>
      </div>

      {/* FORMULA REFERENCE WITH KATEX */}
      <div className="warm-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-900 border border-purple-300">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-coffee-950">
                Formulasi Metrik Resmi (Lončar & Lončar, 2022)
              </h4>
              <span className="text-xs font-mono text-coffee-600">
                Metrik evaluasi efisiensi komputasi awan yang dihitung pada engine ini
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-purple-800">KaTeX Rendered</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-cream-50 border border-sand-200 space-y-1">
            <span className="text-coffee-600 text-[10px] uppercase">Makespan (Durasi Total)</span>
            <div
              className="text-amber-900 py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                'C_{max} = \\max_{j \\in VMs} (T_j)',
                true
              )}
            />
            <span className="text-[10px] text-coffee-600 block">Waktu VM terakhir selesai bekerja</span>
          </div>

          <div className="p-3 rounded-xl bg-cream-50 border border-sand-200 space-y-1">
            <span className="text-coffee-600 text-[10px] uppercase">Degree of Imbalance (DI)</span>
            <div
              className="text-rose-900 py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                'DI = \\frac{T_{max} - T_{min}}{T_{avg}}',
                true
              )}
            />
            <span className="text-[10px] text-coffee-600 block">Makin mendekati 0, beban makin adil</span>
          </div>

          <div className="p-3 rounded-xl bg-cream-50 border border-sand-200 space-y-1">
            <span className="text-coffee-600 text-[10px] uppercase">Rasio Keturunan (&mu;, &lambda;)</span>
            <div
              className="text-purple-900 py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                '\\lambda = 7 \\times \\mu',
                true
              )}
            />
            <span className="text-[10px] text-coffee-600 block">Tekanan seleksi optimal jurnal 1/7</span>
          </div>

          <div className="p-3 rounded-xl bg-cream-50 border border-sand-200 space-y-1">
            <span className="text-coffee-600 text-[10px] uppercase">Random Resetting Mutation</span>
            <div
              className="text-emerald-800 py-1 text-center font-bold"
              dangerouslySetInnerHTML={renderFormula(
                'P_{mut} \\approx 0.10 \\; (10\\%)',
                true
              )}
            />
            <span className="text-[10px] text-coffee-600 block">Pemindahan tugas acak antar-VM</span>
          </div>
        </div>
      </div>
    </section>
  );
};
