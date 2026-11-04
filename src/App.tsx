import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Cpu,
  Award,
  CheckCircle,
  Terminal,
} from 'lucide-react';
import { Header } from './components/Header';
import { ThreeCanvas } from './components/ThreeCanvas';
import { MetricsDashboard } from './components/MetricsDashboard';
import { EducationalCards } from './components/EducationalCards';
import { ESEducationalCards } from './components/ESEducationalCards';
import { InteractiveSandbox } from './components/InteractiveSandbox';
import {
  Agent,
  AlgorithmType,
  GlobalBest,
  OperatorCounts,
  SimulationParams,
  ESMetrics,
} from './types';
import { initAOAPopulation, stepAOA } from './algorithms/aoa';
import { initESPopulation, stepES } from './algorithms/es';

export const App: React.FC = () => {
  // Algorithm & Simulation State
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('AOA');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(3); // 1x, 3x, 8x, 20x
  const [iteration, setIteration] = useState<number>(0);

  // Simulation Parameters
  const [params, setParams] = useState<SimulationParams>({
    populationSize: 30,
    maxIterations: 100,
    alpha: 5,
    muParents: 5,
    ratio: 7, // 1:7 optimal rule from paper
    mutationRate: 0.10, // 10%
    landscape: 'cern_alice',
  });

  // Algorithm Dynamic States
  const [agents, setAgents] = useState<Agent[]>([]);
  const [esOffspring, setEsOffspring] = useState<Agent[]>([]);
  const [globalBest, setGlobalBest] = useState<GlobalBest>({
    position: [0, 0],
    fitness: Infinity,
    iteration: 0,
  });

  const [moa, setMoa] = useState<number>(0.2);
  const [mop, setMop] = useState<number>(1.0);
  const [isExploration, setIsExploration] = useState<boolean>(true);
  const [opCounts, setOpCounts] = useState<OperatorCounts>({ div: 0, mul: 0, sub: 0, add: 0 });
  const [esMetrics, setEsMetrics] = useState<ESMetrics | undefined>(undefined);
  const [stepPhase, setStepPhase] = useState<number>(1);
  const [convergenceHistory, setConvergenceHistory] = useState<number[]>([]);

  // Simulation loop timer
  const loopRef = useRef<number | null>(null);

  // Initialize Population based on active mode
  const initializeSimulation = useCallback(() => {
    setIteration(0);
    setIsRunning(false);

    if (algorithm === 'AOA') {
      const { agents: initialAgents, globalBest: best } = initAOAPopulation(
        params.populationSize,
        params.landscape === 'cern_alice' ? 'cloud_multi' : params.landscape
      );
      setAgents(initialAgents);
      setEsOffspring([]);
      setGlobalBest(best);
      setConvergenceHistory([best.fitness]);
      setMoa(0.2);
      setMop(1.0);
      setIsExploration(true);
      setOpCounts({ div: 0, mul: 0, sub: 0, add: 0 });
      setEsMetrics(undefined);
    } else if (algorithm === 'ES') {
      const { parents, globalBest: best, metrics } = initESPopulation(
        params.muParents,
        params.landscape
      );
      setAgents(parents);
      setEsOffspring([]);
      setGlobalBest(best);
      setConvergenceHistory([best.fitness]);
      setIsExploration(true);
      setEsMetrics(metrics);
      setStepPhase(1);
    } else {
      // Split Arena Mode: 15 AOA drones vs 5 ES parents
      const { agents: aoaAgents, globalBest: bestAoa } = initAOAPopulation(
        15,
        params.landscape === 'cern_alice' ? 'cloud_multi' : params.landscape
      );
      const { parents: esParents, globalBest: bestEs, metrics } = initESPopulation(
        params.muParents,
        params.landscape
      );

      const combinedBest = bestAoa.fitness < bestEs.fitness ? bestAoa : bestEs;
      setAgents([...aoaAgents, ...esParents]);
      setEsOffspring([]);
      setGlobalBest(combinedBest);
      setConvergenceHistory([combinedBest.fitness]);
      setEsMetrics(metrics);
    }
  }, [algorithm, params]);

  // Initial load or when algorithm changes
  useEffect(() => {
    initializeSimulation();
  }, [initializeSimulation]);

  // Single Step Function
  const handleStep = useCallback(() => {
    setIteration((prev) => {
      if (prev >= params.maxIterations) {
        setIsRunning(false);
        return prev;
      }
      const nextIter = prev + 1;

      if (algorithm === 'AOA') {
        const result = stepAOA(
          agents,
          globalBest,
          nextIter,
          params.maxIterations,
          params.alpha,
          params.landscape === 'cern_alice' ? 'cloud_multi' : params.landscape
        );
        setAgents(result.agents);
        setGlobalBest(result.globalBest);
        setMoa(result.moa);
        setMop(result.mop);
        setOpCounts(result.opCounts);
        setIsExploration(result.isExploration);
        setConvergenceHistory((hist) => [...hist, result.globalBest.fitness]);
      } else if (algorithm === 'ES') {
        const result = stepES(
          agents,
          globalBest,
          nextIter,
          params.maxIterations,
          params.ratio,
          params.mutationRate,
          params.landscape
        );
        setAgents(result.parents);
        setEsOffspring(result.offspring);
        setGlobalBest(result.globalBest);
        setEsMetrics(result.metrics);
        setStepPhase(result.stepPhase);
        setIsExploration(nextIter < params.maxIterations * 0.5);
        setConvergenceHistory((hist) => [...hist, result.globalBest.fitness]);
      } else {
        // Split Mode
        const aoaList = agents.filter((a) => a.id < 500);
        const esList = agents.filter((a) => a.id >= 500);

        const resAoa = stepAOA(
          aoaList,
          globalBest,
          nextIter,
          params.maxIterations,
          params.alpha,
          params.landscape === 'cern_alice' ? 'cloud_multi' : params.landscape
        );
        const resEs = stepES(
          esList,
          globalBest,
          nextIter,
          params.maxIterations,
          params.ratio,
          params.mutationRate,
          params.landscape
        );

        const bestNow =
          resAoa.globalBest.fitness < resEs.globalBest.fitness
            ? resAoa.globalBest
            : resEs.globalBest;

        setAgents([...resAoa.agents, ...resEs.parents]);
        setEsOffspring(resEs.offspring);
        setGlobalBest(bestNow);
        setMoa(resAoa.moa);
        setMop(resAoa.mop);
        setOpCounts(resAoa.opCounts);
        setEsMetrics(resEs.metrics);
        setConvergenceHistory((hist) => [...hist, bestNow.fitness]);
      }

      return nextIter;
    });
  }, [algorithm, agents, globalBest, params]);

  // Simulation Interval Runner
  useEffect(() => {
    if (!isRunning) {
      if (loopRef.current) clearInterval(loopRef.current);
      return;
    }

    const intervalTime = Math.max(30, 240 / speed);
    const id = window.setInterval(() => {
      handleStep();
    }, intervalTime);

    loopRef.current = id;
    return () => clearInterval(id);
  }, [isRunning, speed, handleStep]);

  return (
    <div className="bg-cyber-950 text-slate-100 font-sans min-h-screen selection:bg-cyber-cyan selection:text-cyber-950 relative overflow-x-hidden">
      {/* HEADER */}
      <Header algorithm={algorithm} onSelectAlgorithm={setAlgorithm} />

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* HERO CONTEXT */}
        <section className="cyber-panel rounded-2xl p-5 border border-cyber-700/50 relative overflow-hidden">
          <div
            className={`absolute right-0 top-0 w-96 h-full bg-gradient-to-l pointer-events-none ${
              algorithm === 'ES'
                ? 'from-cyber-purple/15 via-cyber-purple/5 to-transparent'
                : 'from-cyber-cyan/10 via-cyber-cyan/5 to-transparent'
            }`}
          />
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-3xl">
              <div
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono border ${
                  algorithm === 'ES'
                    ? 'bg-cyber-purple/15 border-cyber-purple/40 text-cyber-violet'
                    : 'bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>
                  {algorithm === 'ES'
                    ? 'Studi Kasus Riil: CERN LHC ALICE Monte Carlo Task Scheduling (IEEE Access 2022)'
                    : 'Studi Kasus Riil: Cloud Task Scheduling & Resource Allocation'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {algorithm === 'ES'
                  ? 'Optimasi Penjadwalan Cloud: Minimasi Makespan & Keseimbangan Beban (DI)'
                  : 'Optimasi Beban Server: Meminimalkan Latensi & Konsumsi Energi'}
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                {algorithm === 'ES'
                  ? 'Mengalokasikan puluhan ribu tugas ilmiah ke 5 Data Center heterogen (2.100 VM). Membandingkan rasio induk-anak 1:7 dengan mutasi acak 10% dan kebijakan antrean LJF untuk memangkas waktu penyelesaian total tugas (Makespan).'
                  : 'Dalam komputasi awan, tugas (tasks) harus dialokasikan ke puluhan Virtual Machines (VM). Algoritma metaheuristik bertugas mencari koordinat alokasi yang menghasilkan latensi terendah (ms) tanpa membebani server hingga overload.'}
              </p>
            </div>

            {/* Target Best Highlight Badge */}
            <div className="bg-cyber-900/90 border border-cyber-gold/40 rounded-xl p-3.5 min-w-[240px] flex items-center gap-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-lg bg-cyber-gold/20 border border-cyber-gold/50 flex items-center justify-center text-cyber-gold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  {algorithm === 'ES' ? 'Makespan Terbaik (S_best)' : 'Target Terbaik (Best So Far)'}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-cyber-gold">
                    {globalBest.fitness === Infinity ? '---' : globalBest.fitness.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-slate-400">ms (Latensi)</span>
                </div>
                <span className="text-[10px] text-cyber-emerald flex items-center gap-1 font-mono">
                  <CheckCircle className="w-3 h-3" /> Dynamic Global Beacon
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 3D VIEWPORT CONTAINER */}
        <section className="cyber-panel rounded-2xl border border-cyber-700/60 overflow-hidden shadow-2xl relative">
          {/* Top HUD inside Viewport */}
          <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Left Badges */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div
                className={`px-3 py-1.5 rounded-lg bg-cyber-900/90 border text-xs font-mono font-bold flex items-center gap-2 shadow-md backdrop-blur-md ${
                  algorithm === 'ES'
                    ? 'border-cyber-purple text-cyber-purple'
                    : 'border-cyber-cyan text-cyber-cyan'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-ping ${
                    algorithm === 'ES' ? 'bg-cyber-purple' : 'bg-cyber-cyan'
                  }`}
                />
                <span>
                  {algorithm === 'AOA'
                    ? 'ARITHMETIC OPTIMIZATION ALGORITHM'
                    : algorithm === 'ES'
                    ? 'EVOLUTION STRATEGIES (μ, λ)-ES'
                    : 'SPLIT ARENA: AOA VS ES'}
                </span>
              </div>

              <div
                className={`px-3 py-1.5 rounded-lg bg-cyber-900/90 border text-xs font-mono flex items-center gap-1.5 shadow-md backdrop-blur-md ${
                  algorithm === 'ES'
                    ? 'border-cyber-pink/50 text-cyber-pink'
                    : 'border-cyber-sky/50 text-cyber-sky'
                }`}
              >
                <span>
                  Fase:{' '}
                  <strong className="font-bold text-white">
                    {algorithm === 'AOA'
                      ? isExploration
                        ? 'Eksplorasi (÷, ×)'
                        : 'Eksploitasi (-, +)'
                      : isExploration
                      ? `Reproduksi & Mutasi (Rasio 1:${params.ratio})`
                      : 'Seleksi Lingkungan & Elitisme'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Right Telemetry */}
            <div className="flex items-center gap-2 pointer-events-auto font-mono text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-cyber-900/90 border border-cyber-700 text-slate-300 flex items-center gap-2 backdrop-blur-md">
                <span>
                  {algorithm === 'ES' ? 'Generasi:' : 'Iterasi:'}{' '}
                  <strong className="text-white font-bold">{iteration}</strong> /{' '}
                  {params.maxIterations}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-cyber-900/90 border border-cyber-gold/60 text-cyber-gold flex items-center gap-2 backdrop-blur-md shadow-sm">
                <span>
                  {algorithm === 'ES' ? 'Makespan:' : 'Best:'}{' '}
                  <strong className="text-white font-bold">
                    {globalBest.fitness === Infinity ? '---' : globalBest.fitness.toFixed(2)}
                  </strong>{' '}
                  ms
                </span>
              </div>
            </div>
          </div>

          {/* Three.js Canvas */}
          <ThreeCanvas
            algorithm={algorithm}
            agents={agents}
            esOffspring={esOffspring}
            globalBest={globalBest}
            isExploration={isExploration}
            stepPhase={stepPhase}
          />

          {/* Bottom Control Bar */}
          <div className="p-4 bg-cyber-900/95 border-t border-cyber-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition shadow-lg font-mono text-xs md:text-sm ${
                  algorithm === 'ES'
                    ? 'bg-cyber-purple text-white hover:bg-cyber-violet'
                    : 'bg-cyber-cyan text-cyber-950 hover:bg-cyber-sky'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Jeda Simulasi</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Jalankan Simulasi</span>
                  </>
                )}
              </button>

              <button
                onClick={handleStep}
                className="p-2.5 rounded-xl bg-cyber-800 hover:bg-cyber-700 text-slate-200 border border-cyber-700 transition"
                title="Langkah Tunggal (+1 Generasi/Iterasi)"
              >
                <StepForward className="w-4 h-4" />
              </button>

              <button
                onClick={initializeSimulation}
                className="p-2.5 rounded-xl bg-cyber-800 hover:bg-cyber-700 text-slate-200 border border-cyber-700 transition"
                title="Reset Ulang Populasi"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">Kecepatan:</span>
              <div className="flex items-center bg-cyber-950 p-1 rounded-lg border border-cyber-800 text-xs font-mono">
                {[1, 3, 8, 20].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2.5 py-1 rounded transition ${
                      speed === s
                        ? algorithm === 'ES'
                          ? 'bg-cyber-800 text-cyber-purple font-bold'
                          : 'bg-cyber-800 text-cyber-cyan font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s === 20 ? 'Turbo' : `${s}x`}
                  </button>
                ))}
              </div>
            </div>

            {/* Population & Space Stats */}
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <div>
                {algorithm === 'ES' ? (
                  <>
                    Bibit: <strong className="text-slate-200">{agents.length} Induk (μ)</strong> |{' '}
                    <strong className="text-cyber-pink">
                      {agents.length * params.ratio} Anak (λ)
                    </strong>
                  </>
                ) : (
                  <>
                    Populasi: <strong className="text-slate-200">{agents.length} Agen</strong>
                  </>
                )}
              </div>
              <div className="border-l border-cyber-800 pl-4">
                Pusat Data:{' '}
                <strong className="text-slate-200">5 Kluster Heterogen (CERN ALICE)</strong>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS DASHBOARD */}
        <MetricsDashboard
          algorithm={algorithm}
          moa={moa}
          mop={mop}
          opCounts={opCounts}
          totalAgents={agents.length}
          history={convergenceHistory}
          bestFitness={globalBest.fitness}
          esMetrics={esMetrics}
        />

        {/* DYNAMIC EDUCATIONAL CARDS (AOA vs ES) */}
        {algorithm === 'AOA' && <EducationalCards />}
        {algorithm === 'ES' && <ESEducationalCards />}
        {algorithm === 'SPLIT' && (
          <div className="space-y-8">
            <EducationalCards />
            <ESEducationalCards />
          </div>
        )}

        {/* INTERACTIVE SANDBOX */}
        <InteractiveSandbox
          algorithm={algorithm}
          params={params}
          onChangeParams={setParams}
          onApply={initializeSimulation}
        />
      </main>

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 lg:px-8 py-8 border-t border-cyber-900 text-xs font-mono text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyber-cyan" />
          <span>
            Cloud Optimization Matrix &bull; AOA (Abualigah et al., 2021) & Evolution Strategies
            (Lončar & Lončar, IEEE Access 2022)
          </span>
        </div>
        <div>Modern Vite + React + Three.js + Tailwind CSS</div>
      </footer>
    </div>
  );
};

export default App;
