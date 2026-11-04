import { Agent, GlobalBest, OperatorCounts, OperatorType } from '../types';
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
  landscape: 'cloud_multi' | 'sphere' | 'rastrigin'
): { agents: Agent[]; globalBest: GlobalBest } {
  const agents: Agent[] = [];
  let globalBest: GlobalBest = {
    position: [0, 0],
    fitness: Infinity,
    iteration: 0,
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
      color: '#38bdf8', // Sky blue
    });

    if (fit < globalBest.fitness) {
      globalBest = {
        position: [x, z],
        fitness: fit,
        iteration: 0,
      };
    }
  }

  return { agents, globalBest };
}

/**
 * Perform one single iteration step of AOA
 */
export function stepAOA(
  agents: Agent[],
  globalBest: GlobalBest,
  currentIter: number,
  maxIter: number,
  alpha: number,
  landscape: 'cloud_multi' | 'sphere' | 'rastrigin'
): {
  agents: Agent[];
  globalBest: GlobalBest;
  moa: number;
  mop: number;
  opCounts: OperatorCounts;
  isExploration: boolean;
} {
  const moa = calculateMOA(currentIter, maxIter);
  const mop = calculateMOP(currentIter, maxIter, alpha);
  const eps = 1e-7;
  const mu = 0.5;

  const opCounts: OperatorCounts = { div: 0, mul: 0, sub: 0, add: 0 };
  let explorationCount = 0;

  let newBest = { ...globalBest };

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
          val = bestCoord / (mop + eps) * (1 + 0.15 * (Math.random() - 0.5)) + spread * 0.4;
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
      };
    }

    // Determine altitude and color for animation
    const targetAltitude = isAgentExploring ? 8.0 + Math.random() * 3.5 : 2.0;
    const color = isAgentExploring ? '#38bdf8' : '#10b981';

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

  return {
    agents: updatedAgents,
    globalBest: newBest,
    moa,
    mop,
    opCounts,
    isExploration: explorationCount > agents.length / 2,
  };
}

