import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { OperatorCounts, ESMetrics, AlgorithmType } from '../types';

Chart.register(...registerables);

interface MetricsDashboardProps {
  algorithm: AlgorithmType;
  moa: number;
  mop: number;
  opCounts: OperatorCounts;
  totalAgents: number;
  history: number[];
  bestFitness: number;
  esMetrics?: ESMetrics;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  algorithm,
  moa,
  mop,
  opCounts,
  totalAgents,
  history,
  bestFitness,
  esMetrics,
}) => {
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartCanvasRef.current) return;
    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: history.map((_, i) => i),
        datasets: [
          {
            data: history,
            borderColor: algorithm === 'ES' ? '#a855f7' : '#f59e0b',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            backgroundColor:
              algorithm === 'ES'
                ? 'rgba(168, 85, 247, 0.12)'
                : 'rgba(245, 158, 11, 0.1)',
            tension: 0.25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          x: { display: false },
          y: {
            display: true,
            grid: { color: 'rgba(51, 65, 85, 0.2)' },
            ticks: { color: '#64748b', font: { size: 9, family: 'monospace' } },
          },
        },
        animation: false,
      },
    });

    chartInstanceRef.current = chart;

    return () => {
      chart.destroy();
    };
  }, [algorithm]);

  // Update chart data whenever history updates
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;
    chart.data.labels = history.map((_, i) => i);
    chart.data.datasets[0].data = history;
    chart.data.datasets[0].borderColor = algorithm === 'ES' ? '#a855f7' : '#f59e0b';
    chart.update();
  }, [history, algorithm]);

  // If ES mode, display ES specific telemetries
  if (algorithm === 'ES') {
    const defaultMetrics: ESMetrics = esMetrics || {
      generation: 0,
      makespan: bestFitness,
      degreeOfImbalance: 0.42,
      activeVMs: 320,
      mutationCount: 0,
      currentStepDescription: 'Inisialisasi populasi induk (μ)',
    };

    return (
      <section className="space-y-4">
        {/* Step-by-Step Storyboard Narrative Banner */}
        <div className="p-3.5 rounded-xl bg-cyber-900/95 border border-cyber-purple/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-pink animate-ping" />
            <span className="text-xs font-mono font-bold text-cyber-violet uppercase">
              Proses ES Berjalan:
            </span>
            <span className="text-xs text-slate-200 font-medium">
              {defaultMetrics.currentStepDescription}
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyber-purple/20 text-cyber-pink border border-cyber-purple/30">
            Rasio Induk-Anak 1 : 7
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Makespan (C_max) */}
          <div className="cyber-panel p-4 rounded-xl border border-cyber-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Makespan (C<sub>max</sub>)
              </span>
              <span className="p-1 rounded bg-cyber-purple/10 text-cyber-violet font-mono text-xs font-bold">
                Durasi Total
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-white">
                {bestFitness === Infinity ? '---' : `${bestFitness.toFixed(2)}`}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">ms / detik</span>
            </div>
            <div className="w-full h-1.5 bg-cyber-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyber-purple transition-all duration-200"
                style={{ width: `${Math.min(100, (bestFitness / 20) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Waktu sejak tugas pertama mulai diproses hingga tugas paling akhir tuntas di seluruh VM.
            </p>
          </div>

          {/* Card 2: Degree of Imbalance (DI) */}
          <div className="cyber-panel p-4 rounded-xl border border-cyber-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Degree of Imbalance (DI)
              </span>
              <span className="p-1 rounded bg-cyber-pink/10 text-cyber-pink font-mono text-xs font-bold">
                Keadilan Beban
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-cyber-pink">
                {defaultMetrics.degreeOfImbalance.toFixed(3)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Target &le; 0.08</span>
            </div>
            <div className="w-full h-1.5 bg-cyber-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyber-pink transition-all duration-200"
                style={{ width: `${Math.max(5, (1 - defaultMetrics.degreeOfImbalance) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Mengukur disparitas utilisasi server. Nilai mendekati nol menandakan beban merata.
            </p>
          </div>

          {/* Card 3: Elastisitas VM Aktif (Auto-Scaling) */}
          <div className="cyber-panel p-4 rounded-xl border border-cyber-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Penskalaan VM (Auto-Scale)
              </span>
              <span className="text-[10px] font-mono text-cyber-mint bg-cyber-mint/10 px-1.5 py-0.5 rounded">
                Dinamis
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-cyber-mint">
                {defaultMetrics.activeVMs}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">VM Instans Aktif</span>
            </div>
            <div className="w-full h-1.5 bg-cyber-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyber-mint transition-all duration-200"
                style={{ width: `${Math.min(100, (defaultMetrics.activeVMs / 900) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Instans VM otomatis scale-out saat beban antrean tinggi, dan scale-in saat tugas rampung.
            </p>
          </div>

          {/* Card 4: Sparkline Konvergensi ES */}
          <div className="cyber-panel p-4 rounded-xl border border-cyber-700/60 space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Konvergensi Makespan
              </span>
              <span className="text-[10px] font-mono text-cyber-purple flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-purple" /> Makespan vs Generasi
              </span>
            </div>
            <div className="w-full h-20 bg-cyber-950/60 rounded-lg p-1 border border-cyber-800">
              <canvas ref={chartCanvasRef} className="w-full h-full" />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Awal: {history[0]?.toFixed(1) || '--'} ms</span>
              <span>
                Optimum:{' '}
                <strong className="text-cyber-lime font-bold">
                  {bestFitness === Infinity ? '--' : bestFitness.toFixed(2)} ms
                </strong>
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Default AOA & Split Display
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. MOA */}
      <div className="cyber-panel p-4 rounded-xl border border-cyber-700/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Saklar Waktu (MOA)
          </span>
          <span className="p-1 rounded bg-cyber-cyan/10 text-cyber-cyan font-mono text-xs font-bold">
            Transisi Fase
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-mono font-bold text-white">{moa.toFixed(3)}</div>
          <span className="text-[11px] text-slate-400 font-mono">Range [0.2 - 0.9]</span>
        </div>
        <div className="w-full h-1.5 bg-cyber-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyber-cyan transition-all duration-200"
            style={{ width: `${Math.min(100, (moa / 0.9) * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Menentukan kapan tim beralih dari melompat jauh (Eksplorasi) ke menyisir rapat (Eksploitasi).
        </p>
      </div>

      {/* 2. MOP */}
      <div className="cyber-panel p-4 rounded-xl border border-cyber-700/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Pengecil Langkah (MOP)
          </span>
          <span className="p-1 rounded bg-cyber-mint/10 text-cyber-mint font-mono text-xs font-bold">
            Akurasi
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-mono font-bold text-cyber-mint">{mop.toFixed(3)}</div>
          <span className="text-[11px] text-slate-400 font-mono">Sensitivitas &alpha; = 5</span>
        </div>
        <div className="w-full h-1.5 bg-cyber-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyber-mint transition-all duration-200"
            style={{ width: `${Math.min(100, mop * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Koefisien langkah non-linear agar koordinat agen makin stabil dan tidak meleset di akhir pencarian.
        </p>
      </div>

      {/* 3. 4 Operators Distribution */}
      <div className="cyber-panel p-4 rounded-xl border border-cyber-700/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Distribusi Operator
          </span>
          <span className="text-[10px] font-mono text-slate-400">Populasi: {totalAgents}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div className="p-1.5 rounded bg-cyber-900/80 border border-cyber-cyan/30">
            <span className="text-[10px] text-slate-400 block">Bagi (÷)</span>
            <strong className="text-sm font-bold text-cyber-cyan">{opCounts.div}</strong>
          </div>
          <div className="p-1.5 rounded bg-cyber-900/80 border border-cyber-sky/30">
            <span className="text-[10px] text-slate-400 block">Kali (×)</span>
            <strong className="text-sm font-bold text-cyber-sky">{opCounts.mul}</strong>
          </div>
          <div className="p-1.5 rounded bg-cyber-900/80 border border-cyber-emerald/30">
            <span className="text-[10px] text-slate-400 block">Kurang (-)</span>
            <strong className="text-sm font-bold text-cyber-emerald">{opCounts.sub}</strong>
          </div>
          <div className="p-1.5 rounded bg-cyber-900/80 border border-cyber-mint/30">
            <span className="text-[10px] text-slate-400 block">Tambah (+)</span>
            <strong className="text-sm font-bold text-cyber-mint">{opCounts.add}</strong>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Rincian eksekusi kalkulasi aritmatika pada iterasi yang sedang aktif.
        </p>
      </div>

      {/* 4. Convergence Sparkline */}
      <div className="cyber-panel p-4 rounded-xl border border-cyber-700/60 space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Grafik Konvergensi
          </span>
          <span className="text-[10px] font-mono text-cyber-gold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-gold" /> Latensi vs Iterasi
          </span>
        </div>
        <div className="w-full h-20 bg-cyber-950/60 rounded-lg p-1 border border-cyber-800">
          <canvas ref={chartCanvasRef} className="w-full h-full" />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Awal: {history[0]?.toFixed(1) || '--'} ms</span>
          <span>
            Optimum:{' '}
            <strong className="text-cyber-emerald font-bold">
              {bestFitness === Infinity ? '--' : bestFitness.toFixed(2)} ms
            </strong>
          </span>
        </div>
      </div>
    </section>
  );
};
