// ============================================================================
// 1. DATA EMPIRIS PENGUJIAN (PYTHON REAL-WORLD & JAVA CLOUDSIM 7.0.1)
// ============================================================================
const BENCHMARK_DATA = {
  'real-world': {
    100: {
      random: { makespan: 444.29, lbi: 2.20, throughput: 0.23, cost: 92.97, util: { sby: 14.2, jkt: 32.5, yog: 98.4 } },
      aoa:    { makespan: 206.99, lbi: 1.96, throughput: 0.48, cost: 58.48, util: { sby: 54.2, jkt: 52.8, yog: 55.1 } }
    },
    200: {
      random: { makespan: 939.25, lbi: 2.09, throughput: 0.21, cost: 198.09, util: { sby: 15.1, jkt: 36.2, yog: 99.1 } },
      aoa:    { makespan: 634.92, lbi: 1.64, throughput: 0.32, cost: 167.48, util: { sby: 55.4, jkt: 53.6, yog: 54.8 } }
    },
    300: {
      random: { makespan: 1177.30, lbi: 1.91, throughput: 0.25, cost: 274.11, util: { sby: 16.8, jkt: 39.4, yog: 99.5 } },
      aoa:    { makespan: 931.37, lbi: 1.59, throughput: 0.32, cost: 250.45, util: { sby: 56.1, jkt: 54.2, yog: 55.0 } }
    },
    400: {
      random: { makespan: 1468.63, lbi: 1.83, throughput: 0.27, cost: 353.54, util: { sby: 17.5, jkt: 41.2, yog: 99.8 } },
      aoa:    { makespan: 1202.80, lbi: 1.58, throughput: 0.33, cost: 326.90, util: { sby: 56.8, jkt: 54.9, yog: 55.4 } }
    },
    500: {
      random: { makespan: 1917.29, lbi: 1.74, throughput: 0.26, cost: 467.26, util: { sby: 18.2, jkt: 43.1, yog: 99.9 } },
      aoa:    { makespan: 1682.69, lbi: 1.59, throughput: 0.30, cost: 445.20, util: { sby: 57.3, jkt: 55.2, yog: 55.8 } }
    }
  },
  'cloudsim': {
    100: {
      random: { makespan: 406.18, lbi: 0.3627, throughput: 0.25, cost: 86.40, util: { sby: 14.8, jkt: 33.1, yog: 98.2 } },
      aoa:    { makespan: 254.24, lbi: 0.3545, throughput: 0.39, cost: 59.10, util: { sby: 53.8, jkt: 51.9, yog: 54.2 } }
    },
    200: {
      random: { makespan: 728.07, lbi: 0.3880, throughput: 0.27, cost: 165.20, util: { sby: 15.6, jkt: 37.0, yog: 99.0 } },
      aoa:    { makespan: 607.90, lbi: 0.2874, throughput: 0.33, cost: 142.30, util: { sby: 54.7, jkt: 53.1, yog: 54.5 } }
    },
    300: {
      random: { makespan: 1352.44, lbi: 0.3518, throughput: 0.22, cost: 295.40, util: { sby: 16.5, jkt: 39.8, yog: 99.4 } },
      aoa:    { makespan: 933.42, lbi: 0.3555, throughput: 0.32, cost: 231.50, util: { sby: 55.9, jkt: 53.8, yog: 54.9 } }
    },
    400: {
      random: { makespan: 1557.14, lbi: 0.3849, throughput: 0.26, cost: 350.20, util: { sby: 17.2, jkt: 41.5, yog: 99.7 } },
      aoa:    { makespan: 1208.29, lbi: 0.3438, throughput: 0.33, cost: 298.10, util: { sby: 56.4, jkt: 54.5, yog: 55.2 } }
    },
    500: {
      random: { makespan: 2104.69, lbi: 0.3659, throughput: 0.24, cost: 489.10, util: { sby: 18.0, jkt: 43.5, yog: 99.9 } },
      aoa:    { makespan: 1680.48, lbi: 0.3879, throughput: 0.30, cost: 420.80, util: { sby: 57.1, jkt: 55.0, yog: 55.6 } }
    }
  }
};

// ============================================================================
// 2. KONFIGURASI 8 POS MUSUH DUMMY DI ARENA 3D (POS 1 S.D. POS 8)
// ============================================================================
const ENEMY_STATIONS = [
  {
    id: 0,
    posNum: 1,
    name: "POS 1 • UNCONFIGURED NODE",
    enemyTitle: "Dummy 01: Unconfigured Server",
    slideTitle: "Slide 1: Komparasi Kinerja & Topologi 10 VM",
    x: 0,
    z: 5,
    color: 0x38bdf8,
    scale: 1.0
  },
  {
    id: 1,
    posNum: 2,
    name: "POS 2 • RANDOM BOTTLENECK",
    enemyTitle: "Dummy 02: Blind Random Imp",
    slideTitle: "Slide 2: Inefisiensi Fatal Random Scheduling",
    x: -10,
    z: -7,
    color: 0xef4444,
    scale: 1.05
  },
  {
    id: 2,
    posNum: 3,
    name: "POS 3 • LATENCY PHANTOM",
    enemyTitle: "Dummy 03: Network Latency Golem",
    slideTitle: "Slide 3: Arsitektur 3 DC & Latensi Geografis",
    x: 10,
    z: -19,
    color: 0xa855f7,
    scale: 1.05
  },
  {
    id: 3,
    posNum: 4,
    name: "POS 4 • ARITHMETIC CORE",
    enemyTitle: "Dummy 04: 4-Operator Sentinel",
    slideTitle: "Slide 4: Matematika AOA (MOA, MOP, ÷, ×, -, +)",
    x: -10,
    z: -31,
    color: 0x10b981,
    scale: 1.12
  },
  {
    id: 4,
    posNum: 5,
    name: "POS 5 • IMBALANCE GOLEM",
    enemyTitle: "Dummy 05: LBI & Cost Construct",
    slideTitle: "Slide 5: Evaluator Fitness (Makespan, LBI, Cost)",
    x: 10,
    z: -43,
    color: 0xf59e0b,
    scale: 1.12
  },
  {
    id: 5,
    posNum: 6,
    name: "POS 6 • DATASET SENTINEL",
    enemyTitle: "Dummy 06: CSV 10-Runs Guardian",
    slideTitle: "Slide 6: Metodologi Loop 10 Runs & Parser CSV",
    x: -10,
    z: -55,
    color: 0x06b6d4,
    scale: 1.15
  },
  {
    id: 6,
    posNum: 7,
    name: "POS 7 • BENCHMARK COLOSSUS",
    enemyTitle: "Dummy 07: CloudSim vs Real-World Titan",
    slideTitle: "Slide 7: Tabel Hasil Empiris CloudSim & Real-World",
    x: 10,
    z: -67,
    color: 0xec4899,
    scale: 1.2
  },
  {
    id: 7,
    posNum: 8,
    name: "POS 8 • BOTTLENECK OVERLORD",
    enemyTitle: "Boss Dummy 08: Cloud Overlord",
    slideTitle: "Slide 8: Kesimpulan Akademik & Konsol Simulator",
    x: 0,
    z: -80,
    color: 0xfbbf24,
    scale: 1.38
  }
];
