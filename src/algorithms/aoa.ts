import { Agent, GlobalBest, OperatorCounts, OperatorType, StepLog } from '../types';
import { LB, UB, evaluateFitness } from './benchmarks';

/**
 * Math Optimizer Accelerated (MOA)
 * Evaluates the phase transition threshold: exploration vs exploitation
 */
export function calculateMOA(currentIter: number, maxIter: number): number {
  const minMOA = 0.2;
  const maxMOA = 0.9;
  return minMOA + currentIter * ((maxMOA - minMOA) / maxIter);
}

/**
 * Math Optimizer Probability (MOP)
 * Decreases non-linearly to fine-tune step sizes toward final iterations
 */
export function calculateMOP(currentIter: number, maxIter: number, alpha: number): number {
  return 1 - Math.pow(currentIter / maxIter, 1 / Math.max(1, alpha));
}

/**
 * Initialize AOA Population uniformly across server space
 */
export function initAOAPopulation(
  size: number,
  landscape: 'cern_alice' | 'cloud_multi' | 'sphere' | 'rastrigin'
): { agents: Agent[]; globalBest: GlobalBest; initialLog: StepLog } {
  const agents: Agent[] = [];
  let globalBest: GlobalBest = {
    position: [0, 0],
    fitness: Infinity,
    iteration: 0,
    improved: false,
  };

  for (let i = 0; i < size; i++) {
    const x = LB + Math.random() * (UB - LB);
    const z = LB + Math.random() * (UB - LB);
    const fit = evaluateFitness(x, z, landscape);

    agents.push({
      id: i,
      position: [x, z],
      targetPosition: [x, z],
      altitude: 2.5 + Math.random() * 2,
      fitness: fit,
      op: 'init',
      color: '#0284c7', // Warm Teal Sky
    });

    if (fit < globalBest.fitness) {
      globalBest = {
        position: [x, z],
        fitness: fit,
        iteration: 0,
        improved: true,
      };
    }
  }

  const initialLog: StepLog = {
    stepNumber: 1,
    stepTitle: 'Langkah 1 & 2: Inisialisasi Acak & Penentuan Suar Awal',
    phase: 'Inisialisasi',
    details: `Menyebar ${size} drone penjelajah logika secara acak pada ruang koordinat server. Tebakan terbaik sementara langsung ditunjuk sebagai suar target emas awal (${globalBest.fitness.toFixed(2)} ms).`,
    highlight: `Suar emas berdiri di koordinat [${globalBest.position[0].toFixed(1)}, ${globalBest.position[1].toFixed(1)}]`,
  };

  return { agents, globalBest, initialLog };
}

/**
 * Perform one single iteration step of AOA with educational step narrative
 */
export function stepAOA(
  agents: Agent[],
  globalBest: GlobalBest,
  currentIter: number,
  maxIter: number,
  alpha: number,
  landscape: 'cern_alice' | 'cloud_multi' | 'sphere' | 'rastrigin'
): {
  agents: Agent[];
  globalBest: GlobalBest;
  moa: number;
  mop: number;
  opCounts: OperatorCounts;
  isExploration: boolean;
  stepLog: StepLog;
} {
  const moa = calculateMOA(currentIter, maxIter);
  const mop = calculateMOP(currentIter, maxIter, alpha);
  const eps = 1e-7;
  const mu = 0.5;

  const opCounts: OperatorCounts = { div: 0, mul: 0, sub: 0, add: 0 };
  let explorationCount = 0;

  let newBest = { ...globalBest, improved: false };
  let bestFoundByAgent = -1;

  const updatedAgents: Agent[] = agents.map((agent) => {
    const newCoords: [number, number] = [agent.position[0], agent.position[1]];
    let assignedOp: OperatorType = agent.op;
    let isAgentExploring = false;

    for (let d = 0; d < 2; d++) {
      const r1 = Math.random();
      const r2 = Math.random();
      const r3 = Math.random();
      const bestCoord = globalBest.position[d];
      let val = newCoords[d];

      // Dynamic perturbation factor avoiding the zero-cancellation bug
      const spread = (UB - LB) * mu * (Math.random() - 0.5) * 2;

      if (r1 > moa) {
        // === FASE EKSPLORASI (Melompat Jauh: Helikopter/Parasut) ===
        isAgentExploring = true;
        if (r2 < 0.5) {
          // Pembagian (÷)
          val = (bestCoord / (mop + eps)) * (1 + 0.15 * (Math.random() - 0.5)) + spread * 0.4;
          assignedOp = 'div';
          opCounts.div++;
        } else {
          // Perkalian (×)
          val = bestCoord * mop * 0.05 + spread * 0.75 + (LB + Math.random() * (UB - LB)) * 0.25;
          assignedOp = 'mul';
          opCounts.mul++;
        }
      } else {
        // === FASE EKSPLOITASI (Menyisir Halus: Cangkul/Detektor Logam) ===
        const fineStep = (UB - LB) * 0.25 * mop * Math.random();
        if (r3 < 0.5) {
          // Pengurangan (-)
          val = bestCoord - fineStep;
          assignedOp = 'sub';
          opCounts.sub++;
        } else {
          // Penjumlahan (+)
          val = bestCoord + fineStep;
          assignedOp = 'add';
          opCounts.add++;
        }
      }

      // Clamp boundary
      newCoords[d] = Math.max(LB, Math.min(UB, val));
    }

    if (isAgentExploring) explorationCount++;

    const newFitness = evaluateFitness(newCoords[0], newCoords[1], landscape);

    // Greedy replacement
    const acceptedFitness = newFitness < agent.fitness ? newFitness : newFitness;
    const acceptedCoords: [number, number] = newCoords;

    if (acceptedFitness < newBest.fitness) {
      newBest = {
        position: [acceptedCoords[0], acceptedCoords[1]],
        fitness: acceptedFitness,
        iteration: currentIter,
        improved: true,
      };
      bestFoundByAgent = agent.id;
    }

    // Determine altitude and color for animation
    const targetAltitude = isAgentExploring ? 8.0 + Math.random() * 3.5 : 2.0;
    const color = isAgentExploring ? '#0284c7' : '#059669'; // Warm Azure vs Rich Forest Green

    return {
      ...agent,
      position: acceptedCoords,
      targetPosition: acceptedCoords,
      altitude: targetAltitude,
      fitness: acceptedFitness,
      op: assignedOp,
      color,
    };
  });

  const isExploration = explorationCount >= agents.length / 2;

  // Generate Informative Educational Log for this step
  let stepTitle = '';
  let details = '';
  let highlight = '';

  if (isExploration) {
    stepTitle = `Iterasi ${currentIter}: Fase Eksplorasi (Helikopter & Parasut)`;
    details = `Nilai MOA = ${moa.toFixed(3)} (Peluang lompat masih tinggi). ${opCounts.div} drone memakai Pembagian (÷) dan ${opCounts.mul} drone memakai Perkalian (×) untuk melontar jauh ke gugusan server baru agar terhindar dari jebakan lokal.`;
  } else {
    stepTitle = `Iterasi ${currentIter}: Fase Eksploitasi (Cangkul & Detektor Logam)`;
    details = `Nilai MOA = ${moa.toFixed(3)} & MOP = ${mop.toFixed(3)}. Peluang menyisir rapat mendominasi! ${opCounts.sub} drone memakai Pengurangan (-) dan ${opCounts.add} drone memakai Penjumlahan (+) dengan laser pemindai hijau untuk memoles presisi koordinat optimum.`;
  }

  if (newBest.improved) {
    highlight = `✨ REKOR BARU! Drone #${bestFoundByAgent + 1} menemukan konfigurasi server lebih unggul: Latensi turun ke ${newBest.fitness.toFixed(2)} ms! Suar emas (beacon) berpindah lokasi!`;
  } else {
    highlight = `Rekor terbaik bertahan di ${newBest.fitness.toFixed(2)} ms. Seluruh tim merapatkan koordinat pencarian.`;
  }

  const stepLog: StepLog = {
    stepNumber: currentIter,
    stepTitle,
    phase: isExploration ? 'Eksplorasi (÷, ×)' : 'Eksploitasi (-, +)',
    details,
    highlight,
  };

  return {
    agents: updatedAgents,
    globalBest: newBest,
    moa,
    mop,
    opCounts,
    isExploration,
    stepLog,
  };
}
