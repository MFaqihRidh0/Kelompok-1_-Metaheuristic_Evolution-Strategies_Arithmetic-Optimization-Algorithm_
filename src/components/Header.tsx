import React from 'react';
import { Server, Calculator, Dna, Split } from 'lucide-react';
import { AlgorithmType } from '../types';

interface HeaderProps {
  algorithm: AlgorithmType;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
}

export const Header: React.FC<HeaderProps> = ({ algorithm, onSelectAlgorithm }) => {
  return (
    <header className="sticky top-0 z-50 cyber-panel border-b border-cyber-800 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyber-900 border border-cyber-cyan/40 text-cyber-cyan shadow-sm flex items-center justify-center">
            <Server className="w-6 h-6 animate-pulse text-cyber-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest font-mono text-cyber-cyan uppercase font-bold">
                Cloud Optimization Matrix
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyber-800 text-slate-300 border border-slate-700">
                Metaheuristic v2.4
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AOA <span className="text-slate-500 font-light text-sm">vs</span> Evolution Strategies
            </h1>
          </div>
        </div>

        {/* Algorithm Switcher Mode Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-cyber-900/90 border border-cyber-700/60 shadow-inner">
          <button
            onClick={() => onSelectAlgorithm('AOA')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
              algorithm === 'AOA'
                ? 'bg-cyber-cyan text-cyber-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-cyber-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Mode AOA (Aritmatika)</span>
          </button>

          <button
            onClick={() => onSelectAlgorithm('ES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
              algorithm === 'ES'
                ? 'bg-cyber-purple text-white font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-cyber-800'
            }`}
          >
            <Dna className="w-4 h-4" />
            <span>Mode Evolution Strategies</span>
          </button>

          <button
            onClick={() => onSelectAlgorithm('SPLIT')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 border-l border-cyber-800 ml-1 ${
              algorithm === 'SPLIT'
                ? 'bg-cyber-gold text-cyber-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-cyber-800'
            }`}
          >
            <Split className="w-4 h-4" />
            <span className="hidden sm:inline">Split Arena (Race)</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-emerald animate-ping" />
            <span>
              Engine: <strong className="text-slate-200">Three.js 60 FPS</strong>
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};

