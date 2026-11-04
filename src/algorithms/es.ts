import { Agent, GlobalBest } from '../types';
import { LB, UB, evaluateFitness } from './benchmarks';

/**
 * Evolution Strategies (ES) Engine
 * Prepared for the upcoming detailed ES materials
 */
export function initESPopulation(
  mu: number,
  landscape: 'cloud_multi' | 'sphere' | 'rastrigin'
): { parents: Agent[]; globalBest: GlobalBest } {
  const parents: Agent[] = [];
  let globalBest: GlobalBest = {
    position: [0, 0],
    fitness: Infinity,
    iteration: 0,
  };

  for (let i = 0; i < mu; i++) {
    const x = LB + Math.random() * (UB - LB);
    const z = LB + Math.random() * (UB - LB);
    const fit = evaluateFitness(x, z, landscape);

    parents.push({
      id: i,
      position: [x, z],
      targetPosition: [x, z],
      altitude: 1.5,
      fitness: fit,
      op: 'init',
      color: '#8b5cf6', // Electric Purple
    });

    if (fit < globalBest.fitness) {
      globalBest = {
        position: [x, z],
        fitness: fit,
        iteration: 0,
      };
    }
  }

  return { parents, globalBest };
}

export function stepES(
  parents: Agent[],
  globalBest: GlobalBest,
  currentIter: number,
  maxIter: number,
  lambda: number,
  landscape: 'cloud_multi' | 'sphere' | 'rastrigin'
): {
  parents: Agent[];
  offspring: Agent[];
  globalBest: GlobalBest;
  sigma: number;
} {
  // Adaptive 1/5th Rule step size
  const sigma = Math.max(0.5, 4.5 * (1 - currentIter / maxIter));
  const offspringList: Agent[] = [];
  let newBest = { ...globalBest };

  for (let i = 0; i < lambda; i++) {
    const parent = parents[Math.floor(Math.random() * parents.length)];

    // Box-Muller Gaussian Noise
    const u1 = Math.random() || 1e-6;
    const u2 = Math.random() || 1e-6;
    const randG1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const randG2 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);

    const childX = Math.max(LB, Math.min(UB, parent.position[0] + randG1 * sigma));
    const childZ = Math.max(LB, Math.min(UB, parent.position[1] + randG2 * sigma));
    const childFitness = evaluateFitness(childX, childZ, landscape);

    const childAgent: Agent = {
      id: 1000 + i,
      position: [childX, childZ],
      targetPosition: [childX, childZ],
      altitude: 2.0,
      fitness: childFitness,
      op: 'init',
      color: '#ec4899', // Pink / Magenta
    };

    offspringList.push(childAgent);

    if (childFitness < newBest.fitness) {
      newBest = {
        position: [childX, childZ],
        fitness: childFitness,
        iteration: currentIter,
      };
    }
  }

  // Environmental Selection: Pick top Mu from offspring
  const combined = [...offspringList].sort((a, b) => a.fitness - b.fitness);
  const nextParents: Agent[] = [];

  for (let i = 0; i < parents.length; i++) {
    const elite = combined[i];
    nextParents.push({
      ...parents[i],
      position: elite.position,
      targetPosition: elite.position,
      fitness: elite.fitness,
      color: i === 0 ? '#84cc16' : '#8b5cf6', // Best child turns Bright Lime Green
    });
  }

  return {
    parents: nextParents,
    offspring: offspringList,
    globalBest: newBest,
    sigma,
  };
}

