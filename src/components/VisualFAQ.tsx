import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Server,
  Crown,
  Pickaxe,
  Crosshair,
  Layers,
  Sparkles,
  Info,
  Dna,
  Zap,
  Scale,
  Compass,
} from 'lucide-react';
import { AlgorithmType } from '../types';

interface VisualFAQProps {
  algorithm: AlgorithmType;
}

export const VisualFAQ: React.FC<VisualFAQProps> = ({ algorithm }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // ==========================================
  // ARITHMETIC OPTIMIZATION ALGORITHM (AOA) FAQ
  // ==========================================
  const aoaFaqItems = [
    {
      id: 'aoa-same-spot-record',
      badge: 'Fenomena AOA: Presisi MOP & Sweet-Spot',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: Pickaxe,
      iconColor: 'text-amber-800 bg-amber-100 border-amber-200',
      question:
        'Di AOA, secara visual drone di repetisi kesekian berada di titik suar yang sama, tapi mengapa bisa memecahkan rekor baru? Padahal secara jarak tampak sama saja?',
      shortAnswer:
        'Jarak visual di layar 3D tampak sama, namun nilai MOP menyusut mikro sehingga drone menyisir dengan ketelitian desimal sub-mikro di titik sweet-spot terdalam.',
      detailedContent: (
        <div className="space-y-4 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <p>
            Pada iterasi ke-5, ada drone yang mendarat di suar dan mencatat rekor latensi{' '}
            <strong className="text-amber-900 font-mono">7.91 ms</strong>. Pada iterasi ke-35, ada
            drone lain yang tampaknya mendarat persis di tiang suar yang sama, namun tiba-tiba
            memecahkan rekor baru menjadi{' '}
            <strong className="text-emerald-800 font-mono">6.80 ms</strong>. Berikut 3 alasan
            matematis AOA di baliknya:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Pickaxe className="w-4 h-4" />
                </div>
                <span>1. Analogi Bor Tambang Emas</span>
              </div>
              <p className="text-coffee-700 text-xs leading-normal">
                Tiang suar adalah tanda bahwa di lokasi tanah tersebut ada urat emas. Drone pertama
                baru mencangkul di <strong>kedalaman 1 meter</strong> (latensi 7.91 ms). Drone di
                repetisi berikutnya <strong>mengebor lebih dalam hingga kedalaman 10 meter</strong> di
                titik yang sama (latensi 6.80 ms). Tempat di peta terlihat sama, tetapi kualitas
                galiannya jauh lebih murni!
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <Crosshair className="w-4 h-4" />
                </div>
                <span>2. Presisi Langkah MOP Mengecil</span>
              </div>
              <p className="text-coffee-700 text-xs leading-normal">
                Di awal simulasi, parameter <strong>MOP</strong> bernilai besar (~0.8), tebakan drone
                masih kasar. Di repetisi kesekian, MOP menyusut menjadi sub-mikro (~0.05). Drone
                menyisir dengan <strong>ketelitian desimal mikro</strong> tepat di titik{' '}
                <em>sweet spot</em> inti server yang sebelumnya terlewat beberapa milimeter.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <div className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
                  <Layers className="w-4 h-4" />
                </div>
                <span>3. Dimensi Internal Alokasi Cloud</span>
              </div>
              <p className="text-coffee-700 text-xs leading-normal">
                Solusi optimasi awan bukan sekadar koordinat 2D di lantai, melainkan konfigurasi
                alokasi <strong>Core CPU, kapasitas RAM, dan antrean VM</strong>. Drone kedua
                menemukan susunan antrean internal di server tersebut yang bebas dari waktu tunggu.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'aoa-near-beacon-no-record',
      badge: 'Topografi & Kelerengan Latensi AOA',
      badgeColor: 'bg-sand-200 text-coffee-900 border-sand-300',
      icon: Target,
      iconColor: 'text-coffee-800 bg-sand-200 border-sand-300',
      question:
        'Kenapa ada drone AOA yang tampak terbang sangat dekat ke suar tapi TIDAK mencetak rekor baru?',
      shortAnswer:
        'Karena rekor dihitung dari nilai latensi server (ms), bukan jarak visual (meter). Tiang suar berdiri di dasar lembah terendah; drone di dekatnya masih berada di lereng bukit dengan latensi lebih tinggi.',
      detailedContent: (
        <div className="space-y-3 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <div className="p-3.5 rounded-xl bg-cream-50 border border-sand-200 space-y-2">
            <strong className="text-coffee-950 block text-xs md:text-sm font-semibold">
              Prinsip: Jarak Visual (Meter) &ne; Nilai Latensi Server (ms)
            </strong>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-coffee-700 pl-1">
              <li>
                <strong>Tiang Suar adalah Rekor yang Sudah Tercatat:</strong> Tiang suar didirikan
                persis di titik latensi terendah yang pernah ditemukan agen mana pun (misal{' '}
                <strong>7.91 ms</strong>).
              </li>
              <li>
                <strong>Lanskap Bergelombang:</strong> Topografi server memiliki lereng non-linier.
                Drone di sebelah suar berada di lereng (misalnya latensinya{' '}
                <span className="font-mono text-rose-700 font-semibold">8.04 ms</span>).
              </li>
              <li>
                <strong>Syarat Pemecahan Rekor:</strong> Karena 8.04 ms &gt; 7.91 ms, drone belum
                mengalahkan rekor. Rekor hanya pecah jika ada drone yang mencatat latensi lebih kecil
                secara mutlak (&lt;).
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'aoa-five-buildings',
      badge: 'Infrastruktur Komputasi Awan Heterogen',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: Server,
      iconColor: 'text-emerald-800 bg-emerald-100 border-emerald-200',
      question: 'Apa fungsi 5 gedung dengan atap warna-warni yang ada di animasi 3D?',
      shortAnswer:
        'Itu adalah 5 Pusat Data (Datacenter Clusters) Heterogen CERN LHC ALICE dengan kapasitas MIPS dan Core yang berbeda, tempat ribuan tugas dialokasikan.',
      detailedContent: (
        <div className="space-y-3 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <p>
            Kelima gedung adalah <strong>5 Kluster Pusat Data Heterogen</strong> yang dimodelkan dari
            eksperimen partikel CERN LHC ALICE:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#38bdf8] border border-sand-200">
              <span className="font-bold text-[#0284c7]">DC-1: HPC Cluster (4.500 MIPS)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                8 Cores VM. Server komputasi kelas berat super cepat untuk tugas instruksi terbesar.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#a855f7] border border-sand-200">
              <span className="font-bold text-[#7c3aed]">DC-2: HTC High-Throughput (3.200 MIPS)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                4 Cores VM. Pemrosesan ribuan data batch paralel secara simultan.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#ec4899] border border-sand-200">
              <span className="font-bold text-[#db2777]">DC-3: HSC High-Storage (2.800 MIPS)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                4 Cores VM. Kluster khusus operasi input/output dan analisis berkas partikel besar.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#f59e0b] border border-sand-200">
              <span className="font-bold text-[#d97706]">DC-4: Distributed Storage (2.100 MIPS)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                2 Cores VM. Kluster replika terdistribusi untuk pengarsipan data detektor.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#10b981] border border-sand-200 sm:col-span-2 lg:col-span-1">
              <span className="font-bold text-[#059669]">DC-5: Core Edge Cloud (3.600 MIPS)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                6 Cores VM (Pusat). Broker lalu lintas data dan gerbang utama distribusi awan.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'aoa-drone-colors',
      badge: 'Identifikasi Visual Drone AOA',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      icon: Crown,
      iconColor: 'text-purple-800 bg-purple-100 border-purple-200',
      question: 'Di AOA, apa arti warna drone? Siapa penanda rekor, drone biru atau hijau?',
      shortAnswer:
        'Warna Biru dan Hijau adalah jenis alat aksi (lompat jauh vs menyisir tanah), BUKAN penanda juara. Penanda rekor sejati adalah drone yang mengenakan MAHKOTA EMAS (👑) di atas kepalanya.',
      detailedContent: (
        <div className="space-y-3 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sky-900 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#0284c7] inline-block" />
                <span>Drone Biru: Eksplorasi (&divide;, &times;)</span>
              </div>
              <p className="text-[11px] text-sky-950 leading-relaxed font-sans">
                Operasi perkalian/pembagian. Melompat jauh melintasi kluster server agar tidak
                terjebak lokal.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#059669] inline-block" />
                <span>Drone Hijau: Eksploitasi (-, +)</span>
              </div>
              <p className="text-[11px] text-emerald-950 leading-relaxed font-sans">
                Operasi penjumlahan/pengurangan. Laser hijau menyisir koordinat secara rapat dan
                presisi di dekat target.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-400 space-y-1 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>👑 Drone Bermahkota Emas</span>
              </div>
              <p className="text-[11px] text-amber-950 leading-relaxed font-sans">
                <strong>Inilah sang pemegang rekor dunia saat ini!</strong> Menghasilkan latensi
                terendah sepanjang sejarah putaran.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // ==========================================
  // EVOLUTION STRATEGIES (ES) FAQ (IEEE ACCESS 2022)
  // ==========================================
  const esFaqItems = [
    {
      id: 'es-same-server-makespan',
      badge: 'Teori ES: Kebijakan LJF & Mutasi Alokasi VM',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      icon: Zap,
      iconColor: 'text-purple-800 bg-purple-100 border-purple-200',
      question:
        'Di Evolution Strategies (ES), entitas anak (λ) berada di kluster pusat data yang sama, mengapa waktu Makespan masih bisa terpangkas drastis memecahkan rekor S_best baru?',
      shortAnswer:
        'Makespan terpangkas drastis karena kebijakan LJF (Longest Job First) menempatkan tugas terberat ke prosesor tercepat lebih awal, ditambah mutasi acak 10% memindahkan antrean macet ke VM yang menganggur sehingga Degree of Imbalance (DI) menurun.',
      detailedContent: (
        <div className="space-y-4 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <p>
            Dalam paper <em>Petra Lončar & Paula Lončar (IEEE Access 2022)</em> yang mengevaluasi{' '}
            <strong>49.026 tugas ilmiah CERN ALICE</strong>, entitas solusi adalah pemetaan tugas ke
            2.100 Virtual Machines (VM). Meskipun entitas anak tetap beroperasi di kluster server
            yang sama (misal sama-sama di <strong>DC-1 HPC</strong>), waktu penyelesaian seluruh
            tugas (<strong>Makespan</strong>) bisa berkurang drastis berkat 3 mekanisme murni ES:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            <div className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-950 text-xs">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
                  <Zap className="w-4 h-4" />
                </div>
                <span>1. Kebijakan LJF (Longest Job First)</span>
              </div>
              <p className="text-coffee-700 text-xs leading-normal">
                Broker mengurutkan tugas berdasarkan panjang instruksi. Tugas dengan beban komputasi
                terbesar (hingga <strong>60.780 Million Instructions</strong>) dieksekusi lebih awal
                oleh prosesor VM terkuat (4.500 MIPS), memangkas waktu tunggu server lain di akhir
                jadwal.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-950 text-xs">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
                  <Dna className="w-4 h-4" />
                </div>
                <span>2. Mutasi Acak 10% (Random Resetting)</span>
              </div>
              <p className="text-coffee-700 text-xs leading-normal">
                Tanpa kawin silang (<em>crossover</em>), anak hasil mutasi memindahkan sekitar{' '}
                <strong>10% tugas yang membuat VM macet</strong> ke VM satelit yang sedang
                menganggur (<em>idle</em>). Ini menghilangkan <em>bottleneck</em> pada antrean
                internal server.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-purple-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-purple-950 text-xs">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <Scale className="w-4 h-4" />
                </div>
                <span>3. Penurunan Degree of Imbalance (DI)</span>
              </div>
              <p className="text-coffee-700 text-xs leading-normal">
                Di lokasi datacenter yang sama, beban kerja antar-VM menjadi jauh lebih merata.
                Nilai <strong>DI mendekati nol</strong> membuktikan efisiensi komputasi meningkat
                tajam tanpa perlu memindahkan lokasi fisik server.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'es-near-beacon-no-record',
      badge: 'Evaluasi Makespan & Proteksi Elitisme',
      badgeColor: 'bg-sand-200 text-coffee-900 border-sand-300',
      icon: Target,
      iconColor: 'text-coffee-800 bg-sand-200 border-sand-300',
      question:
        'Di ES, kenapa ada entitas anak yang posisinya sangat dekat dengan suar tapi TIDAK mencetak rekor S_best baru?',
      shortAnswer:
        'Di ES, rekor diukur dari waktu Makespan total (C_max) seluruh 2.100 VM. Entitas di dekat suar masih memiliki susunan antrean tugas yang memicu idle waiting time sehingga Makespan-nya belum mengalahkan S_best.',
      detailedContent: (
        <div className="space-y-3 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <div className="p-3.5 rounded-xl bg-cream-50 border border-sand-200 space-y-2">
            <strong className="text-coffee-950 block text-xs md:text-sm font-semibold">
              Prinsip ES: Makespan Total (C_max) & Mekanisme Elitisme (Elitism)
            </strong>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-coffee-700 pl-1">
              <li>
                <strong>Suar Emas S_best adalah Jadwal Tercepat:</strong> Tiang suar emas memegang
                konfigurasi alokasi dengan Makespan paling singkat yang pernah ditemukan sepanjang
                sejarah generasi.
              </li>
              <li>
                <strong>Waktu Tunggu Antrean (Idle Delay):</strong> Entitas anak yang posisinya dekat
                ke suar masih memiliki beberapa penugasan tugas ke VM yang lambat, sehingga{' '}
                <em>finish time</em> VM terakhir lebih lama dari rekor S_best.
              </li>
              <li>
                <strong>Proteksi Elitisme:</strong> Jika seluruh anak (λ) pada generasi tersebut
                menghasilkan Makespan yang lebih lambat, sistem mempertahankan S_best lama agar
                progres penjadwalan komputasi awan tidak pernah mundur.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'es-five-datacenters',
      badge: '5 Data Center Heterogen CERN ALICE (2.100 VM)',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      icon: Server,
      iconColor: 'text-purple-800 bg-purple-100 border-purple-200',
      question: 'Apa fungsi 5 gedung dengan atap warna-warni dalam simulasi ES?',
      shortAnswer:
        'Itu adalah 5 Kluster Data Center Heterogen CERN LHC ALICE (total 2.100 VM) tempat 49.026 tugas komputasi partikel dialokasikan oleh algoritma ES.',
      detailedContent: (
        <div className="space-y-3 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <p>
            Berdasarkan simulasi jurnal CERN ALICE oleh Lončar & Lončar (2022), beban kerja
            didistribusikan ke 5 kluster dengan kapasitas komputasi heterogen:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#38bdf8] border border-sand-200">
              <span className="font-bold text-[#0284c7]">DC-1: HPC Cluster (4.500 MIPS)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                8 Cores VM. Server komputasi tercepat untuk tugas dengan instruksi terbesar (hingga
                60.780 MI).
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#a855f7] border border-sand-200">
              <span className="font-bold text-[#7c3aed]">DC-2: HTC High-Throughput (3.200 MIPS)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                4 Cores VM. Pemrosesan paralel batch ribuan tugas ilmiah simultan.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#ec4899] border border-sand-200">
              <span className="font-bold text-[#db2777]">DC-3: HSC High-Storage (2.800 MIPS)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                4 Cores VM. Penyimpanan dan pemrosesan berkas input/output eksperimen fisik.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#f59e0b] border border-sand-200">
              <span className="font-bold text-[#d97706]">DC-4: Distributed Storage (2.100 MIPS)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                2 Cores VM. Kluster arsip dan replikasi data mentah detektor CERN.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#10b981] border border-sand-200 sm:col-span-2 lg:col-span-1">
              <span className="font-bold text-[#059669]">DC-5: Core Edge Cloud (3.600 MIPS)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                6 Cores VM (Pusat). Broker LJF dan pengatur lalu lintas komputasi awan.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'es-entity-colors',
      badge: 'Identifikasi Visual Entitas ES (μ & λ)',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      icon: Crown,
      iconColor: 'text-purple-800 bg-purple-100 border-purple-200',
      question:
        'Di ES, apa arti warna entitas bot 3D? Siapa Induk (μ), Keturunan (λ), dan Pemegang Rekor (S_best)?',
      shortAnswer:
        'Ungu adalah Induk (μ Parents), Merah Mawar adalah Keturunan Mutasi (λ 1:7), Hijau adalah Elitis generasi baru, dan Mahkota Emas (👑) adalah pemegang rekor Makespan tercepat (S_best).',
      detailedContent: (
        <div className="space-y-3 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <p>
            Dalam Evolution Strategies, entitas bukan drone aritmatika, melainkan agen strategi
            evolusioner:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-purple-900 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#7c3aed] inline-block" />
                <span>Induk Terpilih (&mu; Parents)</span>
              </div>
              <p className="text-[11px] text-purple-950 leading-relaxed font-sans">
                Berwarna ungu. Strategi penjadwalan terbaik yang disaring dari generasi sebelumnya
                untuk menjadi bibit generasi baru.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-900 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#e11d48] inline-block" />
                <span>Keturunan Mutasi (&lambda; 1:7)</span>
              </div>
              <p className="text-[11px] text-rose-950 leading-relaxed font-sans">
                Berwarna merah mawar. Dihasilkan dengan rasio optimal 1:7 (1 induk melahirkan 7
                anak) melalui mutasi acak 10%.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#16a34a] inline-block" />
                <span>Elitis Generasi Baru</span>
              </div>
              <p className="text-[11px] text-emerald-950 leading-relaxed font-sans">
                Berwarna hijau. Keturunan anak tercepat yang memenangkan seleksi alam dan
                menggantikan posisi induk untuk putaran berikutnya.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-400 space-y-1 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>👑 Juara Rekor S_best</span>
              </div>
              <p className="text-[11px] text-amber-950 leading-relaxed font-sans">
                Mengenakan mahkota emas dan berdiri di dasar tiang suar emas. Memegang Makespan
                paling singkat sepanjang simulasi.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Active items depending on current algorithm
  const currentItems = algorithm === 'ES' ? esFaqItems : aoaFaqItems;

  return (
    <section className="warm-panel rounded-3xl p-6 md:p-8 space-y-6 border-2 border-sand-300 shadow-md bg-gradient-to-br from-cream-100 via-white to-sand-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-sand-200 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl border shadow-sm ${
              algorithm === 'ES'
                ? 'bg-purple-100 text-purple-900 border-purple-300'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            {algorithm === 'ES' ? (
              <Dna className="w-7 h-7 text-purple-900" />
            ) : (
              <HelpCircle className="w-7 h-7 text-amber-900" />
            )}
          </div>
          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                algorithm === 'ES'
                  ? 'bg-purple-100 text-purple-950 border-purple-300'
                  : 'bg-amber-200/80 text-amber-950 border-amber-300'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              Pusat Tanya-Jawab & Panduan Visual 3D ({algorithm})
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-coffee-950 tracking-tight">
              {algorithm === 'ES'
                ? 'Memahami Logika & Objek Simulasi Evolution Strategies (ES)'
                : 'Memahami Logika & Objek Simulasi Arithmetic Optimization Algorithm (AOA)'}
            </h3>
          </div>
        </div>
        <div className="text-xs font-mono text-coffee-600 bg-sand-100 px-3 py-1.5 rounded-xl border border-sand-200 self-start md:self-auto">
          Penjelasan spesifik sesuai teori algoritma yang aktif
        </div>
      </div>

      {/* Accordion Questions */}
      <div className="space-y-3">
        {currentItems.map((item, index) => {
          const isOpen = openIndex === index;
          const IconComp = item.icon;

          return (
            <div
              key={item.id}
              className={`rounded-2xl transition-all border duration-200 overflow-hidden ${
                isOpen
                  ? algorithm === 'ES'
                    ? 'bg-white border-purple-400 shadow-md ring-1 ring-purple-300'
                    : 'bg-white border-amber-400 shadow-md ring-1 ring-amber-300'
                  : 'bg-cream-50/70 hover:bg-white border-sand-200 hover:border-sand-300'
              }`}
            >
              {/* Question Header Button */}
              <button
                onClick={() => toggle(index)}
                className="w-full text-left p-4 md:p-5 flex items-start justify-between gap-4 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 mt-0.5 border shadow-sm ${item.iconColor}`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <h4 className="text-sm md:text-base font-bold text-coffee-950 leading-snug">
                      {item.question}
                    </h4>
                    {!isOpen && (
                      <p className="text-xs text-coffee-600 font-sans line-clamp-1">
                        {item.shortAnswer}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-sand-100 text-coffee-800 shrink-0 mt-1">
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Detailed Expanded Body */}
              {isOpen && (
                <div className="px-5 pb-5 pt-0 border-t border-sand-200/80 animate-fadeIn">
                  {item.detailedContent}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Summary Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-start gap-3 text-xs text-coffee-800 font-sans ${
          algorithm === 'ES'
            ? 'bg-purple-50/80 border-purple-200'
            : 'bg-amber-50/80 border-amber-200'
        }`}
      >
        <Info
          className={`w-5 h-5 shrink-0 mt-0.5 ${
            algorithm === 'ES' ? 'text-purple-700' : 'text-amber-700'
          }`}
        />
        <div>
          <strong className="text-coffee-950 block font-semibold mb-0.5">
            {algorithm === 'ES'
              ? 'Poin Inti Observasi Evolution Strategies (ES):'
              : 'Poin Inti Observasi Arithmetic Optimization Algorithm (AOA):'}
          </strong>
          <span>
            {algorithm === 'ES'
              ? 'Evolution Strategies memodelkan seleksi alam murni (tanpa kawin silang) dengan rasio 1:7 dan mutasi acak 10%. Rekor Makespan baru tercipta ketika alokasi tugas yang macet dipindahkan ke VM ber-MIPS tinggi dan diurutkan oleh kebijakan LJF, meminimalkan durasi eksekusi total (C_max) dan ketidakseimbangan beban (DI).'
              : 'Arithmetic Optimization Algorithm memanfaatkan 4 operasi aritmatika (Bagi, Kali, Kurang, Tambah) dengan fungsi saklar waktu MOA dan pengecil langkah MOP. Rekor latensi baru tercipta saat drone menyisir sweet-spot terendah dengan presisi mikro dan menancapkan tiang suar emas.'}
          </span>
        </div>
      </div>
    </section>
  );
};
