import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Target,
  Compass,
  Server,
  Crown,
  Pickaxe,
  Crosshair,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export const VisualFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Open first question by default

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems = [
    {
      id: 'same-spot-record',
      badge: 'Fenomena Paling Sering Ditanyakan',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: Pickaxe,
      iconColor: 'text-amber-800 bg-amber-100 border-amber-200',
      question:
        'Secara visual drone di repetisi kesekian berada di titik suar yang sama, tapi mengapa bisa memecahkan rekor baru? Padahal secara jarak tampak sama saja?',
      shortAnswer:
        'Jarak visual di layar 3D tampak sama, namun nilai MOP (presisi langkah) menyusut mikro sehingga drone mengebor lebih dalam di titik sweet-spot yang sama dengan konfigurasi internal alokasi cloud yang lebih sempurna.',
      detailedContent: (
        <div className="space-y-4 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <p>
            Fenomena ini sangat wajar membuat bingung saat pertama kali melihat simulasi 3D. Pada
            iterasi ke-5, ada drone yang mendarat di suar dan mencetak rekor latensi{' '}
            <strong className="text-amber-900 font-mono">7.91 ms</strong>. Kemudian pada iterasi
            ke-35, ada drone lain yang tampaknya mendarat persis di tiang suar yang sama, namun
            tiba-tiba memecahkan rekor baru menjadi{' '}
            <strong className="text-emerald-800 font-mono">6.80 ms</strong>.
          </p>

          <p>
            Secara visual mata kita hanya melihat posisi fisik 3D di koordinat lantai yang sama.
            Berikut adalah 3 alasan ilmiah mengapa latensi tetap bisa turun drastis:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* Analogi 1 */}
            <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <Pickaxe className="w-4 h-4" />
                </div>
                <span>1. Analogi Bor Tambang Emas</span>
              </div>
              <p className="text-coffee-700 text-xs leading-normal">
                Bayangkan tiang suar adalah tanda bahwa di lokasi tanah tersebut ada urat emas. Drone
                pertama baru mencangkul di <strong>kedalaman 1 meter</strong> (kemurnian 7.91 ms).
                Drone di repetisi berikutnya <strong>mengebor lebih dalam di titik yang sama</strong>{' '}
                hingga <strong>kedalaman 10 meter</strong> (kemurnian 6.80 ms). Lokasi di peta sama,
                tetapi kualitas hasil galiannya jauh lebih murni dan bernilai!
              </p>
            </div>

            {/* Analogi 2 */}
            <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <Crosshair className="w-4 h-4" />
                </div>
                <span>2. Presisi Langkah MOP Mengecil</span>
              </div>
              <p className="text-coffee-700 text-xs leading-normal">
                Di awal simulasi, parameter <strong>MOP</strong> (Math Optimizer Probability) bernilai
                besar (~0.8). Langkah drone masih kasar. Di repetisi kesekian, MOP menyusut menjadi
                angka sub-mikro (~0.05). Drone menyisir dengan <strong>ketelitian desimal mikro</strong>{' '}
                (misal dari koordinat 0.45 menjadi 0.002) tepat di titik <em>sweet spot</em> inti
                server yang sebelumnya terlewat beberapa milimeter.
              </p>
            </div>

            {/* Analogi 3 */}
            <div className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <div className="p-1.5 rounded-lg bg-sky-100 text-sky-800">
                  <Layers className="w-4 h-4" />
                </div>
                <span>3. Dimensi Internal Alokasi Cloud</span>
              </div>
              <p className="text-coffee-700 text-xs leading-normal">
                Di dunia komputasi awan riil, solusi optimasi bukan sekadar posisi 2D di lantai.
                Solusi adalah vektor alokasi <strong>Core CPU, kapasitas RAM, dan antrean penjadwalan VM</strong>.
                Drone di repetisi berikutnya menemukan susunan antrean internal di gedung server
                tersebut yang lebih efisien tanpa antrean tunggu (zero contention delay).
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'near-beacon-no-record',
      badge: 'Topografi & Kelerengan Latensi',
      badgeColor: 'bg-sand-200 text-coffee-900 border-sand-300',
      icon: Target,
      iconColor: 'text-coffee-800 bg-sand-200 border-sand-300',
      question:
        'Kenapa ada drone yang tampak terbang sangat dekat ke suar tapi TIDAK mencetak rekor baru?',
      shortAnswer:
        'Karena rekor dihitung dari nilai latensi server (ms), bukan jarak visual (meter). Tiang suar berdiri di dasar lembah terendah; drone yang dekat dengannya masih berada di lereng bukit dengan latensi yang sedikit lebih tinggi.',
      detailedContent: (
        <div className="space-y-3 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <p>
            Pengguna sering melihat ada drone biru yang melintas atau hinggap tepat di sebelah tiang
            suar emas, tetapi angka rekor dunia di layar tetap tidak berubah. Mengapa demikian?
          </p>

          <div className="p-3.5 rounded-xl bg-cream-50 border border-sand-200 space-y-2">
            <strong className="text-coffee-950 block text-xs md:text-sm font-semibold">
              Prinsip: Jarak Visual (Meter) &ne; Nilai Latensi Server (ms)
            </strong>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-coffee-700 pl-1">
              <li>
                <strong>Tiang Suar Emas adalah Rekor yang Sudah Tercatat:</strong> Tiang suar
                didirikan persis di titik terendah yang pernah ditemukan oleh agen mana pun dalam
                seluruh sejarah pencarian (misal latensi <strong>7.91 ms</strong>).
              </li>
              <li>
                <strong>Lanskap Bergelombang (Bukan Lantai Datar):</strong> Topografi server memiliki
                lembah dan perbukitan matematis. Drone yang terbang di dekat suar berada di{' '}
                <em>lereng sekitar lembah</em>. Misalnya, titik tersebut memiliki latensi{' '}
                <span className="font-mono text-rose-700 font-semibold">8.04 ms</span>.
              </li>
              <li>
                <strong>Syarat Pemecahan Rekor Mutlak:</strong> Karena 8.04 ms &gt; 7.91 ms, drone
                tersebut <strong>gagal memecahkan rekor</strong>. Rekor hanya akan pecah jika ada drone
                yang menemukan titik dengan latensi <em>strictly lower</em> (&lt;) dari 7.91 ms.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'five-buildings-function',
      badge: 'Infrastruktur Komputasi Awan',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: Server,
      iconColor: 'text-emerald-800 bg-emerald-100 border-emerald-200',
      question: 'Apa fungsi 5 gedung dengan atap warna-warni yang ada di animasi 3D?',
      shortAnswer:
        'Itu adalah 5 Pusat Data (Datacenter Clusters) Heterogen CERN LHC ALICE dengan kapasitas MIPS dan jumlah Core VM yang berbeda-beda, tempat beban ribuan tugas ilmiah dialokasikan.',
      detailedContent: (
        <div className="space-y-3 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <p>
            Kelima gedung tersebut bukan sekadar hiasan visual, melainkan representasi dari{' '}
            <strong>5 Kluster Pusat Data Heterogen</strong> yang dimodelkan berdasarkan paper ilmiah{' '}
            <em>Petra Lončar & Paula Lončar (IEEE Access 2022)</em> saat mengevaluasi 49.026 tugas
            simulasi partikel CERN LHC ALICE:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#38bdf8] border border-sand-200">
              <span className="font-bold text-[#0284c7]">DC-1: HPC Cluster</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                4.500 MIPS &bull; 8 Cores VM. Server komputasi kelas berat dengan kecepatan tercepat
                untuk tugas ber-instruksi masif.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#a855f7] border border-sand-200">
              <span className="font-bold text-[#7c3aed]">DC-2: HTC High-Throughput</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                3.200 MIPS &bull; 4 Cores VM. Dirancang untuk memproses ribuan tugas ilmiah kecil
                secara paralel tanpa antrean macet.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#ec4899] border border-sand-200">
              <span className="font-bold text-[#db2777]">DC-3: HSC High-Storage</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                2.800 MIPS &bull; 4 Cores VM. Kluster khusus operasi input/output dan analisis berkas
                eksperimen partikel besar.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#f59e0b] border border-sand-200">
              <span className="font-bold text-[#d97706]">DC-4: Distributed Storage</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                2.100 MIPS &bull; 2 Cores VM. Server replika terdistribusi untuk pengarsipan data
                mentah detektor fisik.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white border-l-4 border-l-[#10b981] border border-sand-200 sm:col-span-2 lg:col-span-1">
              <span className="font-bold text-[#059669]">DC-5: Core Edge Cloud (Tengah)</span>
              <p className="text-[11px] text-coffee-700 font-sans mt-0.5">
                3.600 MIPS &bull; 6 Cores VM. Broker penghubung lalu lintas data dan gerbang utama
                distribusi komputasi awan.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'drone-colors-champion',
      badge: 'Identifikasi Visual & Peran',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      icon: Crown,
      iconColor: 'text-purple-800 bg-purple-100 border-purple-200',
      question: 'Apa arti warna drone? Siapa yang menjadi penanda rekor, drone biru atau hijau?',
      shortAnswer:
        'Warna Biru dan Hijau adalah jenis alat aksi (lompat jauh vs menyisir tanah), BUKAN penanda juara. Penanda rekor sejati adalah drone yang mengenakan MAHKOTA EMAS (👑) di atas kepalanya dan berada di tiang suar emas.',
      detailedContent: (
        <div className="space-y-3 pt-2 text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
          <p>
            Banyak pengguna mengira drone biru adalah pemenang atau drone hijau adalah pemenang.
            Sebenarnya, warna tubuh drone menunjukkan <strong>operasi matematika yang sedang dijalankan</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sky-900 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#0284c7] inline-block" />
                <span>Drone Biru: Eksplorasi (&divide;, &times;)</span>
              </div>
              <p className="text-[11px] text-sky-950 leading-relaxed font-sans">
                Sedang menggunakan operasi perkalian atau pembagian. Drone ini bertugas terbang tinggi
                dan melompat jauh untuk mencari kluster server baru agar tidak terjebak.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#059669] inline-block" />
                <span>Drone Hijau: Eksploitasi (-, +)</span>
              </div>
              <p className="text-[11px] text-emerald-950 leading-relaxed font-sans">
                Sedang menggunakan operasi penjumlahan atau pengurangan. Dilengkapi{' '}
                <strong>laser pemindai hijau</strong> ke tanah untuk menyisir koordinat secara presisi
                di dekat target suar.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-400 space-y-1 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-xs">
                <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>👑 Drone Bermahkota: Juara Rekor</span>
              </div>
              <p className="text-[11px] text-amber-950 leading-relaxed font-sans">
                <strong>Inilah sang pemegang rekor dunia saat ini!</strong> Memiliki cincin emas dan
                berlian bintang di atas kepalanya. Drone ini yang menghasilkan nilai latensi terendah
                sepanjang sejarah iterasi.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="warm-panel rounded-3xl p-6 md:p-8 space-y-6 border-2 border-sand-300 shadow-md bg-gradient-to-br from-cream-100 via-white to-sand-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-sand-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
            <HelpCircle className="w-7 h-7 text-amber-900" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-200/80 text-amber-950 border border-amber-300">
              <Sparkles className="w-3 h-3 text-amber-800" />
              Pusat Tanya-Jawab & Panduan Visual 3D
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-coffee-950 tracking-tight">
              Memahami Fenomena & Objek di Layar Simulasi
            </h3>
          </div>
        </div>
        <div className="text-xs font-mono text-coffee-600 bg-sand-100 px-3 py-1.5 rounded-xl border border-sand-200 self-start md:self-auto">
          Klik setiap kartu pertanyaan untuk membaca detail ilmiahnya
        </div>
      </div>

      {/* Accordion Questions */}
      <div className="space-y-3">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          const IconComp = item.icon;

          return (
            <div
              key={item.id}
              className={`rounded-2xl transition-all border duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-white border-amber-400 shadow-md ring-1 ring-amber-300'
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
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-coffee-800 font-sans">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-coffee-950 block font-semibold mb-0.5">
            Poin Inti Observasi Simulasi Metaheuristik:
          </strong>
          <span>
            Simulasi 3D ini memetakan ruang multi-dimensi (Core, RAM, Antrean MIPS, Latensi Jaringan)
            ke koordinat ruang yang mudah dipahami manusia. Rekor baru adalah penemuan matematis
            terhadap konfigurasi server dengan latensi absolut terendah, di mana perbaikan terus
            terjadi bahkan di titik gedung server yang sama berkat penyempurnaan parameter presisi MOP
            dan mutasi adaptif.
          </span>
        </div>
      </div>
    </section>
  );
};
