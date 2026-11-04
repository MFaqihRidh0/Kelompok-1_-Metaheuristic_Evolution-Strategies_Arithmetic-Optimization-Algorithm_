// Problem Bounds
export const LB = -40;
export const UB = 40;

/**
 * Evaluates Cloud Server Latency Fitness (ms)
 * Lower is better (Minimization problem)
 */
export function evaluateFitness(
  x: number,
  z: number,
  landscape: 'cloud_multi' | 'sphere' | 'rastrigin' = 'cloud_multi'
): number {
  if (landscape === 'sphere') {
    // Ideal minimum is 5.0 ms at (0, 0)
    return 5 + 0.02 * (x * x + z * z);
  }

  if (landscape === 'rastrigin') {
    // Highly multi-modal landscape with many local optima traps
    const A = 10;
    const nx = x / 8;
    const nz = z / 8;
    return (
      10 +
      (2 * A +
        (nx * nx - A * Math.cos(2 * Math.PI * nx)) +
        (nz * nz - A * Math.cos(2 * Math.PI * nz))) *
        1.5
    );
  }

  // Real-world Multi-Cluster Cloud Datacenter Topology
  // Simulates server bottlenecks, congested VM nodes, and optimal edge cluster
  const optimalNodeX = -12;
  const optimalNodeZ = 14;
  const distToOpt = Math.hypot(x - optimalNodeX, z - optimalNodeZ);

  // Overloaded server racks with latency spikes
  const hotspot1 = 28.0 * Math.exp(-0.025 * (Math.pow(x - 15, 2) + Math.pow(z - 12, 2)));
  const hotspot2 = 22.0 * Math.exp(-0.03 * (Math.pow(x + 18, 2) + Math.pow(z + 10, 2)));

  // Distance penalty to backbone
  const backbonePenalty = 0.035 * Math.hypot(x, z);

  // Golden cluster minimum: reaches ~11.5 - 12.0 ms
  const clusterBonus = -9.5 * Math.exp(-0.015 * (distToOpt * distToOpt));

  // Small packet jitter
  const packetJitter = Math.sin(x * 0.35) * Math.cos(z * 0.35) * 0.75;

  const totalLatency = 16.0 + backbonePenalty + hotspot1 + hotspot2 + clusterBonus + packetJitter;
  return Math.max(4.0, totalLatency);
}

