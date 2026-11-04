import React from 'react';
import { StepLog, AlgorithmType } from '../types';
import { Compass, Dna, Info, Sparkles, Target, Activity } from 'lucide-react';

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
                Putaran {iteration} / {maxIterations}
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

      {/* Comparison Score Telemetry (Menjawab Mengapa Rekor Tidak Pecah) */}
      {stepLog.roundBestLatency !== undefined && stepLog.currentRecordLatency !== undefined && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-900 font-semibold">
              <Target className="w-4 h-4 text-amber-700" />
              <span>Rekor Suar Emas (Target yang Dikejar):</span>
            </span>
            <strong className="text-amber-950 text-sm">
              {stepLog.currentRecordLatency.toFixed(2)} ms
            </strong>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-sand-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-coffee-800 font-semibold">
              <Activity className="w-4 h-4 text-sky-700" />
              <span>Tebakan Terbaik Drone Putaran Ini:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <strong className="text-coffee-950 text-sm">
                {stepLog.roundBestLatency.toFixed(2)} ms
              </strong>
              {stepLog.roundBestLatency <= stepLog.currentRecordLatency ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Pecah Rekor!
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sand-200 text-coffee-700">
                  Belum Mengalahkan
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Highlight Badge */}
      <div className="flex items-center gap-2 text-xs font-mono p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 font-medium">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
        <span>{stepLog.highlight}</span>
      </div>

      {/* Educational Clarification Tips (Interactive Multi-Insights) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1 text-[11px] font-sans">
        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300 text-coffee-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <span className="p-1 rounded bg-amber-200 text-amber-900 text-[10px]">💡 Insight 1</span>
            <span>Mengapa Repetisi Kesekian di Titik Suar yang Sama Masih Bisa Pecah Rekor?</span>
          </div>
          <p className="text-coffee-700 leading-relaxed">
            Secara visual di peta 3D tampak mendarat di tiang yang sama, namun <strong>nilai MOP menyusut mikro</strong> sehingga drone menyisir dengan presisi desimal tajam (seperti <em>bor tambang</em> yang mengebor lebih dalam 10 meter di koordinat emas yang sama). Di server awan riil, drone menemukan susunan antrean internal CPU/RAM yang lebih optimal tanpa waktu tunggu.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-sand-100/90 border border-sand-300 text-coffee-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-coffee-950">
            <span className="p-1 rounded bg-sand-200 text-coffee-800 text-[10px]">💡 Insight 2</span>
            <span>Mengapa Drone Dekat ke Suar Tidak Otomatis Memecahkan Rekor?</span>
          </div>
          <p className="text-coffee-700 leading-relaxed">
            Rekor dihitung dari <strong>nilai latensi (ms)</strong>, bukan jarak visual (meter). Tiang suar berdiri di dasar lembah terendah; drone yang dekat dengannya masih berada di lereng bukit (latensinya sedikit lebih tinggi). Rekor <strong>hanya pecah jika latensi drone lebih kecil mutlak (&lt;)</strong>. Penanda rekor sejati adalah drone yang mengenakan <strong>Mahkota Emas (👑)</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
