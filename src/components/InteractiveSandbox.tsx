import React from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { SimulationParams, AlgorithmType } from '../types';

interface InteractiveSandboxProps {
  algorithm: AlgorithmType;
  params: SimulationParams;
  onChangeParams: (params: SimulationParams) => void;
  onApply: () => void;
}

export const InteractiveSandbox: React.FC<InteractiveSandboxProps> = ({
  algorithm,
  params,
  onChangeParams,
  onApply,
}) => {
  return (
    <section className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-cyber-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              algorithm === 'ES'
                ? 'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple'
                : 'bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">
              Sandbox Interaktif: Eksperimen Parameter {algorithm}
            </h4>
            <p className="text-xs text-slate-400">
              Sesuaikan parameter algoritma di bawah ini untuk menguji responsivitas konvergensi secara langsung.
            </p>
          </div>
        </div>

        <button
          onClick={onApply}
          className={`px-4 py-2 rounded-xl text-cyber-950 font-bold transition text-xs font-mono flex items-center gap-2 shadow-lg ${
            algorithm === 'ES'
              ? 'bg-cyber-purple text-white hover:bg-cyber-violet'
              : 'bg-cyber-cyan hover:bg-cyber-sky'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Terapkan & Uji Ulang</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        {/* Param 1: Population Size / Mu Parents */}
        <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-2">
          <div className="flex justify-between">
            <label className="text-slate-300">
              {algorithm === 'ES' ? 'Bibit Induk (μ):' : 'Populasi (N):'}
            </label>
            <span
              className={`font-bold ${
                algorithm === 'ES' ? 'text-cyber-purple' : 'text-cyber-cyan'
              }`}
            >
              {algorithm === 'ES' ? params.muParents : params.populationSize}
            </span>
          </div>
          <input
            type="range"
            min={algorithm === 'ES' ? 2 : 10}
            max={algorithm === 'ES' ? 10 : 80}
            step={algorithm === 'ES' ? 1 : 5}
            value={algorithm === 'ES' ? params.muParents : params.populationSize}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onChangeParams(
                algorithm === 'ES'
                  ? { ...params, muParents: val }
                  : { ...params, populationSize: val }
              );
            }}
            className={`w-full cursor-pointer ${
              algorithm === 'ES' ? 'accent-purple-400' : 'accent-cyan-400'
            }`}
          />
          <span className="text-[10px] text-slate-500 block">
            {algorithm === 'ES'
              ? 'Jumlah komandan induk terpilih per generasi'
              : 'Jumlah drone penjelajah aritmatika'}
          </span>
        </div>

        {/* Param 2: Max Iterations / Generations */}
        <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-2">
          <div className="flex justify-between">
            <label className="text-slate-300">
              {algorithm === 'ES' ? 'Maks Generasi (G):' : 'Batas Iterasi (M_iter):'}
            </label>
            <span
              className={`font-bold ${
                algorithm === 'ES' ? 'text-cyber-purple' : 'text-cyber-cyan'
              }`}
            >
              {params.maxIterations}
            </span>
          </div>
          <input
            type="range"
            min="30"
            max="250"
            step="10"
            value={params.maxIterations}
            onChange={(e) =>
              onChangeParams({ ...params, maxIterations: parseInt(e.target.value, 10) })
            }
            className={`w-full cursor-pointer ${
              algorithm === 'ES' ? 'accent-purple-400' : 'accent-cyan-400'
            }`}
          />
          <span className="text-[10px] text-slate-500 block">
            Total putaran siklus reproduksi / alokasi
          </span>
        </div>

        {/* Param 3: Ratio (1:7) for ES or Alpha for AOA */}
        {algorithm === 'ES' ? (
          <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-2">
            <div className="flex justify-between">
              <label className="text-slate-300">Rasio Keturunan (λ / μ):</label>
              <span className="text-cyber-pink font-bold">1 : {params.ratio}</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="1"
              value={params.ratio}
              onChange={(e) =>
                onChangeParams({ ...params, ratio: parseInt(e.target.value, 10) })
              }
              className="w-full accent-pink-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">
              Paper rujukan IEEE Access: rasio 1:7 terbukti optimal
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-2">
            <div className="flex justify-between">
              <label className="text-slate-300">Sensitivitas MOP (α):</label>
              <span className="text-cyber-mint font-bold">{params.alpha}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={params.alpha}
              onChange={(e) =>
                onChangeParams({ ...params, alpha: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">
              Derajat kelengkungan kurva langkah non-linear
            </span>
          </div>
        )}

        {/* Param 4: Problem Landscape Topology */}
        <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-2">
          <label className="text-slate-300 block">Topologi Beban Server:</label>
          <select
            value={params.landscape}
            onChange={(e) =>
              onChangeParams({
                ...params,
                landscape: e.target.value as
                  | 'cern_alice'
                  | 'cloud_multi'
                  | 'sphere'
                  | 'rastrigin',
              })
            }
            className="w-full bg-cyber-950 border border-cyber-700 text-slate-200 rounded p-1.5 focus:outline-none focus:border-cyber-purple text-xs"
          >
            <option value="cern_alice">CERN LHC ALICE (5 Data Center Heterogen)</option>
            <option value="cloud_multi">Multi-Cluster Datacenter Standar</option>
            <option value="sphere">Sphere Bowl (Cepat Konvergen)</option>
            <option value="rastrigin">Rastrigin Grid (Banyak Jebakan)</option>
          </select>
          <span className="text-[10px] text-slate-500 block">
            Permukaan latensi & Makespan pemrosesan tugas
          </span>
        </div>
      </div>
    </section>
  );
};
