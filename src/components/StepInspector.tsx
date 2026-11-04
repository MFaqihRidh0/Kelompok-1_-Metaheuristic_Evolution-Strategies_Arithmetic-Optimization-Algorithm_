import React from 'react';
import { StepLog, AlgorithmType } from '../types';
import { Compass, Dna, Info, Sparkles } from 'lucide-react';

interface StepInspectorProps {
  algorithm: AlgorithmType;
  stepLog: StepLog;
  iteration: number;
  maxIterations: number;
}

export const StepInspector: React.FC<StepInspectorProps> = ({
  algorithm,
  stepLog,
  iteration,
  maxIterations,
}) => {
  return (
    <div className="warm-panel rounded-2xl p-4 md:p-5 border-l-4 border-l-amber-600 space-y-3 bg-gradient-to-r from-cream-100 via-white to-sand-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand-200 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
            {algorithm === 'ES' ? <Dna className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
                Log Langkah Operasional ({algorithm})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-coffee-100 text-coffee-800 border border-coffee-200">
                Langkah {iteration} dari {maxIterations}
              </span>
            </div>
            <h4 className="text-base font-bold text-coffee-950 tracking-tight">
              {stepLog.stepTitle}
            </h4>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-amber-50 border border-amber-200 text-amber-900 font-semibold self-start sm:self-auto">
          <Info className="w-3.5 h-3.5 text-amber-700" />
          <span>Fase: {stepLog.phase}</span>
        </div>
      </div>

      {/* Descriptive Explanation Text */}
      <div className="text-xs md:text-sm text-coffee-900 leading-relaxed font-sans">
        {stepLog.details}
      </div>

      {/* Progress Highlight Badge */}
      <div className="flex items-center gap-2 text-xs font-mono p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 font-medium">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
        <span>{stepLog.highlight}</span>
      </div>

      {/* Educational Clarification Tip */}
      <div className="flex items-start gap-2 text-[11px] font-sans p-2.5 rounded-xl bg-sand-100/70 border border-sand-200 text-coffee-800">
        <span className="font-bold text-amber-800 shrink-0">💡 Mengapa rekor belum berubah saat drone mendekat?</span>
        <span>
          Suar emas (dan drone bermahkota 👑) berdiri di titik rekor <strong>yang sudah ditemukan</strong>. Drone di sekitarnya sedang berkumpul menyisir area tersebut. Rekor baru <strong>hanya akan pecah</strong> jika ada drone yang menemukan konfigurasi server dengan latensi <strong>lebih rendah lagi</strong> daripada titik suar tersebut. Warna <strong>biru/hijau</strong> adalah jenis aksi alat kerja (lompat jauh vs menyisir tanah), bukan penanda juara.
        </span>
      </div>
    </div>
  );
};

