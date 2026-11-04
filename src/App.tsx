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
import { StepInspector } from './components/StepInspector';
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
  StepLog,
} from './types';
import { initAOAPopulation, stepAOA } from './algorithms/aoa';
import { initESPopulation, stepES } from './algorithms/es';

export const App: React.FC = () => {
  // Algorithm & Simulation State
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('AOA');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1); // Default to calm 1x (~1000ms per step)
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
    improved: false,
  });

  const [moa, setMoa] = useState<number>(0.2);
  const [mop, setMop] = useState<number>(1.0);
  const [isExploration, setIsExploration] = useState<boolean>(true);
  const [opCounts, setOpCounts] = useState<OperatorCounts>({ div: 0, mul: 0, sub: 0, add: 0 });
  const [esMetrics, setEsMetrics] = useState<ESMetrics | undefined>(undefined);
  const [stepPhase, setStepPhase] = useState<number>(1);
  const [convergenceHistory, setConvergenceHistory] = useState<number[]>([]);

  // Detailed step log for each iteration
  const [currentStepLog, setCurrentStepLog] = useState<StepLog>({
    stepNumber: 0,
    stepTitle: 'Siap Memulai Simulasi',
    phase: 'Standby',
    details: 'Klik "Jalankan Simulasi" atau "Langkah Tunggal" untuk memulai siklus komputasi optimasi awan.',
    highlight: 'Populasi telah disiapkan di atas kluster server.',
  });

  // Simulation loop timer
  const loopRef = useRef<number | null>(null);

  // Initialize Population based on active mode
  const initializeSimulation = useCallback(() => {
    setIteration(0);
    setIsRunning(false);

    if (algorithm === 'AOA') {
      const { agents: initialAgents, globalBest: best, initialLog } = initAOAPopulation(
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
      setCurrentStepLog(initialLog);
    } else if (algorithm === 'ES') {
      const { parents, globalBest: best, metrics, initialLog } = initESPopulation(
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
      setCurrentStepLog(initialLog);
    } else {
      // Split Arena Mode
      const { agents: aoaAgents, globalBest: bestAoa, initialLog } = initAOAPopulation(
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
      setCurrentStepLog({
        ...initialLog,
        stepTitle: 'Split Arena: Balapan Konvergensi AOA vs ES',
        details: '15 drone AOA dan 5 induk ES berlomba mencari alokasi beban server dengan latensi terendah.',
      });
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
        setCurrentStepLog(result.stepLog);
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
        setCurrentStepLog(result.stepLog);
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
        setCurrentStepLog({
          stepNumber: nextIter,
          stepTitle: `Iterasi ${nextIter}: AOA vs ES Bersaing`,
          phase: 'Split Race',
          details: `AOA Best: ${resAoa.globalBest.fitness.toFixed(2)} ms | ES Best: ${resEs.globalBest.fitness.toFixed(2)} ms`,
          highlight: `Pemimpin saat ini: ${resAoa.globalBest.fitness <= resEs.globalBest.fitness ? 'AOA Drone Team' : 'Evolution Strategies Entity'}`,
        });
        setConvergenceHistory((hist) => [...hist, bestNow.fitness]);
      }

      return nextIter;
    });
  }, [algorithm, agents, globalBest, params]);

  // Calmer simulation interval runner (1x = 1000ms, 2x = 500ms, 4x = 250ms)
  useEffect(() => {
    if (!isRunning) {
      if (loopRef.current) clearInterval(loopRef.current);
      return;
    }

    const intervalTime = Math.max(120, Math.round(1000 / speed));
    const id = window.setInterval(() => {
      handleStep();
    }, intervalTime);

    loopRef.current = id;
    return () => clearInterval(id);
  }, [isRunning, speed, handleStep]);

  return (
    <div className="bg-[#fcfaf6] text-[#292524] font-sans min-h-screen selection:bg-amber-200 selection:text-amber-950 relative overflow-x-hidden">
      {/* HEADER */}
      <Header algorithm={algorithm} onSelectAlgorithm={setAlgorithm} />

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* HERO CONTEXT (WARM CREAM PALETTE) */}
        <section className="warm-panel-hero rounded-3xl p-6 md:p-7 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-3xl">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                  algorithm === 'ES'
                    ? 'bg-purple-100 border-purple-300 text-purple-900'
                    : 'bg-amber-100 border-amber-300 text-amber-900'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>
                  {algorithm === 'ES'
                    ? 'Studi Kasus Riil: CERN LHC ALICE Task Scheduling (IEEE Access 2022)'
                    : 'Studi Kasus Riil: Cloud Task Scheduling & Resource Allocation'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-coffee-950 tracking-tight">
                {algorithm === 'ES'
                  ? 'Optimasi Penjadwalan Cloud: Minimasi Makespan & Keseimbangan Beban (DI)'
                  : 'Optimasi Beban Server: Meminimalkan Latensi & Konsumsi Energi'}
              </h2>
              <p className="text-xs md:text-sm text-coffee-800 leading-relaxed font-sans">
                {algorithm === 'ES'
                  ? 'Mengalokasikan puluhan ribu tugas ilmiah ke 5 Data Center heterogen CERN ALICE (2.100 VM). Memanfaatkan rasio induk-anak 1:7 dengan mutasi acak 10% dan kebijakan antrean LJF untuk memangkas waktu penyelesaian total tugas (Makespan).'
                  : 'Dalam komputasi awan, ribuan tugas harus dipetakan ke puluhan Virtual Machines. Algoritma metaheuristik bertugas mencari konfigurasi alokasi yang menghasilkan latensi terendah (ms) tanpa membebani server hingga overload.'}
              </p>
            </div>

            {/* Target Best Highlight Badge */}
            <div className="bg-white border border-amber-300 rounded-2xl p-4 min-w-[250px] flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-coffee-600 uppercase tracking-wider block font-semibold">
                  {algorithm === 'ES' ? 'Makespan Terbaik (S_best)' : 'Target Terbaik (Best So Far)'}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-amber-800">
                    {globalBest.fitness === Infinity ? '---' : globalBest.fitness.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-coffee-600">ms (Latensi)</span>
                </div>
                <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-mono font-medium">
                  <CheckCircle className="w-3.5 h-3.5" /> Dynamic Global Beacon
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* STEP-BY-STEP OPERATIONAL INSPECTOR (BARU & INFORMATIF) */}
        <StepInspector
          algorithm={algorithm}
          stepLog={currentStepLog}
          iteration={iteration}
          maxIterations={params.maxIterations}
        />

        {/* 3D VIEWPORT CONTAINER (BRIGHT WARM STUDIO) */}
        <section className="warm-panel rounded-3xl overflow-hidden shadow-lg relative border border-sand-200">
          {/* Top HUD inside Viewport */}
          <div className="absolute top-3 inset-x-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Left Badges */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <div
                className={`px-3 py-1.5 rounded-xl bg-white/95 border text-xs font-mono font-bold flex items-center gap-2 shadow-sm backdrop-blur-md ${
                  algorithm === 'ES'
                    ? 'border-purple-300 text-purple-900'
                    : 'border-amber-300 text-amber-900'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    algorithm === 'ES' ? 'bg-purple-700' : 'bg-amber-700'
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

              <div className="px-3 py-1.5 rounded-xl bg-white/95 border border-sand-300 text-coffee-800 text-xs font-mono flex items-center gap-1.5 shadow-sm backdrop-blur-md">
                <span>
                  Fase:{' '}
                  <strong className="font-bold text-coffee-950">
                    {algorithm === 'AOA'
                      ? isExploration
                        ? 'Eksplorasi (÷, ×)'
                        : 'Eksploitasi (-, +)'
                      : isExploration
                      ? `Reproduksi & Mutasi (1:${params.ratio})`
                      : 'Seleksi Lingkungan & Elitisme'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Right Telemetry */}
            <div className="flex items-center gap-2 pointer-events-auto font-mono text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white/95 border border-sand-300 text-coffee-800 flex items-center gap-2 backdrop-blur-md shadow-sm">
                <span>
                  {algorithm === 'ES' ? 'Generasi:' : 'Iterasi:'}{' '}
                  <strong className="text-coffee-950 font-bold">{iteration}</strong> /{' '}
                  {params.maxIterations}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/95 border border-amber-300 text-amber-900 flex items-center gap-2 backdrop-blur-md shadow-sm">
                <span>
                  {algorithm === 'ES' ? 'Makespan:' : 'Best:'}{' '}
                  <strong className="text-amber-800 font-bold">
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
          <div className="p-4 bg-white/95 border-t border-sand-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition shadow-sm font-mono text-xs md:text-sm ${
                  algorithm === 'ES'
                    ? 'bg-purple-800 text-white hover:bg-purple-900'
                    : 'bg-amber-700 text-white hover:bg-amber-800'
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
                className="p-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-coffee-900 border border-sand-300 transition shadow-sm"
                title="Langkah Tunggal (+1 Generasi/Iterasi)"
              >
                <StepForward className="w-4 h-4" />
              </button>

              <button
                onClick={initializeSimulation}
                className="p-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-coffee-900 border border-sand-300 transition shadow-sm"
                title="Reset Ulang Populasi"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Speed Selector (Calmer 0.5x, 1x, 2x, 4x) */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-coffee-700 font-semibold">Kecepatan:</span>
              <div className="flex items-center bg-sand-100 p-1 rounded-xl border border-sand-300 text-xs font-mono">
                {[
                  { label: '0.5x', val: 0.5 },
                  { label: '1x (Tenang)', val: 1 },
                  { label: '2x', val: 2 },
                  { label: '4x', val: 4 },
                ].map(({ label, val }) => (
                  <button
                    key={label}
                    onClick={() => setSpeed(val)}
                    className={`px-3 py-1 rounded-lg transition font-medium ${
                      speed === val
                        ? algorithm === 'ES'
                          ? 'bg-purple-800 text-white font-bold shadow-sm'
                          : 'bg-amber-700 text-white font-bold shadow-sm'
                        : 'text-coffee-700 hover:text-coffee-950'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Population & Space Stats */}
            <div className="flex items-center gap-4 text-xs font-mono text-coffee-700">
              <div>
                {algorithm === 'ES' ? (
                  <>
                    Bibit: <strong className="text-coffee-950">{agents.length} Induk (μ)</strong> |{' '}
                    <strong className="text-rose-700">
                      {agents.length * params.ratio} Anak (λ)
                    </strong>
                  </>
                ) : (
                  <>
                    Populasi: <strong className="text-coffee-950">{agents.length} Agen</strong>
                  </>
                )}
              </div>
              <div className="border-l border-sand-300 pl-4">
                Pusat Data:{' '}
                <strong className="text-coffee-950">5 Kluster Heterogen CERN ALICE</strong>
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
      <footer className="max-w-7xl mx-auto px-4 lg:px-8 py-8 border-t border-sand-200 text-xs font-mono text-coffee-600 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-amber-700" />
          <span>
            Cloud Optimization Matrix &bull; AOA (Abualigah et al., 2021) & Evolution Strategies
            (Lončar & Lončar, IEEE Access 2022)
          </span>
        </div>
        <div>Vite + React + Three.js &bull; Tema Coklat & Krem Studio</div>
      </footer>
    </div>
  );
};

export default App;
