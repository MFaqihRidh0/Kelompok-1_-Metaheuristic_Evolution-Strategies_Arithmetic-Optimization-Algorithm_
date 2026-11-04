export type AlgorithmType = 'AOA' | 'ES' | 'SPLIT';

export type OperatorType = 'div' | 'mul' | 'sub' | 'add' | 'init';

export interface Agent {
  id: number;
  position: [number, number]; // [x, z] in search space
  targetPosition: [number, number]; // for smooth lerp animation
  altitude: number;
  fitness: number;
  op: OperatorType;
  color: string;
}

export interface GlobalBest {
  position: [number, number];
  fitness: number;
  iteration: number;
}

export interface SimulationParams {
  populationSize: number;
  maxIterations: number;
  alpha: number; // MOP sensitivity parameter
  landscape: 'cloud_multi' | 'sphere' | 'rastrigin';
}

export interface OperatorCounts {
  div: number;
  mul: number;
  sub: number;
  add: number;
}

