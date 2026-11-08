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
    <section className="warm-panel p-6 rounded-2xl space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-sand-300 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              algorithm === 'ES'
                ? 'bg-purple-100 border-purple-300 text-purple-900'
                : 'bg-amber-100 border-amber-300 text-amber-900'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-coffee-950">
              Sandbox Interaktif: Eksperimen Parameter {algorithm}
            </h4>
            <p className="text-xs text-coffee-600">
              Sesuaikan parameter algoritma di bawah ini untuk menguji responsivitas konvergensi secara langsung.
            </p>
          </div>
        </div>

        <button
          onClick={onApply}
          className={`px-5 py-2.5 rounded-xl font-bold transition text-xs font-mono flex items-center gap-2 shadow-sm ${
            algorithm === 'ES'
              ? 'bg-purple-800 text-white hover:bg-purple-900'
              : 'bg-amber-700 text-white hover:bg-amber-800'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Terapkan & Uji Ulang</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        {/* Param 1: Population Size / Mu Parents */}
        <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 space-y-2">
          <div className="flex justify-between">
            <label className="text-coffee-800 font-medium">
              {algorithm === 'ES' ? 'Bibit Induk (μ):' : 'Populasi (N):'}
            </label>
            <span
              className={`font-bold ${
                algorithm === 'ES' ? 'text-purple-800' : 'text-amber-800'
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
              algorithm === 'ES' ? 'accent-purple-700' : 'accent-amber-700'
            }`}
          />
          <span className="text-[10px] text-coffee-600 block">
            {algorithm === 'ES'
              ? 'Jumlah komandan induk terpilih per generasi'
              : 'Jumlah drone penjelajah aritmatika'}
          </span>
        </div>

        {/* Param 2: Max Iterations / Generations */}
        <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 space-y-2">
          <div className="flex justify-between">
            <label className="text-coffee-800 font-medium">
              {algorithm === 'ES' ? 'Maks Generasi (G):' : 'Batas Iterasi (M_iter):'}
            </label>
            <span
              className={`font-bold ${
                algorithm === 'ES' ? 'text-purple-800' : 'text-amber-800'
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
              algorithm === 'ES' ? 'accent-purple-700' : 'accent-amber-700'
            }`}
          />
          <span className="text-[10px] text-coffee-600 block">
            Total putaran siklus reproduksi / alokasi
          </span>
        </div>

        {/* Param 3: Ratio (1:7) for ES or Alpha for AOA */}
        {algorithm === 'ES' ? (
          <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 space-y-2">
            <div className="flex justify-between">
              <label className="text-coffee-800 font-medium">Rasio Keturunan (λ / μ):</label>
              <span className="text-rose-800 font-bold">1 : {params.ratio}</span>
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
              className="w-full accent-rose-700 cursor-pointer"
            />
            <span className="text-[10px] text-coffee-600 block">
              Paper rujukan IEEE Access: rasio 1:7 terbukti optimal
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 space-y-2">
            <div className="flex justify-between">
              <label className="text-coffee-800 font-medium">Sensitivitas MOP (α):</label>
              <span className="text-emerald-800 font-bold">{params.alpha}</span>
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
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <span className="text-[10px] text-coffee-600 block">
              Derajat kelengkungan kurva langkah non-linear
            </span>
          </div>
        )}

        {/* Param 4: Problem Landscape Topology */}
        <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 space-y-2">
          <label className="text-coffee-800 font-medium block">Topologi Beban Server:</label>
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
            className="w-full bg-white border border-sand-300 text-coffee-950 rounded-lg p-2 focus:outline-none focus:border-amber-700 text-xs shadow-sm"
          >
            <option value="cern_alice">CERN LHC ALICE (5 Data Center Heterogen)</option>
            <option value="cloud_multi">Multi-Cluster Datacenter Standar</option>
            <option value="sphere">Sphere Bowl (Cepat Konvergen)</option>
            <option value="rastrigin">Rastrigin Grid (Banyak Jebakan)</option>
          </select>
          <span className="text-[10px] text-coffee-600 block">
            Permukaan latensi & Makespan pemrosesan tugas
          </span>
        </div>
      </div>
    </section>
  );
};
