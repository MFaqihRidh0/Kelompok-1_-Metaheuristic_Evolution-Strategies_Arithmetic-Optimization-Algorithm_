// Problem Bounds in 2D coordinate space for Three.js
export const LB = -40;
export const UB = 40;

export interface DatacenterCluster {
  id: number;
  name: string;
  type: 'HPC' | 'HTC' | 'HSC' | 'Storage' | 'General';
  position: [number, number]; // [x, z]
  mips: number; // Millions of Instructions per Second
  cores: number;
  height: number;
  color: string;
}

// 5 Heterogeneous Cloud Datacenters according to Lončar & Lončar (2022) CERN ALICE simulation
export const HETEROGENEOUS_DATACENTERS: DatacenterCluster[] = [
  { id: 1, name: 'DC-1: HPC Cluster', type: 'HPC', position: [-22, -20], mips: 4500, cores: 8, height: 7.5, color: '#38bdf8' },
  { id: 2, name: 'DC-2: HTC High-Throughput', type: 'HTC', position: [24, -18], mips: 3200, cores: 4, height: 6.0, color: '#a855f7' },
  { id: 3, name: 'DC-3: HSC High-Storage', type: 'HSC', position: [20, 22], mips: 2800, cores: 4, height: 5.2, color: '#ec4899' },
  { id: 4, name: 'DC-4: Distributed Storage', type: 'Storage', position: [-24, 20], mips: 2100, cores: 2, height: 4.2, color: '#f59e0b' },
  { id: 5, name: 'DC-5: Core Edge Cloud', type: 'General', position: [0, 0], mips: 3600, cores: 6, height: 6.8, color: '#10b981' },
];

/**
 * Evaluates Cloud Server Latency & Makespan Fitness (ms / seconds)
 * Lower is better (Minimization problem)
 */
export function evaluateFitness(
  x: number,
  z: number,
  landscape: 'cloud_multi' | 'sphere' | 'rastrigin' | 'cern_alice' = 'cloud_multi'
): number {
  if (landscape === 'sphere') {
    // Ideal minimum is 5.0 ms at (0, 0)
    return 5 + 0.02 * (x * x + z * z);
  }

  if (landscape === 'rastrigin') {
    // Multi-modal landscape with many local minima traps
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

  if (landscape === 'cern_alice') {
    // CERN LHC ALICE Monte Carlo Heterogeneous Workflow
    // Evaluates mapping to the 5 heterogeneous datacenters
    let minDcDist = Infinity;
    let targetDc = HETEROGENEOUS_DATACENTERS[0];

    HETEROGENEOUS_DATACENTERS.forEach((dc) => {
      const d = Math.hypot(x - dc.position[0], z - dc.position[1]);
      if (d < minDcDist) {
        minDcDist = d;
        targetDc = dc;
      }
    });

    // MIPS capacity factor: Higher MIPS processes tasks faster -> lower makespan
    const mipsFactor = 4500 / targetDc.mips;
    const distancePenalty = 0.05 * minDcDist;
    const jitter = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5;

    // Optimal makespan approaches ~8.2 ms at DC-1 (HPC) with balanced load
    return Math.max(3.5, 7.5 * mipsFactor + distancePenalty + jitter);
  }

  // Real-world Multi-Cluster Cloud Datacenter Topology (Default for AOA)
  const optimalNodeX = -12;
  const optimalNodeZ = 14;
  const distToOpt = Math.hypot(x - optimalNodeX, z - optimalNodeZ);

  // Overloaded server racks with latency spikes
  const hotspot1 = 28.0 * Math.exp(-0.025 * (Math.pow(x - 15, 2) + Math.pow(z - 12, 2)));
  const hotspot2 = 22.0 * Math.exp(-0.03 * (Math.pow(x + 18, 2) + Math.pow(z + 10, 2)));
  const backbonePenalty = 0.035 * Math.hypot(x, z);
  const clusterBonus = -9.5 * Math.exp(-0.015 * (distToOpt * distToOpt));
  const packetJitter = Math.sin(x * 0.35) * Math.cos(z * 0.35) * 0.75;

  const totalLatency = 16.0 + backbonePenalty + hotspot1 + hotspot2 + clusterBonus + packetJitter;
  return Math.max(4.0, totalLatency);
}
