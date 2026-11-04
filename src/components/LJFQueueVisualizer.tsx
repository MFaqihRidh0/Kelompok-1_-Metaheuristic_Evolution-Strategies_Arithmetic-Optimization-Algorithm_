import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, RotateCcw, Zap, Sparkles, CheckCircle2, Clock } from 'lucide-react';

interface TaskJob {
  id: number;
  code: string;
  name: string;
  instructions: number; // in Million Instructions (MI)
  coresRequired: number;
  targetDC: string;
  color: string;
}

const INITIAL_UNSORTED_JOBS: TaskJob[] = [
  { id: 7, code: 'JOB-07', name: 'Event Filtering', instructions: 6800, coresRequired: 1, targetDC: 'DC-4 Storage', color: '#f59e0b' },
  { id: 1, code: 'JOB-01', name: 'Particle Collision Event', instructions: 60780, coresRequired: 8, targetDC: 'DC-1 HPC', color: '#0284c7' },
  { id: 8, code: 'JOB-08', name: 'Metadata Logging', instructions: 2340, coresRequired: 1, targetDC: 'DC-4 Storage', color: '#f59e0b' },
  { id: 3, code: 'JOB-03', name: 'Vertex Reconstruction', instructions: 36200, coresRequired: 4, targetDC: 'DC-2 HTC', color: '#7c3aed' },
  { id: 5, code: 'JOB-05', name: 'Muon Track Identification', instructions: 18400, coresRequired: 2, targetDC: 'DC-3 HSC', color: '#db2777' },
  { id: 2, code: 'JOB-02', name: 'Track Density Reconstruction', instructions: 48500, coresRequired: 6, targetDC: 'DC-1 HPC', color: '#0284c7' },
  { id: 6, code: 'JOB-06', name: 'TOF Time Calibration', instructions: 12300, coresRequired: 2, targetDC: 'DC-3 HSC', color: '#db2777' },
  { id: 4, code: 'JOB-04', name: 'Calorimeter Cluster Matching', instructions: 24100, coresRequired: 4, targetDC: 'DC-2 HTC', color: '#7c3aed' },
];

interface LJFQueueVisualizerProps {
  isRunning: boolean;
  iteration: number;
}

export const LJFQueueVisualizer: React.FC<LJFQueueVisualizerProps> = ({ isRunning, iteration }) => {
  const [isSortedLJF, setIsSortedLJF] = useState<boolean>(false);
  const [isSortingAnimation, setIsSortingAnimation] = useState<boolean>(false);

  // Auto sort when simulation is running
  useEffect(() => {
    if (isRunning && !isSortedLJF) {
      triggerSorting();
    }
  }, [isRunning]);

  const triggerSorting = () => {
    setIsSortingAnimation(true);
    setTimeout(() => {
      setIsSortedLJF(true);
      setIsSortingAnimation(false);
    }, 450);
  };

  const resetToUnsorted = () => {
    setIsSortedLJF(false);
  };

  // Get current ordered list
  const currentJobs = isSortedLJF
    ? [...INITIAL_UNSORTED_JOBS].sort((a, b) => b.instructions - a.instructions)
    : INITIAL_UNSORTED_JOBS;

  return (
    <section className="warm-panel rounded-3xl p-5 md:p-6 border border-sand-300 shadow-md space-y-4 bg-gradient-to-br from-cream-100 via-white to-sand-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-sand-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-900 border border-purple-300 shadow-sm">
            <Zap className="w-6 h-6 text-purple-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                Kebijakan Antrean Broker (Cloud Scheduler)
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-semibold">
                Lončar & Lončar (IEEE Access 2022)
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-coffee-950 tracking-tight">
              Animasi Antrean Tugas &amp; Penjadwalan Longest Job First (LJF)
            </h3>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={triggerSorting}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-sm ${
              isSortedLJF
                ? 'bg-purple-800 text-white shadow-purple-200'
                : 'bg-sand-100 hover:bg-sand-200 text-coffee-900 border border-sand-300'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Terapkan Urutan LJF</span>
          </button>

          <button
            onClick={resetToUnsorted}
            className="p-1.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-coffee-800 border border-sand-300 transition shadow-sm"
            title="Reset ke Urutan Acak Awal (FIFO)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Narrative Info Box */}
      <div className="text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
        {isSortedLJF ? (
          <div className="p-3 rounded-xl bg-purple-50/90 border border-purple-300 text-purple-950 flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">
                Kebijakan LJF Aktif: Tugas Raksasa Bergeser ke Barisan Terdepan!
              </strong>
              <span>
                Tugas dengan Million Instructions (MI) terbesar seperti{' '}
                <strong>JOB-01 (60.780 MI)</strong> dan <strong>JOB-02 (48.500 MI)</strong> otomatis
                dimajukan ke awal antrean untuk langsung diproses oleh VM terkuat di{' '}
                <strong>DC-1 HPC (4.500 MIPS)</strong>. Ini memangkas waktu tunggu server lain di
                akhir jadwal.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-sand-100/90 border border-sand-300 text-coffee-900 flex items-start gap-2.5">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">
                Kondisi Antrean Acak (FIFO): Rawan Bottleneck dan Idle Time!
              </strong>
              <span>
                Tugas kecil (seperti JOB-07: 6.800 MI) menempati antrean depan secara acak, sementara
                tugas raksasa (JOB-01: 60.780 MI) berada di belakang. Jika tidak diurutkan LJF, server
                lain akan selesai lebih cepat dan menganggur berjam-jam menunggu tugas raksasa tuntas
                di akhir waktu.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Queue Conveyor Runway */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-coffee-600 px-1">
          <span className="font-bold text-coffee-900 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            Ujung Depan Antrean (Masuk ke VM Processor Duluan)
          </span>
          <span className="flex items-center gap-1">
            Ujung Belakang Antrean <ArrowRight className="w-3.5 h-3.5 text-coffee-400" />
          </span>
        </div>

        {/* Animated Blocks Strip */}
        <div className="relative overflow-x-auto pb-2">
          <div className="flex items-center gap-2.5 min-w-[760px] p-2 rounded-2xl bg-cream-50 border border-sand-300">
            {currentJobs.map((job, idx) => {
              // Width proportional to instructions size
              const widthPct = Math.max(85, Math.round((job.instructions / 60780) * 175));

              return (
                <div
                  key={job.id}
                  className={`p-2.5 rounded-xl border shadow-sm transition-all duration-500 ease-out flex flex-col justify-between shrink-0 ${
                    idx === 0
                      ? 'ring-2 ring-purple-600 bg-white border-purple-400 shadow-md'
                      : 'bg-white border-sand-200'
                  }`}
                  style={{
                    width: `${widthPct}px`,
                    height: '115px',
                  }}
                >
                  {/* Top Bar: Position & Code */}
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-sand-100 text-coffee-800">
                      #{idx + 1}
                    </span>
                    <span
                      className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold text-white shadow-2xs"
                      style={{ backgroundColor: job.color }}
                    >
                      {job.code}
                    </span>
                  </div>

                  {/* Middle: Instructions Bar Height indicator */}
                  <div className="my-1 space-y-0.5">
                    <div className="flex items-baseline justify-between text-[11px] font-mono font-bold text-coffee-950">
                      <span>{job.instructions.toLocaleString()}</span>
                      <span className="text-[9px] font-normal text-coffee-500">MI</span>
                    </div>

                    <div className="w-full bg-sand-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(job.instructions / 60780) * 100}%`,
                          backgroundColor: job.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Bottom: Target Datacenter */}
                  <div className="text-[9px] font-mono text-coffee-600 border-t border-sand-200 pt-1 flex items-center justify-between">
                    <span>{job.coresRequired} Cores</span>
                    <strong className="text-coffee-900 truncate max-w-[80px]">
                      {job.targetDC}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Benchmark Metric Comparison Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
        <div className="p-2.5 rounded-xl bg-white border border-sand-200 flex items-center justify-between">
          <span className="text-coffee-600">Makespan (FIFO Acak):</span>
          <span className="font-bold text-rose-700 text-sm">42.8 detik</span>
        </div>

        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-300 flex items-center justify-between">
          <span className="text-purple-900 font-semibold">Makespan (ES + LJF):</span>
          <span className="font-bold text-purple-950 text-sm">24.1 detik</span>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
          <span className="text-emerald-900 font-semibold">Efisiensi Pemangkasan:</span>
          <span className="font-bold text-emerald-800 text-sm flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 43.7% Lebih Cepat
          </span>
        </div>
      </div>
    </section>
  );
};
