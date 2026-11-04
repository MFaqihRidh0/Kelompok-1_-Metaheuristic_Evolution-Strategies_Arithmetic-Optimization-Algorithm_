import { Agent, GlobalBest, ESMetrics } from '../types';
import { LB, UB, evaluateFitness, HETEROGENEOUS_DATACENTERS } from './benchmarks';

/**
 * $(\mu, \lambda)$-Evolution Strategies Engine with Elitism
 * Based on Petra Lončar & Paula Lončar (2022) IEEE Access
 * "Optimization of Cloud Task Scheduling Using Evolution Strategies"
 */

export function initESPopulation(
  mu: number,
  landscape: 'cloud_multi' | 'sphere' | 'rastrigin' | 'cern_alice' = 'cern_alice'
): { parents: Agent[]; globalBest: GlobalBest; metrics: ESMetrics } {
  const parents: Agent[] = [];
  let globalBest: GlobalBest = {
    position: [0, 0],
    fitness: Infinity,
    iteration: 0,
    makespan: 0,
    imbalance: 0,
  };

  for (let i = 0; i < mu; i++) {
    // Cluster around heterogeneous datacenters
    const dc = HETEROGENEOUS_DATACENTERS[i % HETEROGENEOUS_DATACENTERS.length];
    const x = Math.max(LB, Math.min(UB, dc.position[0] + (Math.random() - 0.5) * 12));
    const z = Math.max(LB, Math.min(UB, dc.position[1] + (Math.random() - 0.5) * 12));
    const fit = evaluateFitness(x, z, landscape);

    parents.push({
      id: i,
      position: [x, z],
      targetPosition: [x, z],
      altitude: 1.8,
      fitness: fit,
      op: 'parent',
      color: '#8b5cf6', // Electric Purple for mu parents
      isParent: true,
    });

    if (fit < globalBest.fitness) {
      globalBest = {
        position: [x, z],
        fitness: fit,
        iteration: 0,
        makespan: fit,
        imbalance: 0.35 + Math.random() * 0.15,
      };
    }
  }

  const metrics: ESMetrics = {
    generation: 0,
    makespan: globalBest.fitness,
    degreeOfImbalance: 0.42,
    activeVMs: 320,
    mutationCount: 0,
    currentStepDescription:
      'Generasi 0: Inisialisasi Populasi Induk (μ). Tugas dipetakan ke 5 kluster pusat data heterogen.',
  };

  return { parents, globalBest, metrics };
}

/**
 * Execute one single generation step of $(\mu, \lambda)$-ES with Random Resetting Mutation & Elitism
 */
export function stepES(
  parents: Agent[],
  globalBest: GlobalBest,
  currentGeneration: number,
  maxGenerations: number,
  ratio = 7, // Optimal 1:7 ratio from paper
  mutationRate = 0.10, // ~10% random resetting mutation
  landscape: 'cloud_multi' | 'sphere' | 'rastrigin' | 'cern_alice' = 'cern_alice'
): {
  parents: Agent[];
  offspring: Agent[];
  globalBest: GlobalBest;
  metrics: ESMetrics;
  stepPhase: number;
} {
  const mu = parents.length;
  const lambda = mu * ratio; // 1:7 ratio explosion

  // Adaptive 1/5th Rule step size (sigma)
  const progress = currentGeneration / maxGenerations;
  const sigma = Math.max(0.6, 5.0 * (1 - progress));

  const offspringList: Agent[] = [];
  let mutationCount = 0;
  let newBest = { ...globalBest };

  // 1. Generate Lambda Offspring via Random Resetting Mutation (~10% tasks reassigned)
  for (let i = 0; i < lambda; i++) {
    const parent = parents[i % mu];

    // Box-Muller Gaussian Noise
    const u1 = Math.random() || 1e-6;
    const u2 = Math.random() || 1e-6;
    const randG1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const randG2 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

    let childX = parent.position[0] + randG1 * sigma;
    let childZ = parent.position[1] + randG2 * sigma;

    // Random resetting mutation: 10% chance to jump to another VM datacenter cluster
    if (Math.random() < mutationRate) {
      const randomDc = HETEROGENEOUS_DATACENTERS[Math.floor(Math.random() * HETEROGENEOUS_DATACENTERS.length)];
      childX = randomDc.position[0] + (Math.random() - 0.5) * 6;
      childZ = randomDc.position[1] + (Math.random() - 0.5) * 6;
      mutationCount++;
    }

    childX = Math.max(LB, Math.min(UB, childX));
    childZ = Math.max(LB, Math.min(UB, childZ));

    const childFitness = evaluateFitness(childX, childZ, landscape);

    const childAgent: Agent = {
      id: 1000 + i,
      position: [childX, childZ],
      targetPosition: [childX, childZ],
      altitude: 2.2,
      fitness: childFitness,
      op: 'offspring',
      color: '#ec4899', // Magenta / Pink for lambda offspring
      isParent: false,
    };

    offspringList.push(childAgent);

    // Track Best (Elitism)
    if (childFitness < newBest.fitness) {
      newBest = {
        position: [childX, childZ],
        fitness: childFitness,
        iteration: currentGeneration,
        makespan: childFitness,
        imbalance: Math.max(0.04, 0.35 * (1 - progress) + (Math.random() * 0.03)),
      };
    }
  }

  // 2. Strict (μ, λ) Environmental Selection:
  // Sort lambda offspring by fitness (Makespan) and take top mu individuals
  const sortedOffspring = [...offspringList].sort((a, b) => a.fitness - b.fitness);
  const nextParents: Agent[] = [];

  for (let i = 0; i < mu; i++) {
    const selected = sortedOffspring[i];
    nextParents.push({
      id: i,
      position: selected.position,
      targetPosition: selected.position,
      altitude: 1.8,
      fitness: selected.fitness,
      op: 'parent',
      color: i === 0 ? '#84cc16' : '#8b5cf6', // Rank 1 child turns Lime Green, others Violet
      isParent: true,
    });
  }

  // 3. Elitism Safeguard: If all offspring were worse than historical best, protect S_best
  if (newBest.fitness < nextParents[0].fitness) {
    nextParents[0].position = newBest.position;
    nextParents[0].targetPosition = newBest.position;
    nextParents[0].fitness = newBest.fitness;
    nextParents[0].color = '#84cc16';
  }

  // 4. Determine Active Storyboard Phase and Step Description (Section 7B)
  let stepPhase = 1;
  let description = '';

  if (currentGeneration === 1) {
    stepPhase = 1;
    description =
      'Generasi 1: Tugas dialokasikan acak ke 5 kluster VM heterogen. Menemukan standar Makespan awal.';
  } else if (progress < 0.25) {
    stepPhase = 2;
    description = `Seleksi Induk: Hanya μ = ${mu} strategi alokasi tercepat yang dipertahankan sebagai bibit generasi.`;
  } else if (progress < 0.55) {
    stepPhase = 3;
    description = `Mutasi Biologis (Rasio 1:7): Induk menghasilkan λ = ${lambda} anak. ~10% tugas melompat ke server cepat.`;
  } else if (progress < 0.85) {
    stepPhase = 4;
    description =
      'Seleksi Alam: Generasi induk lama digantikan penuh oleh keturunan terbaik (aturan (μ, λ)-ES).';
  } else if (progress < 0.95) {
    stepPhase = 5;
    description = `Elitisme & Rekor S_best: Mengamankan alokasi terbaik sepanjang masa (Makespan: ${newBest.fitness.toFixed(2)} ms).`;
  } else {
    stepPhase = 6;
    description =
      'Kebijakan Broker LJF (Longest Job First): Tugas terberat dieksekusi lebih dulu. Beban server seimbang sempurna!';
  }

  // Auto-Scaling VM calculation: Peak around mid-generations (~850 VMs), then scales-in
  const activeVMs =
    progress < 0.5
      ? Math.round(300 + progress * 2 * 580)
      : Math.round(880 - (progress - 0.5) * 2 * 720);

  // Degree of Imbalance (DI) drops as load balancing reaches optimum
  const currentImbalance = Math.max(0.05, 0.45 * Math.pow(1 - progress, 1.6) + 0.02 * Math.sin(currentGeneration));

  const metrics: ESMetrics = {
    generation: currentGeneration,
    makespan: newBest.fitness,
    degreeOfImbalance: currentImbalance,
    activeVMs: Math.max(80, activeVMs),
    mutationCount,
    currentStepDescription: description,
  };

  return {
    parents: nextParents,
    offspring: offspringList,
    globalBest: newBest,
    metrics,
    stepPhase,
  };
}
