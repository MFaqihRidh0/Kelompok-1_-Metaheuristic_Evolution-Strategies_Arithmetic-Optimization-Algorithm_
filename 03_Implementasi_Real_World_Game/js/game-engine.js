// ============================================================================
// AOA CLOUD BATTLE ARENA — 3D WORLD, CYBER-MAGE & ELEMENTAL COMBAT ENGINE
// Three.js + Procedural Shaders + Spring Wobble Physics + Corpse [O] Re-open
// ============================================================================

let scene, camera, renderer, clock;
let isIntroMode = true;
let playerGroup, playerParts = {};
let playerPos = new THREE.Vector3(0, 0, 17);
let playerRotY = Math.PI; // Facing -Z (into the arena)
let walkTime = 0;

// Auto-walk target (when user clicks "Mulai Presentasi" or teleports)
let autoWalkTarget = null;

// Input keys
const keysPressed = {};

// Lights for Intro -> Main World transition
let hemiLight, dirLight, introSpotLight, introRingMesh;

// Enemy Dummies (8 Pos)
const enemyObjects = [];
// Active Projectiles & VFX Particles
const activeProjectiles = [];
const activeParticles = [];
const activeLightnings = [];
const activeShockwaves = [];

// Track defeated count
let defeatedCount = 0;
let nearestEnemyIndex = 0;
let nearestCorpseIndex = -1;

// ============================================================================
// 1. INITIALIZE THREE.JS SCENE & SPOTLIGHT INTRO (Gambar 1)
// ============================================================================
function initGameEngine() {
  const container = document.getElementById('gameCanvasContainer');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x130e26);
  scene.fog = new THREE.FogExp2(0x130e26, 0.012);

  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 250);
  camera.position.set(0, 14, 31);

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
  buildPlayerCyberMage();
  buildAllEnemyStations();
  setupInputListeners();

  window.addEventListener('resize', onWindowResize);
  requestAnimationFrame(gameLoop);
}

// ============================================================================
// 2. LIGHTING (Intro Spotlight Mode -> Warm Sunset Cloud Ops World)
// ============================================================================
function setupLighting() {
  // Hemisphere light starts dim in Intro Mode, brightens when game starts
  hemiLight = new THREE.HemisphereLight(0xffd6a5, 0x2b193d, 0.14);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffb482, 0.12);
  dirLight.position.set(28, 45, 25);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 5;
  dirLight.shadow.camera.far = 140;
  const d = 55;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  // Spotlight for "CLICK TO START" Intro (Reference Image 1)
  introSpotLight = new THREE.SpotLight(0xc084fc, 4.2, 32, Math.PI / 4.2, 0.35, 1.2);
  introSpotLight.position.set(0, 16, 17);
  introSpotLight.target.position.set(0, 0, 17);
  introSpotLight.castShadow = true;
  scene.add(introSpotLight);
  scene.add(introSpotLight.target);
}

// ============================================================================
// 3. GROUND GRID ('+' Pattern like Image 1) & ARENA ROAD (Image 3 & 4)
// ============================================================================
function createPlusGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Deep indigo/plum base
  ctx.fillStyle = '#191233';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 256, 256);

  // '+' Crosses at center & corners
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  const drawPlus = (cx, cy) => {
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy + 8);
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
  // Base Grid Plane
  const gridTex = createPlusGridTexture();
  const groundGeo = new THREE.PlaneGeometry(220, 220);
  const groundMat = new THREE.MeshStandardMaterial({
    map: gridTex,
    roughness: 0.85,
    metalness: 0.1
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Intro Spotlight Circle Floor & Glowing Ring (Image 1)
  const startDiscGeo = new THREE.CircleGeometry(6.2, 48);
  const startDiscMat = new THREE.MeshStandardMaterial({
    color: 0x4c3575,
    roughness: 0.7
  });
  const startDisc = new THREE.Mesh(startDiscGeo, startDiscMat);
  startDisc.rotation.x = -Math.PI / 2;
  startDisc.position.set(0, 0.03, 17);
  startDisc.receiveShadow = true;
  scene.add(startDisc);

  const ringGeo = new THREE.RingGeometry(6.05, 6.32, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xe879f9,
    side: THREE.DoubleSide
  });
  introRingMesh = new THREE.Mesh(ringGeo, ringMat);
  introRingMesh.rotation.x = -Math.PI / 2;
  introRingMesh.position.set(0, 0.06, 17);
  scene.add(introRingMesh);

  // Main Arena Track / Boulevard (from Z = 17 to Z = -88)
  const roadGeo = new THREE.PlaneGeometry(16, 112);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x221b29,
    roughness: 0.8
  });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, -36);
  road.receiveShadow = true;
  scene.add(road);

  // Red & White Curbs along the road (like Image 4)
  for (let z = 12; z >= -86; z -= 4) {
    const isRed = Math.abs(Math.floor(z / 4)) % 2 === 0;
    const curbColor = isRed ? 0xef4444 : 0xf8fafc;
    const curbGeo = new THREE.BoxGeometry(0.9, 0.22, 3.9);
    const curbMat = new THREE.MeshStandardMaterial({ color: curbColor, roughness: 0.6 });

    const leftCurb = new THREE.Mesh(curbGeo, curbMat);
    leftCurb.position.set(-14.5, 0.11, z);
    leftCurb.receiveShadow = true;
    scene.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, curbMat);
    rightCurb.position.set(14.5, 0.11, z);
    rightCurb.receiveShadow = true;
    scene.add(rightCurb);
  }

  // Start Gate Truss Arch (like Image 3)
  buildArenaGateArch(0, 10.5);
}

function buildArenaGateArch(x, z) {
  const gateGroup = new THREE.Group();
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x7c5869, metalness: 0.4, roughness: 0.5 });
  const pillarGeo = new THREE.BoxGeometry(1.1, 7.5, 1.1);

  const leftP = new THREE.Mesh(pillarGeo, pillarMat);
  leftP.position.set(-8.5, 3.75, 0);
  leftP.castShadow = true;
  gateGroup.add(leftP);

  const rightP = new THREE.Mesh(pillarGeo, pillarMat);
  rightP.position.set(8.5, 3.75, 0);
  rightP.castShadow = true;
  gateGroup.add(rightP);

  const beamGeo = new THREE.BoxGeometry(18.5, 1.3, 1.3);
  const topBeam = new THREE.Mesh(beamGeo, pillarMat);
  topBeam.position.set(0, 7.2, 0);
  topBeam.castShadow = true;
  gateGroup.add(topBeam);

  // Checkered start line on the ground
  for (let i = -7; i <= 7; i++) {
    const sqGeo = new THREE.PlaneGeometry(0.95, 0.95);
    const sqMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xffffff : 0x1e1b24 });
    const sq = new THREE.Mesh(sqGeo, sqMat);
    sq.rotation.x = -Math.PI / 2;
    sq.position.set(i, 0.04, 0);
    gateGroup.add(sq);
  }

  gateGroup.position.set(x, 0, z);
  scene.add(gateGroup);
}

// ============================================================================
// 4. SANCTUARY PROPS (Lanterns, Stylized Trees, Bench - Image 1 & 2)
// ============================================================================
function buildLantern(x, z) {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3b2d54, roughness: 0.6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.48, 0.8, 8), poleMat);
  base.position.y = 0.4;
  g.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 3.2, 8), poleMat);
  pole.position.y = 2.0;
  pole.castShadow = true;
  g.add(pole);

  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.3, 0.85, 6), lampMat);
  lamp.position.y = 3.7;
  g.add(lamp);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.65, 0.45, 6), poleMat);
  cap.position.y = 4.3;
  g.add(cap);

  const pl = new THREE.PointLight(0xff9e00, 1.1, 14);
  pl.position.y = 3.7;
  g.add(pl);

  g.position.set(x, 0, z);
  scene.add(g);
}

function buildStylizedTree(x, z, foliageColor = 0x9d4edd) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 2.8, 7), trunkMat);
  trunk.position.y = 1.4;
  trunk.castShadow = true;
  g.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.75 });
  const offsets = [
    [0, 3.4, 0, 1.45],
    [-0.8, 2.9, 0.5, 1.05],
    [0.85, 3.0, -0.4, 1.1],
    [0.2, 4.2, 0.3, 0.95]
  ];
  offsets.forEach(([ox, oy, oz, r]) => {
    const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), leafMat);
    puff.position.set(ox, oy, oz);
    puff.castShadow = true;
    g.add(puff);
  });

  g.position.set(x, 0, z);
  scene.add(g);
}

function buildStartSanctuaryProps() {
  // Exact props inside the Start Spotlight Circle (Image 1)
  buildLantern(-3.2, 18.2);
  buildStylizedTree(-2.2, 14.2, 0x8b5cf6);

  // Wooden/Cyber Bench behind character
  const benchGroup = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 1.1), woodMat);
  seat.position.y = 0.7;
  benchGroup.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 0.2), woodMat);
  back.position.set(0, 1.3, -0.45);
  benchGroup.add(back);
  benchGroup.position.set(0.6, 0, 14.5);
  scene.add(benchGroup);

  // Lanterns & Trees along the Arena Avenue
  const treeColors = [0xd946ef, 0xf43f5e, 0xf59e0b, 0x8b5cf6];
  for (let i = 0; i < 8; i++) {
    const zPos = 4 - i * 12;
    buildLantern(-13.2, zPos + 3);
    buildLantern(13.2, zPos - 3);
    buildStylizedTree(-17.5, zPos, treeColors[i % treeColors.length]);
    buildStylizedTree(17.5, zPos - 4, treeColors[(i + 1) % treeColors.length]);
  }
}

// ============================================================================
// 5. THREE REALISTIC DATACENTER TOWERS FLANKING THE ARENA
// ============================================================================
function buildDatacenterTowers() {
  const dcConfigs = [
    { name: "DC_SURABAYA (6.000 MIPS)", x: -23, z: -14, h: 11, color: 0x0284c7 },
    { name: "DC_JAKARTA (3.600 MIPS)",  x: 23,  z: -38, h: 8.5, color: 0x8b5cf6 },
    { name: "DC_YOGYAKARTA (800 MIPS)", x: -23, z: -62, h: 6.5, color: 0x10b981 }
  ];

  dcConfigs.forEach(dc => {
    const g = new THREE.Group();

    // Concrete foundation pad
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.5, 9),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    pad.position.y = 0.25;
    g.add(pad);

    // Main Server Tower
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, dc.h, 6.5),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.3 })
    );
    body.position.y = dc.h / 2 + 0.5;
    body.castShadow = true;
    g.add(body);

    // Glowing Neon Trim Ring at Roof
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(6.75, 0.35, 6.75),
      new THREE.MeshBasicMaterial({ color: dc.color })
    );
    rim.position.y = dc.h + 0.4;
    g.add(rim);

    // Server rack LED strips on facade
    for (let row = 1.5; row < dc.h; row += 1.4) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 0.18, 6.62),
        new THREE.MeshBasicMaterial({ color: dc.color })
      );
      strip.position.y = row;
      g.add(strip);
    }

    g.position.set(dc.x, 0, dc.z);
    scene.add(g);
  });
}

// ============================================================================
// 6. PLAYER CHARACTER: PENDEKAR SIBER (CYBER-MAGE) WITH FIRE & LIGHTNING ORBS
// ============================================================================
function buildPlayerCyberMage() {
  playerGroup = new THREE.Group();

  // Cloak / Armor Torso
  const cloakMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.5 });
  const trimMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.72, 1.55, 10), cloakMat);
  torso.position.y = 1.35;
  torso.castShadow = true;
  playerGroup.add(torso);

  // Glowing Cyber Belt & Chest Core
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.6, 0.16, 10), trimMat);
  belt.position.y = 1.05;
  playerGroup.add(belt);

  // Head + Hood + Glowing Visor
  const headGroup = new THREE.Group();
  headGroup.position.y = 2.4;
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 14), cloakMat);
  headGroup.add(hood);

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.18, 0.35),
    new THREE.MeshBasicMaterial({ color: 0x00f5d4 })
  );
  visor.position.set(0, 0.02, 0.28);
  headGroup.add(visor);
  playerGroup.add(headGroup);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.85, 8);
  const legL = new THREE.Mesh(legGeo, cloakMat);
  legL.position.set(-0.24, 0.45, 0);
  playerGroup.add(legL);

  const legR = new THREE.Mesh(legGeo, cloakMat);
  legR.position.set(0.24, 0.45, 0);
  playerGroup.add(legR);

  // Right Arm + Floating FIRE ORB (Jurus Api)
  const armR = new THREE.Group();
  armR.position.set(0.65, 1.85, 0);
  const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.75, 8), cloakMat);
  sleeveR.position.y = -0.25;
  armR.add(sleeveR);

  const fireOrb = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff5400 })
  );
  fireOrb.position.set(0.15, -0.45, 0.45);
  armR.add(fireOrb);

  const fireHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xff9e00, transparent: true, opacity: 0.45, wireframe: true })
  );
  fireOrb.add(fireHalo);
  playerGroup.add(armR);

  // Left Arm + Floating LIGHTNING ORB (Jurus Listrik)
  const armL = new THREE.Group();
  armL.position.set(-0.65, 1.85, 0);
  const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.75, 8), cloakMat);
  sleeveL.position.y = -0.25;
  armL.add(sleeveL);

  const voltOrb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.28, 1),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  voltOrb.position.set(-0.15, -0.45, 0.45);
  armL.add(voltOrb);

  const voltHalo = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.44, 0),
    new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.55, wireframe: true })
  );
  voltOrb.add(voltHalo);
  playerGroup.add(armL);

  playerParts = { torso, headGroup, legL, legR, armR, armL, fireOrb, fireHalo, voltOrb, voltHalo };
  playerGroup.position.copy(playerPos);
  playerGroup.rotation.y = playerRotY;
  scene.add(playerGroup);
}

// ============================================================================
// 7. BUILD 8 STATIONARY ENEMY DUMMIES + 3D SIGNBOARDS + HTML LABELS
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
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
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
      new THREE.RingGeometry(2.7, 3.05, 40),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    sealRing.rotation.x = -Math.PI / 2;
    sealRing.position.y = 0.04;
    stationGroup.add(sealRing);

    const innerDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 36),
      new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.18 })
    );
    innerDisc.rotation.x = -Math.PI / 2;
    innerDisc.position.y = 0.03;
    stationGroup.add(innerDisc);

    // 2. 3D Signboard beside the station (Image 4 style)
    const signOffset = st.x <= 0 ? -5.2 : 5.2;
    const signboard = createSignboardMesh(st.name, `SLIDE ${st.posNum} • SERANG 2X`);
    signboard.position.set(signOffset, 0, 0.8);
    signboard.rotation.y = st.x <= 0 ? 0.25 : -0.25;
    stationGroup.add(signboard);

    // 3. Robot / Golem Dummy Pivot (for Spring Wobble & Corpse Collapse)
    const dummyPivot = new THREE.Group();
    dummyPivot.scale.setScalar(st.scale);

    // Pedestal Base
    const baseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 1.05, 0.45, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 })
    );
    baseMesh.position.y = 0.22;
    dummyPivot.add(baseMesh);

    // Body Group (this collapses on defeat!)
    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 0.45;

    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.65,
      roughness: 0.32
    });
    const coreMat = new THREE.MeshBasicMaterial({ color: st.color });

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.52, 1.7, 8), armorMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Glowing Reactor Core on Chest
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), coreMat);
    core.position.set(0, 1.2, 0.62);
    bodyGroup.add(core);

    // Shoulder Pauldrons & Arms
    const shoulderGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const shL = new THREE.Mesh(shoulderGeo, armorMat);
    shL.position.set(-0.95, 1.65, 0);
    bodyGroup.add(shL);
    const shR = new THREE.Mesh(shoulderGeo, armorMat);
    shR.position.set(0.95, 1.65, 0);
    bodyGroup.add(shR);

    // Robot Head & Glowing Visor
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.72, 0.8), armorMat);
    head.position.y = 2.35;
    head.castShadow = true;
    bodyGroup.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.1), coreMat);
    visor.position.set(0, 2.38, 0.41);
    bodyGroup.add(visor);

    dummyPivot.add(bodyGroup);

    // Floating Emerald Unlock Crystal (Hidden until Defeated!)
    const unlockCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.48, 0),
      new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: false })
    );
    unlockCrystal.position.set(0, 2.4, 0);
    unlockCrystal.visible = false;
    stationGroup.add(unlockCrystal);

    scene.add(stationGroup);

    // 4. Create Projected HTML Overlay Label (HP Bar when Alive -> "[O] Buka Presentasi" on Corpse when Defeated)
    const labelEl = document.createElement('div');
    labelEl.className = 'world-label';
    labelEl.id = `enemyLabel_${idx}`;
    labelEl.innerHTML = `
      <div class="enemy-pos-tag">
        <span>🥊 ${st.name}</span>
      </div>
      <div class="enemy-hp-track" id="hpTrack_${idx}">
        <div class="enemy-hp-fill" id="hpFill_${idx}" style="width: 100%;"></div>
      </div>
      <div class="enemy-attack-hint" id="atkHint_${idx}">
        🔥 Klik Kiri [J] / ⚡ Klik Kanan [K] (100 HP)
      </div>
      <div class="corpse-reopen-badge" id="corpseBadge_${idx}" style="display: none;" onclick="reopenSlideFromCorpse(${idx})">
        <span>🔓 Mayat Dummy #${st.posNum} • Klik / Tekan</span>
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
      sealRing,
      core,
      visor,
      unlockCrystal,
      armorMat,
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
// 8. ELEMENTAL SKILLS: FIRE (J / Left Click) & LIGHTNING (K / Right Click)
// ============================================================================
function findTargetEnemy() {
  // Prefer the nearest alive enemy; if all defeated, target the nearest enemy corpse for visual fun
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
    targetPos = new THREE.Vector3(enemy.station.x, 1.5, enemy.station.z);
    // Rotate player to face the target enemy
    const dx = enemy.station.x - playerPos.x;
    const dz = enemy.station.z - playerPos.z;
    playerRotY = Math.atan2(dx, dz);
  } else {
    // Shoot forward if all enemies are defeated
    targetPos = playerPos.clone().add(new THREE.Vector3(Math.sin(playerRotY) * 10, 1.5, Math.cos(playerRotY) * 10));
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

// 🔥 JURUS 1: BOLA API & GELOMBANG BARA (PYRO MULTIPLICATION BLAST)
function spawnFireProjectile(targetPos, targetEnemy, dmgAmount) {
  const startPos = playerPos.clone().add(new THREE.Vector3(0, 1.8, 0));

  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0 })
  );
  group.add(core);

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff5400, transparent: true, opacity: 0.75 })
  );
  group.add(aura);

  const light = new THREE.PointLight(0xff5400, 3.2, 14);
  group.add(light);

  group.position.copy(startPos);
  scene.add(group);

  // Swing right arm animation
  playerParts.armR.rotation.x = -1.2;
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

// ⚡ JURUS 2: SAMBARAN PETIR PROSEDURAL (THUNDER DIVISION STRIKE)
function spawnLightningStrike(targetPos, targetEnemy, dmgAmount) {
  const handPos = playerPos.clone().add(new THREE.Vector3(0, 1.9, 0));
  const skyPos = targetPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 3, 16, (Math.random() - 0.5) * 3));

  // Swing left arm animation
  playerParts.armL.rotation.x = -1.3;
  setTimeout(() => { if (playerParts.armL) playerParts.armL.rotation.x = 0; }, 260);

  // Create jagged procedural bolt from hand -> target and sky -> target
  createJaggedBolt(handPos, targetPos, 0x38bdf8, 14);
  createJaggedBolt(skyPos, targetPos, 0xc084fc, 18);

  // Electric Flash PointLight at Target
  const flashLight = new THREE.PointLight(0x38bdf8, 5.0, 20);
  flashLight.position.copy(targetPos);
  scene.add(flashLight);
  setTimeout(() => scene.remove(flashLight), 180);

  // Spawn Electric Shockwave & Sparks
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
      pt.x += (Math.random() - 0.5) * 1.35;
      pt.y += (Math.random() - 0.5) * 1.15;
      pt.z += (Math.random() - 0.5) * 1.35;
    }
    points.push(pt);
  }

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: hexColor, linewidth: 3 });
  const line = new THREE.Line(geo, mat);
  scene.add(line);

  activeLightnings.push({ line, life: 0.22 });
}

function spawnImpactExplosion(pos, colorPrimary, colorSecondary) {
  // Shockwave Ring on floor
  const ringGeo = new THREE.RingGeometry(0.3, 0.85, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorPrimary,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(pos.x, 0.12, pos.z);
  scene.add(ring);
  activeShockwaves.push({ mesh: ring, scale: 1, opacity: 0.95 });

  // 28 Burst Particles
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
// 9. APPLY DAMAGE, SPRING WOBBLE, CORPSE COLLAPSE & SLIDE UNLOCK
// ============================================================================
function applyDamageToEnemy(enemy, dmg, element) {
  if (enemy.defeated) return;

  enemy.hp = Math.max(0, enemy.hp - dmg);
  enemy.wobbleVel = 0.42; // Trigger Spring Wobble!

  // Update HP Bar HTML
  const hpFill = document.getElementById(`hpFill_${enemy.id}`);
  if (hpFill) {
    hpFill.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
  }

  // Spawn Floating Damage Text
  const labelText = element === 'fire' ? `-${dmg} HP 🔥 API!` : `-${dmg} HP ⚡ LISTRIK!`;
  const colorHex = element === 'fire' ? '#fb923c' : '#38bdf8';
  spawnFloatingDamageText(enemy.station.x, 3.2, enemy.station.z, labelText, colorHex);

  // Flash enemy armor
  enemy.armorMat.emissive = new THREE.Color(element === 'fire' ? 0xff4500 : 0x38bdf8);
  setTimeout(() => {
    if (enemy.armorMat) enemy.armorMat.emissive = new THREE.Color(0x000000);
  }, 160);

  // Check if Enemy is Defeated (HP == 0)
  if (enemy.hp <= 0 && !enemy.defeated) {
    enemy.defeated = true;
    defeatedCount++;

    // Change ground seal to Emerald Green
    enemy.sealRing.material.color.setHex(0x10b981);
    enemy.unlockCrystal.visible = true;

    // Hide HP bar & attack hint, show Corpse Reopen Badge "[O] Buka Presentasi"
    const hpTrack = document.getElementById(`hpTrack_${enemy.id}`);
    const atkHint = document.getElementById(`atkHint_${enemy.id}`);
    const corpseBadge = document.getElementById(`corpseBadge_${enemy.id}`);
    if (hpTrack) hpTrack.style.display = 'none';
    if (atkHint) atkHint.style.display = 'none';
    if (corpseBadge) corpseBadge.style.display = 'flex';

    spawnFloatingDamageText(enemy.station.x, 4.0, enemy.station.z, `💥 DUMMY KALAH! SLIDE ${enemy.station.posNum} TERBUKA!`, '#4ade80');
    CloudAudio.playVictoryUnlock();
    updateQuestHudProgress();

    // Open the Floating Presentation Slide Window after a short dramatic pause (550ms)
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
// 10. PLAYER MOVEMENT, KEYBOARD/MOUSE CONTROLS & GAME LOOP
// ============================================================================
function setupInputListeners() {
  window.addEventListener('keydown', (e) => {
    const code = e.code;
    keysPressed[code] = true;
    autoWalkTarget = null; // Cancel auto-walk if player presses manual movement

    // ESC closes active modals
    if (code === 'Escape') {
      closeSlideWindow();
      closeCreditsModal();
      closeFullCodeModal();
      return;
    }

    if (isIntroMode) return;

    // Combat & Interaction Shortcuts (when slide window is closed)
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

  // Mouse Click on 3D Canvas: Left Click = Fire, Right Click = Lightning
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
  // Find nearest defeated corpse within 14 units, or the last defeated enemy
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
    autoWalkTarget = new THREE.Vector3(nextEn.station.x * 0.55, 0, nextEn.station.z + 4.8);
  }
}

function teleportToPos(idx) {
  CloudAudio.playClick();
  const target = enemyObjects[idx];
  if (!target) return;
  playerPos.set(target.station.x * 0.5, 0, target.station.z + 4.8);
  const dx = target.station.x - playerPos.x;
  const dz = target.station.z - playerPos.z;
  playerRotY = Math.atan2(dx, dz);
  autoWalkTarget = null;
  document.getElementById('teleportPopover').classList.remove('active');
}

// ============================================================================
// 11. MAIN ANIMATION & PHYSICS LOOP
// ============================================================================
function gameLoop() {
  requestAnimationFrame(gameLoop);
  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  // 1. Transition Lighting after "CLICK TO START"
  if (!isIntroMode) {
    hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, 0.95, dt * 2.5);
    dirLight.intensity = THREE.MathUtils.lerp(dirLight.intensity, 1.15, dt * 2.5);
    introSpotLight.intensity = THREE.MathUtils.lerp(introSpotLight.intensity, 0.4, dt * 2.0);
  } else {
    if (introRingMesh) {
      introRingMesh.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.025);
    }
  }

  // 2. Player Movement (WASD / Arrow Keys / AutoWalk)
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
    const speed = 13.5;
    playerPos.x += (moveX / norm) * speed * dt;
    playerPos.z += (moveZ / norm) * speed * dt;

    // Clamp to Arena bounds
    playerPos.x = Math.max(-13, Math.min(13, playerPos.x));
    playerPos.z = Math.max(-84, Math.min(20, playerPos.z));

    const targetAngle = Math.atan2(moveX, moveZ);
    playerRotY = targetAngle;
    walkTime += dt * 11;

    playerParts.legL.rotation.x = Math.sin(walkTime) * 0.55;
    playerParts.legR.rotation.x = -Math.sin(walkTime) * 0.55;
    playerParts.torso.position.y = 1.35 + Math.abs(Math.sin(walkTime)) * 0.08;
  } else {
    playerParts.legL.rotation.x = THREE.MathUtils.lerp(playerParts.legL.rotation.x, 0, dt * 10);
    playerParts.legR.rotation.x = THREE.MathUtils.lerp(playerParts.legR.rotation.x, 0, dt * 10);
    playerParts.torso.position.y = 1.35 + Math.sin(elapsed * 2.5) * 0.04;
  }

  // Rotate Elemental Orbs in Cyber-Mage's hands
  if (playerParts.fireHalo) {
    playerParts.fireHalo.rotation.y += dt * 3.5;
    playerParts.voltHalo.rotation.x += dt * 4.2;
  }

  playerGroup.position.copy(playerPos);
  playerGroup.rotation.y = playerRotY;

  // 3. Smooth Third-Person / Isometric Camera Follow
  const camTargetPos = isIntroMode
    ? new THREE.Vector3(0, 11.5, 29.5)
    : new THREE.Vector3(playerPos.x * 0.55, 13.5, playerPos.z + 16.5);
  camera.position.lerp(camTargetPos, dt * 4.5);

  const lookTarget = isIntroMode
    ? new THREE.Vector3(0, 1.6, 17)
    : new THREE.Vector3(playerPos.x * 0.4, 1.4, playerPos.z - 3.5);
  camera.lookAt(lookTarget);

  // 4. Update Projectiles (Fireballs)
  for (let i = activeProjectiles.length - 1; i >= 0; i--) {
    const p = activeProjectiles[i];
    p.progress += dt * p.speed;

    // Spawn small fire trail particle
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
      // Hit Target!
      spawnImpactExplosion(p.targetPos, 0xff5400, 0xffd166);
      if (p.targetEnemy) {
        applyDamageToEnemy(p.targetEnemy, p.dmgAmount, 'fire');
      }
      scene.remove(p.mesh);
      activeProjectiles.splice(i, 1);
    } else {
      p.mesh.position.lerpVectors(p.startPos, p.targetPos, p.progress);
      p.mesh.position.y += Math.sin(p.progress * Math.PI) * 1.6; // Parabolic arc
    }
  }

  // 5. Update Lightning Bolts, Shockwaves & Particles
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

  // 6. Update Enemy Dummies (Spring Wobble, Corpse State & Projected 3D Labels)
  enemyObjects.forEach((en) => {
    if (!en.defeated) {
      // Spring Wobble Physics when hit
      const stiffness = 35;
      const damping = 6.5;
      const force = -stiffness * en.wobbleAngle - damping * en.wobbleVel;
      en.wobbleVel += force * dt;
      en.wobbleAngle += en.wobbleVel * dt;
      en.bodyGroup.rotation.x = en.wobbleAngle;
      en.core.rotation.y += dt * 2.2;
    } else {
      // Defeated Corpse State: Collapsed robot on the ground + spinning Emerald Crystal
      en.collapseProgress = Math.min(1, en.collapseProgress + dt * 3.5);
      en.bodyGroup.rotation.x = THREE.MathUtils.lerp(0, 1.25, en.collapseProgress);
      en.bodyGroup.position.y = THREE.MathUtils.lerp(0.45, 0.15, en.collapseProgress);
      en.unlockCrystal.rotation.y += dt * 2.8;
      en.unlockCrystal.position.y = 2.4 + Math.sin(elapsed * 3 + en.id) * 0.22;
    }

    // Project 3D position to 2D Screen Label
    if (isIntroMode) {
      en.labelEl.style.opacity = '0';
    } else {
      const worldPos = new THREE.Vector3(en.station.x, 3.6 * en.station.scale, en.station.z);
      const distToCam = camera.position.distanceTo(worldPos);
      worldPos.project(camera);

      if (worldPos.z < 1 && distToCam < 48) {
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
