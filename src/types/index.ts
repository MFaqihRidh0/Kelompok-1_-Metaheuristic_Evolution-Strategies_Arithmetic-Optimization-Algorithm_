export type AlgorithmType = 'AOA' | 'ES' | 'SPLIT';

export type OperatorType = 'div' | 'mul' | 'sub' | 'add' | 'init' | 'parent' | 'offspring' | 'elite';

export interface Agent {
  id: number;
  position: [number, number]; // [x, z] in search space
  targetPosition: [number, number]; // for smooth lerp animation
  altitude: number;
  fitness: number; // Latency / Makespan
  op: OperatorType;
  color: string;
  isParent?: boolean;
}

export interface GlobalBest {
  position: [number, number];
  fitness: number;
  iteration: number;
  makespan?: number;
  imbalance?: number;
  improved?: boolean;
}

export interface SimulationParams {
  populationSize: number;
  maxIterations: number;
  alpha: number; // MOP sensitivity parameter for AOA
  muParents: number; // Parents for ES
  ratio: number; // Offspring ratio (optimal 7 according to paper)
  mutationRate: number; // Default 0.10 (10%)
  landscape: 'cern_alice' | 'cloud_multi' | 'sphere' | 'rastrigin';
}

export interface OperatorCounts {
  div: number;
  mul: number;
  sub: number;
  add: number;
}

export interface StepLog {
  stepNumber: number;
  stepTitle: string;
  phase: string;
  details: string;
  highlight: string;
}

export interface ESMetrics {
  generation: number;
  makespan: number;
  degreeOfImbalance: number;
  activeVMs: number;
  mutationCount: number;
  currentStepDescription: string;
}
