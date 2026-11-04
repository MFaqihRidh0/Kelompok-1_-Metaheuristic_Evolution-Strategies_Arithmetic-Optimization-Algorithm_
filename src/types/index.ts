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
}

export interface SimulationParams {
  populationSize: number;
  maxIterations: number;
  alpha: number; // MOP sensitivity parameter for AOA
  muParents: number; // Parents for ES
  ratio: number; // Offspring ratio (optimal 7 according to paper)
  mutationRate: number; // Default 0.10 (10%)
  landscape: 'cloud_multi' | 'sphere' | 'rastrigin' | 'cern_alice';
}

export interface OperatorCounts {
  div: number;
  mul: number;
  sub: number;
  add: number;
}

export interface ESMetrics {
  generation: number;
  makespan: number; // in seconds/ms
  degreeOfImbalance: number; // DI
  activeVMs: number; // Elastic auto-scaling count
  mutationCount: number;
  currentStepDescription: string;
}
