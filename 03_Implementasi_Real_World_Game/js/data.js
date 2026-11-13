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
// 2. RUTE JALAN BERKELOK (LURUS -> BELOK KIRI -> BELOK KANAN -> S-CURVE)
//    Setiap Pos berjarak ~38-55 unit di balik tikungan tebing batu & pepohonan
//    sehingga musuh pos berikutnya tidak langsung terlihat dari pos sebelumnya!
// ============================================================================
const ROAD_WAYPOINTS = [
  { x: 0,   z: 20 },   // Titik Awal Sanctuary
  { x: 0,   z: 8 },    // Gerbang Arena (Lurus ke depan)
  { x: 0,   z: -8 },   // POS 1: Ular Kobra Abyssal (Lurus di depan gerbang)
  { x: -14, z: -22 },  // Tikungan Belok Kiri 1
  { x: -34, z: -34 },  // POS 2: Elang Badai Petir (Di balik tikungan kiri)
  { x: -54, z: -48 },  // Tikungan Lembah Barat
  { x: -60, z: -68 },  // POS 3: Laba-Laba Latensi
  { x: -38, z: -86 },  // Tikungan Belok Kanan melintasi ngarai batu
  { x: -10, z: -98 },  // POS 4: Serigala Fenrir
  { x: 20,  z: -110 }, // Tikungan Belok Kanan Jauh ke Hutan Timur
  { x: 46,  z: -126 }, // POS 5: Kalajengking Besi
  { x: 58,  z: -148 }, // Tikungan Tebing Timur Laut
  { x: 42,  z: -170 }, // POS 6: Minotaur Dataset
  { x: 14,  z: -186 }, // Tikungan Belok Kiri menuju Rawa Kristal
  { x: -16, z: -202 }, // POS 7: Hydra Kraken
  { x: -6,  z: -220 }, // Jalur Lurus Menuju Kuil Boss Terakhir
  { x: 0,   z: -240 }  // POS 8: Raja Naga Bahamut (Final Boss Sanctuary)
];

// ============================================================================
// 3. KONFIGURASI 8 POS MONSTER UNIK DI SEPANJANG RUTE BERKELOK (POS 1 - POS 8)
// ============================================================================
const ENEMY_STATIONS = [
  {
    id: 0,
    posNum: 1,
    monsterType: "serpent",
    icon: "🐍",
    name: "POS 1 • ULAR KOBRA ABYSSAL",
    enemyTitle: "Venomous Cyber-Serpent",
    slideTitle: "Slide 1: Komparasi Kinerja & Topologi 10 VM",
    x: 0,
    z: -8,
    faceAngle: 0,
    color: 0x10b981,
    accent: 0xef4444,
    scale: 1.2
  },
  {
    id: 1,
    posNum: 2,
    monsterType: "eagle",
    icon: "🦅",
    name: "POS 2 • ELANG RAJA LANGIT",
    enemyTitle: "Majestic Feathered Golden Eagle",
    slideTitle: "Slide 2: Inefisiensi Fatal Random Scheduling",
    x: -34,
    z: -34,
    faceAngle: 0.75,
    color: 0x5c3419,
    accent: 0xfbbf24,
    scale: 1.25
  },
  {
    id: 2,
    posNum: 3,
    monsterType: "spider",
    icon: "🕷️",
    name: "POS 3 • LABA-LABA LATENSI",
    enemyTitle: "Shadow Network Arachnid",
    slideTitle: "Slide 3: Arsitektur 3 DC & Latensi Geografis",
    x: -60,
    z: -68,
    faceAngle: 0.25,
    color: 0xa855f7,
    accent: 0xf43f5e,
    scale: 1.25
  },
  {
    id: 3,
    posNum: 4,
    monsterType: "wolf",
    icon: "🐺",
    name: "POS 4 • SERIGALA ABU-ABU FENRIR",
    enemyTitle: "Alpha Grey Timber Wolf",
    slideTitle: "Slide 4: Matematika AOA (MOA, MOP, ÷, ×, -, +)",
    x: -10,
    z: -98,
    faceAngle: -0.85,
    color: 0x64748b,
    accent: 0xfbbf24,
    scale: 1.25
  },
  {
    id: 4,
    posNum: 5,
    monsterType: "scorpion",
    icon: "🦂",
    name: "POS 5 • KALAJENGKING BESI",
    enemyTitle: "Scorpius Chitin Dreadnought",
    slideTitle: "Slide 5: Evaluator Fitness (Makespan, LBI, Cost)",
    x: 46,
    z: -126,
    faceAngle: -0.75,
    color: 0xea580c,
    accent: 0xfacc15,
    scale: 1.28
  },
  {
    id: 5,
    posNum: 6,
    monsterType: "minotaur",
    icon: "👹",
    name: "POS 6 • MINOTAUR DATASET",
    enemyTitle: "Infernal Horned Minotaur",
    slideTitle: "Slide 6: Metodologi Loop 10 Runs & Parser CSV",
    x: 42,
    z: -170,
    faceAngle: 0.45,
    color: 0xdc2626,
    accent: 0xfbbf24,
    scale: 1.32
  },
  {
    id: 6,
    posNum: 7,
    monsterType: "hydra",
    icon: "🐙",
    name: "POS 7 • KRAKEN GURITA RAKSASA",
    enemyTitle: "Colossal Brown Octopus Kraken",
    slideTitle: "Slide 7: Tabel Hasil Empiris CloudSim & Real-World",
    x: -16,
    z: -202,
    faceAngle: 0.85,
    color: 0x7c3f1d,
    accent: 0xfbbf24,
    scale: 1.38
  },
  {
    id: 7,
    posNum: 8,
    monsterType: "dragon",
    icon: "🐉",
    name: "POS 8 • RAJA NAGA MERAH BAHAMUT",
    enemyTitle: "Final Boss: Crimson Scaled Dragon",
    slideTitle: "Slide 8: Kesimpulan Akademik & Konsol Simulator",
    x: 0,
    z: -240,
    faceAngle: 0,
    color: 0xdc2626,
    accent: 0xfbbf24,
    scale: 1.55
  }
];
