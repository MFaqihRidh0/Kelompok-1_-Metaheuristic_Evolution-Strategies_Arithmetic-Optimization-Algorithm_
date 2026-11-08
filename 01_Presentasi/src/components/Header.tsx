import React from 'react';
import { Server, Calculator, Dna, Split } from 'lucide-react';
import { AlgorithmType } from '../types';

interface HeaderProps {
  algorithm: AlgorithmType;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
}

export const Header: React.FC<HeaderProps> = ({ algorithm, onSelectAlgorithm }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-sand-200 px-4 lg:px-8 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 shadow-sm flex items-center justify-center">
            <Server className="w-6 h-6 text-amber-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs tracking-widest font-mono text-amber-800 uppercase font-bold">
                Cloud Optimization Matrix
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-sand-200 text-coffee-800 font-medium">
                Metaheuristic v2.5
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-coffee-950 flex items-center gap-2">
              AOA <span className="text-sand-400 font-light text-sm">vs</span> Evolution Strategies
            </h1>
          </div>
        </div>

        {/* Algorithm Switcher Tabs (Warm Coffee Palette) */}
        <div className="flex items-center p-1 rounded-2xl bg-sand-100 border border-sand-300 shadow-inner">
          <button
            onClick={() => onSelectAlgorithm('AOA')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 ${
              algorithm === 'AOA'
                ? 'bg-amber-700 text-white shadow-md'
                : 'text-coffee-800 hover:text-coffee-950 hover:bg-sand-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Mode AOA (Aritmatika)</span>
          </button>

          <button
            onClick={() => onSelectAlgorithm('ES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 ${
              algorithm === 'ES'
                ? 'bg-purple-800 text-white shadow-md'
                : 'text-coffee-800 hover:text-coffee-950 hover:bg-sand-200'
            }`}
          >
            <Dna className="w-4 h-4" />
            <span>Mode Evolution Strategies</span>
          </button>

          <button
            onClick={() => onSelectAlgorithm('SPLIT')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 border-l border-sand-300 ml-1 ${
              algorithm === 'SPLIT'
                ? 'bg-coffee-900 text-white shadow-md'
                : 'text-coffee-700 hover:text-coffee-950 hover:bg-sand-200'
            }`}
          >
            <Split className="w-4 h-4" />
            <span className="hidden sm:inline">Split Arena (Race)</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-coffee-700">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-200 border border-sand-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>
              Engine: <strong className="text-coffee-900">Three.js Studio</strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
