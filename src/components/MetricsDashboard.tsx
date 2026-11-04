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
            borderColor: algorithm === 'ES' ? '#7c3aed' : '#b45309',
            borderWidth: 2.2,
            pointRadius: 0,
            fill: true,
            backgroundColor:
              algorithm === 'ES'
                ? 'rgba(124, 58, 237, 0.08)'
                : 'rgba(180, 83, 9, 0.08)',
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
            grid: { color: 'rgba(219, 190, 170, 0.4)' },
            ticks: { color: '#785642', font: { size: 9, family: 'monospace' } },
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
    chart.data.datasets[0].borderColor = algorithm === 'ES' ? '#7c3aed' : '#b45309';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Makespan (C_max) */}
        <div className="warm-panel p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-coffee-700">
              Makespan (C<sub>max</sub>)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-mono text-[11px] font-bold">
              Durasi Total
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-mono font-bold text-coffee-950">
              {bestFitness === Infinity ? '---' : `${bestFitness.toFixed(2)}`}
            </div>
            <span className="text-[11px] text-coffee-600 font-mono">ms / detik</span>
          </div>
          <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden border border-sand-200">
            <div
              className="h-full bg-purple-600 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, (bestFitness / 20) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-coffee-700 leading-tight">
            Durasi sejak tugas pertama diproses hingga tugas paling akhir selesai di seluruh VM.
          </p>
        </div>

        {/* Card 2: Degree of Imbalance (DI) */}
        <div className="warm-panel p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-coffee-700">
              Degree of Imbalance (DI)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-mono text-[11px] font-bold">
              Keseimbangan
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-mono font-bold text-rose-700">
              {defaultMetrics.degreeOfImbalance.toFixed(3)}
            </div>
            <span className="text-[11px] text-coffee-600 font-mono">Target &le; 0.08</span>
          </div>
          <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden border border-sand-200">
            <div
              className="h-full bg-rose-600 transition-all duration-300 rounded-full"
              style={{ width: `${Math.max(5, (1 - defaultMetrics.degreeOfImbalance) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-coffee-700 leading-tight">
            Disparitas beban antar-server. Semakin mendekati nol, alokasi beban semakin merata.
          </p>
        </div>

        {/* Card 3: Elastisitas VM Aktif (Auto-Scaling) */}
        <div className="warm-panel p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-coffee-700">
              Auto-Scaling VM Aktif
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold">
              Elastis
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-mono font-bold text-emerald-700">
              {defaultMetrics.activeVMs}
            </div>
            <span className="text-[11px] text-coffee-600 font-mono">Mesin Virtual</span>
          </div>
          <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden border border-sand-200">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, (defaultMetrics.activeVMs / 900) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-coffee-700 leading-tight">
            Scale-out bertambah saat beban puncak dan scale-in ke nol saat pekerjaan tuntas.
          </p>
        </div>

        {/* Card 4: Sparkline Konvergensi ES */}
        <div className="warm-panel p-4 rounded-xl space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-coffee-700">
              Konvergensi Makespan
            </span>
            <span className="text-[10px] font-mono text-purple-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" /> Makespan vs Generasi
            </span>
          </div>
          <div className="w-full h-20 bg-cream-50 rounded-lg p-1 border border-sand-200">
            <canvas ref={chartCanvasRef} className="w-full h-full" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-coffee-700">
            <span>Awal: {history[0]?.toFixed(1) || '--'} ms</span>
            <span>
              Optimum:{' '}
              <strong className="text-emerald-700 font-bold">
                {bestFitness === Infinity ? '--' : bestFitness.toFixed(2)} ms
              </strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default AOA Display
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. MOA */}
      <div className="warm-panel p-4 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-coffee-700">
            Saklar Waktu (MOA)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[11px] font-bold">
            Transisi Fase
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-mono font-bold text-coffee-950">{moa.toFixed(3)}</div>
          <span className="text-[11px] text-coffee-600 font-mono">Range [0.2 - 0.9]</span>
        </div>
        <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden border border-sand-200">
          <div
            className="h-full bg-amber-600 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, (moa / 0.9) * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-coffee-700 leading-tight">
          Menentukan proporsi kapan tim melompat jauh (Eksplorasi) vs menyisir rapat (Eksploitasi).
        </p>
      </div>

      {/* 2. MOP */}
      <div className="warm-panel p-4 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-coffee-700">
            Pengecil Langkah (MOP)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono text-[11px] font-bold">
            Presisi
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-mono font-bold text-emerald-700">{mop.toFixed(3)}</div>
          <span className="text-[11px] text-coffee-600 font-mono">Sensitivitas &alpha; = 5</span>
        </div>
        <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden border border-sand-200">
          <div
            className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
            style={{ width: `${Math.min(100, mop * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-coffee-700 leading-tight">
          Koefisien langkah non-linear agar koordinat drone makin stabil dan halus di akhir iterasi.
        </p>
      </div>

      {/* 3. 4 Operators Distribution */}
      <div className="warm-panel p-4 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-coffee-700">
            Distribusi Operator
          </span>
          <span className="text-[10px] font-mono text-coffee-600">Populasi: {totalAgents}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
          <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200">
            <span className="text-[10px] text-sky-800 block">Bagi (÷)</span>
            <strong className="text-sm font-bold text-sky-900">{opCounts.div}</strong>
          </div>
          <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200">
            <span className="text-[10px] text-sky-800 block">Kali (×)</span>
            <strong className="text-sm font-bold text-sky-900">{opCounts.mul}</strong>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] text-emerald-800 block">Kurang (-)</span>
            <strong className="text-sm font-bold text-emerald-900">{opCounts.sub}</strong>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] text-emerald-800 block">Tambah (+)</span>
            <strong className="text-sm font-bold text-emerald-900">{opCounts.add}</strong>
          </div>
        </div>
        <p className="text-[11px] text-coffee-700 leading-tight">
          Distribusi kalkulasi 4 operator aritmatika pada iterasi yang sedang aktif.
        </p>
      </div>

      {/* 4. Convergence Sparkline */}
      <div className="warm-panel p-4 rounded-xl space-y-2 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-coffee-700">
            Grafik Konvergensi
          </span>
          <span className="text-[10px] font-mono text-amber-700 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Latensi vs Iterasi
          </span>
        </div>
        <div className="w-full h-20 bg-cream-50 rounded-lg p-1 border border-sand-200">
          <canvas ref={chartCanvasRef} className="w-full h-full" />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-coffee-700">
          <span>Awal: {history[0]?.toFixed(1) || '--'} ms</span>
          <span>
            Optimum:{' '}
            <strong className="text-emerald-700 font-bold">
              {bestFitness === Infinity ? '--' : bestFitness.toFixed(2)} ms
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
