// ============================================================================
// AOA CLOUD BATTLE ARENA — 3D WORLD, HERO & 8 UNIQUE MONSTERS ENGINE
// 1. Hero dengan 5 Lightning Orbs Formasi Kurva ke Atas di Punggung + Solar Fire Halo
// 2. 8 Karakter Monster Unik (Ular Kobra, Elang, Laba-laba, Serigala, Kalajengking, Minotaur, Hydra, Naga Boss)
// ============================================================================

let scene, camera, renderer, clock;
let isIntroMode = true;
let playerGroup, playerParts = {};
let playerPos = new THREE.Vector3(0, 0, 17);
let playerRotY = Math.PI; // Menghadap ke arah -Z (ke dalam arena)
let walkTime = 0;

let autoWalkTarget = null;
const keysPressed = {};

let hemiLight, dirLight, introSpotLight, introRingMesh;

const enemyObjects = [];
const activeProjectiles = [];
const activeParticles = [];
const activeLightnings = [];
const activeShockwaves = [];

let defeatedCount = 0;

// ============================================================================
// 1. INITIALIZE THREE.JS SCENE & SPOTLIGHT INTRO
// ============================================================================
function initGameEngine() {
  const container = document.getElementById('gameCanvasContainer');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x130e26);
  scene.fog = new THREE.FogExp2(0x130e26, 0.011);

  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 250);
  camera.position.set(0, 13.5, 30.5);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  setupLighting();
  buildGroundAndRoad();
  buildStartSanctuaryProps();
  buildDatacenterTowers();
  buildPlayerHero();
  buildAllEnemyStations();
  setupInputListeners();

  window.addEventListener('resize', onWindowResize);
  requestAnimationFrame(gameLoop);
}

// ============================================================================
// 2. LIGHTING
// ============================================================================
function setupLighting() {
  hemiLight = new THREE.HemisphereLight(0xffe3b8, 0x2b193d, 0.22);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffb482, 0.2);
  dirLight.position.set(28, 48, 25);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 5;
  dirLight.shadow.camera.far = 150;
  const d = 58;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  introSpotLight = new THREE.SpotLight(0xc084fc, 4.5, 34, Math.PI / 4.0, 0.35, 1.2);
  introSpotLight.position.set(0, 16, 17);
  introSpotLight.target.position.set(0, 0, 17);
  introSpotLight.castShadow = true;
  scene.add(introSpotLight);
  scene.add(introSpotLight.target);
}

// ============================================================================
// 3. GROUND GRID & ARENA BOULEVARD
// ============================================================================
function createPlusGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#191233';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 256, 256);

  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  const drawPlus = (cx, cy) => {
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.moveTo(cx, cy + 8);
    ctx.stroke();
  };
  drawPlus(128, 128);
  drawPlus(64, 64);
  drawPlus(192, 64);
  drawPlus(64, 192);
  drawPlus(192, 192);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(36, 36);
  return tex;
}

function buildGroundAndRoad() {
  const gridTex = createPlusGridTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(230, 230),
    new THREE.MeshStandardMaterial({ map: gridTex, roughness: 0.85, metalness: 0.1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const startDisc = new THREE.Mesh(
    new THREE.CircleGeometry(6.2, 48),
    new THREE.MeshStandardMaterial({ color: 0x4c3575, roughness: 0.7 })
  );
  startDisc.rotation.x = -Math.PI / 2;
  startDisc.position.set(0, 0.03, 17);
  startDisc.receiveShadow = true;
  scene.add(startDisc);

  introRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(6.05, 6.35, 64),
    new THREE.MeshBasicMaterial({ color: 0xe879f9, side: THREE.DoubleSide })
  );
  introRingMesh.rotation.x = -Math.PI / 2;
  introRingMesh.position.set(0, 0.06, 17);
  scene.add(introRingMesh);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 116),
    new THREE.MeshStandardMaterial({ color: 0x241d2c, roughness: 0.8 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, -37);
  road.receiveShadow = true;
  scene.add(road);

  for (let z = 12; z >= -88; z -= 4) {
    const isRed = Math.abs(Math.floor(z / 4)) % 2 === 0;
    const curbMat = new THREE.MeshStandardMaterial({ color: isRed ? 0xef4444 : 0xf8fafc, roughness: 0.6 });
    const curbGeo = new THREE.BoxGeometry(0.9, 0.24, 3.9);

    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-14.8, 0.12, z);
    leftCurb.receiveShadow = true;
    scene.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(14.8, 0.12, z);
    rightCurb.receiveShadow = true;
    scene.add(rightCurb);
  }

  buildArenaGateArch(0, 10.8);
}

function buildArenaGateArch(x, z) {
  const gateGroup = new THREE.Group();
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x7c5869, metalness: 0.4, roughness: 0.5 });
  const pillarGeo = new THREE.BoxGeometry(1.1, 7.5, 1.1);

  const leftP = new THREE.Mesh(pillarGeo, pillarMat);
  leftP.position.set(-9.5, 3.75, 0);
  leftP.castShadow = true;
  gateGroup.add(leftP);

  const rightP = new THREE.Mesh(pillarGeo, pillarMat);
  rightP.position.set(9.5, 3.75, 0);
  rightP.castShadow = true;
  gateGroup.add(rightP);

  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(20.5, 1.3, 1.3), pillarMat);
  topBeam.position.set(0, 7.2, 0);
  topBeam.castShadow = true;
  gateGroup.add(topBeam);

  for (let i = -8; i <= 8; i++) {
    const sq = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.95),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xffffff : 0x1e1b24 })
    );
    sq.rotation.x = -Math.PI / 2;
    sq.position.set(i, 0.04, 0);
    gateGroup.add(sq);
  }

  gateGroup.position.set(x, 0, z);
  scene.add(gateGroup);
}

// ============================================================================
// 4. SANCTUARY PROPS & DATACENTER TOWERS
// ============================================================================
function buildLantern(x, z) {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3b2d54, roughness: 0.6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 0.8, 8), poleMat);
  base.position.y = 0.4;
  g.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.2, 8), poleMat);
  pole.position.y = 2.0;
  g.add(pole);

  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.3, 0.85, 6), new THREE.MeshBasicMaterial({ color: 0xffb703 }));
  lamp.position.y = 3.7;
  g.add(lamp);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.45, 6), poleMat);
  cap.position.y = 4.3;
  g.add(cap);

  const pl = new THREE.PointLight(0xff9e00, 1.0, 14);
  pl.position.y = 3.7;
  g.add(pl);

  g.position.set(x, 0, z);
  scene.add(g);
}

function buildStylizedTree(x, z, foliageColor = 0x9d4edd) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.45, 2.8, 7),
    new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 })
  );
  trunk.position.y = 1.4;
  trunk.castShadow = true;
  g.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.75 });
  [[0, 3.4, 0, 1.45], [-0.8, 2.9, 0.5, 1.05], [0.85, 3.0, -0.4, 1.1], [0.2, 4.2, 0.3, 0.95]].forEach(([ox, oy, oz, r]) => {
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), leafMat);
    puff.position.set(ox, oy, oz);
    puff.castShadow = true;
    g.add(puff);
  });

  g.position.set(x, 0, z);
  scene.add(g);
}

function buildStartSanctuaryProps() {
  buildLantern(-3.4, 18.2);
  buildStylizedTree(-2.4, 14.2, 0x8b5cf6);

  const treeColors = [0xd946ef, 0xf43f5e, 0xf59e0b, 0x8b5cf6];
  for (let i = 0; i < 8; i++) {
    const zPos = 4 - i * 12;
    buildLantern(-13.8, zPos + 3);
    buildLantern(13.8, zPos - 3);
    buildStylizedTree(-18.2, zPos, treeColors[i % treeColors.length]);
    buildStylizedTree(18.2, zPos - 4, treeColors[(i + 1) % treeColors.length]);
  }
}

function buildDatacenterTowers() {
  const dcConfigs = [
    { x: -24, z: -14, h: 11, color: 0x0284c7 },
    { x: 24,  z: -38, h: 8.5, color: 0x8b5cf6 },
    { x: -24, z: -62, h: 6.5, color: 0x10b981 }
  ];

  dcConfigs.forEach(dc => {
    const g = new THREE.Group();
    const pad = new THREE.Mesh(new THREE.BoxGeometry(9, 0.5, 9), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    pad.position.y = 0.25;
    g.add(pad);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, dc.h, 6.5),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.3 })
    );
    body.position.y = dc.h / 2 + 0.5;
    body.castShadow = true;
    g.add(body);

    const rim = new THREE.Mesh(new THREE.BoxGeometry(6.75, 0.35, 6.75), new THREE.MeshBasicMaterial({ color: dc.color }));
    rim.position.y = dc.h + 0.4;
    g.add(rim);

    for (let row = 1.5; row < dc.h; row += 1.4) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.18, 6.62), new THREE.MeshBasicMaterial({ color: dc.color }));
      strip.position.y = row;
      g.add(strip);
    }

    g.position.set(dc.x, 0, dc.z);
    scene.add(g);
  });
}

// ============================================================================
// 5. REVISED HERO CHARACTER: CYBER-SAMURAI ARCHMAGE
// - Detailed Armor, Spiky Anime Hair, Flowing Scarf/Cape, Crossed Back Blades
// - 5 LIGHTNING ORBS IN AN UPWARD CURVE ARCH BEHIND THE BACK (No orbs on hands!)
// - FLOATING SOLAR FIRE HALO BEHIND LOWER BACK
// ============================================================================
function buildPlayerHero() {
  playerGroup = new THREE.Group();

  const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.7 });
  const crimsonMat  = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.45, metalness: 0.3 });
  const goldMat     = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.25, metalness: 0.85 });
  const skinMat     = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 });
  const hairMat     = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.2 });
  const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // 1. Torso & Samurai Chest Cuirass
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.38;

  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.34, 1.15, 10), obsidianMat);
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Golden Chest & Back Armor Plates
  const armorPlate = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.68, 0.56), obsidianMat);
  armorPlate.position.y = 0.12;
  torsoGroup.add(armorPlate);

  const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.6), goldMat);
  goldTrim.position.y = 0.36;
  torsoGroup.add(goldTrim);

  // Glowing Core Emblem on Back
  const backEmblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), cyanGlowMat);
  backEmblem.position.set(0, 0.15, -0.3);
  torsoGroup.add(backEmblem);

  // Waist Sash / Belt & Armored Skirt Tassets
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.22, 10), goldMat);
  belt.position.y = -0.45;
  torsoGroup.add(belt);

  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.48), crimsonMat);
  skirtL.position.set(-0.34, -0.72, 0);
  skirtL.rotation.z = 0.18;
  torsoGroup.add(skirtL);

  const skirtR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.55, 0.48), crimsonMat);
  skirtR.position.set(0.34, -0.72, 0);
  skirtR.rotation.z = -0.18;
  torsoGroup.add(skirtR);

  // Crossed Elemental Katana Sheaths on Lower Back
  const katana1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.65, 8), obsidianMat);
  katana1.position.set(0, -0.1, -0.35);
  katana1.rotation.z = 0.65;
  torsoGroup.add(katana1);

  const katana2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.65, 8), goldMat);
  katana2.position.set(0, -0.1, -0.38);
  katana2.rotation.z = -0.65;
  torsoGroup.add(katana2);

  // Flowing Divided Battle Cape / Scarf Ribbons behind Back
  const capeGroup = new THREE.Group();
  capeGroup.position.set(0, 0.38, -0.32);
  const capeL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.35, 0.06), crimsonMat);
  capeL.position.set(-0.24, -0.65, -0.08);
  capeL.rotation.z = 0.08;
  capeGroup.add(capeL);

  const capeR = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.35, 0.06), crimsonMat);
  capeR.position.set(0.24, -0.65, -0.08);
  capeR.rotation.z = -0.08;
  capeGroup.add(capeR);
  torsoGroup.add(capeGroup);

  playerGroup.add(torsoGroup);

  // 2. Hero Head, Sculpted Spiky Anime Hair & Golden Crown
  const headGroup = new THREE.Group();
  headGroup.position.y = 2.25;

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 14), skinMat);
  headGroup.add(headMesh);

  // Glowing Cyber Eyes Visor (facing +Z)
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.22), cyanGlowMat);
  visor.position.set(0, 0.02, 0.25);
  headGroup.add(visor);

  // Golden Crown Headband
  const headband = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.1, 12), goldMat);
  headband.position.y = 0.14;
  headGroup.add(headband);

  // Sculpted Spiky Anime Hair Locks (sweeping upward & backward so it looks badass from the back!)
  const spikeAngles = [
    [0, 0.42, -0.18, -0.5, 0],
    [-0.22, 0.38, -0.16, -0.45, -0.35],
    [0.22, 0.38, -0.16, -0.45, 0.35],
    [-0.34, 0.22, -0.12, -0.25, -0.65],
    [0.34, 0.22, -0.12, -0.25, 0.65],
    [0, 0.25, -0.32, -0.95, 0],
    [-0.18, 0.18, -0.3, -0.85, -0.3],
    [0.18, 0.18, -0.3, -0.85, 0.3]
  ];
  spikeAngles.forEach(([sx, sy, sz, rx, rz]) => {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.52, 6), hairMat);
    spike.position.set(sx, sy, sz);
    spike.rotation.set(rx, 0, rz);
    headGroup.add(spike);
  });

  playerGroup.add(headGroup);

  // 3. Articulated Arms with Layered Shoulder Pauldrons & Armored Gauntlets (NO Orbs in hands!)
  const buildHeroArm = (isRight) => {
    const s = isRight ? 1 : -1;
    const arm = new THREE.Group();
    arm.position.set(s * 0.6, 1.82, 0);

    // Layered Samurai Shoulder Pauldron
    const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.48), obsidianMat);
    pauldron.position.set(s * 0.08, 0.08, 0);
    pauldron.rotation.z = -s * 0.25;
    arm.add(pauldron);

    const pauldronRim = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.07, 0.51), goldMat);
    pauldronRim.position.set(s * 0.08, -0.04, 0);
    pauldronRim.rotation.z = -s * 0.25;
    arm.add(pauldronRim);

    // Upper Arm & Forearm Gauntlet
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.55, 8), obsidianMat);
    upper.position.set(s * 0.08, -0.28, 0);
    arm.add(upper);

    const gauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.42, 8), goldMat);
    gauntlet.position.set(s * 0.1, -0.62, 0.06);
    gauntlet.rotation.x = 0.25;
    arm.add(gauntlet);

    return arm;
  };

  const armR = buildHeroArm(true);
  const armL = buildHeroArm(false);
  playerGroup.add(armR);
  playerGroup.add(armL);

  // 4. Articulated Legs with Armored Greaves/Boots
  const buildHeroLeg = (isRight) => {
    const s = isRight ? 1 : -1;
    const leg = new THREE.Group();
    leg.position.set(s * 0.23, 0.82, 0);

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.48, 8), obsidianMat);
    thigh.position.y = -0.22;
    leg.add(thigh);

    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.46, 8), goldMat);
    boot.position.y = -0.62;
    leg.add(boot);

    return leg;
  };

  const legR = buildHeroLeg(true);
  const legL = buildHeroLeg(false);
  playerGroup.add(legR);
  playerGroup.add(legL);

  // ============================================================================
  // 5. ELEMENTAL FORMATIONS BEHIND THE BACK (NOT ON HANDS!)
  // A) 5 LIGHTNING ORBS IN AN UPWARD CURVE FORMATION (Kurva Melengkung ke Atas)
  // ============================================================================
  const lightningArchGroup = new THREE.Group();
  lightningArchGroup.position.set(0, 0, -0.58); // Behind the hero's back
  const lightningOrbs = [];
  const archPositions = [];

  // 5 Orbs arranged in a symmetric upward curve (Busur Kurva ke Atas)
  const angles = [Math.PI * 0.14, Math.PI * 0.32, Math.PI * 0.50, Math.PI * 0.68, Math.PI * 0.86];
  angles.forEach((theta, idx) => {
    const ox = Math.cos(theta) * 1.28;
    const oy = 1.68 + Math.sin(theta) * 1.22; // Curves upward to peak at y = 2.90!
    const oz = 0;
    archPositions.push(new THREE.Vector3(ox, oy, oz));

    const orbHolder = new THREE.Group();
    orbHolder.position.set(ox, oy, oz);

    // Inner Bright Electric Sphere
    const coreSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    orbHolder.add(coreSphere);

    // Outer Crackling Violet-Cyan Wireframe Cage
    const cage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.29, 1),
      new THREE.MeshBasicMaterial({ color: 0xc084fc, wireframe: true, transparent: true, opacity: 0.75 })
    );
    orbHolder.add(cage);

    // Plasma Ring around each Orb
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.33, 0.022, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
    );
    ring.rotation.x = Math.PI / 3;
    orbHolder.add(ring);

    lightningArchGroup.add(orbHolder);
    lightningOrbs.push({ orbHolder, coreSphere, cage, ring, baseY: oy, phase: idx * 1.1 });
  });

  // Glowing Energy Curve Line connecting the 5 Lightning Orbs
  const archCurveGeo = new THREE.BufferGeometry().setFromPoints(archPositions);
  const archCurveLine = new THREE.Line(
    archCurveGeo,
    new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 })
  );
  lightningArchGroup.add(archCurveLine);
  playerGroup.add(lightningArchGroup);

  // ============================================================================
  // B) SOLAR FIRE ELEMENT RING & 3 EMBER SUN-ORBS FLOATING BEHIND LOWER BACK
  // ============================================================================
  const fireBackGroup = new THREE.Group();
  fireBackGroup.position.set(0, 1.55, -0.45);

  const fireChakram = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.038, 10, 32),
    new THREE.MeshBasicMaterial({ color: 0xff5400 })
  );
  fireBackGroup.add(fireChakram);

  const fireOrbs = [];
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2;
    const fOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffbe0b })
    );
    fOrb.position.set(Math.cos(ang) * 0.72, Math.sin(ang) * 0.72, 0);
    const fAura = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xff5400, transparent: true, opacity: 0.55 })
    );
    fOrb.add(fAura);
    fireChakram.add(fOrb);
    fireOrbs.push(fOrb);
  }
  playerGroup.add(fireBackGroup);

  playerParts = {
    torso: torsoGroup,
    headGroup,
    capeGroup,
    legL,
    legR,
    armR,
    armL,
    lightningArchGroup,
    lightningOrbs,
    fireBackGroup,
    fireChakram
  };

  playerGroup.position.copy(playerPos);
  playerGroup.rotation.y = playerRotY;
  scene.add(playerGroup);
}

// ============================================================================
// 6. BUILD 8 UNIQUE, DIVERSE MONSTER CHARACTERS FOR POS 1 TO POS 8
// Pos 1: Ular Kobra Raksasa (Serpent)
// Pos 2: Burung Elang Badai (Eagle)
// Pos 3: Laba-Laba Latensi (Spider)
// Pos 4: Serigala Fenrir (Wolf)
// Pos 5: Kalajengking Besi (Scorpion)
// Pos 6: Minotaur Bertanduk (Minotaur)
// Pos 7: Hydra Kraken Tentakel (Hydra)
// Pos 8: Raja Naga Legendaris (Dragon Final Boss)
// ============================================================================
function buildMonsterMesh(st) {
  const bodyGroup = new THREE.Group();
  const mainMat = new THREE.MeshStandardMaterial({ color: st.color, roughness: 0.38, metalness: 0.45 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e1b2e, roughness: 0.5, metalness: 0.5 });
  const accentMat = new THREE.MeshBasicMaterial({ color: st.accent });
  const fangMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff003c });

  const animParts = {};

  if (st.monsterType === 'serpent') {
    // 🐍 POS 1: ULAR KOBRA RAKSASA MENGERIKAN
    // 4 Coiled body rings on the ground
    const coilRadii = [1.45, 1.2, 0.95, 0.72];
    coilRadii.forEach((r, idx) => {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(r, 0.32 - idx * 0.03, 12, 28), idx % 2 === 0 ? mainMat : darkMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.y = 0.28 + idx * 0.34;
      coil.castShadow = true;
      bodyGroup.add(coil);
    });

    // Rising Cobra Neck & Flared Hood
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.75, 0.2);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 1.3, 12), mainMat);
    neck.position.y = 0.4;
    headPivot.add(neck);

    // Wide Cobra Hood (Flattened sphere/disc behind head)
    const hood = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 16), darkMat);
    hood.scale.set(1.15, 1.1, 0.28);
    hood.position.set(0, 0.75, -0.05);
    headPivot.add(hood);

    const hoodPattern = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 20), accentMat);
    hoodPattern.position.set(0, 0.75, 0.18);
    headPivot.add(hoodPattern);

    // Serpent Head, Glowing Eyes, Venom Fangs & Forked Tongue
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.52, 0.95), mainMat);
    head.position.set(0, 1.15, 0.35);
    headPivot.add(head);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), eyeMat);
    eyeL.position.set(-0.26, 1.26, 0.72);
    headPivot.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.26;
    headPivot.add(eyeR);

    // Two Giant Venomous Fangs
    const fangL = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.42, 8), fangMat);
    fangL.rotation.x = Math.PI;
    fangL.position.set(-0.22, 0.82, 0.72);
    headPivot.add(fangL);
    const fangR = fangL.clone();
    fangR.position.x = 0.22;
    headPivot.add(fangR);

    // Flickering Forked Tongue
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.65), accentMat);
    tongue.position.set(0, 0.95, 1.05);
    headPivot.add(tongue);

    bodyGroup.add(headPivot);
    animParts.headPivot = headPivot;
    animParts.tongue = tongue;

  } else if (st.monsterType === 'eagle') {
    // 🦅 POS 2: BURUNG ELANG BADAI PETIR (Hovering & Flapping Giant Wings)
    const eagleGroup = new THREE.Group();
    eagleGroup.position.y = 1.95;

    const torso = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.8, 10), darkMat);
    torso.rotation.x = Math.PI * 0.65;
    torso.castShadow = true;
    eagleGroup.add(torso);

    const breastArmor = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 12), mainMat);
    breastArmor.position.set(0, 0.1, 0.35);
    eagleGroup.add(breastArmor);

    // Eagle Head & Sharp Hooked Golden Beak
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), fangMat);
    head.position.set(0, 0.65, 0.75);
    eagleGroup.add(head);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.68, 8), mainMat);
    beak.rotation.x = Math.PI * 0.58;
    beak.position.set(0, 0.58, 1.22);
    eagleGroup.add(beak);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), accentMat);
    eyeL.position.set(-0.22, 0.72, 1.0);
    eagleGroup.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.22;
    eagleGroup.add(eyeR);

    // Giant Flapping Wings (Left & Right)
    const buildWing = (dir) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(dir * 0.5, 0.35, 0.1);
      const mainWing = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 0.95), mainMat);
      mainWing.position.set(dir * 1.15, 0, 0);
      mainWing.castShadow = true;
      wGroup.add(mainWing);

      const featherTip = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.55), accentMat);
      featherTip.position.set(dir * 1.35, -0.02, -0.35);
      wGroup.add(featherTip);
      return wGroup;
    };

    const wingL = buildWing(-1);
    const wingR = buildWing(1);
    eagleGroup.add(wingL);
    eagleGroup.add(wingR);

    // Sharp Talons
    const talonL = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.55, 6), mainMat);
    talonL.rotation.x = Math.PI;
    talonL.position.set(-0.35, -0.65, 0.35);
    eagleGroup.add(talonL);
    const talonR = talonL.clone();
    talonR.position.x = 0.35;
    eagleGroup.add(talonR);

    bodyGroup.add(eagleGroup);
    animParts.hoverGroup = eagleGroup;
    animParts.wingL = wingL;
    animParts.wingR = wingR;

  } else if (st.monsterType === 'spider') {
    // 🕷️ POS 3: LABA-LABA RAKSASA LATENSI (8 Articulated Legs + Glowing Abdomen)
    const abdomen = new THREE.Mesh(new THREE.SphereGeometry(1.15, 16, 16), darkMat);
    abdomen.scale.set(1.0, 0.85, 1.35);
    abdomen.position.set(0, 1.15, -0.55);
    abdomen.castShadow = true;
    bodyGroup.add(abdomen);

    const mark = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), accentMat);
    mark.position.set(0, 1.65, -0.55);
    bodyGroup.add(mark);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.68, 14, 14), mainMat);
    head.position.set(0, 1.05, 0.65);
    bodyGroup.add(head);

    // Cluster of 6 Red Spider Eyes
    [-0.25, -0.1, 0.1, 0.25].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeMat);
      eye.position.set(ex, 1.2, 1.22);
      bodyGroup.add(eye);
    });

    // 8 Jointed Spider Legs
    const legs = [];
    for (let side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const legPivot = new THREE.Group();
        const zOff = 0.5 - i * 0.42;
        legPivot.position.set(side * 0.55, 1.0, zOff);

        const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 1.35, 8), mainMat);
        upperLeg.position.set(side * 0.55, 0.35, 0);
        upperLeg.rotation.z = -side * 0.85;
        legPivot.add(upperLeg);

        const lowerLeg = new THREE.Mesh(new THREE.ConeGeometry(0.08, 1.55, 8), darkMat);
        lowerLeg.rotation.z = Math.PI + side * 0.25;
        lowerLeg.position.set(side * 1.18, -0.25, 0);
        legPivot.add(lowerLeg);

        bodyGroup.add(legPivot);
        legs.push({ legPivot, phase: i * 0.8 + (side > 0 ? 0 : Math.PI) });
      }
    }
    animParts.spiderLegs = legs;

  } else if (st.monsterType === 'wolf') {
    // 🐺 POS 4: SERIGALA FENRIR ARITMATIKA
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.05, 2.1), darkMat);
    torso.position.set(0, 1.25, 0);
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Crystal Spikes along Fenrir's Back
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 5), mainMat);
      spike.position.set(0, 1.95, 0.5 - i * 0.45);
      spike.rotation.x = -0.35;
      bodyGroup.add(spike);
    }

    // Wolf Head, Snout, Ears & Fangs
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.75, 1.15);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.78, 0.85), mainMat);
    headGroup.add(skull);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.42, 0.75), darkMat);
    snout.position.set(0, -0.12, 0.65);
    headGroup.add(snout);

    const earL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 4), mainMat);
    earL.position.set(-0.32, 0.58, -0.1);
    headGroup.add(earL);
    const earR = earL.clone();
    earR.position.x = 0.32;
    headGroup.add(earR);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), eyeMat);
    eyeL.position.set(-0.25, 0.12, 0.42);
    headGroup.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.25;
    headGroup.add(eyeR);
    bodyGroup.add(headGroup);

    // 4 Muscular Wolf Legs
    [[-0.45, 0.75], [0.45, 0.75], [-0.45, -0.75], [0.45, -0.75]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 1.2, 8), mainMat);
      leg.position.set(lx, 0.6, lz);
      bodyGroup.add(leg);
    });

    animParts.headPivot = headGroup;

  } else if (st.monsterType === 'scorpion') {
    // 🦂 POS 5: KALAJENGKING BESI BERBISA (Giant Pincers & High Stinger Tail)
    const carapace = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 2.0), darkMat);
    carapace.position.set(0, 0.75, 0);
    carapace.castShadow = true;
    bodyGroup.add(carapace);

    // Giant Front Pincer Claws
    [-1, 1].forEach(side => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.2, 8), mainMat);
      arm.position.set(side * 0.95, 0.85, 0.85);
      arm.rotation.x = Math.PI / 2;
      arm.rotation.z = -side * 0.35;
      bodyGroup.add(arm);

      const claw = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 10), mainMat);
      claw.scale.set(0.8, 0.5, 1.4);
      claw.position.set(side * 1.18, 0.85, 1.55);
      bodyGroup.add(claw);
    });

    // High-Arching Segmented Stinger Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.9, -0.9);
    const tailCoords = [
      [0, 0.4, -0.3],
      [0, 1.0, -0.5],
      [0, 1.65, -0.3],
      [0, 2.15, 0.15],
      [0, 2.35, 0.75]
    ];
    tailCoords.forEach(([tx, ty, tz]) => {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), mainMat);
      seg.position.set(tx, ty, tz);
      tailGroup.add(seg);
    });

    const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 8), accentMat);
    stinger.rotation.x = Math.PI * 0.65;
    stinger.position.set(0, 2.25, 1.25);
    tailGroup.add(stinger);
    bodyGroup.add(tailGroup);
    animParts.tailGroup = tailGroup;

  } else if (st.monsterType === 'minotaur') {
    // 👹 POS 6: MINOTAUR BERTANDUK IBLIS RAKSASA
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.65, 1.85, 10), mainMat);
    torso.position.y = 1.65;
    torso.castShadow = true;
    bodyGroup.add(torso);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.85, 0.25);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.95), darkMat);
    headGroup.add(head);

    // Massive Curved Bull Horns
    [-1, 1].forEach(side => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.15, 8), accentMat);
      horn.position.set(side * 0.75, 0.35, 0.1);
      horn.rotation.z = -side * 0.85;
      horn.rotation.x = 0.35;
      headGroup.add(horn);
    });

    // Brass Nose Ring & Glowing Eyes
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.04, 8, 16), accentMat);
    ring.position.set(0, -0.22, 0.52);
    headGroup.add(ring);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), eyeMat);
    eyeL.position.set(-0.24, 0.12, 0.48);
    headGroup.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.24;
    headGroup.add(eyeR);
    bodyGroup.add(headGroup);

    // Giant Battle Axe in Right Hand
    const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), darkMat);
    axeHandle.position.set(1.25, 1.8, 0.4);
    axeHandle.rotation.x = 0.3;
    bodyGroup.add(axeHandle);

    const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.1, 0.95), accentMat);
    axeBlade.position.set(1.25, 2.8, 0.75);
    bodyGroup.add(axeBlade);

    // Minotaur Legs
    [-0.45, 0.45].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 1.1, 8), darkMat);
      leg.position.set(lx, 0.55, 0);
      bodyGroup.add(leg);
    });
    animParts.headPivot = headGroup;

  } else if (st.monsterType === 'hydra') {
    // 🐙 POS 7: HYDRA KRAKEN TIGA KEPALA & TENTAKEL
    const coreBody = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 16), darkMat);
    coreBody.position.y = 1.15;
    coreBody.castShadow = true;
    bodyGroup.add(coreBody);

    // 3 Serpentine Hydra Heads on Long Necks
    const heads = [];
    [-0.85, 0, 0.85].forEach((hx, idx) => {
      const hPivot = new THREE.Group();
      hPivot.position.set(hx, 1.75, 0.2);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.4, 10), mainMat);
      neck.position.y = 0.55;
      neck.rotation.z = -hx * 0.35;
      hPivot.add(neck);

      const skull = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.48, 0.78), idx === 1 ? accentMat : mainMat);
      skull.position.set(hx * 0.35, 1.25, 0.35);
      hPivot.add(skull);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
      eye.position.set(hx * 0.35, 1.35, 0.75);
      hPivot.add(eye);

      bodyGroup.add(hPivot);
      heads.push(hPivot);
    });
    animParts.hydraHeads = heads;

  } else {
    // 🐉 POS 8 (FINAL BOSS): RAJA NAGA LEGENDARIS BAHAMUT
    const dragonGroup = new THREE.Group();

    // Massive Dragon Torso & Golden Heart Core
    const chest = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.82, 2.2, 12), darkMat);
    chest.position.y = 1.65;
    chest.castShadow = true;
    dragonGroup.add(chest);

    const heartCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 1), mainMat);
    heartCore.position.set(0, 1.75, 0.85);
    dragonGroup.add(heartCore);

    // Long Dragon Neck, Horned Dragon Head & Blazing Jaw
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 2.75, 0.35);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.58, 1.25, 10), darkMat);
    neck.position.y = 0.45;
    neck.rotation.x = 0.25;
    headPivot.add(neck);

    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.78, 1.35), mainMat);
    skull.position.set(0, 1.05, 0.55);
    headPivot.add(skull);

    // Swept-back Golden Dragon Horns
    [-0.38, 0.38].forEach(hx => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.35, 8), mainMat);
      horn.position.set(hx, 1.55, 0.05);
      horn.rotation.x = -0.75;
      headPivot.add(horn);
    });

    // Glowing Dragon Eyes & Fire Mouth Core
    [-0.32, 0.32].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
      eye.position.set(ex, 1.2, 1.18);
      headPivot.add(eye);
    });

    const fireMaw = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), accentMat);
    fireMaw.position.set(0, 0.85, 1.15);
    headPivot.add(fireMaw);
    dragonGroup.add(headPivot);

    // Enormous Bat/Dragon Wings (Left & Right)
    const buildDragonWing = (dir) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(dir * 0.85, 2.35, -0.2);

      const bone = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 0.22), mainMat);
      bone.position.set(dir * 1.6, 0.45, 0);
      bone.rotation.z = dir * 0.25;
      wGroup.add(bone);

      const membrane = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.65, 0.08), accentMat);
      membrane.position.set(dir * 1.55, -0.25, -0.05);
      membrane.castShadow = true;
      wGroup.add(membrane);
      return wGroup;
    };

    const wingL = buildDragonWing(-1);
    const wingR = buildDragonWing(1);
    dragonGroup.add(wingL);
    dragonGroup.add(wingR);

    // Dragon Legs & Spiked Tail
    [-0.65, 0.65].forEach(lx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 1.2, 8), mainMat);
      leg.position.set(lx, 0.6, 0.2);
      dragonGroup.add(leg);
    });

    bodyGroup.add(dragonGroup);
    animParts.headPivot = headPivot;
    animParts.wingL = wingL;
    animParts.wingR = wingR;
    animParts.heartCore = heartCore;
  }

  return { bodyGroup, mainMat, animParts };
}

// ============================================================================
// 7. BUILD ALL 8 ENEMY STATIONS & ATTACH MONSTERS TO SCENE
// ============================================================================
function createSignboardMesh(textTop, textSub) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3b2538';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#f6efe2';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 144);

  ctx.fillStyle = '#f6efe2';
  ctx.font = 'bold 31px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(textTop, 256, 68);

  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.fillText(textSub, 256, 118);

  const tex = new THREE.CanvasTexture(canvas);
  const boardGroup = new THREE.Group();

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 1.45, 0.22),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 })
  );
  board.position.y = 2.4;
  board.castShadow = true;
  boardGroup.add(board);

  const postMat = new THREE.MeshStandardMaterial({ color: 0x4a304d });
  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8), postMat);
  postL.position.set(-1.8, 1.2, 0);
  boardGroup.add(postL);
  const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8), postMat);
  postR.position.set(1.8, 1.2, 0);
  boardGroup.add(postR);

  return boardGroup;
}

function buildAllEnemyStations() {
  const labelsContainer = document.getElementById('worldLabelsContainer');
  labelsContainer.innerHTML = '';

  ENEMY_STATIONS.forEach((st, idx) => {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(st.x, 0, st.z);

    // 1. Glowing Arena Circle Seal on Ground
    const sealRing = new THREE.Mesh(
      new THREE.RingGeometry(2.85, 3.22, 44),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    sealRing.rotation.x = -Math.PI / 2;
    sealRing.position.y = 0.04;
    stationGroup.add(sealRing);

    const innerDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.85, 36),
      new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.22 })
    );
    innerDisc.rotation.x = -Math.PI / 2;
    innerDisc.position.y = 0.03;
    stationGroup.add(innerDisc);

    // 2. 3D Signboard beside the station
    const signOffset = st.x <= 0 ? -5.4 : 5.4;
    const signboard = createSignboardMesh(st.name, `SLIDE ${st.posNum} • ${st.enemyTitle.toUpperCase()}`);
    signboard.position.set(signOffset, 0, 0.8);
    signboard.rotation.y = st.x <= 0 ? 0.25 : -0.25;
    stationGroup.add(signboard);

    // 3. Build Unique Monster & Pedestal inside dummyPivot (AND ADD TO stationGroup!)
    const dummyPivot = new THREE.Group();
    dummyPivot.scale.setScalar(st.scale);

    const baseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.35, 0.36, 14),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
    );
    baseMesh.position.y = 0.18;
    dummyPivot.add(baseMesh);

    const { bodyGroup, mainMat, animParts } = buildMonsterMesh(st);
    bodyGroup.position.y = 0.32;
    dummyPivot.add(bodyGroup);

    // CRITICAL: Add dummyPivot to stationGroup so the monster appears in the 3D scene!
    stationGroup.add(dummyPivot);

    // Floating Emerald Unlock Crystal (Shown when Monster is Defeated)
    const unlockCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.52, 0),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    unlockCrystal.position.set(0, 3.2, 0);
    unlockCrystal.visible = false;
    stationGroup.add(unlockCrystal);

    scene.add(stationGroup);

    // 4. Projected HTML Overlay Label
    const labelEl = document.createElement('div');
    labelEl.className = 'world-label';
    labelEl.id = `enemyLabel_${idx}`;
    labelEl.innerHTML = `
      <div class="enemy-pos-tag">
        <span>${st.icon} ${st.name}</span>
      </div>
      <div class="enemy-hp-track" id="hpTrack_${idx}">
        <div class="enemy-hp-fill" id="hpFill_${idx}" style="width: 100%;"></div>
      </div>
      <div class="enemy-attack-hint" id="atkHint_${idx}">
        🔥 Klik Kiri [J] / ⚡ Klik Kanan [K] (100 HP)
      </div>
      <div class="corpse-reopen-badge" id="corpseBadge_${idx}" style="display: none;" onclick="reopenSlideFromCorpse(${idx})">
        <span>🔓 Mayat ${st.icon} Pos #${st.posNum} • Klik / Tekan</span>
        <span class="key-o">O</span>
        <span>Buka Slide ${st.posNum}</span>
      </div>
    `;
    labelsContainer.appendChild(labelEl);

    enemyObjects.push({
      id: idx,
      station: st,
      stationGroup,
      dummyPivot,
      bodyGroup,
      animParts,
      sealRing,
      unlockCrystal,
      armorMat: mainMat,
      hp: 100,
      maxHp: 100,
      defeated: false,
      wobbleAngle: 0,
      wobbleVel: 0,
      collapseProgress: 0,
      labelEl
    });
  });
}

// ============================================================================
// 8. ELEMENTAL SKILLS LAUNCHED FROM BACK ORB FORMATIONS
// ============================================================================
function findTargetEnemy() {
  let bestEnemy = null;
  let bestDist = Infinity;

  enemyObjects.forEach(en => {
    if (!en.defeated) {
      const d = playerPos.distanceTo(new THREE.Vector3(en.station.x, 0, en.station.z));
      if (d < bestDist) {
        bestDist = d;
        bestEnemy = en;
      }
    }
  });

  return { enemy: bestEnemy, dist: bestDist };
}

function castElementalSkill(type) {
  if (isIntroMode) return;
  if (document.getElementById('slideModalOverlay').classList.contains('active')) return;

  const { enemy } = findTargetEnemy();
  let targetPos;

  if (enemy) {
    targetPos = new THREE.Vector3(enemy.station.x, 1.8, enemy.station.z);
    const dx = enemy.station.x - playerPos.x;
    const dz = enemy.station.z - playerPos.z;
    playerRotY = Math.atan2(dx, dz);
  } else {
    targetPos = playerPos.clone().add(new THREE.Vector3(Math.sin(playerRotY) * 10, 1.8, Math.cos(playerRotY) * 10));
  }

  if (type === 'fire') {
    CloudAudio.playFireSkill();
    spawnFireProjectile(targetPos, enemy, 50);
  } else if (type === 'lightning') {
    CloudAudio.playLightningSkill();
    spawnLightningStrike(targetPos, enemy, 50);
  } else if (type === 'ultimate') {
    CloudAudio.playUltimateSkill();
    spawnFireProjectile(targetPos, enemy, 50);
    setTimeout(() => spawnLightningStrike(targetPos, enemy, 50), 90);
  }
}

// 🔥 JURUS 1: SOLAR FIREBALL BARRAGE (Ditembakkan dari Solar Halo di Punggung)
function spawnFireProjectile(targetPos, targetEnemy, dmgAmount) {
  const startPos = playerPos.clone().add(new THREE.Vector3(0, 2.2, 0));

  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0 })
  );
  group.add(core);

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(0.82, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff5400, transparent: true, opacity: 0.78 })
  );
  group.add(aura);

  const light = new THREE.PointLight(0xff5400, 3.5, 15);
  group.add(light);

  group.position.copy(startPos);
  scene.add(group);

  // Hero martial arts strike pose
  playerParts.armR.rotation.x = -1.35;
  setTimeout(() => { if (playerParts.armR) playerParts.armR.rotation.x = 0; }, 260);

  activeProjectiles.push({
    mesh: group,
    startPos: startPos.clone(),
    targetPos: targetPos.clone(),
    progress: 0,
    speed: 3.4,
    targetEnemy,
    dmgAmount,
    element: 'fire'
  });
}

// ⚡ JURUS 2: 5-ORB RAIJIN THUNDERBARRAGE (Menyambar dari 5 Bola Petir di Punggung!)
function spawnLightningStrike(targetPos, targetEnemy, dmgAmount) {
  playerParts.armL.rotation.x = -1.35;
  setTimeout(() => { if (playerParts.armL) playerParts.armL.rotation.x = 0; }, 260);

  // Fire a jagged lightning arc from EACH of the 5 Back Lightning Orbs to the Monster!
  if (playerParts.lightningOrbs) {
    playerParts.lightningOrbs.forEach((orbObj, idx) => {
      const orbWorldPos = new THREE.Vector3();
      orbObj.orbHolder.getWorldPosition(orbWorldPos);
      createJaggedBolt(orbWorldPos, targetPos, idx % 2 === 0 ? 0x38bdf8 : 0xc084fc, 12);
    });
  }

  // Plus a Sky Thunderbolt
  const skyPos = targetPos.clone().add(new THREE.Vector3(0, 16, 0));
  createJaggedBolt(skyPos, targetPos, 0xe0f2fe, 16);

  const flashLight = new THREE.PointLight(0x38bdf8, 5.5, 22);
  flashLight.position.copy(targetPos);
  scene.add(flashLight);
  setTimeout(() => scene.remove(flashLight), 190);

  spawnImpactExplosion(targetPos, 0x38bdf8, 0xc084fc);

  if (targetEnemy) {
    applyDamageToEnemy(targetEnemy, dmgAmount, 'lightning');
  }
}

function createJaggedBolt(pA, pB, hexColor, segments = 14) {
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = new THREE.Vector3().lerpVectors(pA, pB, t);
    if (i > 0 && i < segments) {
      pt.x += (Math.random() - 0.5) * 1.15;
      pt.y += (Math.random() - 0.5) * 1.05;
      pt.z += (Math.random() - 0.5) * 1.15;
    }
    points.push(pt);
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: hexColor, linewidth: 3 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);

  activeLightnings.push({ line, life: 0.24 });
}

function spawnImpactExplosion(pos, colorPrimary, colorSecondary) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.9, 32),
    new THREE.MeshBasicMaterial({ color: colorPrimary, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(pos.x, 0.14, pos.z);
  scene.add(ring);
  activeShockwaves.push({ mesh: ring, scale: 1, opacity: 0.95 });

  for (let i = 0; i < 28; i++) {
    const pMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? colorPrimary : colorSecondary,
      transparent: true,
      opacity: 1
    });
    const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), pMat);
    pMesh.position.copy(pos);

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 11,
      Math.random() * 8 + 2,
      (Math.random() - 0.5) * 11
    );
    scene.add(pMesh);
    activeParticles.push({ mesh: pMesh, vel, life: 0.65 });
  }
}

// ============================================================================
// 9. APPLY DAMAGE, MONSTER HIT REACTION & SLIDE UNLOCK
// ============================================================================
function applyDamageToEnemy(enemy, dmg, element) {
  if (enemy.defeated) return;

  enemy.hp = Math.max(0, enemy.hp - dmg);
  enemy.wobbleVel = 0.48;

  const hpFill = document.getElementById(`hpFill_${enemy.id}`);
  if (hpFill) {
    hpFill.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
  }

  const labelText = element === 'fire' ? `-${dmg} HP 🔥 SOLAR FIRE!` : `-${dmg} HP ⚡ 5-ORB THUNDER!`;
  const colorHex = element === 'fire' ? '#fb923c' : '#38bdf8';
  spawnFloatingDamageText(enemy.station.x, 3.6, enemy.station.z, labelText, colorHex);

  enemy.armorMat.emissive = new THREE.Color(element === 'fire' ? 0xff4500 : 0x38bdf8);
  setTimeout(() => {
    if (enemy.armorMat) enemy.armorMat.emissive = new THREE.Color(0x000000);
  }, 160);

  if (enemy.hp <= 0 && !enemy.defeated) {
    enemy.defeated = true;
    defeatedCount++;

    enemy.sealRing.material.color.setHex(0x10b981);
    enemy.unlockCrystal.visible = true;

    const hpTrack = document.getElementById(`hpTrack_${enemy.id}`);
    const atkHint = document.getElementById(`atkHint_${enemy.id}`);
    const corpseBadge = document.getElementById(`corpseBadge_${enemy.id}`);
    if (hpTrack) hpTrack.style.display = 'none';
    if (atkHint) atkHint.style.display = 'none';
    if (corpseBadge) corpseBadge.style.display = 'flex';

    spawnFloatingDamageText(enemy.station.x, 4.4, enemy.station.z, `💥 ${enemy.station.icon} KALAH! SLIDE ${enemy.station.posNum} TERBUKA!`, '#4ade80');
    CloudAudio.playVictoryUnlock();
    updateQuestHudProgress();

    setTimeout(() => {
      openSlideWindow(enemy.id);
    }, 550);
  }
}

function spawnFloatingDamageText(wx, wy, wz, text, color) {
  const vec = new THREE.Vector3(wx, wy, wz);
  vec.project(camera);
  const sx = (vec.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-(vec.y * 0.5) + 0.5) * window.innerHeight;

  const el = document.createElement('div');
  el.className = 'floating-dmg';
  el.style.left = `${sx}px`;
  el.style.top = `${sy}px`;
  el.style.color = color;
  el.innerText = text;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 1100);
}

// ============================================================================
// 10. PLAYER INPUT & NAVIGATION
// ============================================================================
function setupInputListeners() {
  window.addEventListener('keydown', (e) => {
    const code = e.code;
    keysPressed[code] = true;
    autoWalkTarget = null;

    if (code === 'Escape') {
      closeSlideWindow();
      closeCreditsModal();
      closeFullCodeModal();
      return;
    }

    if (isIntroMode) return;

    const isModalOpen = document.getElementById('slideModalOverlay').classList.contains('active');
    if (!isModalOpen) {
      if (code === 'KeyJ' || code === 'Digit1') {
        castElementalSkill('fire');
      } else if (code === 'KeyK' || code === 'Digit2') {
        castElementalSkill('lightning');
      } else if (code === 'KeyL' || code === 'Space') {
        e.preventDefault();
        castElementalSkill('ultimate');
      } else if (code === 'KeyO' || code === 'KeyE' || code === 'Enter') {
        triggerOpenNearestDefeatedSlide();
      } else if (code === 'KeyR') {
        resetPlayerPosition();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
  });

  const canvasEl = document.getElementById('gameCanvasContainer');
  canvasEl.addEventListener('mousedown', (e) => {
    if (isIntroMode) return;
    if (document.getElementById('slideModalOverlay').classList.contains('active')) return;
    if (e.button === 0) {
      castElementalSkill('fire');
    } else if (e.button === 2) {
      castElementalSkill('lightning');
    }
  });
  canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
}

function triggerOpenNearestDefeatedSlide() {
  let bestCorpse = null;
  let bestDist = Infinity;

  enemyObjects.forEach(en => {
    if (en.defeated) {
      const d = playerPos.distanceTo(new THREE.Vector3(en.station.x, 0, en.station.z));
      if (d < bestDist) {
        bestDist = d;
        bestCorpse = en;
      }
    }
  });

  if (bestCorpse) {
    CloudAudio.playReopenSlide();
    openSlideWindow(bestCorpse.id);
  }
}

function reopenSlideFromCorpse(enemyIdx) {
  CloudAudio.playReopenSlide();
  openSlideWindow(enemyIdx);
}

function resetPlayerPosition() {
  CloudAudio.playClick();
  playerPos.set(0, 0, 14);
  playerRotY = Math.PI;
  autoWalkTarget = null;
}

function walkToNextUndefeatedPos() {
  CloudAudio.playClick();
  const nextEn = enemyObjects.find(e => !e.defeated) || enemyObjects[0];
  if (nextEn) {
    autoWalkTarget = new THREE.Vector3(nextEn.station.x * 0.55, 0, nextEn.station.z + 5.2);
  }
}

function teleportToPos(idx) {
  CloudAudio.playClick();
  const target = enemyObjects[idx];
  if (!target) return;
  playerPos.set(target.station.x * 0.5, 0, target.station.z + 5.2);
  const dx = target.station.x - playerPos.x;
  const dz = target.station.z - playerPos.z;
  playerRotY = Math.atan2(dx, dz);
  autoWalkTarget = null;
  document.getElementById('teleportPopover').classList.remove('active');
}

// ============================================================================
// 11. MAIN ANIMATION LOOP (Hero Orbs + Monster Idle Animations + Combat VFX)
// ============================================================================
function gameLoop() {
  requestAnimationFrame(gameLoop);
  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  if (!isIntroMode) {
    hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, 0.98, dt * 2.5);
    dirLight.intensity = THREE.MathUtils.lerp(dirLight.intensity, 1.2, dt * 2.5);
    introSpotLight.intensity = THREE.MathUtils.lerp(introSpotLight.intensity, 0.4, dt * 2.0);
  } else if (introRingMesh) {
    introRingMesh.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.025);
  }

  // Player Movement
  let moveX = 0;
  let moveZ = 0;
  const isModalOpen = document.getElementById('slideModalOverlay').classList.contains('active');

  if (!isIntroMode && !isModalOpen) {
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) moveZ -= 1;
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) moveZ += 1;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) moveX -= 1;
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) moveX += 1;

    if (autoWalkTarget) {
      const toTarget = autoWalkTarget.clone().sub(playerPos);
      if (toTarget.length() > 0.6) {
        toTarget.normalize();
        moveX = toTarget.x;
        moveZ = toTarget.z;
      } else {
        autoWalkTarget = null;
      }
    }
  }

  const isMoving = Math.hypot(moveX, moveZ) > 0.05;
  if (isMoving) {
    const norm = Math.hypot(moveX, moveZ);
    const speed = 13.8;
    playerPos.x += (moveX / norm) * speed * dt;
    playerPos.z += (moveZ / norm) * speed * dt;

    playerPos.x = Math.max(-13, Math.min(13, playerPos.x));
    playerPos.z = Math.max(-84, Math.min(20, playerPos.z));

    playerRotY = Math.atan2(moveX, moveZ);
    walkTime += dt * 11.5;

    playerParts.legL.rotation.x = Math.sin(walkTime) * 0.62;
    playerParts.legR.rotation.x = -Math.sin(walkTime) * 0.62;
    playerParts.armL.rotation.x = -Math.sin(walkTime) * 0.45;
    playerParts.armR.rotation.x = Math.sin(walkTime) * 0.45;
    playerParts.torso.position.y = 1.38 + Math.abs(Math.sin(walkTime)) * 0.08;
    playerParts.capeGroup.rotation.x = 0.28 + Math.sin(walkTime * 2) * 0.12;
  } else {
    playerParts.legL.rotation.x = THREE.MathUtils.lerp(playerParts.legL.rotation.x, 0, dt * 10);
    playerParts.legR.rotation.x = THREE.MathUtils.lerp(playerParts.legR.rotation.x, 0, dt * 10);
    playerParts.torso.position.y = 1.38 + Math.sin(elapsed * 2.5) * 0.04;
    playerParts.capeGroup.rotation.x = 0.08 + Math.sin(elapsed * 2) * 0.04;
  }

  // Animate the 5 Lightning Orbs in the Upward Curve Arch behind the Hero's Back
  if (playerParts.lightningOrbs) {
    playerParts.lightningOrbs.forEach((o) => {
      o.orbHolder.position.y = o.baseY + Math.sin(elapsed * 3.5 + o.phase) * 0.08;
      o.cage.rotation.x += dt * 3.2;
      o.cage.rotation.y += dt * 2.6;
      o.ring.rotation.z += dt * 4.0;
    });
  }

  // Animate the Solar Fire Chakram behind the Hero's Lower Back
  if (playerParts.fireChakram) {
    playerParts.fireChakram.rotation.z -= dt * 2.2;
  }

  playerGroup.position.copy(playerPos);
  playerGroup.rotation.y = playerRotY;

  // Camera Follow
  const camTargetPos = isIntroMode
    ? new THREE.Vector3(0, 11.0, 28.5)
    : new THREE.Vector3(playerPos.x * 0.55, 13.0, playerPos.z + 16.0);
  camera.position.lerp(camTargetPos, dt * 4.5);

  const lookTarget = isIntroMode
    ? new THREE.Vector3(0, 1.8, 17)
    : new THREE.Vector3(playerPos.x * 0.4, 1.6, playerPos.z - 3.5);
  camera.lookAt(lookTarget);

  // Update Fire Projectiles
  for (let i = activeProjectiles.length - 1; i >= 0; i--) {
    const p = activeProjectiles[i];
    p.progress += dt * p.speed;

    if (Math.random() < 0.65) {
      const ember = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xff9e00, transparent: true, opacity: 0.85 })
      );
      ember.position.copy(p.mesh.position);
      scene.add(ember);
      activeParticles.push({
        mesh: ember,
        vel: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2.5, (Math.random() - 0.5) * 2),
        life: 0.35
      });
    }

    if (p.progress >= 1) {
      spawnImpactExplosion(p.targetPos, 0xff5400, 0xffd166);
      if (p.targetEnemy) {
        applyDamageToEnemy(p.targetEnemy, p.dmgAmount, 'fire');
      }
      scene.remove(p.mesh);
      activeProjectiles.splice(i, 1);
    } else {
      p.mesh.position.lerpVectors(p.startPos, p.targetPos, p.progress);
      p.mesh.position.y += Math.sin(p.progress * Math.PI) * 1.6;
    }
  }

  // Update Lightning, Shockwaves & Particles
  for (let i = activeLightnings.length - 1; i >= 0; i--) {
    activeLightnings[i].life -= dt;
    if (activeLightnings[i].life <= 0) {
      scene.remove(activeLightnings[i].line);
      activeLightnings.splice(i, 1);
    }
  }

  for (let i = activeShockwaves.length - 1; i >= 0; i--) {
    const sw = activeShockwaves[i];
    sw.scale += dt * 9.5;
    sw.opacity -= dt * 2.2;
    sw.mesh.scale.setScalar(sw.scale);
    sw.mesh.material.opacity = Math.max(0, sw.opacity);
    if (sw.opacity <= 0) {
      scene.remove(sw.mesh);
      activeShockwaves.splice(i, 1);
    }
  }

  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const pt = activeParticles[i];
    pt.life -= dt;
    pt.mesh.position.addScaledVector(pt.vel, dt);
    pt.mesh.material.opacity = Math.max(0, pt.life * 1.5);
    if (pt.life <= 0) {
      scene.remove(pt.mesh);
      activeParticles.splice(i, 1);
    }
  }

  // Update 8 Unique Monsters (Idle Creature Animations + Spring Hit Wobble + Defeated Corpse)
  enemyObjects.forEach((en) => {
    const ap = en.animParts;
    if (!en.defeated) {
      // Face the player subtly
      const dx = playerPos.x - en.station.x;
      const dz = playerPos.z - en.station.z;
      const targetRot = Math.atan2(dx, dz);
      en.dummyPivot.rotation.y = THREE.MathUtils.lerp(en.dummyPivot.rotation.y, targetRot * 0.35, dt * 3);

      // Spring Wobble when struck
      const stiffness = 35;
      const damping = 6.5;
      const force = -stiffness * en.wobbleAngle - damping * en.wobbleVel;
      en.wobbleVel += force * dt;
      en.wobbleAngle += en.wobbleVel * dt;
      en.bodyGroup.rotation.x = en.wobbleAngle;

      // Creature-specific Idle Animations
      if (ap.wingL && ap.wingR) {
        const flap = Math.sin(elapsed * 5.5 + en.id) * 0.42;
        ap.wingL.rotation.z = flap;
        ap.wingR.rotation.z = -flap;
      }
      if (ap.hoverGroup) {
        ap.hoverGroup.position.y = 1.95 + Math.sin(elapsed * 3.5) * 0.25;
      }
      if (ap.headPivot) {
        ap.headPivot.rotation.y = Math.sin(elapsed * 2.2 + en.id) * 0.22;
        ap.headPivot.position.y += Math.sin(elapsed * 3) * 0.002;
      }
      if (ap.tongue) {
        ap.tongue.scale.z = 0.7 + Math.abs(Math.sin(elapsed * 8)) * 0.6;
      }
      if (ap.spiderLegs) {
        ap.spiderLegs.forEach(leg => {
          leg.legPivot.rotation.x = Math.sin(elapsed * 4 + leg.phase) * 0.15;
        });
      }
      if (ap.tailGroup) {
        ap.tailGroup.rotation.x = Math.sin(elapsed * 3) * 0.18;
      }
      if (ap.hydraHeads) {
        ap.hydraHeads.forEach((h, hIdx) => {
          h.rotation.z = Math.sin(elapsed * 2.8 + hIdx) * 0.18;
          h.rotation.x = Math.cos(elapsed * 2.2 + hIdx) * 0.12;
        });
      }
      if (ap.heartCore) {
        ap.heartCore.rotation.y += dt * 2.5;
      }
    } else {
      // Defeated Corpse State
      en.collapseProgress = Math.min(1, en.collapseProgress + dt * 3.2);
      en.bodyGroup.rotation.x = THREE.MathUtils.lerp(0, 1.3, en.collapseProgress);
      en.bodyGroup.position.y = THREE.MathUtils.lerp(0.32, 0.1, en.collapseProgress);
      en.unlockCrystal.rotation.y += dt * 2.8;
      en.unlockCrystal.position.y = 3.2 + Math.sin(elapsed * 3 + en.id) * 0.22;
    }

    // Project 3D Label to Screen
    if (isIntroMode) {
      en.labelEl.style.opacity = '0';
    } else {
      const worldPos = new THREE.Vector3(en.station.x, 4.1 * en.station.scale, en.station.z);
      const distToCam = camera.position.distanceTo(worldPos);
      worldPos.project(camera);

      if (worldPos.z < 1 && distToCam < 52) {
        const sx = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-(worldPos.y * 0.5) + 0.5) * window.innerHeight;
        en.labelEl.style.left = `${sx}px`;
        en.labelEl.style.top = `${sy}px`;
        en.labelEl.style.opacity = '1';
      } else {
        en.labelEl.style.opacity = '0';
      }
    }
  });

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
