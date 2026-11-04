import React from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import { SimulationParams } from '../types';

interface InteractiveSandboxProps {
  params: SimulationParams;
  onChangeParams: (params: SimulationParams) => void;
  onApply: () => void;
}

export const InteractiveSandbox: React.FC<InteractiveSandboxProps> = ({
  params,
  onChangeParams,
  onApply,
}) => {
  return (
    <section className="cyber-panel p-6 rounded-2xl border border-cyber-700/60 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-cyber-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">
              Sandbox Interaktif: Eksperimen Parameter
            </h4>
            <p className="text-xs text-slate-400">
              Sesuaikan parameter di bawah ini untuk melihat dampaknya langsung pada dinamika konvergensi.
            </p>
          </div>
        </div>

        <button
          onClick={onApply}
          className="px-4 py-2 rounded-xl bg-cyber-cyan text-cyber-950 font-bold hover:bg-cyber-sky transition text-xs font-mono flex items-center gap-2 shadow-lg"
        >
          <Check className="w-4 h-4" />
          <span>Terapkan & Uji Ulang</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        {/* Param 1: Population Size */}
        <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-2">
          <div className="flex justify-between">
            <label className="text-slate-300">Populasi (N):</label>
            <span className="text-cyber-cyan font-bold">{params.populationSize}</span>
          </div>
          <input
            type="range"
            min="10"
            max="80"
            step="5"
            value={params.populationSize}
            onChange={(e) =>
              onChangeParams({ ...params, populationSize: parseInt(e.target.value, 10) })
            }
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">Jumlah drone/agen penjelajah</span>
        </div>

        {/* Param 2: Max Iterations */}
        <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-2">
          <div className="flex justify-between">
            <label className="text-slate-300">Batas Iterasi (M_iter):</label>
            <span className="text-cyber-cyan font-bold">{params.maxIterations}</span>
          </div>
          <input
            type="range"
            min="50"
            max="300"
            step="25"
            value={params.maxIterations}
            onChange={(e) =>
              onChangeParams({ ...params, maxIterations: parseInt(e.target.value, 10) })
            }
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 block">Total putaran siklus pencarian</span>
        </div>

        {/* Param 3: Alpha Parameter */}
        <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-2">
          <div className="flex justify-between">
            <label className="text-slate-300">Sensitivitas MOP ($\alpha$):</label>
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
          <span className="text-[10px] text-slate-500 block">Derajat kelengkungan kurva langkah</span>
        </div>

        {/* Param 4: Problem Landscape */}
        <div className="p-3.5 rounded-xl bg-cyber-900/90 border border-cyber-800 space-y-2">
          <label className="text-slate-300 block">Topologi Beban Server:</label>
          <select
            value={params.landscape}
            onChange={(e) =>
              onChangeParams({
                ...params,
                landscape: e.target.value as 'cloud_multi' | 'sphere' | 'rastrigin',
              })
            }
            className="w-full bg-cyber-950 border border-cyber-700 text-slate-200 rounded p-1.5 focus:outline-none focus:border-cyber-cyan text-xs"
          >
            <option value="cloud_multi">Multi-Cluster Datacenter (Realistis)</option>
            <option value="sphere">Sphere Bowl (Cepat Konvergen)</option>
            <option value="rastrigin">Rastrigin Grid (Banyak Jebakan)</option>
          </select>
          <span className="text-[10px] text-slate-500 block">Bentuk permukaan latensi server</span>
        </div>
      </div>
    </section>
  );
};
