// ============================================================================
// AOA CLOUD BATTLE ARENA — 3D WORLD, SCULPTED HERO & 8 ORGANIC MONSTERS ENGINE
// Revisi:
// 1. Geometri Organik & Animasi Multi-Sendi Halus (Spline Tube, Lathe, Sayap Berbulu, Sendi Lutut/Siku/Rahang/Ekor)
// 2. Rute Jalan Berkelok (Lurus -> Kiri -> Kanan -> S-Curve) dengan Jarak Antar Pos Jauh,
//    Tekstur Jalan Bebatuan Kuno, Tebing Batu 3D, Semak, Kristal, dan Hutan Pohon Rimbun
// ============================================================================

let scene, camera, renderer, clock;
let isIntroMode = true;
let playerGroup, playerParts = {};
let playerPos = new THREE.Vector3(0, 0, 17.5);
let playerRotY = Math.PI; // Menghadap ke arah -Z (ke dalam arena)
let walkTime = 0;

let roadCurve = null;
let roadSamplePoints = [];
let autoWalkTarget = null;
let autoWalkCurveTargetT = null;
const keysPressed = {};

// 360-Degree Damped Spherical Orbit Camera State (Stabil untuk Putar 360°, Naik/Turun & Zoom)
let cameraYaw = 0;             // Sudut horizontal aktual kamera (radian)
let targetCameraYaw = 0;       // Target sudut horizontal kamera (360° penuh)
let cameraPitch = 0.34;        // Sudut vertikal aktual kamera (radian)
let targetCameraPitch = 0.34;  // Target sudut vertikal (dibatasi 0.12 s.d 1.12 agar tidak terbalik)
let cameraDist = 15.5;         // Jarak zoom aktual kamera
let targetCameraDist = 15.5;   // Target jarak zoom (dibatasi 8.5 s.d 26.0)
let smoothFocusPos = new THREE.Vector3(0, 1.9, 17.5); // Titik pusat orbit yang stabil di bahu karakter

let isDraggingCamera = false;
let dragMouseButton = -1;
let dragStartPos = { x: 0, y: 0 };
let lastMousePos = { x: 0, y: 0 };
let totalDragDist = 0;
let lastTouchPos = null;
let lastPinchDist = null;

let hemiLight, dirLight, introSpotLight, introRingMesh;
let skyMoonGroup = null;
let skyStarsPoints = null;

const enemyObjects = [];
const activeProjectiles = [];
const activeParticles = [];
const activeLightnings = [];
const activeShockwaves = [];

let defeatedCount = 0;

// ============================================================================
// 0. ORGANIC 3D SCULPTING HELPERS (SPLINE TUBES, SCULPTED ROCKS & FEATHERED WINGS)
// ============================================================================
function createOrganicTube(points, radiusFn, tubularSegments, radialSegments, material, scaleX = 1.0, scaleY = 1.0) {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const pt = curve.getPointAt(u);
    const r = radiusFn(u);
    const N = frames.normals[i];
    const B = frames.binormals[i];

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);

      const nx = (cos * N.x * scaleX + sin * B.x * scaleY);
      const ny = (cos * N.y * scaleX + sin * B.y * scaleY);
      const nz = (cos * N.z * scaleX + sin * B.z * scaleY);
      const nLen = Math.hypot(nx, ny, nz) || 1;

      vertices.push(
        pt.x + r * (cos * N.x * scaleX + sin * B.x * scaleY),
        pt.y + r * (cos * N.y * scaleX + sin * B.y * scaleY),
        pt.z + r * (cos * N.z * scaleX + sin * B.z * scaleY)
      );
      normals.push(nx / nLen, ny / nLen, nz / nLen);
      uvs.push(u, j / radialSegments);
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = (radialSegments + 1) * i + j;
      const b = (radialSegments + 1) * (i + 1) + j;
      const c = (radialSegments + 1) * (i + 1) + (j + 1);
      const d = (radialSegments + 1) * i + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createSculptedMesh(baseGeo, noiseAmp, material, sx = 1, sy = 1, sz = 1) {
  const geo = baseGeo.clone();
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let vx = pos.getX(i);
    let vy = pos.getY(i);
    let vz = pos.getZ(i);
    const n = 1 + noiseAmp * (Math.sin(vx * 3.7 + vy * 2.3) * Math.cos(vz * 3.1 + vx * 1.9));
    pos.setXYZ(i, vx * sx * n, vy * sy * n, vz * sz * n);
  }
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ============================================================================
// 1. INITIALIZE THREE.JS SCENE & SPOTLIGHT INTRO
// ============================================================================
function initGameEngine() {
  const container = document.getElementById('gameCanvasContainer');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x130e26);
  // Fog lembut agar pemandangan sekeliling 360 derajat (gunung, pohon, tower, langit) terlihat indah
  scene.fog = new THREE.FogExp2(0x130e26, 0.0052);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 450);
  camera.position.set(0, 11.5, 31.0);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  setupLighting();
  buildWindingRoadAndScenery();
  buildSurroundingPanorama360();
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
  hemiLight = new THREE.HemisphereLight(0xffe3b8, 0x2b193d, 0.24);
  scene.add(hemiLight);

  dirLight = new THREE.DirectionalLight(0xffb482, 0.22);
  dirLight.position.set(35, 65, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 5;
  dirLight.shadow.camera.far = 220;
  const d = 95;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  introSpotLight = new THREE.SpotLight(0xc084fc, 4.5, 36, Math.PI / 4.0, 0.35, 1.2);
  introSpotLight.position.set(0, 16, 17.5);
  introSpotLight.target.position.set(0, 0, 17.5);
  introSpotLight.castShadow = true;
  scene.add(introSpotLight);
  scene.add(introSpotLight.target);
}

// ============================================================================
// 3. WINDING ROAD (LURUS -> KIRI -> KANAN), COBBLESTONES, ROCKS & FOREST TREES
// ============================================================================
function createPlusGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#17112b';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 256, 256);

  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2.5;
  const drawPlus = (cx, cy) => {
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy);
    ctx.lineTo(cx + 7, cy);
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx, cy + 7);
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
  tex.repeat.set(60, 60);
  return tex;
}

function createCobblestoneRoadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Rich earthen stone road base
  ctx.fillStyle = '#2d2338';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle dirt & moss patches
  for (let i = 0; i < 60; i++) {
    const x = (i * 97) % 512;
    const y = (i * 151) % 512;
    const r = 18 + (i % 24);
    ctx.fillStyle = i % 3 === 0 ? 'rgba(42, 75, 60, 0.22)' : 'rgba(65, 48, 78, 0.25)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flagstone / Cobblestone blocks
  const stoneColors = ['#3d314a', '#463856', '#352a42', '#4f3f61', '#3b2e48'];
  for (let row = 0; row < 16; row++) {
    const y = row * 32;
    const offset = (row % 2) * 24;
    for (let col = 0; col < 12; col++) {
      const x = (col * 48 + offset) % 512;
      const w = 40 + ((row + col) % 6);
      const h = 26 + ((row * col) % 4);
      ctx.fillStyle = stoneColors[(row + col) % stoneColors.length];
      ctx.strokeStyle = '#1d1626';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(x, y + 2, w, h, 6);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Glowing arcane center trail lines
  ctx.strokeStyle = 'rgba(192, 132, 252, 0.22)';
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 42);
  return tex;
}

function buildWindingRoadMesh(curve, width = 14.5, segments = 320) {
  const vertices = [];
  const uvs = [];
  const indices = [];
  const halfW = width / 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const leftPt = pt.clone().addScaledVector(normal, halfW);
    const rightPt = pt.clone().addScaledVector(normal, -halfW);

    vertices.push(leftPt.x, 0.03, leftPt.z);
    vertices.push(rightPt.x, 0.03, rightPt.z);

    uvs.push(0, t * 38);
    uvs.push(1, t * 38);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = i * 2 + 1;
    const c = (i + 1) * 2;
    const d = (i + 1) * 2 + 1;
    indices.push(a, b, c);
    indices.push(b, d, c);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const roadTex = createCobblestoneRoadTexture();
  const mat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.82,
    metalness: 0.08
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

function buildWindingRoadAndScenery() {
  const gridTex = createPlusGridTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(420, 420),
    new THREE.MeshStandardMaterial({ map: gridTex, roughness: 0.88, metalness: 0.08 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -110);
  ground.receiveShadow = true;
  scene.add(ground);

  // Start Sanctuary Disc
  const startDisc = new THREE.Mesh(
    new THREE.CircleGeometry(6.8, 48),
    new THREE.MeshStandardMaterial({ color: 0x4c3575, roughness: 0.7 })
  );
  startDisc.rotation.x = -Math.PI / 2;
  startDisc.position.set(0, 0.04, 17.5);
  startDisc.receiveShadow = true;
  scene.add(startDisc);

  introRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(6.6, 6.95, 64),
    new THREE.MeshBasicMaterial({ color: 0xe879f9, side: THREE.DoubleSide })
  );
  introRingMesh.rotation.x = -Math.PI / 2;
  introRingMesh.position.set(0, 0.07, 17.5);
  scene.add(introRingMesh);

  // Construct Smooth CatmullRomCurve3 from ROAD_WAYPOINTS
  const wpVectors = ROAD_WAYPOINTS.map(wp => new THREE.Vector3(wp.x, 0, wp.z));
  roadCurve = new THREE.CatmullRomCurve3(wpVectors, false, 'catmullrom', 0.45);

  // Pre-sample 600 titik di sepanjang kurva jalan untuk pembatas rute (Road Clamping)
  roadSamplePoints = [];
  for (let s = 0; s <= 600; s++) {
    roadSamplePoints.push(roadCurve.getPointAt(s / 600));
  }

  // Build Continuous Winding Cobblestone Road Ribbon
  buildWindingRoadMesh(roadCurve, 14.5, 340);

  // Populate Road Borders: Stone Curbs, Stepping Stones, Boulders, Bushes, Trees & Lanterns
  const totalSteps = 180;
  const rockMatDark = new THREE.MeshStandardMaterial({ color: 0x3b334a, roughness: 0.85, flatShading: true });
  const rockMatMoss = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8, flatShading: true });
  const stoneSlabMat = new THREE.MeshStandardMaterial({ color: 0x524566, roughness: 0.75 });
  const treePalette = [0xd946ef, 0xf43f5e, 0xf59e0b, 0x8b5cf6, 0x10b981, 0xec4899];

  for (let i = 2; i < totalSteps; i++) {
    const t = i / totalSteps;
    const pt = roadCurve.getPointAt(t);
    const tangent = roadCurve.getTangentAt(t).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const angleY = Math.atan2(tangent.x, tangent.z);

    // Check distance to nearest Enemy Pos so we don't block the Pos arena itself
    let minDistToPos = Infinity;
    ENEMY_STATIONS.forEach(st => {
      const d = Math.hypot(pt.x - st.x, pt.z - st.z);
      if (d < minDistToPos) minDistToPos = d;
    });

    // 1. Stone Border Curbs along the winding road
    const isAccent = i % 2 === 0;
    const curbMat = new THREE.MeshStandardMaterial({
      color: isAccent ? 0xd97706 : 0x64748b,
      roughness: 0.65
    });
    [-7.5, 7.5].forEach(offsetSide => {
      const cPos = pt.clone().addScaledVector(normal, offsetSide);
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 1.9), curbMat);
      curb.position.set(cPos.x, 0.16, cPos.z);
      curb.rotation.y = angleY;
      curb.castShadow = true;
      curb.receiveShadow = true;
      scene.add(curb);
    });

    // 2. Decorative 3D Stepping Stones & Moss Pebbles on the road surface
    if (i % 3 === 0 && minDistToPos > 5.5) {
      const sideJitter = ((i * 37) % 9) - 4.5;
      const sPos = pt.clone().addScaledVector(normal, sideJitter);
      const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.09, 7), stoneSlabMat);
      slab.position.set(sPos.x, 0.045, sPos.z);
      slab.rotation.y = i * 0.8;
      slab.scale.set(1.2, 1, 0.85);
      slab.receiveShadow = true;
      scene.add(slab);
    }

    // 3. Roadside Sculpted 3D Rocks, Bushes & Crystal Formations
    if (i % 3 === 1 && minDistToPos > 7.5) {
      const side = (i % 2 === 0) ? 1 : -1;
      const distOut = 9.2 + (i % 4) * 1.4;
      const rPos = pt.clone().addScaledVector(normal, side * distOut);
      buildRockFormation(rPos.x, rPos.z, 0.8 + (i % 3) * 0.45, i % 2 === 0 ? rockMatDark : rockMatMoss, i % 5 === 0);
    }

    // 4. Dense Roadside Forest (Multi-species Trees + Bushes) on both sides & especially thick on curve bends!
    if (i % 2 === 0 && minDistToPos > 8.5) {
      const treeColor1 = treePalette[i % treePalette.length];
      const treeColor2 = treePalette[(i + 2) % treePalette.length];
      const leftTreePos = pt.clone().addScaledVector(normal, 12.0 + (i % 5) * 2.2);
      const rightTreePos = pt.clone().addScaledVector(normal, -(12.0 + ((i + 3) % 5) * 2.2));

      buildStylizedTree(leftTreePos.x, leftTreePos.z, treeColor1, i % 3);
      buildStylizedTree(rightTreePos.x, rightTreePos.z, treeColor2, (i + 1) % 3);

      // Extra inner-bend sightline blocker trees & boulders so next Pos is hidden around turns!
      if (i % 4 === 0 && minDistToPos > 10.5) {
        const outerLeft = pt.clone().addScaledVector(normal, 19.5 + (i % 4) * 2.5);
        const outerRight = pt.clone().addScaledVector(normal, -(19.5 + (i % 4) * 2.5));
        buildStylizedTree(outerLeft.x, outerLeft.z, treePalette[(i + 4) % treePalette.length], 1);
        buildStylizedTree(outerRight.x, outerRight.z, treePalette[(i + 1) % treePalette.length], 2);
        buildRockFormation(
          pt.x + normal.x * (sideSign(i) * 15.5),
          pt.z + normal.z * (sideSign(i) * 15.5),
          1.65,
          rockMatDark,
          true
        );
      }
    }

    // 5. Warm Street Lanterns guiding the winding trail
    if (i % 9 === 0 && minDistToPos > 6.5) {
      const lSide = (i % 18 === 0) ? 8.8 : -8.8;
      const lPos = pt.clone().addScaledVector(normal, lSide);
      buildLantern(lPos.x, lPos.z);
    }
  }

  buildArenaGateArch(0, 10.5);
  buildStartSanctuaryProps();
}

function sideSign(idx) {
  return idx % 2 === 0 ? 1 : -1;
}

function buildRockFormation(x, z, scale, mat, withCrystals = false) {
  const g = new THREE.Group();

  // Main boulder
  const mainRock = createSculptedMesh(new THREE.DodecahedronGeometry(1.35, 1), 0.18, mat, 1.25, 0.95, 1.15);
  mainRock.position.y = 0.75;
  mainRock.rotation.set(x * 0.2, z * 0.3, 0.2);
  g.add(mainRock);

  // Secondary side rocks
  const sideRock1 = createSculptedMesh(new THREE.DodecahedronGeometry(0.85, 1), 0.16, mat, 1.1, 0.8, 1.0);
  sideRock1.position.set(1.05, 0.45, 0.4);
  sideRock1.rotation.y = 1.1;
  g.add(sideRock1);

  const sideRock2 = createSculptedMesh(new THREE.DodecahedronGeometry(0.65, 1), 0.15, mat, 1.0, 0.75, 1.15);
  sideRock2.position.set(-0.85, 0.35, -0.5);
  g.add(sideRock2);

  // Low bush / grass cluster next to the rock
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.8 });
  const bush = createSculptedMesh(new THREE.IcosahedronGeometry(0.55, 1), 0.15, bushMat, 1.3, 0.75, 1.2);
  bush.position.set(0.3, 0.32, 1.05);
  g.add(bush);

  // Optional glowing arcane crystal shard emerging from the rock
  if (withCrystals) {
    const crysMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      roughness: 0.2
    });
    [[-0.2, 1.35, 0, 0.25, 1.2, -0.25], [0.3, 1.15, 0.2, 0.18, 0.9, 0.32]].forEach(([cx, cy, cz, r, h, tilt]) => {
      const shard = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), crysMat);
      shard.position.set(cx, cy, cz);
      shard.rotation.z = tilt;
      g.add(shard);
    });
  }

  g.position.set(x, 0, z);
  g.scale.setScalar(scale);
  scene.add(g);
}

function buildArenaGateArch(x, z) {
  const gateGroup = new THREE.Group();
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x7c5869, metalness: 0.4, roughness: 0.5 });
  const pillarGeo = new THREE.CylinderGeometry(0.65, 0.85, 7.8, 12);

  const leftP = new THREE.Mesh(pillarGeo, pillarMat);
  leftP.position.set(-8.2, 3.9, 0);
  leftP.castShadow = true;
  gateGroup.add(leftP);

  const rightP = new THREE.Mesh(pillarGeo, pillarMat);
  rightP.position.set(8.2, 3.9, 0);
  rightP.castShadow = true;
  gateGroup.add(rightP);

  // Curved Torii-style upper arch beam
  const archPts = [
    new THREE.Vector3(-9.8, 7.4, 0),
    new THREE.Vector3(-4.5, 8.1, 0),
    new THREE.Vector3(0, 8.35, 0),
    new THREE.Vector3(4.5, 8.1, 0),
    new THREE.Vector3(9.8, 7.4, 0)
  ];
  const topArch = createOrganicTube(archPts, () => 0.58, 24, 12, pillarMat, 1.0, 1.2);
  gateGroup.add(topArch);

  for (let i = -7; i <= 7; i++) {
    const sq = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.95),
      new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xffffff : 0x1e1b24 })
    );
    sq.rotation.x = -Math.PI / 2;
    sq.position.set(i, 0.05, 0);
    gateGroup.add(sq);
  }

  gateGroup.position.set(x, 0, z);
  scene.add(gateGroup);
}

// ============================================================================
// 4. SANCTUARY PROPS, TREES & DATACENTER TOWERS
// ============================================================================
function buildLantern(x, z) {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x3b2d54, roughness: 0.6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.52, 0.8, 8), poleMat);
  base.position.y = 0.4;
  g.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 3.3, 8), poleMat);
  pole.position.y = 2.0;
  g.add(pole);

  const lamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.3, 0.85, 6),
    new THREE.MeshBasicMaterial({ color: 0xffb703 })
  );
  lamp.position.y = 3.75;
  g.add(lamp);

  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.48, 6), poleMat);
  cap.position.y = 4.35;
  g.add(cap);

  g.position.set(x, 0, z);
  scene.add(g);
}

function buildStylizedTree(x, z, foliageColor = 0x9d4edd, treeStyle = 0) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });

  // Organic curved tree trunk using spline tube
  const bendX = ((Math.abs(Math.floor(x)) % 5) - 2) * 0.18;
  const trunkPts = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(bendX * 0.5, 1.2, 0.1),
    new THREE.Vector3(bendX, 2.6, -0.1),
    new THREE.Vector3(bendX * 0.7, 3.6, 0)
  ];
  const trunk = createOrganicTube(trunkPts, (u) => 0.48 * (1 - u * 0.52), 10, 8, trunkMat);
  g.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({ color: foliageColor, roughness: 0.75 });

  if (treeStyle === 1) {
    // Layered Pine / Cypress Tree
    for (let layer = 0; layer < 4; layer++) {
      const cone = createSculptedMesh(
        new THREE.ConeGeometry(1.95 - layer * 0.35, 1.85, 9),
        0.12,
        leafMat
      );
      cone.position.set(bendX * 0.7, 2.5 + layer * 1.05, 0);
      g.add(cone);
    }
  } else {
    // Sculpted Canopy Blossom / Oak Tree with organic foliage clouds
    const puffs = [
      [bendX, 3.8, 0, 1.55],
      [bendX - 0.95, 3.25, 0.55, 1.15],
      [bendX + 0.95, 3.35, -0.45, 1.2],
      [bendX + 0.2, 4.65, 0.3, 1.1],
      [bendX - 0.4, 4.2, -0.6, 1.0]
    ];
    puffs.forEach(([ox, oy, oz, r]) => {
      const puff = createSculptedMesh(new THREE.IcosahedronGeometry(r, 1), 0.14, leafMat, 1.15, 0.9, 1.15);
      puff.position.set(ox, oy, oz);
      g.add(puff);
    });
  }

  const scaleVar = 0.85 + ((Math.abs(Math.floor(x + z)) % 5) * 0.12);
  g.scale.setScalar(scaleVar);
  g.position.set(x, 0, z);
  scene.add(g);
}

function buildStartSanctuaryProps() {
  buildLantern(-4.2, 18.5);
  buildLantern(4.2, 18.5);
  buildStylizedTree(-4.8, 14.8, 0x8b5cf6, 0);
  buildStylizedTree(5.2, 15.2, 0xd946ef, 2);
  buildRockFormation(-5.5, 19.5, 0.95, new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 }), true);
  buildRockFormation(5.8, 19.2, 0.85, new THREE.MeshStandardMaterial({ color: 0x3b334a, roughness: 0.8 }), false);
}

// ============================================================================
// 4B. 360° PANORAMIC SURROUNDINGS (MOUNTAINS, SKY STARS & CYBER MOON)
//     Sehingga saat memutar kamera 360 derajat, sekeliling dunia tampak hidup!
// ============================================================================
function buildSurroundingPanorama360() {
  const mtnMat1 = new THREE.MeshStandardMaterial({ color: 0x1e1636, roughness: 0.9, flatShading: true });
  const mtnMat2 = new THREE.MeshStandardMaterial({ color: 0x2a1f4a, roughness: 0.85, flatShading: true });

  // Lingkaran Pegunungan 360 Derajat mengelilingi seluruh lembah arena
  const numPeaks = 32;
  for (let i = 0; i < numPeaks; i++) {
    const angle = (i / numPeaks) * Math.PI * 2;
    const dist = 165 + (i % 3) * 18;
    const cx = Math.cos(angle) * dist;
    const cz = -110 + Math.sin(angle) * dist;
    const radius = 24 + (i % 4) * 8;
    const height = 32 + (i % 5) * 14;

    const peak = createSculptedMesh(
      new THREE.ConeGeometry(radius, height, 7),
      0.16,
      i % 2 === 0 ? mtnMat1 : mtnMat2
    );
    peak.position.set(cx, height * 0.42, cz);
    peak.rotation.y = i * 0.7;
    scene.add(peak);
  }

  // Kubah Bintang 360 Derajat di Langit Malam (fog: false agar selalu berkilau jelas)
  const starGeo = new THREE.BufferGeometry();
  const starPositions = [];
  for (let s = 0; s < 520; s++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.46;
    const r = 185 + Math.random() * 25;
    starPositions.push(
      Math.cos(theta) * Math.sin(phi) * r,
      Math.cos(phi) * r * 0.55 + 14,
      Math.sin(theta) * Math.sin(phi) * r
    );
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  skyStarsPoints = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xe0f2fe, size: 1.5, transparent: true, opacity: 0.9, fog: false })
  );
  scene.add(skyStarsPoints);

  // BULAN PURNAMA BERSINAR DI LANGIT GAME (Dengan Kawah Bulan & Halo Cahaya Berlapis, fog: false)
  skyMoonGroup = new THREE.Group();

  // Bola Utama Bulan Purnama (Kuning Gading / Emas Pucat Bersinar)
  const moonCoreMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, fog: false });
  const moonSphere = new THREE.Mesh(new THREE.SphereGeometry(10.5, 32, 32), moonCoreMat);
  skyMoonGroup.add(moonSphere);

  // Tekstur Kawah-Kawah Bulan (Lunar Mare & Craters di permukaan depan bulan)
  const craterMatDark = new THREE.MeshBasicMaterial({ color: 0xeab308, fog: false });
  const craterMatMid = new THREE.MeshBasicMaterial({ color: 0xfacc15, fog: false });
  const craters = [
    { x: -3.2, y: 2.6, z: 9.4, r: 2.5, mat: craterMatDark },
    { x: 3.8, y: 1.8, z: 9.3, r: 3.1, mat: craterMatMid },
    { x: -1.4, y: -3.4, z: 9.5, r: 2.2, mat: craterMatMid },
    { x: 2.5, y: -2.8, z: 9.6, r: 1.7, mat: craterMatDark },
    { x: -4.8, y: -0.8, z: 9.1, r: 1.9, mat: craterMatDark },
    { x: 0.6, y: 4.5, z: 9.2, r: 1.6, mat: craterMatMid }
  ];
  craters.forEach(c => {
    const crater = new THREE.Mesh(new THREE.SphereGeometry(c.r, 14, 14), c.mat);
    crater.scale.set(1.0, 0.85, 0.35);
    crater.position.set(c.x, c.y, c.z);
    skyMoonGroup.add(crater);
  });

  // Lapisan Corona / Halo Cahaya Bulan 1 (Inner Glow)
  const haloInner = new THREE.Mesh(
    new THREE.SphereGeometry(13.2, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.28, fog: false, depthWrite: false })
  );
  skyMoonGroup.add(haloInner);

  // Lapisan Corona / Halo Cahaya Bulan 2 (Outer Aura)
  const haloOuter = new THREE.Mesh(
    new THREE.SphereGeometry(18.0, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xfef9c3, transparent: true, opacity: 0.12, fog: false, depthWrite: false })
  );
  skyMoonGroup.add(haloOuter);

  // Cincin Pendaran Cahaya Bulan
  const moonGlowRing = new THREE.Mesh(
    new THREE.RingGeometry(11.2, 21.5, 40),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.16, fog: false, depthWrite: false })
  );
  skyMoonGroup.add(moonGlowRing);

  // Posisi di langit depan-atas agar langsung terlihat megah di cakrawala langit game!
  skyMoonGroup.position.set(-26, 30, -102);
  scene.add(skyMoonGroup);
}

function buildDatacenterTowers() {
  const dcConfigs = [
    { x: -28, z: -12,  h: 12, color: 0x0284c7, name: "DC SURABAYA" },
    { x: -38, z: -112, h: 10, color: 0x8b5cf6, name: "DC JAKARTA" },
    { x: 26,  z: -215, h: 9,  color: 0x10b981, name: "DC YOGYAKARTA" }
  ];

  dcConfigs.forEach(dc => {
    const g = new THREE.Group();
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(5.8, 6.4, 0.6, 8),
      new THREE.MeshStandardMaterial({ color: 0x334155 })
    );
    pad.position.y = 0.3;
    g.add(pad);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(3.6, 4.0, dc.h, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.6, roughness: 0.3 })
    );
    body.position.y = dc.h / 2 + 0.6;
    body.castShadow = true;
    g.add(body);

    for (let y = 2.0; y < dc.h; y += 1.6) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(3.85, 0.09, 8, 24),
        new THREE.MeshBasicMaterial({ color: dc.color })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      g.add(ring);
    }

    g.position.set(dc.x, 0, dc.z);
    scene.add(g);
  });
}

// ============================================================================
// 5. SCULPTED PLAYER HERO (ANATOMICAL LATHE TORSO, MULTI-JOINTED LIMBS,
//    FLOWING CAPE & 5 LIGHTNING ORBS IN AN UPWARD CURVE BEHIND BACK)
// ============================================================================
function buildPlayerHero() {
  playerGroup = new THREE.Group();

  const armorDarkMat = new THREE.MeshStandardMaterial({ color: 0x1a162b, metalness: 0.65, roughness: 0.28 });
  const armorGoldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });
  const clothCrimsonMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55, side: THREE.DoubleSide });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.45 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.2 });
  const cyanGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  // 1. MULTI-JOINTED LEGS (Hip -> Thigh -> Knee -> Shin -> Boot)
  function createHeroLeg(sideSign) {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(sideSign * 0.25, 1.06, 0);

    // Sculpted Tapered Thigh + Crimson Hakama Tasset
    const thighPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.46, 0.02)];
    const thighMesh = createOrganicTube(thighPts, (u) => 0.165 * (1 - u * 0.22), 8, 12, armorDarkMat);
    hipPivot.add(thighMesh);

    const tasset = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.34, 10, 1, false, 0, Math.PI * 1.2), clothCrimsonMat);
    tasset.position.set(sideSign * 0.03, -0.18, 0);
    tasset.rotation.y = sideSign > 0 ? 0 : Math.PI;
    hipPivot.add(tasset);

    // Knee Joint Pivot
    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.46, 0.02);

    const kneeGuard = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13, 1), armorGoldMat);
    kneeGuard.scale.set(0.9, 1.15, 1.1);
    kneeGuard.position.set(0, 0.02, 0.06);
    kneePivot.add(kneeGuard);

    // Sculpted Greave / Shin
    const shinPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.48, -0.02)];
    const shinMesh = createOrganicTube(shinPts, (u) => 0.135 * (1 - u * 0.28), 8, 12, armorDarkMat);
    kneePivot.add(shinMesh);

    const greaveTrim = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.022, 8, 16), armorGoldMat);
    greaveTrim.rotation.x = Math.PI / 2;
    greaveTrim.position.y = -0.35;
    kneePivot.add(greaveTrim);

    // Sculpted Armored Boot
    const bootPts = [
      new THREE.Vector3(0, -0.48, -0.04),
      new THREE.Vector3(0, -0.52, 0.08),
      new THREE.Vector3(0, -0.53, 0.24)
    ];
    const bootMesh = createOrganicTube(bootPts, (u) => 0.115 * (1 - u * 0.35), 8, 10, armorDarkMat, 1.1, 0.8);
    kneePivot.add(bootMesh);

    hipPivot.add(kneePivot);
    return { hipPivot, kneePivot };
  }

  const leftLegObj = createHeroLeg(-1);
  const rightLegObj = createHeroLeg(1);
  playerGroup.add(leftLegObj.hipPivot);
  playerGroup.add(rightLegObj.hipPivot);
  playerParts.legL = leftLegObj.hipPivot;
  playerParts.legR = rightLegObj.hipPivot;
  playerParts.kneeL = leftLegObj.kneePivot;
  playerParts.kneeR = rightLegObj.kneePivot;

  // 2. SCULPTED ANATOMICAL TORSO (LatheGeometry V-Taper Chest + Flared Battle Coat)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.42;

  const lathePoints = [
    new THREE.Vector2(0.36, -0.48), // Flared battle coat hem
    new THREE.Vector2(0.28, -0.26), // Hips
    new THREE.Vector2(0.22, -0.08), // Narrow athletic waist
    new THREE.Vector2(0.31, 0.15),  // Muscular chest / lats
    new THREE.Vector2(0.35, 0.34),  // Broad shoulders
    new THREE.Vector2(0.18, 0.44)   // Collar base
  ];
  const sculptedTorso = new THREE.Mesh(new THREE.LatheGeometry(lathePoints, 18), armorDarkMat);
  sculptedTorso.scale.set(1.12, 1.0, 0.78); // Anatomical chest flatten
  sculptedTorso.castShadow = true;
  torsoGroup.add(sculptedTorso);

  // Sculpted Chest Armor Plates & Glowing Cyber Core
  const chestPlate = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), armorDarkMat);
  chestPlate.scale.set(1.15, 0.85, 0.65);
  chestPlate.position.set(0, 0.18, 0.08);
  torsoGroup.add(chestPlate);

  const coreGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 1), cyanGlowMat);
  coreGem.scale.set(1.0, 1.35, 0.55);
  coreGem.position.set(0, 0.19, 0.27);
  torsoGroup.add(coreGem);

  // Gold Champion Belt
  const belt = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.045, 10, 24), armorGoldMat);
  belt.rotation.x = Math.PI / 2;
  belt.scale.set(1.12, 0.78, 1.0);
  belt.position.y = -0.08;
  torsoGroup.add(belt);

  // High Arcane Collar
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.21, 0.22, 16, 1, true, Math.PI * 0.25, Math.PI * 1.5),
    armorGoldMat
  );
  collar.position.set(0, 0.44, -0.02);
  torsoGroup.add(collar);

  // Dual Crossed Katanas on Back
  [-1, 1].forEach(dir => {
    const katanaPts = [
      new THREE.Vector3(0, -0.55, 0),
      new THREE.Vector3(0.03 * dir, 0, 0),
      new THREE.Vector3(0.08 * dir, 0.65, 0)
    ];
    const scabbard = createOrganicTube(katanaPts, (u) => 0.042 * (1 - u * 0.25), 12, 8, armorDarkMat);
    scabbard.position.set(dir * 0.12, 0.12, -0.26);
    scabbard.rotation.z = dir * 0.52;
    torsoGroup.add(scabbard);
  });

  // Flowing Multi-Wave Crimson Cape
  const capeGroup = new THREE.Group();
  capeGroup.position.set(0, 0.36, -0.24);
  const capePts = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -0.45, -0.12),
    new THREE.Vector3(0, -0.95, -0.26),
    new THREE.Vector3(0, -1.35, -0.35)
  ];
  const capeMesh = createOrganicTube(capePts, (u) => 0.26 + u * 0.32, 14, 12, clothCrimsonMat, 1.8, 0.12);
  capeGroup.add(capeMesh);
  torsoGroup.add(capeGroup);
  playerParts.capeGroup = capeGroup;

  // 3. MULTI-JOINTED ARMS (Shoulder Pauldron -> Upper Arm -> Elbow -> Forearm Gauntlet -> Hand)
  function createHeroArm(sideSign) {
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(sideSign * 0.44, 0.32, 0);

    // Sculpted Layered Dragon-Scale Pauldron
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      armorDarkMat
    );
    pauldron.rotation.z = -sideSign * 0.45;
    pauldron.scale.set(1.15, 1.0, 1.1);
    shoulderPivot.add(pauldron);

    const pauldronRim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 8, 18), armorGoldMat);
    pauldronRim.rotation.x = Math.PI / 2;
    pauldronRim.rotation.y = -sideSign * 0.45;
    pauldronRim.position.y = -0.03;
    shoulderPivot.add(pauldronRim);

    // Upper Arm
    const upperArmPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(sideSign * 0.03, -0.34, 0)];
    const upperArm = createOrganicTube(upperArmPts, (u) => 0.115 * (1 - u * 0.15), 8, 10, armorDarkMat);
    shoulderPivot.add(upperArm);

    // Elbow Pivot
    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(sideSign * 0.03, -0.34, 0);

    // Forearm Vambrace / Gauntlet
    const forearmPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.34, 0.06)];
    const forearm = createOrganicTube(forearmPts, (u) => 0.11 * (1 - u * 0.25), 8, 10, armorDarkMat);
    elbowPivot.add(forearm);

    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.02, 8, 14), armorGoldMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, -0.22, 0.04);
    elbowPivot.add(cuff);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), skinMat);
    hand.position.set(0, -0.37, 0.07);
    elbowPivot.add(hand);

    shoulderPivot.add(elbowPivot);
    return { shoulderPivot, elbowPivot };
  }

  const leftArmObj = createHeroArm(-1);
  const rightArmObj = createHeroArm(1);
  torsoGroup.add(leftArmObj.shoulderPivot);
  torsoGroup.add(rightArmObj.shoulderPivot);
  playerParts.armL = leftArmObj.shoulderPivot;
  playerParts.armR = rightArmObj.shoulderPivot;
  playerParts.elbowL = leftArmObj.elbowPivot;
  playerParts.elbowR = rightArmObj.elbowPivot;

  // 4. SCULPTED ANIME BATTLEMAGE HEAD, VISOR & FLOWING SPIKED HAIR
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.66, 0);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 18), skinMat);
  headMesh.scale.set(0.95, 1.06, 0.98);
  headGroup.add(headMesh);

  // Sleek Curved Cyber Visor
  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.258, 0.258, 0.09, 16, 1, true, -Math.PI * 0.35, Math.PI * 0.7),
    cyanGlowMat
  );
  visor.rotation.y = Math.PI;
  visor.position.set(0, 0.03, 0);
  headGroup.add(visor);

  // Samurai / Ninja Face Mask
  const mask = new THREE.Mesh(
    new THREE.SphereGeometry(0.256, 16, 12, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.45),
    armorDarkMat
  );
  headGroup.add(mask);

  // Curved Anime Hair Locks (Sculpted with Spline Tubes!)
  const hairLocks = [
    [[0, 0.18, 0], [0, 0.42, -0.12], [0, 0.58, -0.28]],
    [[-0.1, 0.16, -0.02], [-0.26, 0.36, -0.16], [-0.38, 0.48, -0.32]],
    [[0.1, 0.16, -0.02], [0.26, 0.36, -0.16], [0.38, 0.48, -0.32]],
    [[-0.08, 0.12, -0.12], [-0.18, 0.22, -0.34], [-0.25, 0.15, -0.52]],
    [[0.08, 0.12, -0.12], [0.18, 0.22, -0.34], [0.25, 0.15, -0.52]],
    [[0, 0.2, 0.05], [0, 0.46, 0.02], [0, 0.62, -0.08]]
  ];
  hairLocks.forEach(pts => {
    const vecs = pts.map(p => new THREE.Vector3(p[0], p[1], p[2]));
    const lock = createOrganicTube(vecs, (u) => 0.11 * (1 - u * 0.88), 10, 8, hairMat);
    headGroup.add(lock);
  });

  torsoGroup.add(headGroup);
  playerParts.headGroup = headGroup;

  // 5. ⚡ 5 LIGHTNING ORBS IN AN UPWARD CURVE ARCH BEHIND THE HERO'S BACK
  const upwardArchGroup = new THREE.Group();
  upwardArchGroup.position.set(0, 0.42, -0.45);
  playerParts.lightningOrbs = [];

  const orbCurvePositions = [
    { x: -0.96, y: 0.10, z: -0.04, phase: 0.0 },
    { x: -0.58, y: 0.48, z: -0.09, phase: 1.2 },
    { x:  0.00, y: 0.72, z: -0.14, phase: 2.4 },
    { x:  0.58, y: 0.48, z: -0.09, phase: 3.6 },
    { x:  0.96, y: 0.10, z: -0.04, phase: 4.8 }
  ];

  // Subtle energy conduit arc connecting the 5 orbs
  const archConduitPts = orbCurvePositions.map(cfg => new THREE.Vector3(cfg.x, cfg.y, cfg.z));
  const archConduit = createOrganicTube(
    archConduitPts,
    () => 0.018,
    24,
    6,
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
  );
  upwardArchGroup.add(archConduit);

  orbCurvePositions.forEach((cfg) => {
    const orbHolder = new THREE.Group();
    orbHolder.position.set(cfg.x, cfg.y, cfg.z);

    const coreSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
    );
    orbHolder.add(coreSphere);

    const plasmaShell = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
    );
    orbHolder.add(plasmaShell);

    const cage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.27, 1),
      new THREE.MeshBasicMaterial({ color: 0xc084fc, wireframe: true, transparent: true, opacity: 0.85 })
    );
    orbHolder.add(cage);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.29, 0.02, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    orbHolder.add(ring);

    upwardArchGroup.add(orbHolder);
    playerParts.lightningOrbs.push({ orbHolder, cage, ring, baseY: cfg.y, phase: cfg.phase });
  });

  torsoGroup.add(upwardArchGroup);

  // 6. 🔥 SOLAR FIRE CHAKRAM HALO BEHIND BACK
  const fireChakram = new THREE.Group();
  fireChakram.position.set(0, 0.18, -0.34);
  const chakramRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.54, 0.032, 10, 32),
    new THREE.MeshBasicMaterial({ color: 0xff6b00 })
  );
  fireChakram.add(chakramRing);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.055, 0.2, 6),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    spike.position.set(Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0);
    spike.rotation.z = a - Math.PI / 2;
    fireChakram.add(spike);
  }
  torsoGroup.add(fireChakram);
  playerParts.fireChakram = fireChakram;

  playerGroup.add(torsoGroup);
  playerParts.torso = torsoGroup;

  playerGroup.position.copy(playerPos);
  playerGroup.rotation.y = playerRotY;
  scene.add(playerGroup);
}

// ============================================================================
// 6. 8 POS STATIONS & ORGANIC SCULPTED MONSTER MODELS (POS 1 - POS 8)
// ============================================================================
function buildAllEnemyStations() {
  const labelsContainer = document.getElementById('worldLabelsContainer');
  labelsContainer.innerHTML = '';

  ENEMY_STATIONS.forEach((st, idx) => {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(st.x, 0, st.z);

    // Sculpted Stone Altar Pedestal Ring
    const sealRing = new THREE.Mesh(
      new THREE.RingGeometry(2.65, 3.05, 48),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    sealRing.rotation.x = -Math.PI / 2;
    sealRing.position.y = 0.05;
    stationGroup.add(sealRing);

    const innerGlowDisc = new THREE.Mesh(
      new THREE.CircleGeometry(2.65, 48),
      new THREE.MeshBasicMaterial({ color: st.color, transparent: true, opacity: 0.16 })
    );
    innerGlowDisc.rotation.x = -Math.PI / 2;
    innerGlowDisc.position.y = 0.04;
    stationGroup.add(innerGlowDisc);

    // Sculpted Rocky Pedestal Base
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x261f38, metalness: 0.35, roughness: 0.65 });
    const pedestal = createSculptedMesh(new THREE.CylinderGeometry(1.75, 2.25, 0.45, 16), 0.08, pedestalMat);
    pedestal.position.y = 0.22;
    stationGroup.add(pedestal);

    // Build Unique Sculpted 3D Monster
    const dummyPivot = new THREE.Group();
    dummyPivot.position.y = 0.42;
    dummyPivot.rotation.y = st.faceAngle || 0;
    dummyPivot.scale.setScalar(st.scale || 1.2);

    const monsterResult = buildUniqueMonsterMesh(st, idx);
    const bodyGroup = monsterResult.bodyGroup;
    const armorMat = monsterResult.primaryMat;
    const animParts = monsterResult.animParts;

    dummyPivot.add(bodyGroup);
    stationGroup.add(dummyPivot);

    // Floating Green Unlock Crystal (Muncul saat monster kalah)
    const unlockCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.62, 0),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669, roughness: 0.15, metalness: 0.8 })
    );
    unlockCrystal.position.set(0, 3.8, 0);
    unlockCrystal.visible = false;
    stationGroup.add(unlockCrystal);

    // Wooden Signboard at side of Pos
    const signOffsetX = (idx % 2 === 0) ? -4.8 : 4.8;
    const signBoard = buildStationSignboard(st.name, `SLIDE ${st.posNum} • ${st.enemyTitle.toUpperCase()}`);
    signBoard.position.set(signOffsetX, 0, 1.4);
    signBoard.rotation.y = (idx % 2 === 0) ? 0.35 : -0.35;
    stationGroup.add(signBoard);

    scene.add(stationGroup);

    // Floating 3D HTML Label (Ringkas, tidak memanjang, dan badge [O] berwarna terang kontras!)
    const labelEl = document.createElement('div');
    labelEl.className = 'world-label enemy-label-3d';
    labelEl.id = `enemyLabel_${idx}`;
    labelEl.style.cssText = 'position:absolute; transform:translate(-50%, -100%); width:max-content; max-width:240px; display:flex; flex-direction:column; align-items:center; gap:4px; pointer-events:auto;';
    labelEl.innerHTML = `
      <div class="enemy-pos-tag" style="width:max-content; padding:2px 12px; font-size:20px;">
        <span class="icon-boxing">${st.icon}</span>
        <span>${st.name}</span>
      </div>
      <div class="enemy-hp-track" id="hpTrack_${idx}">
        <div class="enemy-hp-fill" id="hpFill_${idx}"></div>
      </div>
      <div class="enemy-attack-hint" id="atkHint_${idx}" style="width:max-content; padding:2px 10px; font-size:10.5px; color:#fde047; background:rgba(24,18,36,0.92); border:1px solid rgba(253,224,71,0.55);">
        🔥 [J] Api &bull; ⚡ [K] Listrik
      </div>
      <div class="corpse-reopen-badge corpse-unlock-badge" id="corpseBadge_${idx}" style="display:none; width:max-content; background:linear-gradient(135deg, #059669 0%, #0d9488 100%); border:2px solid #fde047; color:#ffffff; text-shadow:0 1px 3px rgba(0,0,0,0.7); padding:5px 13px; border-radius:10px; font-weight:800; box-shadow:0 8px 22px rgba(16,185,129,0.75);" onclick="reopenSlideFromCorpse(${idx})">
        <span style="color:#ffffff;">🔓 ${st.icon} Kalah &bull; Klik / Tekan</span>
        <span class="key-o" style="background:#fde047; color:#064e3b; padding:1px 6px; border-radius:5px; font-weight:900;">O</span>
        <span style="color:#fef08a;">Buka Slide ${st.posNum}</span>
      </div>
    `;
    labelsContainer.appendChild(labelEl);

    enemyObjects.push({
      id: idx,
      station: st,
      group: stationGroup,
      dummyPivot,
      bodyGroup,
      armorMat,
      animParts,
      sealRing,
      unlockCrystal,
      labelEl,
      hp: 100,
      maxHp: 100,
      defeated: false,
      wobbleAngle: 0,
      wobbleVel: 0,
      collapseProgress: 0
    });
  });
}

// ============================================================================
// 7. ORGANIC MULTI-JOINTED 3D MONSTER FACTORY (8 UNIQUE CREATURES)
// ============================================================================
function buildUniqueMonsterMesh(st) {
  const bodyGroup = new THREE.Group();
  const primaryMat = new THREE.MeshStandardMaterial({
    color: st.color,
    metalness: 0.35,
    roughness: 0.38
  });
  const secondaryMat = new THREE.MeshStandardMaterial({
    color: 0x1a1528,
    metalness: 0.45,
    roughness: 0.42
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xfde68a,
    roughness: 0.55
  });
  const accentMat = new THREE.MeshBasicMaterial({ color: st.accent });
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.35, metalness: 0.15 });
  const animParts = { monsterType: st.monsterType };

  // -------------------------------------------------------------------------
  // POS 1: 🐍 ULAR KOBRA ABYSSAL (Tubuh & Leher S-Curve Utuh Mulus Tanpa Potongan
  //        Bertumpuk, Tudung Kobra Lebar Menyatu, Kepala Ular Segitiga Pipih,
  //        Mata Slit-Pupil, Taring Bisa Panjang & Lidah Merah Bercabang)
  // -------------------------------------------------------------------------
  if (st.monsterType === 'serpent') {
    const snakeGreenDark = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.32, metalness: 0.15 });
    const snakeGreenMid = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.30, metalness: 0.12 });
    const snakeBellyMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.42, metalness: 0.08 });
    const snakeMouthMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });
    const snakeEyeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const snakePupilMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
    const snakeTongueMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // 1. Gulungan Tubuh Bawah Ular yang Mulus & Menyatu (Seamless Coiled Serpent Base)
    const baseCoilPts = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const angle = t * Math.PI * 3.4;
      const radius = 1.32 * (1 - t * 0.58);
      baseCoilPts.push(new THREE.Vector3(Math.cos(angle) * radius, t * 0.82 + 0.14, Math.sin(angle) * radius));
    }
    const baseCoilMesh = createOrganicTube(baseCoilPts, (u) => 0.33 * (1 - u * 0.18), 52, 16, snakeGreenDark);
    bodyGroup.add(baseCoilMesh);

    // 2. Leher S-Curve Utuh & Tudung Kobra Menyatu Mulus (SATU kurva utuh, TIDAK bertumpuk-tumpuk!)
    const upperNeckGroup = new THREE.Group();
    upperNeckGroup.position.set(0, 0.82, 0);

    const neckCurvePts = [
      new THREE.Vector3(0, 0.0, 0.0),
      new THREE.Vector3(0, 0.42, -0.18),
      new THREE.Vector3(0, 0.92, -0.08),
      new THREE.Vector3(0, 1.42, 0.14),
      new THREE.Vector3(0, 1.72, 0.26)
    ];
    // Batang leher utama yang mulus dari pangkal ke kepala
    const smoothNeckMesh = createOrganicTube(
      neckCurvePts,
      (u) => 0.27 * (1 - u * 0.22),
      28,
      16,
      snakeGreenMid
    );
    upperNeckGroup.add(smoothNeckMesh);

    // Jalur Sisik Perut Kuning-Krem Utuh (Continuous Ventral Belly Strip di bagian depan leher)
    const bellyCurvePts = [
      new THREE.Vector3(0, 0.05, 0.14),
      new THREE.Vector3(0, 0.42, -0.02),
      new THREE.Vector3(0, 0.92, 0.09),
      new THREE.Vector3(0, 1.40, 0.29),
      new THREE.Vector3(0, 1.66, 0.36)
    ];
    const smoothBellyMesh = createOrganicTube(
      bellyCurvePts,
      (u) => 0.18 * (1 - u * 0.22),
      24,
      12,
      snakeBellyMat,
      1.15,
      0.42
    );
    upperNeckGroup.add(smoothBellyMesh);

    // Tudung Kobra Utuh Melebar Mulus di Kiri-Kanan Leher Atas (Seamless Flared King Cobra Hood)
    const hoodSpinePts = [
      new THREE.Vector3(0, 0.72, -0.12),
      new THREE.Vector3(0, 1.15, 0.02),
      new THREE.Vector3(0, 1.48, 0.14),
      new THREE.Vector3(0, 1.70, 0.22)
    ];
    const cobraHoodMesh = createOrganicTube(
      hoodSpinePts,
      (u) => 0.34 * Math.sin(u * Math.PI),
      22,
      16,
      snakeGreenDark,
      2.65, // Melebar pipih ke samping kiri & kanan membentuk tudung kobra utuh yang mulus!
      0.32
    );
    upperNeckGroup.add(cobraHoodMesh);

    // Corak Sepasang Mata Tudung Kobra Emas-Merah di Kiri & Kanan Tudung
    [-1, 1].forEach(side => {
      const hoodPattern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), snakeBellyMat);
      hoodPattern.scale.set(1.15, 1.65, 0.25);
      hoodPattern.position.set(side * 0.48, 1.32, 0.14);
      hoodPattern.rotation.z = -side * 0.18;
      upperNeckGroup.add(hoodPattern);

      const hoodCenterDot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), snakeTongueMat);
      hoodCenterDot.scale.set(1.0, 1.4, 0.28);
      hoodCenterDot.position.set(side * 0.48, 1.32, 0.16);
      hoodCenterDot.rotation.z = -side * 0.18;
      upperNeckGroup.add(hoodCenterDot);
    });

    // Barisan Sisik Berlian Punggung Ular (Dorsal Diamond Scales)
    for (let s = 0; s < 9; s++) {
      const su = (s + 0.5) / 9;
      const scaleMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), snakeBellyMat);
      scaleMesh.scale.set(0.8, 1.2, 0.35);
      scaleMesh.position.set(0, 0.18 + su * 1.35, -0.22 + Math.sin(su * Math.PI) * -0.12 + su * 0.30);
      upperNeckGroup.add(scaleMesh);
    }

    // 3. KEPALA ULAR KOBRA SEGITIGA PIPIH YANG TEGAS & PROPORSIONAL (Sleek Diamond Viper Head)
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.74, 0.28);
    headPivot.rotation.x = 0.12; // Menatap tajam ke arah pemain

    // Tengkorak Atas Kepala Ular (Lebar di rahang belakang / kantung bisa, meruncing mulus ke moncong depan)
    const viperSkullPts = [
      new THREE.Vector3(0, 0.04, -0.24),
      new THREE.Vector3(0, 0.07, 0.02),
      new THREE.Vector3(0, 0.05, 0.34),
      new THREE.Vector3(0, 0.01, 0.62)
    ];
    const upperSkull = createOrganicTube(
      viperSkullPts,
      (u) => (u < 0.35 ? 0.24 + u * 0.42 : 0.39 * (1 - (u - 0.35) * 0.92)),
      16,
      14,
      snakeGreenMid,
      1.32, // Pipih lebar khas kepala ular kobra/viper asli
      0.58
    );
    headPivot.add(upperSkull);

    // Pelat Sisik Atas Kepala Ular (Cranial Crown Shield Scale)
    const crownPlate = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), snakeGreenDark);
    crownPlate.scale.set(1.18, 0.32, 1.35);
    crownPlate.position.set(0, 0.15, 0.12);
    headPivot.add(crownPlate);

    // 2 Lubang Hidung Ular di Ujung Moncong Depan
    [-0.10, 0.10].forEach(nx => {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), snakePupilMat);
      nostril.position.set(nx, 0.06, 0.56);
      headPivot.add(nostril);
    });

    // Sepasang Mata Reptil Kuning Menyala dengan Pupil Vertikal Hitam & Sisik Alis Tajam
    [-1, 1].forEach(side => {
      // Sisik alis mata ular yang menonjol garang (Supraocular Scale)
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.045, 0.24), snakeGreenDark);
      brow.position.set(side * 0.28, 0.15, 0.20);
      brow.rotation.z = -side * 0.28;
      brow.rotation.y = side * 0.25;
      headPivot.add(brow);

      // Bola mata kuning reptil
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.078, 12, 12), snakeEyeMat);
      eye.scale.set(0.85, 1.0, 1.15);
      eye.position.set(side * 0.27, 0.09, 0.22);
      headPivot.add(eye);

      // Pupil celah vertikal hitam khas ular (Vertical Slit Pupil)
      const slitPupil = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.11, 0.05), snakePupilMat);
      slitPupil.position.set(side * 0.33, 0.09, 0.24);
      slitPupil.rotation.y = side * 0.35;
      headPivot.add(slitPupil);
    });

    // Langit-langit Mulut Merah & 2 Taring Bisa Putih Melengkung Tajam (Curved Venom Fangs)
    const upperMouthRoof = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), snakeMouthMat);
    upperMouthRoof.scale.set(1.1, 0.22, 1.35);
    upperMouthRoof.position.set(0, -0.02, 0.24);
    headPivot.add(upperMouthRoof);

    [-0.14, 0.14].forEach(fx => {
      const fangPts = [
        new THREE.Vector3(fx, 0.01, 0.42),
        new THREE.Vector3(fx, -0.14, 0.46),
        new THREE.Vector3(fx, -0.28, 0.38)
      ];
      const fang = createOrganicTube(fangPts, (u) => 0.046 * (1 - u * 0.88), 10, 8, boneMat);
      headPivot.add(fang);
    });

    // Rahang Bawah Ular Berengsel (Hinged Lower Jaw) + Rongga Mulut Merah + Lidah Merah Bercabang Dua
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.04, -0.02);
    jawPivot.rotation.x = 0.32;

    const jawPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.05, 0.26),
      new THREE.Vector3(0, -0.02, 0.54)
    ];
    const lowerJaw = createOrganicTube(jawPts, (u) => 0.26 * (1 - u * 0.48), 12, 12, snakeBellyMat, 1.18, 0.45);
    jawPivot.add(lowerJaw);

    const innerJawFloor = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), snakeMouthMat);
    innerJawFloor.scale.set(1.05, 0.22, 1.35);
    innerJawFloor.position.set(0, 0.01, 0.26);
    jawPivot.add(innerJawFloor);

    // Lidah Ular Merah Bercabang Dua (Forked Snake Tongue)
    const tongueGroup = new THREE.Group();
    tongueGroup.position.set(0, 0.02, 0.42);
    const tongueStemPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.01, 0.22)];
    tongueGroup.add(createOrganicTube(tongueStemPts, () => 0.024, 6, 6, snakeTongueMat));
    [-0.08, 0.08].forEach(tx => {
      const forkPts = [
        new THREE.Vector3(0, -0.01, 0.20),
        new THREE.Vector3(tx * 0.7, -0.03, 0.34),
        new THREE.Vector3(tx * 1.4, -0.06, 0.48)
      ];
      tongueGroup.add(createOrganicTube(forkPts, (u) => 0.022 * (1 - u * 0.78), 8, 6, snakeTongueMat));
    });
    jawPivot.add(tongueGroup);
    animParts.tongue = tongueGroup;

    headPivot.add(jawPivot);
    animParts.jawPivot = jawPivot;
    animParts.headPivot = headPivot;
    upperNeckGroup.add(headPivot);

    bodyGroup.add(upperNeckGroup);
    animParts.serpentSpine = [upperNeckGroup];
  }

  // -------------------------------------------------------------------------
  // POS 2: 🦅 ELANG RAJA LANGIT (Warna Coklat Elang Asli, Kepala & Ekor Putih,
  //        Paruh Bengkok Kuning Emas & Sayap Berlapis Bulu Lebar Membulat)
  // -------------------------------------------------------------------------
  else if (st.monsterType === 'eagle') {
    const hoverGroup = new THREE.Group();
    hoverGroup.position.y = 2.05;

    // Palet Warna Elang Asli (Bald / Golden Eagle)
    const eagleBrownDark = new THREE.MeshStandardMaterial({ color: 0x3e2211, roughness: 0.55, metalness: 0.08 });
    const eagleBrownMid = new THREE.MeshStandardMaterial({ color: 0x5c3419, roughness: 0.52, metalness: 0.08 });
    const eagleBrownWarm = new THREE.MeshStandardMaterial({ color: 0x7c4a27, roughness: 0.5, metalness: 0.1 });
    const eagleWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.42, metalness: 0.05 });
    const eagleBeakMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.25, emissive: 0xd97706, emissiveIntensity: 0.15 });
    const eagleEyeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const talonDarkMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.3, metalness: 0.6 });

    // Helper Pembuat Helai Bulu Burung Asli (Pipih Lebar dengan Ujung Membulat Halus & Batang Bulu Tengah, BUKAN kerucut lancip!)
    function createFeatherBlade(length, width, featherMat, shaftMat = eagleBrownWarm) {
      const fGroup = new THREE.Group();
      // Bilah bulu pipih lebar membulat (ellipsoid paddle)
      const vaneGeo = new THREE.SphereGeometry(0.5, 12, 10);
      const vane = new THREE.Mesh(vaneGeo, featherMat);
      vane.scale.set(width, 0.048, length);
      vane.position.set(0, 0, -length * 0.48);
      vane.castShadow = true;
      fGroup.add(vane);

      // Batang tengah bulu (Rachis / Quill)
      const shaftGeo = new THREE.CylinderGeometry(width * 0.05, width * 0.09, length * 0.92, 6);
      shaftGeo.rotateX(Math.PI / 2);
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(0, 0.018, -length * 0.45);
      fGroup.add(shaft);
      return fGroup;
    }

    // 1. Badan Elang Kekar Berbulu Coklat Tua (Dada Membusung & Punggung Aerodinamis)
    const bodyPts = [
      new THREE.Vector3(0, -0.52, -0.72),
      new THREE.Vector3(0, -0.12, -0.18),
      new THREE.Vector3(0, 0.28, 0.36),
      new THREE.Vector3(0, 0.56, 0.52)
    ];
    const torso = createOrganicTube(bodyPts, (u) => 0.52 * Math.sin(u * Math.PI * 0.85 + 0.22), 18, 16, eagleBrownMid, 1.18, 1.05);
    hoverGroup.add(torso);

    // Dada Berotot dengan Susunan Bulu Dada Coklat Berlapis
    const breast = createSculptedMesh(new THREE.SphereGeometry(0.48, 16, 14), 0.06, eagleBrownWarm, 1.02, 1.15, 0.92);
    breast.position.set(0, 0.18, 0.42);
    hoverGroup.add(breast);

    for (let row = 0; row < 3; row++) {
      for (let col = -2; col <= 2; col++) {
        const chestFeather = createFeatherBlade(0.34, 0.22, row % 2 === 0 ? eagleBrownMid : eagleBrownWarm);
        chestFeather.position.set(col * 0.13, 0.36 - row * 0.18, 0.68 - Math.abs(col) * 0.04 - row * 0.05);
        chestFeather.rotation.x = 0.65 + row * 0.12;
        chestFeather.rotation.y = col * 0.18;
        hoverGroup.add(chestFeather);
      }
    }

    // 2. Kerah Bulu Leher Putih & Kepala Elang Putih (Bald Eagle) dengan Alis Tajam & Paruh Bengkok Emas
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.66, 0.54);

    // Rangkaian Bulu Leher Putih (Neck Ruff Collar)
    for (let r = 0; r < 10; r++) {
      const ang = (r / 10) * Math.PI * 2;
      const ruff = createFeatherBlade(0.32, 0.20, eagleWhiteMat, eagleWhiteMat);
      ruff.position.set(Math.sin(ang) * 0.28, -0.12, Math.cos(ang) * 0.28);
      ruff.rotation.y = ang + Math.PI;
      ruff.rotation.x = 0.42;
      headPivot.add(ruff);
    }

    // Kubah Kepala Elang Putih Berbulu Halus
    const headSculpt = createSculptedMesh(new THREE.SphereGeometry(0.36, 16, 16), 0.04, eagleWhiteMat, 0.96, 0.95, 1.22);
    headPivot.add(headSculpt);

    // Jambul Bulu Kepala Putih di Belakang Kepala Elang
    for (let c = -2; c <= 2; c++) {
      const crestF = createFeatherBlade(0.36, 0.18, eagleWhiteMat, eagleWhiteMat);
      crestF.position.set(c * 0.08, 0.18 - Math.abs(c) * 0.03, -0.12);
      crestF.rotation.x = -0.25;
      crestF.rotation.y = c * 0.12;
      headPivot.add(crestF);
    }

    // Pangkal Paruh Kuning (Cere) & Paruh Atas Elang Melengkung Tajam ke Bawah (Hooked Raptor Beak)
    const cere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), eagleBeakMat);
    cere.scale.set(0.95, 0.85, 0.9);
    cere.position.set(0, 0.04, 0.34);
    headPivot.add(cere);

    const upperBeakPts = [
      new THREE.Vector3(0, 0.06, 0.32),
      new THREE.Vector3(0, 0.05, 0.58),
      new THREE.Vector3(0, -0.04, 0.76),
      new THREE.Vector3(0, -0.22, 0.82)
    ];
    const upperBeak = createOrganicTube(upperBeakPts, (u) => 0.155 * (1 - u * 0.86), 14, 12, eagleBeakMat, 0.82, 1.15);
    headPivot.add(upperBeak);

    // Rahang Bawah Paruh Elang
    const lowerBeakPts = [
      new THREE.Vector3(0, -0.05, 0.30),
      new THREE.Vector3(0, -0.09, 0.56),
      new THREE.Vector3(0, -0.11, 0.68)
    ];
    const lowerBeak = createOrganicTube(lowerBeakPts, (u) => 0.10 * (1 - u * 0.75), 10, 10, eagleBeakMat, 0.78, 0.8);
    headPivot.add(lowerBeak);

    // Alis Mata Elang yang Garang (Supraorbital Brow Ridge) & Bola Mata Kuning Emas
    [-1, 1].forEach(side => {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.24), eagleWhiteMat);
      brow.position.set(side * 0.21, 0.14, 0.22);
      brow.rotation.z = -side * 0.28;
      brow.rotation.y = side * 0.22;
      headPivot.add(brow);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 12), eagleEyeMat);
      eye.position.set(side * 0.21, 0.07, 0.24);
      headPivot.add(eye);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), talonDarkMat);
      pupil.position.set(side * 0.24, 0.07, 0.27);
      headPivot.add(pupil);
    });

    hoverGroup.add(headPivot);
    animParts.headPivot = headPivot;

    // 3. SAYAP ELANG BERBULU 3 LAPIS (Coverts, Secondaries & Primaries — Bulu Lebar Membulat Berlapis-lapis!)
    function buildFeatheredEagleWing(sideSign) {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(sideSign * 0.42, 0.34, 0.14);

      // Otot Bahu & Lengan Dalam Sayap (Humerus/Radius tertutup bulu coklat)
      const innerBonePts = [
        new THREE.Vector3(0, 0, 0.08),
        new THREE.Vector3(sideSign * 0.68, 0.16, 0.14),
        new THREE.Vector3(sideSign * 1.38, 0.20, 0.08)
      ];
      shoulderPivot.add(createOrganicTube(innerBonePts, (u) => 0.18 * (1 - u * 0.28), 12, 10, eagleBrownWarm, 1.3, 0.75));

      // LAPIS 1 (Atas Depan): 8 Bulu Penutup Sayap Dalam (Upper Wing Coverts - pendek & lebar rapat)
      for (let c = 0; c < 8; c++) {
        const u = (c + 0.4) / 8;
        const feather = createFeatherBlade(0.58 + u * 0.12, 0.28, eagleBrownWarm, eagleBrownDark);
        feather.position.set(sideSign * (0.14 + u * 1.18), 0.08 + u * 0.14, 0.12);
        feather.rotation.y = -sideSign * (0.04 + u * 0.08);
        feather.rotation.x = -0.08;
        shoulderPivot.add(feather);
      }

      // LAPIS 2 (Tengah): 9 Bulu Sekunder Tengah (Middle Secondary Plumage - coklat medium lebar)
      for (let m = 0; m < 9; m++) {
        const u = (m + 0.3) / 9;
        const feather = createFeatherBlade(0.95 + Math.sin(u * Math.PI) * 0.18, 0.30, eagleBrownMid, eagleBrownWarm);
        feather.position.set(sideSign * (0.12 + u * 1.22), 0.04 + u * 0.14, 0.04);
        feather.rotation.y = -sideSign * (0.06 + u * 0.10);
        feather.rotation.x = -0.05;
        shoulderPivot.add(feather);
      }

      // LAPIS 3 (Belakang Bawah): 9 Bulu Terbang Sekunder Panjang (Long Flight Secondaries - coklat tua membulat)
      for (let f = 0; f < 9; f++) {
        const u = (f + 0.3) / 9;
        const feather = createFeatherBlade(1.32 + Math.sin(u * Math.PI) * 0.22, 0.32, eagleBrownDark, eagleBrownWarm);
        feather.position.set(sideSign * (0.12 + u * 1.24), 0.0 + u * 0.13, -0.04);
        feather.rotation.y = -sideSign * (0.05 + u * 0.12);
        feather.rotation.x = -0.03;
        shoulderPivot.add(feather);
      }

      // SENDI PERGELANGAN SAYAP LUAR (Wrist Joint -> Membentangkan Bulu Terbang Primer seperti Kipas!)
      const wristPivot = new THREE.Group();
      wristPivot.position.set(sideSign * 1.38, 0.20, 0.08);

      const outerBonePts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(sideSign * 0.78, 0.06, -0.08),
        new THREE.Vector3(sideSign * 1.52, -0.02, -0.26)
      ];
      wristPivot.add(createOrganicTube(outerBonePts, (u) => 0.14 * (1 - u * 0.55), 10, 8, eagleBrownWarm, 1.25, 0.7));

      // Bulu Penutup Sayap Luar (Outer Coverts - 7 helai bulu coklat hangat)
      for (let oc = 0; oc < 7; oc++) {
        const u = oc / 6;
        const feather = createFeatherBlade(0.62 - u * 0.12, 0.26, eagleBrownWarm, eagleBrownDark);
        feather.position.set(sideSign * (0.08 + u * 1.15), 0.04, -u * 0.18);
        feather.rotation.y = -sideSign * (0.18 + u * 0.65);
        wristPivot.add(feather);
      }

      // Bulu Terbang Primer Tengah (Outer Middle Row - 8 helai bulu coklat medium)
      for (let om = 0; om < 8; om++) {
        const u = om / 7;
        const feather = createFeatherBlade(1.02 - u * 0.14, 0.28, eagleBrownMid, eagleBrownWarm);
        feather.position.set(sideSign * (0.08 + u * 1.28), 0.01, -u * 0.20);
        feather.rotation.y = -sideSign * (0.16 + u * 0.78);
        wristPivot.add(feather);
      }

      // 9 Bulu Terbang Primer Utama di Ujung Sayap Elang (Fanned Primary Flight Feathers - lebar membulat!)
      for (let p = 0; p < 9; p++) {
        const u = p / 8;
        const len = 1.48 - Math.pow(u, 1.6) * 0.35;
        const feather = createFeatherBlade(len, 0.30, eagleBrownDark, eagleBrownWarm);
        feather.position.set(sideSign * (0.06 + u * 1.38), -0.02, -u * 0.22);
        // Membuka seperti kipas bulu elang yang sedang terbang megah
        feather.rotation.y = -sideSign * (0.14 + u * 0.96);
        feather.rotation.z = -sideSign * (u * 0.08);
        wristPivot.add(feather);
      }

      shoulderPivot.add(wristPivot);
      return { shoulderPivot, wristPivot };
    }

    const wingLeft = buildFeatheredEagleWing(-1);
    const wingRight = buildFeatheredEagleWing(1);
    hoverGroup.add(wingLeft.shoulderPivot);
    hoverGroup.add(wingRight.shoulderPivot);
    animParts.wingL = wingLeft.shoulderPivot;
    animParts.wingR = wingRight.shoulderPivot;
    animParts.wristL = wingLeft.wristPivot;
    animParts.wristR = wingRight.wristPivot;

    // 4. Ekor Kipas Elang Putih Bersih (9 Helai Bulu Ekor Putih Lebar Membulat + Bulu Pangkal Coklat)
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, -0.46, -0.62);
    for (let t = -4; t <= 4; t++) {
      const a = t * 0.14;
      const tailFeather = createFeatherBlade(1.12 - Math.abs(t) * 0.04, 0.30, eagleWhiteMat, eagleWhiteMat);
      tailFeather.position.set(Math.sin(a) * 0.12, -Math.abs(t) * 0.01, 0);
      tailFeather.rotation.y = -a;
      tailFeather.rotation.x = -0.22;
      tailPivot.add(tailFeather);
    }
    // Bulu penutup pangkal ekor coklat (Upper Tail Coverts)
    for (let tc = -2; tc <= 2; tc++) {
      const covFeather = createFeatherBlade(0.48, 0.24, eagleBrownMid, eagleBrownWarm);
      covFeather.position.set(tc * 0.10, 0.05, 0.05);
      covFeather.rotation.y = -tc * 0.12;
      covFeather.rotation.x = -0.18;
      tailPivot.add(covFeather);
    }
    hoverGroup.add(tailPivot);
    animParts.tailGroup = tailPivot;

    // 5. Kaki Elang Berbulu Coklat & Cakar Mencengkeram Kuning Emas + Kuku Hitam Tajam
    [-0.26, 0.26].forEach(lx => {
      // Paha berbulu coklat tebal
      const thigh = createSculptedMesh(new THREE.SphereGeometry(0.18, 12, 12), 0.05, eagleBrownMid, 0.9, 1.35, 0.95);
      thigh.position.set(lx, -0.38, 0.16);
      hoverGroup.add(thigh);

      // Betis & Jari Kaki Kuning Emas Bersisik
      const tarsusPts = [
        new THREE.Vector3(lx, -0.48, 0.18),
        new THREE.Vector3(lx, -0.78, 0.28)
      ];
      hoverGroup.add(createOrganicTube(tarsusPts, (u) => 0.085 * (1 - u * 0.2), 8, 8, eagleBeakMat));

      // 3 Jari Depan + 1 Jari Belakang (Hallux) dengan Kuku Hitam Melengkung
      [-0.08, 0, 0.08].forEach(cx => {
        const toePts = [
          new THREE.Vector3(lx + cx * 0.5, -0.78, 0.28),
          new THREE.Vector3(lx + cx * 1.4, -0.88, 0.46),
          new THREE.Vector3(lx + cx * 1.5, -1.02, 0.36)
        ];
        hoverGroup.add(createOrganicTube(toePts, (u) => 0.042 * (1 - u * 0.78), 8, 6, eagleBeakMat));
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.16, 8), talonDarkMat);
        claw.position.set(lx + cx * 1.45, -0.98, 0.42);
        claw.rotation.x = 0.65;
        hoverGroup.add(claw);
      });
    });

    bodyGroup.add(hoverGroup);
    animParts.hoverGroup = hoverGroup;
  }

  // -------------------------------------------------------------------------
  // POS 3: 🕷️ LABA-LABA LATENSI (Sculpted Widow Abdomen, Cephalothorax,
  //        Pinching Chelicerae Fangs & 8 3-Jointed Legs with Walking Gait)
  // -------------------------------------------------------------------------
  else if (st.monsterType === 'spider') {
    const spiderRoot = new THREE.Group();
    spiderRoot.position.y = 0.88;

    // Sculpted Bulbous Opisthosoma (Abdomen)
    const abPts = [
      new THREE.Vector3(0, 0.05, -0.15),
      new THREE.Vector3(0, 0.38, -0.68),
      new THREE.Vector3(0, 0.42, -1.28),
      new THREE.Vector3(0, 0.12, -1.68)
    ];
    const abdomen = createOrganicTube(abPts, (u) => 0.72 * Math.sin(u * Math.PI * 0.92 + 0.12), 18, 16, secondaryMat, 1.12, 0.95);
    spiderRoot.add(abdomen);

    // Glowing Cyber Hourglass Dorsal Pattern
    const dorsalCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 1), accentMat);
    dorsalCrest.scale.set(0.85, 0.35, 1.45);
    dorsalCrest.position.set(0, 0.68, -0.92);
    spiderRoot.add(dorsalCrest);

    // Sculpted Cephalothorax
    const cephPts = [
      new THREE.Vector3(0, 0.02, -0.18),
      new THREE.Vector3(0, 0.12, 0.22),
      new THREE.Vector3(0, 0.04, 0.58)
    ];
    const ceph = createOrganicTube(cephPts, (u) => 0.44 * Math.sin(u * Math.PI * 0.85 + 0.2), 12, 14, primaryMat, 1.25, 0.75);
    spiderRoot.add(ceph);

    // Cluster of 8 Glowing Arachnid Eyes
    [-0.18, -0.07, 0.07, 0.18].forEach((ex, i) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(i === 1 || i === 2 ? 0.065 : 0.048, 8, 8), accentMat);
      eye.position.set(ex, 0.18 + (i % 2) * 0.05, 0.52);
      spiderRoot.add(eye);
    });

    // Articulated Pinching Chelicerae Fangs
    animParts.mandibles = [];
    [-1, 1].forEach(side => {
      const fangPivot = new THREE.Group();
      fangPivot.position.set(side * 0.16, 0.02, 0.54);
      const fPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.08, -0.12, 0.22),
        new THREE.Vector3(-side * 0.04, -0.26, 0.32)
      ];
      fangPivot.add(createOrganicTube(fPts, (u) => 0.085 * (1 - u * 0.82), 10, 8, accentMat));
      spiderRoot.add(fangPivot);
      animParts.mandibles.push({ pivot: fangPivot, side });
    });

    // 8 3-Jointed Arachnid Legs (Coxa -> Femur -> Patella/Tibia -> Tarsus)
    animParts.spiderLegs = [];
    const legZOffsets = [0.34, 0.12, -0.12, -0.36];
    const legYawAngles = [0.52, 0.18, -0.22, -0.58];

    [-1, 1].forEach(side => {
      legZOffsets.forEach((zo, idx) => {
        const coxaPivot = new THREE.Group();
        coxaPivot.position.set(side * 0.38, 0.05, zo);
        coxaPivot.rotation.y = side * legYawAngles[idx];

        // Femur arching high upward and outward
        const femurPts = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(side * 0.48, 0.55, 0),
          new THREE.Vector3(side * 0.92, 0.72, 0)
        ];
        coxaPivot.add(createOrganicTube(femurPts, (u) => 0.11 * (1 - u * 0.25), 10, 8, primaryMat));

        // Knee (Patella) Joint Pivot
        const kneePivot = new THREE.Group();
        kneePivot.position.set(side * 0.92, 0.72, 0);

        const kneeNode = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 8), accentMat);
        kneePivot.add(kneeNode);

        // Long Tapered Tibia + Tarsus reaching down to the ground
        const tibiaPts = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(side * 0.45, -0.65, 0),
          new THREE.Vector3(side * 0.72, -1.55, 0)
        ];
        kneePivot.add(createOrganicTube(tibiaPts, (u) => 0.09 * (1 - u * 0.82), 12, 8, secondaryMat));

        coxaPivot.add(kneePivot);
        spiderRoot.add(coxaPivot);

        // Alternating tetrapod phase
        const phase = (idx % 2 === 0 ? 0 : Math.PI) + (side > 0 ? 0 : Math.PI);
        animParts.spiderLegs.push({ coxaPivot, kneePivot, side, phase });
      });
    });

    bodyGroup.add(spiderRoot);
    animParts.spiderRoot = spiderRoot;
  }

  // -------------------------------------------------------------------------
  // POS 4: 🐺 SERIGALA ABU-ABU FENRIR (Warna Abu-Abu Serigala Asli: Punggung
  //        Abu-Abu Tua, Badan Abu-Abu Medium, Dada/Perut/Pipi Abu-Abu Perak,
  //        Moncong Panjang dengan Hidung Hitam, Telinga Segitiga Tegak & 4 Kaki Serigala)
  // -------------------------------------------------------------------------
  else if (st.monsterType === 'wolf') {
    const wolfRoot = new THREE.Group();
    wolfRoot.position.y = 0.05;

    // Palet Warna Serigala Abu-Abu Asli (Grey Timber Wolf)
    const wolfDarkGrey = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.62, metalness: 0.06 });  // Bulu punggung & atas kepala (abu-abu arang tua)
    const wolfMidGrey = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.58, metalness: 0.06 });   // Bulu utama tubuh & kaki (abu-abu serigala)
    const wolfLightGrey = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.52, metalness: 0.05 }); // Bulu dada, perut, pipi & ujung ekor (abu-abu perak terang)
    const wolfNoseBlack = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.2 });  // Hidung hitam & kuku serigala
    const wolfMouthMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.5 });                    // Rongga mulut & lidah
    const wolfEyeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });                                         // Mata kuning amber serigala

    // 1. Tubuh Quadruped Anatomi Serigala (Dada Bidang -> Pinggang Ramping -> Pinggul Berotot)
    const spinePts = [
      new THREE.Vector3(0, 1.16, -0.88),
      new THREE.Vector3(0, 1.14, -0.28),
      new THREE.Vector3(0, 1.24, 0.36),
      new THREE.Vector3(0, 1.38, 0.72)
    ];
    const torsoMesh = createOrganicTube(
      spinePts,
      (u) => 0.36 + 0.12 * Math.sin(u * Math.PI * 1.05),
      20,
      16,
      wolfMidGrey,
      0.94,
      1.12
    );
    wolfRoot.add(torsoMesh);

    // Mantel Bulu Punggung Abu-Abu Tua (Dark Grey Dorsal Saddle Coat)
    const saddlePts = [
      new THREE.Vector3(0, 1.28, -0.82),
      new THREE.Vector3(0, 1.28, -0.22),
      new THREE.Vector3(0, 1.38, 0.38),
      new THREE.Vector3(0, 1.50, 0.72)
    ];
    const saddleCoat = createOrganicTube(saddlePts, (u) => 0.31 * Math.sin(u * Math.PI * 0.85 + 0.22), 16, 12, wolfDarkGrey, 0.96, 0.62);
    wolfRoot.add(saddleCoat);

    // Dada & Perut Bawah Berbulu Abu-Abu Perak Terang (Silver-White Chest & Underbelly Ruff)
    const chestRuff = createSculptedMesh(new THREE.SphereGeometry(0.44, 16, 14), 0.06, wolfLightGrey, 0.88, 1.15, 1.08);
    chestRuff.position.set(0, 1.12, 0.62);
    wolfRoot.add(chestRuff);

    const bellyUnder = createSculptedMesh(new THREE.SphereGeometry(0.35, 14, 12), 0.04, wolfLightGrey, 0.78, 0.75, 1.65);
    bellyUnder.position.set(0, 0.98, -0.10);
    wolfRoot.add(bellyUnder);

    // Surai Leher Serigala Berlapis Halus (Layered Lupine Neck Ruff — mengarah ke belakang dengan alami)
    for (let r = -3; r <= 3; r++) {
      const tuft = createSculptedMesh(new THREE.ConeGeometry(0.14, 0.42, 8), 0.03, Math.abs(r) <= 1 ? wolfDarkGrey : wolfLightGrey);
      tuft.position.set(r * 0.11, 1.54 - Math.abs(r) * 0.06, 0.56 - Math.abs(r) * 0.04);
      tuft.rotation.x = -Math.PI * 0.62;
      tuft.rotation.z = -r * 0.18;
      wolfRoot.add(tuft);
    }

    // 2. KEPALA SERIGALA ABU-ABU ASLI (Tengkorak, Bulu Pipi Perak, Moncong Panjang, Hidung Hitam & Telinga Segitiga Tegak)
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.58, 0.82);

    // Kubah Tengkorak Serigala (Cranium)
    const cranium = createSculptedMesh(new THREE.SphereGeometry(0.36, 16, 16), 0.04, wolfMidGrey, 1.04, 0.96, 1.12);
    cranium.position.set(0, 0.06, 0.05);
    headPivot.add(cranium);

    // Dahi Atas Abu-Abu Tua (Dark Forehead Cap)
    const foreheadCap = createSculptedMesh(new THREE.SphereGeometry(0.32, 14, 12), 0.03, wolfDarkGrey, 0.98, 0.65, 1.10);
    foreheadCap.position.set(0, 0.18, 0.08);
    headPivot.add(foreheadCap);

    // Bulu Pipi Samping Serigala Abu-Abu Perak (Lupine Cheek Ruff Tufts)
    [-1, 1].forEach(side => {
      const cheek = createSculptedMesh(new THREE.ConeGeometry(0.18, 0.38, 10), 0.04, wolfLightGrey, 0.65, 1.0, 1.1);
      cheek.position.set(side * 0.32, -0.02, 0.04);
      cheek.rotation.z = side * 1.15;
      cheek.rotation.y = -side * 0.35;
      headPivot.add(cheek);
    });

    // MONCONG SERIGALA PANJANG MERUNCING KE DEPAN (Long Canine Snout / Muzzle)
    const upperMuzzlePts = [
      new THREE.Vector3(0, 0.04, 0.18),
      new THREE.Vector3(0, 0.02, 0.48),
      new THREE.Vector3(0, 0.00, 0.76)
    ];
    const upperMuzzle = createOrganicTube(upperMuzzlePts, (u) => 0.22 * (1 - u * 0.36), 12, 12, wolfMidGrey, 0.92, 0.78);
    headPivot.add(upperMuzzle);

    // Batang Hidung Atas Abu-Abu Tua & Bibir Samping Abu-Abu Terang
    const nasalBridge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.52), wolfDarkGrey);
    nasalBridge.position.set(0, 0.11, 0.46);
    nasalBridge.rotation.x = 0.06;
    headPivot.add(nasalBridge);

    const muzzleCheeks = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), wolfLightGrey);
    muzzleCheeks.scale.set(1.05, 0.55, 1.45);
    muzzleCheeks.position.set(0, -0.03, 0.46);
    headPivot.add(muzzleCheeks);

    // HIDUNG HITAM SERIGALA DI UJUNG MONCONG (Black Canine Nose)
    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 12), wolfNoseBlack);
    noseTip.scale.set(1.15, 0.85, 0.95);
    noseTip.position.set(0, 0.05, 0.78);
    headPivot.add(noseTip);

    // 2 TELINGA SERIGALA TEGAK SEGITIGA (Erect Pointed Triangular Wolf Ears + Telinga Dalam Perak)
    [-1, 1].forEach(side => {
      const earGroup = new THREE.Group();
      earGroup.position.set(side * 0.22, 0.30, -0.04);
      earGroup.rotation.z = -side * 0.18;
      earGroup.rotation.x = 0.12;

      const outerEar = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.38, 10), wolfDarkGrey);
      outerEar.scale.set(0.85, 1.0, 0.55);
      outerEar.position.y = 0.16;
      earGroup.add(outerEar);

      const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.28, 8), wolfLightGrey);
      innerEar.scale.set(0.8, 1.0, 0.35);
      innerEar.position.set(0, 0.14, 0.035);
      earGroup.add(innerEar);

      headPivot.add(earGroup);
    });

    // Sepasang Mata Kuning Amber Serigala + Alis Garang & Pupil Hitam
    [-1, 1].forEach(side => {
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.16), wolfDarkGrey);
      brow.position.set(side * 0.17, 0.18, 0.28);
      brow.rotation.z = -side * 0.26;
      brow.rotation.y = side * 0.22;
      headPivot.add(brow);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 12), wolfEyeMat);
      eye.position.set(side * 0.17, 0.12, 0.29);
      headPivot.add(eye);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.030, 8, 8), wolfNoseBlack);
      pupil.position.set(side * 0.18, 0.12, 0.34);
      headPivot.add(pupil);
    });

    // Taring Atas Serigala (Upper Canine Fangs)
    [-0.10, 0.10].forEach(fx => {
      const upperFang = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.13, 8), boneMat);
      upperFang.position.set(fx, -0.09, 0.62);
      upperFang.rotation.x = Math.PI;
      headPivot.add(upperFang);
    });

    // Rahang Bawah Serigala Menggeram (Hinged Snarling Lower Jaw + Lidah & Taring Bawah)
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.09, 0.16);
    const jawPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.05, 0.28),
      new THREE.Vector3(0, -0.04, 0.54)
    ];
    jawPivot.add(createOrganicTube(jawPts, (u) => 0.16 * (1 - u * 0.38), 10, 10, wolfLightGrey, 0.88, 0.52));

    const wolfTongue = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), wolfMouthMat);
    wolfTongue.scale.set(0.85, 0.28, 2.2);
    wolfTongue.position.set(0, 0.0, 0.32);
    jawPivot.add(wolfTongue);

    [-0.085, 0.085].forEach(fx => {
      const lowerFang = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.12, 8), boneMat);
      lowerFang.position.set(fx, 0.04, 0.46);
      jawPivot.add(lowerFang);
    });

    headPivot.add(jawPivot);
    animParts.jawPivot = jawPivot;
    animParts.headPivot = headPivot;
    wolfRoot.add(headPivot);

    // 3. 4 KAKI SERIGALA DIGITIGRADE BEROTOT (Bahu/Paha Abu-Abu -> Betis -> Telapak Kaki Perak & Kuku Hitam)
    animParts.wolfLegs = [];
    const legConfigs = [
      { x: -0.35, y: 1.18, z: 0.54, isFront: true, phase: 0 },
      { x:  0.35, y: 1.18, z: 0.54, isFront: true, phase: Math.PI },
      { x: -0.37, y: 1.16, z: -0.68, isFront: false, phase: Math.PI },
      { x:  0.37, y: 1.16, z: -0.68, isFront: false, phase: 0 }
    ];
    legConfigs.forEach(cfg => {
      const legPivot = new THREE.Group();
      legPivot.position.set(cfg.x, cfg.y, cfg.z);

      // Otot Bahu / Paha Atas Serigala
      const thighMuscle = createSculptedMesh(
        new THREE.SphereGeometry(cfg.isFront ? 0.21 : 0.25, 12, 12),
        0.04,
        wolfMidGrey,
        0.82,
        1.35,
        1.12
      );
      thighMuscle.position.set(0, -0.18, cfg.isFront ? -0.02 : -0.04);
      legPivot.add(thighMuscle);

      const legPts = cfg.isFront
        ? [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -0.56, -0.05),
            new THREE.Vector3(0, -1.06, 0.06),
            new THREE.Vector3(0, -1.14, 0.20)
          ]
        : [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -0.48, 0.16),
            new THREE.Vector3(0, -0.78, -0.16),
            new THREE.Vector3(0, -1.08, 0.04),
            new THREE.Vector3(0, -1.14, 0.18)
          ];

      legPivot.add(createOrganicTube(legPts, (u) => 0.16 * (1 - u * 0.42), 14, 10, wolfMidGrey));

      // Telapak Kaki Serigala (Wolf Paw + 3 Kuku Hitam)
      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), wolfLightGrey);
      paw.scale.set(0.95, 0.55, 1.25);
      paw.position.set(0, -1.12, 0.20);
      legPivot.add(paw);

      [-0.05, 0, 0.05].forEach(cx => {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.08, 6), wolfNoseBlack);
        claw.position.set(cx, -1.13, 0.34);
        claw.rotation.x = Math.PI / 2;
        legPivot.add(claw);
      });

      wolfRoot.add(legPivot);
      animParts.wolfLegs.push({ legPivot, phase: cfg.phase });
    });

    // 4. EKOR SERIGALA LEBAT BERBULU ABU-ABU & UJUNG PERAK (Bushy Lupine Tail)
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 1.20, -0.86);
    const tailPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.06, -0.46),
      new THREE.Vector3(0, -0.16, -0.96),
      new THREE.Vector3(0, -0.08, -1.36)
    ];
    tailPivot.add(createOrganicTube(tailPts, (u) => 0.25 * Math.sin(u * Math.PI * 0.85 + 0.22), 16, 12, wolfMidGrey));
    const tailTip = createSculptedMesh(new THREE.ConeGeometry(0.16, 0.42, 10), 0.04, wolfLightGrey);
    tailTip.position.set(0, -0.05, -1.42);
    tailTip.rotation.x = -Math.PI * 0.45;
    tailPivot.add(tailTip);

    wolfRoot.add(tailPivot);
    animParts.tailGroup = tailPivot;

    bodyGroup.add(wolfRoot);
  }

  // -------------------------------------------------------------------------
  // POS 5: 🦂 KALAJENGKING BESI (Overlapping Segmented Chitin Carapace,
  //        8 Scuttling Legs, 2 Articulated Pincer Arms & 8-Joint Stinger Tail)
  // -------------------------------------------------------------------------
  else if (st.monsterType === 'scorpion') {
    const scorpRoot = new THREE.Group();
    scorpRoot.position.y = 0.58;

    // Low, Wide Segmented Arachnid Carapace (No black cube!)
    const caraPts = [
      new THREE.Vector3(0, 0.06, -0.95),
      new THREE.Vector3(0, 0.24, -0.25),
      new THREE.Vector3(0, 0.22, 0.45),
      new THREE.Vector3(0, 0.08, 0.92)
    ];
    const carapace = createOrganicTube(
      caraPts,
      (u) => 0.62 * Math.sin(u * Math.PI * 0.82 + 0.22),
      18,
      14,
      secondaryMat,
      1.45,
      0.55
    );
    scorpRoot.add(carapace);

    // 6 Overlapping Bronze/Orange Chitin Dorsal Plates
    for (let p = 0; p < 6; p++) {
      const pz = -0.68 + p * 0.26;
      const plate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.58 - Math.abs(p - 2.5) * 0.06, 0.64 - Math.abs(p - 2.5) * 0.06, 0.12, 12, 1, false, 0, Math.PI),
        primaryMat
      );
      plate.rotation.z = Math.PI / 2;
      plate.rotation.y = Math.PI / 2;
      plate.scale.set(1.0, 0.55, 1.25);
      plate.position.set(0, 0.24, pz);
      scorpRoot.add(plate);
    }

    // 8 Articulated Scuttling Legs
    animParts.spiderLegs = [];
    [-1, 1].forEach(side => {
      [-0.55, -0.22, 0.12, 0.42].forEach((zo, idx) => {
        const coxaPivot = new THREE.Group();
        coxaPivot.position.set(side * 0.68, 0.02, zo);
        const legPts = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(side * 0.48, 0.26, 0),
          new THREE.Vector3(side * 0.88, -0.56, 0.06)
        ];
        coxaPivot.add(createOrganicTube(legPts, (u) => 0.095 * (1 - u * 0.68), 10, 8, primaryMat));
        scorpRoot.add(coxaPivot);
        animParts.spiderLegs.push({
          coxaPivot,
          kneePivot: null,
          side,
          phase: idx * 1.1 + (side > 0 ? 0 : Math.PI)
        });
      });
    });

    // 2 Multi-Jointed Pedipalp Pincer Arms with Opening/Closing Serrated Claws
    animParts.pincerClaws = [];
    [-1, 1].forEach(side => {
      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.55, 0.12, 0.72);

      const armPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.58, 0.12, 0.35),
        new THREE.Vector3(side * 0.42, 0.18, 0.92)
      ];
      armPivot.add(createOrganicTube(armPts, (u) => 0.15 + u * 0.06, 12, 10, primaryMat));

      // Pincer Hand Base
      const handGroup = new THREE.Group();
      handGroup.position.set(side * 0.42, 0.18, 0.95);
      const palm = createSculptedMesh(new THREE.SphereGeometry(0.24, 12, 12), 0.08, primaryMat, 0.95, 0.75, 1.25);
      handGroup.add(palm);

      // Upper & Lower Curved Pincer Blades
      const outerBladePts = [
        new THREE.Vector3(side * 0.1, 0, 0.12),
        new THREE.Vector3(side * 0.22, 0.02, 0.46),
        new THREE.Vector3(side * 0.04, 0.02, 0.75)
      ];
      handGroup.add(createOrganicTube(outerBladePts, (u) => 0.09 * (1 - u * 0.78), 10, 8, secondaryMat));

      const innerClawPivot = new THREE.Group();
      innerClawPivot.position.set(-side * 0.08, 0, 0.12);
      const innerBladePts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-side * 0.14, 0, 0.34),
        new THREE.Vector3(side * 0.02, 0, 0.62)
      ];
      innerClawPivot.add(createOrganicTube(innerBladePts, (u) => 0.075 * (1 - u * 0.8), 10, 8, accentMat));
      handGroup.add(innerClawPivot);

      armPivot.add(handGroup);
      scorpRoot.add(armPivot);
      animParts.pincerClaws.push({ armPivot, innerClawPivot, side });
    });

    // Articulated 7-Segment Curved Scorpion Tail & Venom Stinger
    animParts.scorpionTailJoints = [];
    let tailParent = scorpRoot;
    const tailOffsets = [
      [0, 0.18, -0.88],
      [0, 0.34, -0.26],
      [0, 0.38, -0.18],
      [0, 0.42, -0.02],
      [0, 0.38, 0.18],
      [0, 0.28, 0.32],
      [0, 0.12, 0.38]
    ];
    tailOffsets.forEach((off, idx) => {
      const tJoint = new THREE.Group();
      tJoint.position.set(off[0], off[1], off[2]);
      const r = 0.24 * (1 - idx * 0.065);
      const segPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, off[1] * 0.85, off[2] * 0.85)];
      tJoint.add(createOrganicTube(segPts, () => r, 6, 10, idx % 2 === 0 ? primaryMat : secondaryMat));

      if (idx === tailOffsets.length - 1) {
        // Curved Venom Telson Stinger
        const stingerPts = [
          new THREE.Vector3(0, 0.08, 0.22),
          new THREE.Vector3(0, 0.14, 0.55),
          new THREE.Vector3(0, -0.16, 0.78)
        ];
        tJoint.add(createOrganicTube(stingerPts, (u) => 0.21 * (1 - u * 0.88), 10, 10, accentMat));
      }

      tailParent.add(tJoint);
      tailParent = tJoint;
      animParts.scorpionTailJoints.push(tJoint);
    });

    bodyGroup.add(scorpRoot);
  }

  // -------------------------------------------------------------------------
  // POS 6: 👹 MINOTAUR DATASET (Sculpted Muscular V-Torso, Prominent Multi-Jointed
  //        Muscular Arms, Bracers & 5-Fingered Hands Gripping Battle Axe)
  // -------------------------------------------------------------------------
  else if (st.monsterType === 'minotaur') {
    // Material Otot & Kulit Minotaur yang Kontras dengan Zirah Dada agar Lengan & Tangan Terlihat Sangat Jelas!
    const minoSkinMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.45, metalness: 0.12 }); // Kulit otot coklat-perunggu kekar
    const minoFurMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7, metalness: 0.08 });   // Bulu banteng coklat gelap
    const minoArmorMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.35, metalness: 0.45 }); // Zirah gladiator merah darah
    const minoGoldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.25, metalness: 0.8, emissive: 0xd97706, emissiveIntensity: 0.2 });

    // 1. Digitigrade Cloven-Hoofed Beast Legs
    animParts.minotaurLegs = [];
    [-1, 1].forEach(side => {
      const legPivot = new THREE.Group();
      legPivot.position.set(side * 0.50, 1.32, 0);
      const legPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.06, -0.58, 0.18),
        new THREE.Vector3(0, -0.95, -0.14),
        new THREE.Vector3(0, -1.30, 0.08)
      ];
      legPivot.add(createOrganicTube(legPts, (u) => 0.29 * (1 - u * 0.36), 12, 12, minoFurMat));
      // Pelindung Lutut Emas
      const kneeGuard = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), minoGoldMat);
      kneeGuard.scale.set(0.9, 1.1, 0.6);
      kneeGuard.position.set(side * 0.06, -0.55, 0.32);
      legPivot.add(kneeGuard);

      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.25, 0.24, 10), boneMat);
      hoof.position.set(0, -1.24, 0.12);
      legPivot.add(hoof);
      bodyGroup.add(legPivot);
      animParts.minotaurLegs.push({ legPivot, side });
    });

    // 2. Sculpted Muscular V-Tapered Beast Torso
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 1.92;

    const minoLathe = [
      new THREE.Vector2(0.42, -0.68),
      new THREE.Vector2(0.38, -0.35),
      new THREE.Vector2(0.56, 0.05),
      new THREE.Vector2(0.76, 0.48),
      new THREE.Vector2(0.48, 0.78)
    ];
    const chestMesh = new THREE.Mesh(new THREE.LatheGeometry(minoLathe, 18), minoArmorMat);
    chestMesh.scale.set(1.16, 1.0, 0.82);
    chestMesh.castShadow = true;
    torsoGroup.add(chestMesh);

    // Sculpted Pectoral Muscle Plates & Golden Harness Straps
    [-0.32, 0.32].forEach(px => {
      const pec = createSculptedMesh(new THREE.SphereGeometry(0.34, 12, 12), 0.06, minoSkinMat, 1.15, 0.82, 0.75);
      pec.position.set(px, 0.36, 0.38);
      torsoGroup.add(pec);
    });

    // Champion Spiked War Belt
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.09, 10, 20), minoGoldMat);
    belt.rotation.x = Math.PI / 2;
    belt.scale.set(1.18, 0.82, 1.0);
    belt.position.y = -0.45;
    torsoGroup.add(belt);

    // 3. Ferocious Bull Head, Spiral 3D Horns & Gold Nose Ring
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.88, 0.24);

    const skullPts = [
      new THREE.Vector3(0, 0.08, -0.18),
      new THREE.Vector3(0, 0.02, 0.18),
      new THREE.Vector3(0, -0.12, 0.62)
    ];
    headPivot.add(createOrganicTube(skullPts, (u) => 0.42 * (1 - u * 0.38), 12, 12, minoFurMat, 1.05, 0.92));

    // Gold Bull Nose Ring
    const noseRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 10, 20), minoGoldMat);
    noseRing.position.set(0, -0.22, 0.66);
    noseRing.rotation.x = 0.35;
    headPivot.add(noseRing);

    // Glowing Rage Eyes
    [-0.22, 0.22].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.078, 10, 10), accentMat);
      eye.position.set(ex, 0.14, 0.28);
      headPivot.add(eye);
    });

    // Spiral Curved Bull Horns (Sculpted with 3D Spline Tubes!)
    [-1, 1].forEach(side => {
      const hornPts = [
        new THREE.Vector3(side * 0.28, 0.22, 0.02),
        new THREE.Vector3(side * 0.78, 0.32, 0.08),
        new THREE.Vector3(side * 1.08, 0.68, 0.32),
        new THREE.Vector3(side * 0.92, 1.08, 0.58)
      ];
      headPivot.add(createOrganicTube(hornPts, (u) => 0.18 * (1 - u * 0.88), 14, 10, boneMat));
    });

    torsoGroup.add(headPivot);
    animParts.headPivot = headPivot;

    // 4. LENGAN BEROTot KEKAR MULTI-SENDI (BAHU -> BISEP -> SIKU -> LENGAN BAWAH -> TANGAN & 5 JARI!)
    animParts.minoArms = [];
    [-1, 1].forEach(side => {
      // Sendi Bahu melebar keluar dari badan agar tidak menyatu dengan dada
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(side * 0.92, 0.50, 0.06);

      // Otot Bahu Deltoid Bulat Besar + Pelindung Bahu Berduri Emas (Pauldron)
      const deltoid = createSculptedMesh(new THREE.SphereGeometry(0.32, 14, 12), 0.05, minoSkinMat, 1.15, 1.05, 1.05);
      shoulderPivot.add(deltoid);

      const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), minoGoldMat);
      pauldron.position.set(side * 0.05, 0.08, 0);
      pauldron.rotation.z = -side * 0.35;
      shoulderPivot.add(pauldron);

      // Duri Bahu
      const pSpike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 8), boneMat);
      pSpike.position.set(side * 0.22, 0.34, 0);
      pSpike.rotation.z = -side * 0.45;
      shoulderPivot.add(pSpike);

      // Lengan Atas (Upper Arm / Bicep) merentang ke samping luar (side * 0.38)
      const upperArmPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.24, -0.28, 0.08),
        new THREE.Vector3(side * 0.38, -0.56, 0.16)
      ];
      shoulderPivot.add(createOrganicTube(upperArmPts, (u) => 0.25 - u * 0.03, 10, 12, minoSkinMat));

      // Tonjolan Otot Bisep Kekar
      const bicepBulge = createSculptedMesh(new THREE.SphereGeometry(0.24, 12, 12), 0.04, minoSkinMat, 0.95, 1.25, 1.05);
      bicepBulge.position.set(side * 0.22, -0.28, 0.16);
      shoulderPivot.add(bicepBulge);

      // SENDI SIKU (Elbow Joint Pivot) -> Lengan Bawah (Forearm) mengarah ke DEPAN!
      const elbowPivot = new THREE.Group();
      elbowPivot.position.set(side * 0.38, -0.56, 0.16);

      const elbowKnob = new THREE.Mesh(new THREE.SphereGeometry(0.20, 10, 10), minoSkinMat);
      elbowPivot.add(elbowKnob);

      // Lengan Bawah Kekar (Forearm) menjulur ke depan (z = +0.62)
      const forearmPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.06, -0.16, 0.32),
        new THREE.Vector3(side * 0.04, -0.28, 0.64)
      ];
      elbowPivot.add(createOrganicTube(forearmPts, (u) => 0.23 - u * 0.04, 10, 12, minoSkinMat));

      // Gelang Besi/Emas Gladiator di Pergelangan Tangan (Spiked Wrist Bracer)
      const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 0.28, 12), minoGoldMat);
      bracer.rotation.x = Math.PI / 2 + 0.38;
      bracer.position.set(side * 0.05, -0.22, 0.48);
      elbowPivot.add(bracer);

      // TELAPAK TANGAN & 5 JARI MINOTAUR (Sculpted Hand + Palm + Thumb + 4 Articulated Fingers + Claws!)
      const handGroup = new THREE.Group();
      handGroup.position.set(side * 0.04, -0.30, 0.72);

      // Telapak Tangan Kekar (Muscular Palm & Knuckles)
      const palm = createSculptedMesh(new THREE.BoxGeometry(0.34, 0.26, 0.34), 0.03, minoSkinMat);
      handGroup.add(palm);

      // Pelindung Buku Jari Emas (Golden Brass Knuckle Guard)
      const knuckleGuard = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.14), minoGoldMat);
      knuckleGuard.position.set(0, 0.08, 0.16);
      handGroup.add(knuckleGuard);

      // Ibu Jari (Opposable Thumb + Claw) di sisi dalam tangan
      const thumbGroup = new THREE.Group();
      thumbGroup.position.set(-side * 0.18, -0.02, 0.06);
      thumbGroup.rotation.y = -side * 0.55;
      const thumbPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-side * 0.08, -0.04, 0.16),
        new THREE.Vector3(-side * 0.02, -0.08, 0.26)
      ];
      thumbGroup.add(createOrganicTube(thumbPts, (u) => 0.075 * (1 - u * 0.35), 6, 8, minoSkinMat));
      const thumbClaw = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.11, 6), boneMat);
      thumbClaw.position.set(-side * 0.02, -0.08, 0.30);
      thumbClaw.rotation.x = Math.PI / 2;
      thumbGroup.add(thumbClaw);
      handGroup.add(thumbGroup);

      // 4 Jari Tangan Kekar (Telunjuk, Tengah, Manis, Kelingking + Kuku Tajam)
      for (let f = 0; f < 4; f++) {
        const fx = (f - 1.5) * 0.082 * side;
        const fingerCurve = side === 1
          ? [ // Tangan kanan mengepal erat menggenggam gagang kapak
              new THREE.Vector3(fx, 0.04, 0.15),
              new THREE.Vector3(fx, -0.06, 0.28),
              new THREE.Vector3(fx, -0.18, 0.20)
            ]
          : [ // Tangan kiri membuka cakar petarung siap menghantam
              new THREE.Vector3(fx, 0.04, 0.15),
              new THREE.Vector3(fx, -0.02, 0.32),
              new THREE.Vector3(fx, -0.12, 0.42)
            ];
        handGroup.add(createOrganicTube(fingerCurve, (u) => 0.065 * (1 - u * 0.32), 6, 8, minoSkinMat));

        const fClaw = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), boneMat);
        const tip = fingerCurve[2];
        fClaw.position.set(tip.x, tip.y - 0.04, tip.z + 0.04);
        fClaw.rotation.x = side === 1 ? Math.PI : Math.PI * 0.68;
        handGroup.add(fClaw);
      }

      if (side === 1) {
        // KAPAK PERANG RAKSASA (Double-Bladed Labrys Battle Axe) digenggam tepat di dalam Tangan Kanan!
        const axeGroup = new THREE.Group();
        axeGroup.position.set(0, -0.06, 0.22);
        axeGroup.rotation.x = 0.25;
        axeGroup.rotation.z = -0.15;

        const handlePts = [new THREE.Vector3(0, -1.25, 0), new THREE.Vector3(0, 1.75, 0)];
        axeGroup.add(createOrganicTube(handlePts, () => 0.07, 10, 8, boneMat));

        // 2 Bilah Kapak Bulan Sabit Kembar
        [-1, 1].forEach(bSide => {
          const bladePts = [
            new THREE.Vector3(bSide * 0.10, 0.78, 0),
            new THREE.Vector3(bSide * 0.74, 1.20, 0),
            new THREE.Vector3(bSide * 0.10, 1.62, 0)
          ];
          axeGroup.add(createOrganicTube(bladePts, (u) => 0.24 * Math.sin(u * Math.PI) + 0.04, 12, 8, minoGoldMat, 1.85, 0.18));
        });
        handGroup.add(axeGroup);
      }

      elbowPivot.add(handGroup);
      shoulderPivot.add(elbowPivot);
      torsoGroup.add(shoulderPivot);
      animParts.minoArms.push({ shoulderPivot, elbowPivot, handGroup, side });
    });

    bodyGroup.add(torsoGroup);
  }

  // -------------------------------------------------------------------------
  // POS 7: 🐙 KRAKEN GURITA RAKSASA (Bentuk Gurita Asli Berwarna Coklat:
  //        Kepala Kubah Mantel Gurita Bulat Besar, 2 Mata Gurita Besar, Corong Siphon,
  //        dan 8 Lengan Tentakel Gurita Coklat Melengkung dengan Barisan Alat Hisap!)
  // -------------------------------------------------------------------------
  else if (st.monsterType === 'hydra') {
    const octopusRoot = new THREE.Group();
    octopusRoot.position.y = 0.15;

    // Palet Warna Gurita Coklat Asli (Rich Brown Octopus / Giant Pacific Octopus)
    const octoBrownMain = new THREE.MeshStandardMaterial({ color: 0x7c3f1d, roughness: 0.36, metalness: 0.12 }); // Coklat gurita utama (lembap mengilap)
    const octoBrownDark = new THREE.MeshStandardMaterial({ color: 0x4a220d, roughness: 0.42, metalness: 0.10 }); // Totol coklat tua di kulit gurita
    const octoBrownWarm = new THREE.MeshStandardMaterial({ color: 0x9a5228, roughness: 0.34, metalness: 0.12 }); // Coklat hangat di pangkal lengan
    const octoSuckerMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.4, metalness: 0.08 });  // Krem-kuning pucat untuk mangkuk alat hisap (suction cups)
    const octoEyeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 }); // Mata kuning emas cephalopoda
    const octoPupilMat = new THREE.MeshBasicMaterial({ color: 0x111827 });

    // 1. ROK PANGKAL KEPALA GURITA (Interbrachial Web / Skirt tempat menyatunya 8 lengan)
    const webLathePts = [
      new THREE.Vector2(1.15, 0.15),
      new THREE.Vector2(0.96, 0.55),
      new THREE.Vector2(0.82, 1.05),
      new THREE.Vector2(0.88, 1.48),
      new THREE.Vector2(0.65, 1.78)
    ];
    const headWeb = new THREE.Mesh(new THREE.LatheGeometry(webLathePts, 24), octoBrownMain);
    headWeb.castShadow = true;
    octopusRoot.add(headWeb);

    // 2. KANTUNG KEPALA / MANTEL BULAT BESAR GURITA (Bulbous Octopus Mantle Dome)
    const mantlePivot = new THREE.Group();
    mantlePivot.position.set(0, 1.65, -0.12);
    mantlePivot.rotation.x = -0.32; // Miring ke belakang khas anatomi kepala gurita asli!

    const mantleDome = createSculptedMesh(
      new THREE.SphereGeometry(1.12, 24, 20),
      0.06,
      octoBrownMain,
      1.12,
      1.38,
      1.22
    );
    mantleDome.position.set(0, 0.55, -0.15);
    mantlePivot.add(mantleDome);

    // Totol-Totol Organik Coklat Tua di Permukaan Kepala Gurita (Octopus Skin Chromatophores / Tubercles)
    const spots = [
      { x: -0.55, y: 0.85, z: 0.35, r: 0.26 },
      { x:  0.58, y: 0.78, z: 0.32, r: 0.28 },
      { x:  0.00, y: 1.25, z: 0.18, r: 0.32 },
      { x: -0.72, y: 0.42, z: -0.25, r: 0.30 },
      { x:  0.74, y: 0.46, z: -0.22, r: 0.29 },
      { x: -0.38, y: 1.38, z: -0.42, r: 0.25 },
      { x:  0.42, y: 1.32, z: -0.45, r: 0.27 },
      { x:  0.00, y: 0.65, z: -0.88, r: 0.35 }
    ];
    spots.forEach((sp, idx) => {
      const spotMesh = new THREE.Mesh(
        new THREE.SphereGeometry(sp.r, 12, 10),
        idx % 2 === 0 ? octoBrownDark : octoBrownWarm
      );
      spotMesh.scale.set(1.1, 0.55, 1.1);
      spotMesh.position.set(sp.x, sp.y, sp.z);
      mantlePivot.add(spotMesh);
    });

    // Sepasang Sirip Samping Kepala Gurita (Lateral Octopus Mantle Fins)
    [-1, 1].forEach(side => {
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), octoBrownWarm);
      fin.scale.set(1.25, 0.18, 0.65);
      fin.position.set(side * 1.02, 0.92, -0.28);
      fin.rotation.z = -side * 0.35;
      fin.rotation.y = -side * 0.25;
      mantlePivot.add(fin);
    });

    // Corong Semprotan Air Gurita (Octopus Siphon / Funnel Tube di sisi leher)
    const siphonGroup = new THREE.Group();
    siphonGroup.position.set(0.68, -0.05, 0.42);
    siphonGroup.rotation.set(0.55, 0.35, -0.45);
    const siphonTube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.62, 14, 1, true), octoBrownWarm);
    siphonGroup.add(siphonTube);
    const siphonRim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 10, 16), octoSuckerMat);
    siphonRim.rotation.x = Math.PI / 2;
    siphonRim.position.y = 0.31;
    siphonGroup.add(siphonRim);
    mantlePivot.add(siphonGroup);

    octopusRoot.add(mantlePivot);
    animParts.octopusMantle = mantlePivot;

    // 3. DUA MATA GURITA BESAR MENONJOL DENGAN PUPIL HORIZONTAL KHAS GURITA
    const eyeHeadPivot = new THREE.Group();
    eyeHeadPivot.position.set(0, 1.35, 0.58);

    [-1, 1].forEach(side => {
      // Tonjolan Kelopak Mata Gurita Coklat
      const eyeSocket = createSculptedMesh(new THREE.SphereGeometry(0.34, 14, 14), 0.04, octoBrownDark, 1.05, 0.95, 1.0);
      eyeSocket.position.set(side * 0.52, 0.05, 0.12);
      eyeHeadPivot.add(eyeSocket);

      // Bola Mata Kuning Emas Bersinar
      const eyeball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), octoEyeMat);
      eyeball.position.set(side * 0.56, 0.05, 0.28);
      eyeHeadPivot.add(eyeball);

      // Pupil Persegi Panjang Horizontal Khas Gurita (Rectangular Cephalopod Pupil)
      const rectPupil = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.08), octoPupilMat);
      rectPupil.position.set(side * 0.60, 0.05, 0.48);
      rectPupil.rotation.y = side * 0.32;
      eyeHeadPivot.add(rectPupil);
    });

    octopusRoot.add(eyeHeadPivot);
    animParts.headPivot = eyeHeadPivot;

    // 4. DELAPAN (8) LENGAN TENTAKEL GURITA COKLAT MELENGKUNG MULTI-SENDI + BARISAN ALAT HISAP (SUCTION CUPS)
    animParts.octopusArms = [];
    const numOctoArms = 8;

    for (let i = 0; i < numOctoArms; i++) {
      // Sebarkan 8 lengan gurita mengelilingi tubuh 360 derajat (dengan sedikit bukaan di depan wajah)
      const baseAngle = (i / numOctoArms) * Math.PI * 2 + (Math.PI / 8);
      const armRoot = new THREE.Group();
      armRoot.position.set(Math.cos(baseAngle) * 0.78, 0.42, Math.sin(baseAngle) * 0.78);
      // Arahkan sumbu +Z masing-masing lengan menjalar keluar secara radial
      armRoot.rotation.y = Math.atan2(Math.cos(baseAngle), Math.sin(baseAngle));

      const armMat = i % 2 === 0 ? octoBrownMain : octoBrownWarm;

      // Rantai 3 Sendi Artikulasi per Tentakel Gurita (Pangkal -> Tengah -> Ujung Melingkar ke Atas)
      // Sendi 1 (Pangkal Lengan Gurita Tebal + 4 Alat Hisap Besar)
      const joint1 = new THREE.Group();
      const seg1Pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.14, 0.48),
        new THREE.Vector3(0, -0.22, 0.95)
      ];
      joint1.add(createOrganicTube(seg1Pts, (u) => 0.32 * (1 - u * 0.22), 10, 12, armMat, 1.08, 0.92));

      // Barisan Alat Hisap (Suction Cups) di Sisi Bawah/Samping Sendi 1
      for (let s = 0; s < 4; s++) {
        const su = (s + 0.5) / 4;
        const sideAlt = s % 2 === 0 ? -1 : 1;
        const sucker = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.08, 12), octoSuckerMat);
        sucker.position.set(sideAlt * 0.16, -0.14 - su * 0.12, su * 0.88);
        sucker.rotation.z = sideAlt * 0.85;
        joint1.add(sucker);
      }

      // Sendi 2 (Bagian Tengah Tentakel Menjalar & Melengkung Naik + 4 Alat Hisap)
      const joint2 = new THREE.Group();
      joint2.position.set(0, -0.22, 0.92);
      const seg2Pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.12, 0.48),
        new THREE.Vector3(0, 0.42, 0.88)
      ];
      joint2.add(createOrganicTube(seg2Pts, (u) => 0.25 * (1 - u * 0.32), 10, 12, armMat));

      for (let s = 0; s < 4; s++) {
        const su = (s + 0.5) / 4;
        const sideAlt = s % 2 === 0 ? -1 : 1;
        const sucker = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.075, 10), octoSuckerMat);
        sucker.position.set(sideAlt * 0.12, su * 0.34, su * 0.82);
        sucker.rotation.x = -0.65;
        sucker.rotation.z = sideAlt * 0.55;
        joint2.add(sucker);
      }

      // Sendi 3 (Ujung Tentakel Gurita Melingkar Halus / Coiled Octopus Tip + 3 Alat Hisap Menghadap Depan)
      const joint3 = new THREE.Group();
      joint3.position.set(0, 0.42, 0.85);
      const seg3Pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.45, 0.32),
        new THREE.Vector3(0, 0.82, 0.05),
        new THREE.Vector3(0, 0.96, -0.28)
      ];
      joint3.add(createOrganicTube(seg3Pts, (u) => 0.17 * (1 - u * 0.78), 12, 10, octoBrownDark));

      for (let s = 0; s < 3; s++) {
        const su = (s + 0.4) / 3;
        const sucker = new THREE.Mesh(new THREE.CylinderGeometry(0.075 * (1 - su * 0.3), 0.055 * (1 - su * 0.3), 0.065, 10), octoSuckerMat);
        sucker.position.set((s % 2 === 0 ? -1 : 1) * 0.06, su * 0.78, 0.26 - su * 0.22);
        sucker.rotation.x = Math.PI / 2.2;
        joint3.add(sucker);
      }

      joint2.add(joint3);
      joint1.add(joint2);
      armRoot.add(joint1);
      octopusRoot.add(armRoot);

      animParts.octopusArms.push({
        armRoot,
        joint1,
        joint2,
        joint3,
        phase: i * 0.82
      });
    }

    bodyGroup.add(octopusRoot);
  }

  // -------------------------------------------------------------------------
  // POS 8: 🐉 RAJA NAGA MERAH BAHAMUT (Final Boss: Naga Merah Bersisik 3D Lengkap,
  //        Wajah Naga Merah Garang dengan Mata Slit Emas, Alis Berduri, Moncong
  //        Berlubang Hidung, Cula Hidung, Rahang Bertaring 12 Gigi, Sisik Perut Emas,
  //        Barisan Sisik Perisai 3D di Tubuh/Leher/Ekor & Sayap Naga Merah Raksasa)
  // -------------------------------------------------------------------------
  else {
    const dragonRoot = new THREE.Group();

    // Palet Warna Naga Merah Menyala (Crimson Scaled Red Dragon)
    const dragonRedMain = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.34, metalness: 0.18 });   // Kulit & tubuh naga merah utama
    const dragonRedDark = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.38, metalness: 0.22 });   // Sisik punggung & perisai merah tua (ruby)
    const dragonScarlet = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.32, metalness: 0.15, emissive: 0x7f1d1d, emissiveIntensity: 0.22 }); // Selaput sayap & sisik merah menyala
    const dragonGoldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.28, metalness: 0.55, emissive: 0xd97706, emissiveIntensity: 0.18 }); // Pelat sisik perut & tanduk emas
    const dragonEyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });  // Mata naga kuning emas menyala
    const dragonPupilMat = new THREE.MeshBasicMaterial({ color: 0x090d16 }); // Pupil celah vertikal hitam

    // Helper Pembuat Keping Sisik Naga 3D (3D Overlapping Diamond/Shield Dragon Scale)
    function createDragonScalePlate(scaleSize, mat) {
      const sc = new THREE.Mesh(new THREE.OctahedronGeometry(scaleSize, 0), mat);
      sc.scale.set(1.15, 0.32, 1.35);
      sc.castShadow = true;
      return sc;
    }

    // 1. Tubuh Naga Merah Berotot S-Curve (Dada Bidang -> Perut -> Pinggul)
    const bodyPts = [
      new THREE.Vector3(0, 0.85, -1.05),
      new THREE.Vector3(0, 1.22, -0.35),
      new THREE.Vector3(0, 1.72, 0.25),
      new THREE.Vector3(0, 2.08, 0.52)
    ];
    const dragonBody = createOrganicTube(
      bodyPts,
      (u) => 0.60 * Math.sin(u * Math.PI * 0.85 + 0.22),
      24,
      16,
      dragonRedMain,
      1.14,
      1.05
    );
    dragonRoot.add(dragonBody);

    // 10 Pelat Sisik Perut Naga Kuning-Emas Berlapis (Overlapping Golden Armored Ventral Belly Scutes)
    for (let b = 0; b < 9; b++) {
      const u = b / 8;
      const by = 0.92 + u * 1.12;
      const bz = -0.62 + u * 1.28;
      const scuteRadius = 0.38 * Math.sin(u * Math.PI * 0.82 + 0.25);
      const bellyPlate = new THREE.Mesh(new THREE.CylinderGeometry(scuteRadius * 0.92, scuteRadius * 1.04, 0.16, 10), dragonGoldMat);
      bellyPlate.scale.set(1.15, 1.0, 0.48);
      bellyPlate.position.set(0, by, bz);
      bellyPlate.rotation.x = 0.55;
      dragonRoot.add(bellyPlate);
    }

    // BARISAN SISIK NAGA 3D DI KIRI, KANAN & PUNGGUNG TUBUH NAGA (3D Overlapping Dragon Armor Scales!)
    for (let row = 0; row < 7; row++) {
      const u = (row + 0.4) / 7;
      const ry = 0.96 + u * 1.08;
      const rz = -0.88 + u * 1.28;
      const bodyRad = 0.56 * Math.sin(u * Math.PI * 0.85 + 0.22);

      // 3 Lapis Baris Sisik Samping di setiap sisi (Kiri & Kanan)
      [-1, 1].forEach(side => {
        for (let layer = 0; layer < 3; layer++) {
          const ang = (0.35 + layer * 0.38) * side;
          const scalePlate = createDragonScalePlate(0.18, (row + layer) % 2 === 0 ? dragonRedDark : dragonScarlet);
          scalePlate.position.set(
            Math.sin(ang) * bodyRad * 1.02,
            ry + Math.cos(ang) * bodyRad * 0.65,
            rz - layer * 0.06
          );
          scalePlate.rotation.z = -ang;
          scalePlate.rotation.x = 0.45;
          dragonRoot.add(scalePlate);
        }
      });

      // Duri Sisik Punggung Naga (Dorsal Dragon Spine Ridge Spikes)
      const dorsalSpike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.38, 6), row % 2 === 0 ? dragonGoldMat : dragonRedDark);
      dorsalSpike.position.set(0, ry + bodyRad * 0.82, rz - 0.12);
      dorsalSpike.rotation.x = -0.58;
      dragonRoot.add(dorsalSpike);
    }

    // Inti Jantung Api Naga di Dada
    const heartCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 1), dragonEyeMat);
    heartCore.position.set(0, 1.78, 0.72);
    dragonRoot.add(heartCore);
    animParts.heartCore = heartCore;

    // 2. 4 Kaki Naga Merah Berotot Kekar Lengkap dengan Sisik Paha & Cakar Tajam
    [
      [-0.60, 1.15, -0.55],
      [ 0.60, 1.15, -0.55],
      [-0.54, 1.72,  0.34],
      [ 0.54, 1.72,  0.34]
    ].forEach(([lx, ly, lz], idx) => {
      const isRear = idx < 2;
      const side = lx < 0 ? -1 : 1;
      const legPts = isRear
        ? [new THREE.Vector3(lx, ly, lz), new THREE.Vector3(lx * 1.28, 0.58, lz + 0.22), new THREE.Vector3(lx * 1.12, 0.08, lz + 0.50)]
        : [new THREE.Vector3(lx, ly, lz), new THREE.Vector3(lx * 1.38, 1.25, lz + 0.35), new THREE.Vector3(lx * 1.16, 0.78, lz + 0.68)];
      dragonRoot.add(createOrganicTube(legPts, (u) => (isRear ? 0.29 : 0.22) * (1 - u * 0.42), 12, 10, dragonRedMain));

      // Sisik Pelindung Bahu/Paha Kaki Naga
      for (let ls = 0; ls < 3; ls++) {
        const legScale = createDragonScalePlate(0.15, dragonRedDark);
        legScale.position.set(lx * 1.25 + side * 0.08, ly - ls * 0.22, lz + ls * 0.10);
        legScale.rotation.z = -side * 0.95;
        dragonRoot.add(legScale);
      }

      // 3 Cakar Kaki Naga Putih Gading
      [-0.10, 0, 0.10].forEach(cx => {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.22, 6), boneMat);
        const endPt = legPts[2];
        claw.position.set(endPt.x + cx, endPt.y, endPt.z + 0.16);
        claw.rotation.x = Math.PI * 0.42;
        dragonRoot.add(claw);
      });
    });

    // 3. LEHER BERSISIK & WAJAH NAGA MERAH YANG SANGAT JELAS MENGHADAP PEMAIN!
    const headPivot = new THREE.Group();
    // Posisi diturunkan sedikit agar Wajah Naga 100% terlihat jelas di bawah label nama!
    headPivot.position.set(0, 2.02, 0.56);

    const neckPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.34, 0.16),
      new THREE.Vector3(0, 0.62, 0.42)
    ];
    headPivot.add(createOrganicTube(neckPts, (u) => 0.38 * (1 - u * 0.22), 14, 12, dragonRedMain));

    // Sisik Leher Samping & Duri Punggung Leher Naga
    for (let ns = 0; ns < 4; ns++) {
      const nu = (ns + 0.3) / 4;
      [-1, 1].forEach(side => {
        const nScale = createDragonScalePlate(0.14, dragonRedDark);
        nScale.position.set(side * 0.32, nu * 0.56, nu * 0.36);
        nScale.rotation.z = -side * 1.1;
        headPivot.add(nScale);
      });
      const nSpike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 6), dragonGoldMat);
      nSpike.position.set(0, nu * 0.58 + 0.12, nu * 0.36 - 0.28);
      nSpike.rotation.x = -0.65;
      headPivot.add(nSpike);
    }

    // KEPALA & WAJAH NAGA MERAH LENGKAP (Tengkorak, Alis Berduri, Mata Kuning Slit, Moncong, Hidung, Cula & Rahang Bertaring)
    const skullGroup = new THREE.Group();
    skullGroup.position.set(0, 0.64, 0.46);
    skullGroup.rotation.x = 0.18; // Menunduk sedikit agar wajah, mata & moncong naga langsung menatap pemain!

    // Kubah Tengkorak & Pipi Naga Berzirah Sisik Merah
    const cranium = createSculptedMesh(new THREE.SphereGeometry(0.42, 16, 14), 0.05, dragonRedMain, 1.16, 0.88, 1.15);
    cranium.position.set(0, 0.08, 0.05);
    skullGroup.add(cranium);

    // Pelat Sisik Dahi Naga Merah Tua
    for (let fs = 0; fs < 3; fs++) {
      const fPlate = createDragonScalePlate(0.16 - fs * 0.02, dragonRedDark);
      fPlate.position.set(0, 0.28 - fs * 0.04, 0.12 + fs * 0.22);
      fPlate.rotation.x = 0.22;
      skullGroup.add(fPlate);
    }

    // Moncong Atas Naga Merah yang Panjang & Gagah (Sculpted Red Dragon Snout)
    const snoutPts = [
      new THREE.Vector3(0, 0.04, 0.05),
      new THREE.Vector3(0, 0.06, 0.45),
      new THREE.Vector3(0, 0.02, 0.88)
    ];
    skullGroup.add(createOrganicTube(snoutPts, (u) => 0.36 * (1 - u * 0.35), 14, 14, dragonRedMain, 1.12, 0.78));

    // CULA HIDUNG NAGA EMAS di Ujung Atas Moncong (Golden Dragon Nasal Horn)
    const nasalHorn = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.32, 8), dragonGoldMat);
    nasalHorn.position.set(0, 0.24, 0.78);
    nasalHorn.rotation.x = -0.25;
    skullGroup.add(nasalHorn);

    // 2 Tonjolan Lubang Hidung Naga di Ujung Moncong Depan (Flared Dragon Nostrils)
    [-1, 1].forEach(side => {
      const nostrilBoss = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), dragonRedDark);
      nostrilBoss.position.set(side * 0.16, 0.10, 0.78);
      skullGroup.add(nostrilBoss);

      const nostrilHole = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), dragonPupilMat);
      nostrilHole.position.set(side * 0.17, 0.10, 0.84);
      skullGroup.add(nostrilHole);
    });

    // SEPASANG MATA NAGA KUNING MENYALA + PUPIL VERTIKAL HITAM & ALIS NAGA BERDURI!
    [-1, 1].forEach(side => {
      // Alis Naga Tebal Berduri (Armored Supraorbital Brow Ridge)
      const browPts = [
        new THREE.Vector3(side * 0.16, 0.26, 0.36),
        new THREE.Vector3(side * 0.36, 0.30, 0.16),
        new THREE.Vector3(side * 0.48, 0.36, -0.08)
      ];
      skullGroup.add(createOrganicTube(browPts, (u) => 0.09 * (1 - u * 0.4), 8, 8, dragonRedDark));

      // Bola Mata Naga Kuning Emas Besar agar Wajah Sangat Terlihat Hidup
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), dragonEyeMat);
      eye.position.set(side * 0.29, 0.15, 0.26);
      skullGroup.add(eye);

      // Pupil Vertikal Hitam Khas Naga (Vertical Dragon Slit Pupil)
      const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16, 0.06), dragonPupilMat);
      pupil.position.set(side * 0.35, 0.15, 0.33);
      pupil.rotation.y = side * 0.38;
      skullGroup.add(pupil);

      // Duri Pipi Samping Wajah Naga (Cheek Frill Spikes)
      [-0.05, 0.12].forEach((cz, cIdx) => {
        const cheekSpike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 6), boneMat);
        cheekSpike.position.set(side * 0.44, -0.02 + cIdx * 0.08, cz);
        cheekSpike.rotation.z = -side * 1.15;
        cheekSpike.rotation.x = -0.35;
        skullGroup.add(cheekSpike);
      });
    });

    // Barisan 6 Gigi Taring Naga Atas (Upper Dragon Fangs)
    [-1, 1].forEach(side => {
      [0.36, 0.56, 0.74].forEach((fz, fIdx) => {
        const fang = new THREE.Mesh(new THREE.ConeGeometry(0.042, fIdx === 2 ? 0.22 : 0.16, 8), boneMat);
        fang.position.set(side * (0.24 - fIdx * 0.03), -0.10, fz);
        fang.rotation.x = Math.PI;
        skullGroup.add(fang);
      });
    });

    // 4 Tanduk Mahkota Naga Melengkung Gagah ke Belakang (Swept-Back Crown Dragon Horns)
    [-1, 1].forEach(side => {
      const mainHornPts = [
        new THREE.Vector3(side * 0.26, 0.26, -0.04),
        new THREE.Vector3(side * 0.56, 0.62, -0.46),
        new THREE.Vector3(side * 0.72, 1.04, -0.92)
      ];
      skullGroup.add(createOrganicTube(mainHornPts, (u) => 0.16 * (1 - u * 0.86), 14, 10, dragonGoldMat));

      const subHornPts = [
        new THREE.Vector3(side * 0.34, 0.10, 0.02),
        new THREE.Vector3(side * 0.64, 0.26, -0.36),
        new THREE.Vector3(side * 0.78, 0.44, -0.70)
      ];
      skullGroup.add(createOrganicTube(subHornPts, (u) => 0.10 * (1 - u * 0.86), 10, 8, boneMat));
    });

    // Rahang Bawah Naga Merah Berengsel (Hinged Fiery Lower Jaw + 6 Gigi Taring Bawah + Semburan Magma)
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.08, 0.08);
    const jawPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.08, 0.38),
      new THREE.Vector3(0, -0.06, 0.76)
    ];
    jawPivot.add(createOrganicTube(jawPts, (u) => 0.31 * (1 - u * 0.42), 12, 12, dragonRedDark, 1.05, 0.55));

    // Dagu Berduri Emas di Bawah Rahang Naga
    const chinSpike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 6), dragonGoldMat);
    chinSpike.position.set(0, -0.20, 0.68);
    chinSpike.rotation.x = Math.PI * 0.78;
    jawPivot.add(chinSpike);

    // 6 Gigi Taring Rahang Bawah
    [-1, 1].forEach(side => {
      [0.28, 0.48, 0.66].forEach((fz, fIdx) => {
        const lFang = new THREE.Mesh(new THREE.ConeGeometry(0.038, fIdx === 2 ? 0.19 : 0.14, 8), boneMat);
        lFang.position.set(side * (0.21 - fIdx * 0.03), 0.04, fz);
        jawPivot.add(lFang);
      });
    });

    // Bola Bara Api Magma di Dalam Mulut Naga
    const throatGlow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), dragonEyeMat);
    throatGlow.position.set(0, 0.05, 0.30);
    jawPivot.add(throatGlow);

    skullGroup.add(jawPivot);
    headPivot.add(skullGroup);
    dragonRoot.add(headPivot);
    animParts.headPivot = headPivot;
    animParts.jawPivot = jawPivot;

    // 4. 2 SAYAP NAGA MERAH RAKSASA BERSELAPUT MERAH MENYALA (Crimson & Scarlet Bat-Wings)
    function buildDragonWing(sideSign) {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(sideSign * 0.54, 1.92, 0.18);

      // Tulang Lengan Sayap Dalam Merah Tua + Sisik Bahu Sayap
      const armPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(sideSign * 0.88, 0.56, -0.08),
        new THREE.Vector3(sideSign * 1.58, 0.84, -0.15)
      ];
      shoulderPivot.add(createOrganicTube(armPts, (u) => 0.17 * (1 - u * 0.24), 10, 8, dragonRedDark));

      // Selaput Sayap Dalam Merah Menyala
      const innerWebPts = [
        new THREE.Vector3(sideSign * 0.15, -0.25, -0.10),
        new THREE.Vector3(sideSign * 0.88, 0.14, -0.22),
        new THREE.Vector3(sideSign * 1.50, 0.40, -0.28)
      ];
      shoulderPivot.add(createOrganicTube(innerWebPts, (u) => 0.50 * Math.sin(u * Math.PI * 0.85 + 0.2), 12, 8, dragonScarlet, 1.0, 0.12));

      // Sendi Pergelangan Sayap Luar + 4 Jari Sayap & Selaput Merah
      const wristPivot = new THREE.Group();
      wristPivot.position.set(sideSign * 1.58, 0.84, -0.15);

      // Cakar Jempol Sayap Emas
      const thumbPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(sideSign * 0.20, 0.35, 0.18)];
      wristPivot.add(createOrganicTube(thumbPts, (u) => 0.085 * (1 - u * 0.85), 6, 6, dragonGoldMat));

      const fingerTargets = [
        [sideSign * 1.68, 0.36, -0.25],
        [sideSign * 1.48, -0.28, -0.32],
        [sideSign * 1.08, -0.86, -0.35],
        [sideSign * 0.46, -1.16, -0.28]
      ];
      fingerTargets.forEach((ft, fIdx) => {
        const fPts = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(ft[0] * 0.55, ft[1] * 0.45 + 0.08, ft[2] * 0.5),
          new THREE.Vector3(ft[0], ft[1], ft[2])
        ];
        wristPivot.add(createOrganicTube(fPts, (u) => 0.095 * (1 - u * 0.78), 10, 8, dragonRedDark));

        if (fIdx < fingerTargets.length - 1) {
          const nextFt = fingerTargets[fIdx + 1];
          const webPts = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3((ft[0] + nextFt[0]) * 0.35, (ft[1] + nextFt[1]) * 0.35, -0.22),
            new THREE.Vector3((ft[0] + nextFt[0]) * 0.48, (ft[1] + nextFt[1]) * 0.48, -0.30)
          ];
          wristPivot.add(createOrganicTube(webPts, (u) => 0.38 * u + 0.06, 10, 6, dragonScarlet, 1.45, 0.12));
        }
      });

      shoulderPivot.add(wristPivot);
      return { shoulderPivot, wristPivot };
    }

    const dWingL = buildDragonWing(-1);
    const dWingR = buildDragonWing(1);
    dragonRoot.add(dWingL.shoulderPivot);
    dragonRoot.add(dWingR.shoulderPivot);
    animParts.wingL = dWingL.shoulderPivot;
    animParts.wingR = dWingR.shoulderPivot;
    animParts.wristL = dWingL.wristPivot;
    animParts.wristR = dWingR.wristPivot;

    // 5. EKOR NAGA MERAH BERSISIK & BERDURI DENGAN UJUNG TOMBAK NAGA EMAS
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.85, -1.02);
    const tailPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.28, -0.36, -0.75),
      new THREE.Vector3(-0.22, -0.48, -1.55),
      new THREE.Vector3(0.15, -0.22, -2.25)
    ];
    tailPivot.add(createOrganicTube(tailPts, (u) => 0.38 * (1 - u * 0.76), 18, 12, dragonRedMain));

    // Barisan Sisik & Duri di Sepanjang Ekor Naga
    for (let ts = 0; ts < 5; ts++) {
      const tu = (ts + 0.4) / 5;
      const tSpike = new THREE.Mesh(new THREE.ConeGeometry(0.08 * (1 - tu * 0.4), 0.26 * (1 - tu * 0.3), 6), dragonGoldMat);
      tSpike.position.set(Math.sin(tu * Math.PI * 2) * 0.12, -0.18 - Math.sin(tu * Math.PI) * 0.18, -tu * 2.05);
      tSpike.rotation.x = -0.45;
      tailPivot.add(tSpike);
    }

    const tailBlade = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), dragonGoldMat);
    tailBlade.scale.set(0.85, 0.32, 1.55);
    tailBlade.position.set(0.15, -0.22, -2.35);
    tailPivot.add(tailBlade);
    dragonRoot.add(tailPivot);
    animParts.tailGroup = tailPivot;

    bodyGroup.add(dragonRoot);
  }

  return { bodyGroup, primaryMat, animParts };
}

function buildStationSignboard(titleText, subText) {
  const g = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });

  const leftPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.2, 8), postMat);
  leftPost.position.set(-1.35, 1.1, 0);
  g.add(leftPost);

  const rightPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.2, 8), postMat);
  rightPost.position.set(1.35, 1.1, 0);
  g.add(rightPost);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3b281e';
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 176);

  ctx.fillStyle = '#fef3c7';
  ctx.font = '900 30px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(titleText, 256, 82);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '800 22px Nunito, sans-serif';
  ctx.fillText(subText, 256, 138);

  const tex = new THREE.CanvasTexture(canvas);
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.15, 0.14),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })
  );
  board.position.set(0, 1.65, 0);
  board.castShadow = true;
  g.add(board);

  return g;
}

// ============================================================================
// 8. ELEMENTAL COMBAT SYSTEM (FIRE & 5-ORB RAIJIN LIGHTNING BARRAGE)
// ============================================================================
function findNearestTargetEnemy(maxRange = 28) {
  let nearest = null;
  let bestDist = maxRange;

  enemyObjects.forEach(en => {
    if (!en.defeated) {
      const dist = playerPos.distanceTo(new THREE.Vector3(en.station.x, 0, en.station.z));
      if (dist < bestDist) {
        bestDist = dist;
        nearest = en;
      }
    }
  });
  return nearest;
}

function castElementalSkill(skillType) {
  if (isIntroMode) return;
  const isModalOpen = document.getElementById('slideModalOverlay').classList.contains('active');
  if (isModalOpen) return;

  const targetEnemy = findNearestTargetEnemy(28);
  let targetPos;

  if (targetEnemy) {
    targetPos = new THREE.Vector3(targetEnemy.station.x, 1.9, targetEnemy.station.z);
    const dx = targetPos.x - playerPos.x;
    const dz = targetPos.z - playerPos.z;
    playerRotY = Math.atan2(dx, dz);
  } else {
    targetPos = playerPos.clone().add(
      new THREE.Vector3(Math.sin(playerRotY) * 11, 1.5, Math.cos(playerRotY) * 11)
    );
  }

  if (skillType === 'fire') {
    CloudAudio.playFireSkill();
    triggerHudPillCooldown('pillFire', 320);
    spawnFireProjectile(targetPos, targetEnemy, 50);
  } else if (skillType === 'lightning') {
    CloudAudio.playLightningSkill();
    triggerHudPillCooldown('pillLightning', 320);
    spawnLightningStrike(targetPos, targetEnemy, 50);
  } else if (skillType === 'ultimate') {
    CloudAudio.playUltimateSkill();
    triggerHudPillCooldown('pillUltimate', 650);
    spawnFireProjectile(targetPos, targetEnemy, 50);
    setTimeout(() => {
      spawnLightningStrike(targetPos, targetEnemy, 50);
    }, 180);
  }
}

function triggerHudPillCooldown(pillId, ms) {
  const el = document.getElementById(pillId);
  if (!el) return;
  el.classList.add('casting');
  setTimeout(() => el.classList.remove('casting'), ms);
}

// 🔥 JURUS 1: SOLAR FIREBALL BARRAGE
function spawnFireProjectile(targetPos, targetEnemy, dmgAmount) {
  const startPos = playerPos.clone().add(new THREE.Vector3(0, 2.1, 0));

  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff3b0 })
  );
  group.add(core);

  const aura = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xff5400, transparent: true, opacity: 0.78 })
  );
  group.add(aura);

  const light = new THREE.PointLight(0xff5400, 3.5, 15);
  group.add(light);

  group.position.copy(startPos);
  scene.add(group);

  // Hero martial-arts strike pose (Shoulder + Elbow extension)
  if (playerParts.armR && playerParts.elbowR) {
    playerParts.armR.rotation.x = -1.42;
    playerParts.elbowR.rotation.x = -0.35;
    setTimeout(() => {
      if (playerParts.armR) playerParts.armR.rotation.x = 0;
      if (playerParts.elbowR) playerParts.elbowR.rotation.x = 0;
    }, 280);
  }

  activeProjectiles.push({
    mesh: group,
    startPos: startPos.clone(),
    targetPos: targetPos.clone(),
    progress: 0,
    speed: 3.5,
    targetEnemy,
    dmgAmount,
    element: 'fire'
  });
}

// ⚡ JURUS 2: 5-ORB RAIJIN THUNDERBARRAGE (Menyambar dari 5 Bola Petir di Punggung!)
function spawnLightningStrike(targetPos, targetEnemy, dmgAmount) {
  if (playerParts.armL && playerParts.elbowL) {
    playerParts.armL.rotation.x = -1.42;
    playerParts.elbowL.rotation.x = -0.35;
    setTimeout(() => {
      if (playerParts.armL) playerParts.armL.rotation.x = 0;
      if (playerParts.elbowL) playerParts.elbowL.rotation.x = 0;
    }, 280);
  }

  // Sambaran petir berantai dari ke-5 Orbs di punggung Hero ke Monster!
  if (playerParts.lightningOrbs) {
    playerParts.lightningOrbs.forEach((orbObj, idx) => {
      const orbWorldPos = new THREE.Vector3();
      orbObj.orbHolder.getWorldPosition(orbWorldPos);
      createJaggedBolt(orbWorldPos, targetPos, idx % 2 === 0 ? 0x38bdf8 : 0xc084fc, 12);
    });
  }

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

  for (let i = 0; i < 26; i++) {
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
  enemy.wobbleVel = 0.52;

  const hpFill = document.getElementById(`hpFill_${enemy.id}`);
  if (hpFill) {
    hpFill.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
  }

  const labelText = element === 'fire' ? `-${dmg} HP 🔥 SOLAR FIRE!` : `-${dmg} HP ⚡ 5-ORB THUNDER!`;
  const colorHex = element === 'fire' ? '#fb923c' : '#38bdf8';
  spawnFloatingDamageText(enemy.station.x, 3.8, enemy.station.z, labelText, colorHex);

  enemy.armorMat.emissive = new THREE.Color(element === 'fire' ? 0xff4500 : 0x38bdf8);
  setTimeout(() => {
    if (enemy.armorMat) enemy.armorMat.emissive = new THREE.Color(0x000000);
  }, 170);

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

    spawnFloatingDamageText(enemy.station.x, 4.5, enemy.station.z, `💥 ${enemy.station.icon} KALAH! SLIDE ${enemy.station.posNum} TERBUKA!`, '#4ade80');
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
// 10. PLAYER INPUT, 360° CAMERA ORBIT & ROAD BOUNDARY CLAMPING
// ============================================================================
function setupInputListeners() {
  window.addEventListener('keydown', (e) => {
    const code = e.code;
    keysPressed[code] = true;

    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      autoWalkTarget = null;
      autoWalkCurveTargetT = null;
    }

    if (code === 'Escape') {
      closeSlideWindow();
      closeCreditsModal();
      closeFullCodeModal();
      return;
    }

    if (isIntroMode) return;
    if (e.repeat) return;

    // Lepaskan fokus dari tombol HUD agar tombol keyboard tidak memicu klik tombol secara tidak sengaja
    if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
      document.activeElement.blur();
    }

    const isModalOpen = document.getElementById('slideModalOverlay').classList.contains('active');
    if (!isModalOpen) {
      if (code === 'KeyJ') {
        castElementalSkill('fire');
      } else if (code === 'KeyK') {
        castElementalSkill('lightning');
      } else if (code === 'KeyL') {
        e.preventDefault();
        castElementalSkill('ultimate');
      } else if (code === 'KeyO' || code === 'Enter') {
        triggerOpenNearestDefeatedSlide();
      } else if (code === 'KeyR') {
        resetPlayerPosition();
      } else if (code === 'Equal' || code === 'NumpadAdd') {
        adjustCameraZoom(-1.8);
      } else if (code === 'Minus' || code === 'NumpadSubtract') {
        adjustCameraZoom(1.8);
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
  });

  // 360-DEGREE STABLE SPHERICAL ORBIT CAMERA:
  // Memisahkan sumbu Kiri/Kanan (Yaw), Naik/Turun (Pitch), dan Zoom (Dist) dengan peredam (damping)
  const canvasEl = document.getElementById('gameCanvasContainer');

  window.addEventListener('mousedown', (e) => {
    if (isIntroMode) return;
    if (document.getElementById('slideModalOverlay').classList.contains('active')) return;
    if (e.target.closest('button, a, select, input, .hud-brand-card, .hud-quest-card, .hud-top-right, .teleport-popover, .slide-floating-window, .corpse-unlock-badge')) {
      return;
    }
    isDraggingCamera = true;
    dragMouseButton = e.button;
    dragStartPos = { x: e.clientX, y: e.clientY };
    lastMousePos = { x: e.clientX, y: e.clientY };
    totalDragDist = 0;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingCamera) return;
    const dx = Math.max(-45, Math.min(45, e.clientX - lastMousePos.x));
    const dy = Math.max(-45, Math.min(45, e.clientY - lastMousePos.y));
    lastMousePos = { x: e.clientX, y: e.clientY };
    totalDragDist += Math.hypot(dx, dy);

    // Kiri/Kanan -> targetCameraYaw (360°), Atas/Bawah -> targetCameraPitch (Stabil)
    targetCameraYaw -= dx * 0.007;
    targetCameraPitch = Math.max(0.12, Math.min(1.12, targetCameraPitch + dy * 0.005));
  });

  window.addEventListener('mouseup', () => {
    if (!isDraggingCamera) return;
    isDraggingCamera = false;
    dragMouseButton = -1;
    // Klik/sentuh pada kanvas atau touchpad HANYA untuk kontrol kamera 360°,
    // TIDAK memicu serangan otomatis agar karakter hanya menyerang saat menekan J / K / L!
  });

  // GESTURE 2 JARI DI TOUCHPAD LAPTOP & MOUSE WHEEL (Damped & Clamped agar Tidak Loncat)
  window.addEventListener('wheel', (e) => {
    if (isIntroMode) return;
    if (document.getElementById('slideModalOverlay').classList.contains('active')) return;
    if (e.target.closest('.teleport-popover, .slide-floating-window, #fullCodeModal, #creditsModal')) return;

    e.preventDefault();

    // Normalisasi nilai delta agar tidak pernah meloncat tajam di berbagai perangkat
    const normFactor = e.deltaMode === 1 ? 16 : 1;
    const rawDX = e.deltaX * normFactor;
    const rawDY = e.deltaY * normFactor;
    const clampedDX = Math.max(-36, Math.min(36, rawDX));
    const clampedDY = Math.max(-36, Math.min(36, rawDY));

    // 1. ZOOM IN / ZOOM OUT: Cubit 2 jari di Touchpad (e.ctrlKey) ATAU tahan Shift/Alt + Scroll
    if (e.ctrlKey || e.altKey) {
      const zoomStep = Math.max(-1.2, Math.min(1.2, rawDY * 0.022));
      targetCameraDist = Math.max(8.5, Math.min(26.0, targetCameraDist + zoomStep));
      return;
    }

    // 2. PUTAR KIRI / KANAN 360° (Sumbu Horizontal Touchpad) & NAIK / TURUN (Sumbu Vertikal Touchpad)
    // Dipisahkan secara murni per sumbu agar saat menggeser naik-turun kamera TIDAK goyang ke kiri-kanan!
    targetCameraYaw -= clampedDX * 0.0065;
    targetCameraPitch = Math.max(0.12, Math.min(1.12, targetCameraPitch + clampedDY * 0.0038));
  }, { passive: false });

  // DUKUNGAN TOUCHSCREEN / MULTI-TOUCH (1 Jari Orbit, 2 Jari Pinch Zoom)
  window.addEventListener('touchstart', (e) => {
    if (isIntroMode) return;
    if (document.getElementById('slideModalOverlay').classList.contains('active')) return;
    if (e.touches.length === 2) {
      lastPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isIntroMode) return;
    if (document.getElementById('slideModalOverlay').classList.contains('active')) return;
    if (e.touches.length === 2 && lastPinchDist !== null) {
      const curDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = lastPinchDist - curDist;
      lastPinchDist = curDist;
      targetCameraDist = Math.max(8.5, Math.min(26.0, targetCameraDist + Math.max(-1.0, Math.min(1.0, diff * 0.035))));
    } else if (e.touches.length === 1 && lastTouchPos) {
      const dx = Math.max(-40, Math.min(40, e.touches[0].clientX - lastTouchPos.x));
      const dy = Math.max(-40, Math.min(40, e.touches[0].clientY - lastTouchPos.y));
      lastTouchPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      targetCameraYaw -= dx * 0.007;
      targetCameraPitch = Math.max(0.12, Math.min(1.12, targetCameraPitch + dy * 0.005));
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    lastTouchPos = null;
    lastPinchDist = null;
  });

  canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
}

function adjustCameraZoom(deltaDist) {
  targetCameraDist = Math.max(8.5, Math.min(26.0, targetCameraDist + deltaDist));
}

// Menjaga agar Karakter Utama TIDAK BISA keluar dari Rute Jalan Berkelok
function clampPlayerToRoad(posVec) {
  if (!roadSamplePoints || roadSamplePoints.length === 0) return;

  // Area Bundaran Start Sanctuary (0, 0, 17.5)
  const distToStartHub = Math.hypot(posVec.x - 0, posVec.z - 17.5);

  // Cari titik terdekat di sepanjang garis tengah jalan berkelok
  let nearestPt = roadSamplePoints[0];
  let minDist = Infinity;
  for (let i = 0; i < roadSamplePoints.length; i++) {
    const pt = roadSamplePoints[i];
    const d = Math.hypot(posVec.x - pt.x, posVec.z - pt.z);
    if (d < minDist) {
      minDist = d;
      nearestPt = pt;
    }
  }

  // Lebar jalan = 14.5 unit (batas batu pinggir jalan di 7.1 unit dari tengah).
  // Batasi karakter di dalam radius 6.05 unit dari garis tengah jalan!
  const maxRoadHalfWidth = 6.05;

  if (posVec.z > 13.5 && distToStartHub <= 6.1) {
    return; // Masih di dalam lingkaran Start Sanctuary
  }

  if (minDist > maxRoadHalfWidth) {
    const dx = posVec.x - nearestPt.x;
    const dz = posVec.z - nearestPt.z;
    const len = Math.hypot(dx, dz) || 1;
    posVec.x = nearestPt.x + (dx / len) * maxRoadHalfWidth;
    posVec.z = nearestPt.z + (dz / len) * maxRoadHalfWidth;
  }
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
  playerPos.set(0, 0, 16);
  playerRotY = Math.PI;
  cameraYaw = 0;
  targetCameraYaw = 0;
  cameraPitch = 0.34;
  targetCameraPitch = 0.34;
  cameraDist = 15.5;
  targetCameraDist = 15.5;
  autoWalkTarget = null;
  autoWalkCurveTargetT = null;
}

function findClosestCurveT(posVec) {
  if (!roadCurve) return 0;
  let bestT = 0;
  let bestDist = Infinity;
  const samples = 240;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = roadCurve.getPointAt(t);
    const d = Math.hypot(pt.x - posVec.x, pt.z - posVec.z);
    if (d < bestDist) {
      bestDist = d;
      bestT = t;
    }
  }
  return bestT;
}

function walkToNextUndefeatedPos() {
  CloudAudio.playClick();
  const nextEn = enemyObjects.find(e => !e.defeated) || enemyObjects[0];
  if (nextEn && roadCurve) {
    const stationVec = new THREE.Vector3(nextEn.station.x, 0, nextEn.station.z);
    const targetStationT = findClosestCurveT(stationVec);
    autoWalkCurveTargetT = Math.max(0.02, targetStationT - 0.018);
    autoWalkTarget = roadCurve.getPointAt(autoWalkCurveTargetT);
  }
}

function teleportToPos(idx) {
  CloudAudio.playClick();
  const target = enemyObjects[idx];
  if (!target) return;

  if (roadCurve) {
    const stVec = new THREE.Vector3(target.station.x, 0, target.station.z);
    const stT = findClosestCurveT(stVec);
    const standT = Math.max(0.01, stT - 0.02);
    const standPt = roadCurve.getPointAt(standT);
    playerPos.set(standPt.x, 0, standPt.z);
  } else {
    playerPos.set(target.station.x, 0, target.station.z + 5.8);
  }

  const dx = target.station.x - playerPos.x;
  const dz = target.station.z - playerPos.z;
  playerRotY = Math.atan2(dx, dz);
  autoWalkTarget = null;
  autoWalkCurveTargetT = null;
  document.getElementById('teleportPopover').classList.remove('active');
}

// ============================================================================
// 11. MAIN ANIMATION LOOP (MULTI-JOINTED HERO & MONSTER ANIMATIONS + 360° CAMERA)
// ============================================================================
function gameLoop() {
  requestAnimationFrame(gameLoop);
  const dt = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  if (!isIntroMode) {
    hemiLight.intensity = THREE.MathUtils.lerp(hemiLight.intensity, 0.98, dt * 2.5);
    dirLight.intensity = THREE.MathUtils.lerp(dirLight.intensity, 1.22, dt * 2.5);
    introSpotLight.intensity = THREE.MathUtils.lerp(introSpotLight.intensity, 0.35, dt * 2.0);
  } else if (introRingMesh) {
    introRingMesh.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.025);
  }

  // Player Movement (Camera-Relative WASD + Keyboard 360° Camera Orbit Q/E + Auto-Walk)
  let moveX = 0;
  let moveZ = 0;
  const isModalOpen = document.getElementById('slideModalOverlay').classList.contains('active');

  if (!isIntroMode && !isModalOpen) {
    // Tombol Q & E untuk memutar kamera 360 derajat dari keyboard dengan mulus
    if (keysPressed['KeyQ']) targetCameraYaw += 2.0 * dt;
    if (keysPressed['KeyE']) targetCameraYaw -= 2.0 * dt;

    let inputForward = 0;
    let inputRight = 0;
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) inputForward += 1;
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) inputForward -= 1;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) inputRight -= 1;
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) inputRight += 1;

    if (inputForward !== 0 || inputRight !== 0) {
      // Arah pandang horizontal kamera saat ini
      const forwardX = -Math.sin(cameraYaw);
      const forwardZ = -Math.cos(cameraYaw);
      const rightX = Math.cos(cameraYaw);
      const rightZ = -Math.sin(cameraYaw);

      moveX = forwardX * inputForward + rightX * inputRight;
      moveZ = forwardZ * inputForward + rightZ * inputRight;
    }

    // Curve-Following Auto-Walk
    if (autoWalkCurveTargetT !== null && roadCurve) {
      const currentT = findClosestCurveT(playerPos);
      if (Math.abs(autoWalkCurveTargetT - currentT) > 0.006) {
        const stepDir = autoWalkCurveTargetT > currentT ? 1 : -1;
        const nextSteerT = Math.max(0, Math.min(1, currentT + stepDir * 0.016));
        const steerPt = roadCurve.getPointAt(nextSteerT);
        const toSteer = steerPt.clone().sub(playerPos);
        if (toSteer.length() > 0.2) {
          toSteer.normalize();
          moveX = toSteer.x;
          moveZ = toSteer.z;
        }
      } else {
        autoWalkCurveTargetT = null;
        autoWalkTarget = null;
      }
    }
  }

  const isMoving = Math.hypot(moveX, moveZ) > 0.05;
  if (isMoving) {
    const norm = Math.hypot(moveX, moveZ);
    const speed = 15.5;
    playerPos.x += (moveX / norm) * speed * dt;
    playerPos.z += (moveZ / norm) * speed * dt;

    // BATASI KARAKTER AGAR TIDAK BISA KELUAR DARI RUTE JALAN!
    clampPlayerToRoad(playerPos);

    const targetYaw = Math.atan2(moveX, moveZ);
    let diff = targetYaw - playerRotY;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    playerRotY += diff * Math.min(1, dt * 12);

    walkTime += dt * 12.0;
    if (typeof CloudAudio !== 'undefined' && CloudAudio.playFootstep) {
      CloudAudio.playFootstep();
    }

    // Multi-Jointed Hero Run Cycle (Hips + Knees + Shoulders + Elbows + Torso Twist)
    const swingL = Math.sin(walkTime);
    const swingR = -Math.sin(walkTime);

    playerParts.legL.rotation.x = swingL * 0.68;
    playerParts.legR.rotation.x = swingR * 0.68;
    if (playerParts.kneeL && playerParts.kneeR) {
      playerParts.kneeL.rotation.x = Math.max(0, -swingL) * 0.85 + 0.12;
      playerParts.kneeR.rotation.x = Math.max(0, -swingR) * 0.85 + 0.12;
    }

    playerParts.armL.rotation.x = swingR * 0.55;
    playerParts.armR.rotation.x = swingL * 0.55;
    if (playerParts.elbowL && playerParts.elbowR) {
      playerParts.elbowL.rotation.x = -0.45 - Math.max(0, swingR) * 0.35;
      playerParts.elbowR.rotation.x = -0.45 - Math.max(0, swingL) * 0.35;
    }

    playerParts.torso.position.y = 1.42 + Math.abs(Math.sin(walkTime * 2)) * 0.07;
    playerParts.torso.rotation.y = Math.sin(walkTime) * 0.14;
    playerParts.torso.rotation.x = 0.08;
    playerParts.capeGroup.rotation.x = 0.34 + Math.sin(walkTime * 2) * 0.14;
    playerParts.capeGroup.rotation.z = Math.cos(walkTime) * 0.08;
  } else {
    // Fluid Martial-Arts Breathing Idle Stance
    playerParts.legL.rotation.x = THREE.MathUtils.lerp(playerParts.legL.rotation.x, -0.06, dt * 10);
    playerParts.legR.rotation.x = THREE.MathUtils.lerp(playerParts.legR.rotation.x, 0.06, dt * 10);
    if (playerParts.kneeL && playerParts.kneeR) {
      playerParts.kneeL.rotation.x = THREE.MathUtils.lerp(playerParts.kneeL.rotation.x, 0.12, dt * 10);
      playerParts.kneeR.rotation.x = THREE.MathUtils.lerp(playerParts.kneeR.rotation.x, 0.12, dt * 10);
    }
    playerParts.armL.rotation.x = THREE.MathUtils.lerp(playerParts.armL.rotation.x, -0.15 + Math.sin(elapsed * 2.5) * 0.05, dt * 8);
    playerParts.armR.rotation.x = THREE.MathUtils.lerp(playerParts.armR.rotation.x, -0.15 - Math.sin(elapsed * 2.5) * 0.05, dt * 8);
    if (playerParts.elbowL && playerParts.elbowR) {
      playerParts.elbowL.rotation.x = THREE.MathUtils.lerp(playerParts.elbowL.rotation.x, -0.38, dt * 8);
      playerParts.elbowR.rotation.x = THREE.MathUtils.lerp(playerParts.elbowR.rotation.x, -0.38, dt * 8);
    }
    playerParts.torso.position.y = 1.42 + Math.sin(elapsed * 2.8) * 0.045;
    playerParts.torso.rotation.y = THREE.MathUtils.lerp(playerParts.torso.rotation.y, Math.sin(elapsed * 1.4) * 0.06, dt * 8);
    playerParts.torso.rotation.x = THREE.MathUtils.lerp(playerParts.torso.rotation.x, 0, dt * 8);
    playerParts.capeGroup.rotation.x = 0.1 + Math.sin(elapsed * 2.2) * 0.05;
  }

  // Animate the 5 Lightning Orbs in the Upward Curve Arch behind the Hero's Back
  if (playerParts.lightningOrbs) {
    playerParts.lightningOrbs.forEach((o) => {
      o.orbHolder.position.y = o.baseY + Math.sin(elapsed * 3.6 + o.phase) * 0.08;
      o.cage.rotation.x += dt * 3.2;
      o.cage.rotation.y += dt * 2.6;
      o.ring.rotation.z += dt * 4.2;
    });
  }

  if (playerParts.fireChakram) {
    playerParts.fireChakram.rotation.z -= dt * 2.4;
  }

  playerGroup.position.copy(playerPos);
  playerGroup.rotation.y = playerRotY;

  // 360-DEGREE STABLE SPHERICAL ORBIT CAMERA (Interpolasi Sudut Bola & Fokus Mulus)
  if (isIntroMode) {
    const introCamPos = new THREE.Vector3(0, 11.2, 29.0);
    camera.position.lerp(introCamPos, dt * 4.8);
    camera.lookAt(new THREE.Vector3(0, 1.8, 17.5));
    smoothFocusPos.set(playerPos.x, 1.9, playerPos.z);
  } else {
    // Exponential Damping pada koordinat sudut bola (Yaw, Pitch, Dist) agar 100% stabil tanpa sentakan
    const camSmooth = 1.0 - Math.exp(-12.5 * dt);
    cameraYaw = THREE.MathUtils.lerp(cameraYaw, targetCameraYaw, camSmooth);
    cameraPitch = THREE.MathUtils.lerp(cameraPitch, targetCameraPitch, camSmooth);
    cameraDist = THREE.MathUtils.lerp(cameraDist, targetCameraDist, camSmooth);

    // Fokus kamera mengikuti bahu/dada karakter dengan redaman halus (tidak goyang saat naik/turun/zoom)
    const desiredFocus = new THREE.Vector3(playerPos.x, 1.9, playerPos.z);
    smoothFocusPos.lerp(desiredFocus, 1.0 - Math.exp(-15.0 * dt));

    const horizDist = cameraDist * Math.cos(cameraPitch);
    const vertOffset = cameraDist * Math.sin(cameraPitch);

    camera.position.set(
      smoothFocusPos.x + Math.sin(cameraYaw) * horizDist,
      Math.max(1.15, smoothFocusPos.y + vertOffset),
      smoothFocusPos.z + Math.cos(cameraYaw) * horizDist
    );
    camera.lookAt(smoothFocusPos);
  }

  // Move directional light shadow frustum with player so shadows stay crisp along the whole trail
  dirLight.position.set(playerPos.x + 28, 55, playerPos.z + 25);
  dirLight.target.position.set(playerPos.x, 0, playerPos.z - 10);
  dirLight.target.updateMatrixWorld();

  // Keep the Sky Moon & Star Dome anchored to the sky horizon relative to the player so the Moon is always clearly visible in the sky
  if (skyMoonGroup) {
    skyMoonGroup.position.set(playerPos.x - 24, 29 + Math.sin(elapsed * 0.8) * 0.4, playerPos.z - 96);
    skyMoonGroup.lookAt(camera.position);
  }
  if (skyStarsPoints) {
    skyStarsPoints.position.set(playerPos.x, 0, playerPos.z);
  }

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

  // =========================================================================
  // UPDATE 8 UNIQUE MONSTERS (MULTI-JOINTED SKELETAL ANIMATIONS + VISIBILITY)
  // =========================================================================
  enemyObjects.forEach((en) => {
    const ap = en.animParts;
    if (!en.defeated) {
      // Face the approaching player smoothly
      const dx = playerPos.x - en.station.x;
      const dz = playerPos.z - en.station.z;
      const distToPlayer = Math.hypot(dx, dz);
      if (distToPlayer < 35) {
        const targetRot = Math.atan2(dx, dz);
        en.dummyPivot.rotation.y = THREE.MathUtils.lerp(en.dummyPivot.rotation.y, targetRot, dt * 3.5);
      }

      // Spring Hit Wobble
      const stiffness = 36;
      const damping = 6.5;
      const force = -stiffness * en.wobbleAngle - damping * en.wobbleVel;
      en.wobbleVel += force * dt;
      en.wobbleAngle += en.wobbleVel * dt;
      en.bodyGroup.rotation.x = en.wobbleAngle;

      // 1. 🐍 SERPENT MULTI-VERTEBRA SLITHERING WAVE & HISSING JAW
      if (ap.serpentSpine) {
        ap.serpentSpine.forEach((joint, jIdx) => {
          joint.rotation.z = Math.sin(elapsed * 4.2 - jIdx * 0.55) * 0.14;
          joint.rotation.x = Math.cos(elapsed * 3.2 - jIdx * 0.45) * 0.08;
        });
      }
      if (ap.jawPivot) {
        ap.jawPivot.rotation.x = 0.18 + Math.max(0, Math.sin(elapsed * 3.8 + en.id)) * 0.34;
      }
      if (ap.tongue) {
        ap.tongue.scale.z = 0.6 + Math.abs(Math.sin(elapsed * 9.5)) * 0.75;
      }

      // 2. 🦅 EAGLE & 🐉 DRAGON 2-STAGE ARTICULATED WING FLAPPING (Shoulder + Wrist Phase Lag)
      if (ap.wingL && ap.wingR) {
        const speed = ap.monsterType === 'eagle' ? 5.6 : 3.8;
        const amp = ap.monsterType === 'eagle' ? 0.48 : 0.38;
        const flap = Math.sin(elapsed * speed + en.id) * amp;
        const wristFlex = Math.sin(elapsed * speed + en.id - 0.85) * (amp * 0.75);

        ap.wingL.rotation.z = flap;
        ap.wingR.rotation.z = -flap;
        if (ap.wristL && ap.wristR) {
          ap.wristL.rotation.z = wristFlex;
          ap.wristR.rotation.z = -wristFlex;
        }
      }
      if (ap.hoverGroup) {
        ap.hoverGroup.position.y = 1.95 + Math.sin(elapsed * 5.6) * 0.28;
        ap.hoverGroup.rotation.x = Math.cos(elapsed * 5.6) * 0.08;
      }

      // 3. 🕷️ SPIDER & 🦂 SCORPION 8-LEG ALTERNATING TETRAPOD GAIT + MANDIBLES
      if (ap.spiderLegs) {
        ap.spiderLegs.forEach(leg => {
          const cycle = elapsed * 5.2 + leg.phase;
          leg.coxaPivot.rotation.z = Math.max(0, Math.sin(cycle)) * 0.22 * leg.side;
          leg.coxaPivot.rotation.y += Math.cos(cycle) * 0.003;
          if (leg.kneePivot) {
            leg.kneePivot.rotation.z = -Math.sin(cycle) * 0.25 * leg.side;
          }
        });
      }
      if (ap.spiderRoot) {
        ap.spiderRoot.position.y = 0.88 + Math.sin(elapsed * 5.2) * 0.09;
      }
      if (ap.mandibles) {
        ap.mandibles.forEach(m => {
          m.pivot.rotation.y = Math.sin(elapsed * 4.5) * 0.28 * m.side;
        });
      }

      // 4. 🐺 WOLF PROWLING LEGS & EARS
      if (ap.wolfLegs) {
        ap.wolfLegs.forEach(wl => {
          wl.legPivot.rotation.x = Math.sin(elapsed * 3.6 + wl.phase) * 0.16;
        });
      }

      // 5. 🦂 SCORPION MULTI-JOINT STINGER TAIL WHIP & PINCER CLAW SNAPPING
      if (ap.scorpionTailJoints) {
        ap.scorpionTailJoints.forEach((tj, idx) => {
          tj.rotation.x = Math.sin(elapsed * 3.4 - idx * 0.35) * 0.11;
          tj.rotation.z = Math.cos(elapsed * 2.2 + idx * 0.3) * 0.05;
        });
      }
      if (ap.pincerClaws) {
        ap.pincerClaws.forEach(pc => {
          pc.armPivot.rotation.y = Math.sin(elapsed * 2.8) * 0.16 * pc.side;
          pc.innerClawPivot.rotation.y = (0.18 + Math.max(0, Math.sin(elapsed * 5.0)) * 0.35) * pc.side;
        });
      }

      // 6. 👹 MINOTAUR MULTI-JOINTED ARMS, ELBOWS & 5-FINGERED HANDS (Swinging Battle Axe & War Fist)
      if (ap.minoArms) {
        ap.minoArms.forEach(arm => {
          if (arm.side === 1) {
            // Tangan Kanan mengayunkan Kapak Perang Raksasa dengan gagah
            arm.shoulderPivot.rotation.x = -0.35 + Math.sin(elapsed * 3.0) * 0.28;
            arm.shoulderPivot.rotation.z = -0.12 + Math.cos(elapsed * 1.8) * 0.08;
            arm.elbowPivot.rotation.x = -0.45 + Math.cos(elapsed * 3.0) * 0.22;
            arm.handGroup.rotation.z = Math.sin(elapsed * 3.0) * 0.15;
          } else {
            // Tangan Kiri mengepal/membuka cakar siap menghantam
            arm.shoulderPivot.rotation.x = -0.25 - Math.sin(elapsed * 3.0) * 0.22;
            arm.shoulderPivot.rotation.z = 0.12 - Math.cos(elapsed * 1.8) * 0.08;
            arm.elbowPivot.rotation.x = -0.55 + Math.sin(elapsed * 3.0) * 0.20;
            arm.handGroup.rotation.y = Math.cos(elapsed * 3.5) * 0.18;
          }
        });
      }

      // 7. 🐙 KRAKEN GURITA RAKSASA COKLAT (Mantle Breathing & 8 Multi-Jointed Tentacles Curling)
      if (ap.octopusMantle) {
        const breathe = 1.0 + Math.sin(elapsed * 2.6) * 0.055;
        ap.octopusMantle.scale.set(breathe, 1.0 + Math.cos(elapsed * 2.6) * 0.04, breathe);
        ap.octopusMantle.rotation.x = -0.32 + Math.sin(elapsed * 1.8) * 0.06;
      }
      if (ap.octopusArms) {
        ap.octopusArms.forEach(oa => {
          const w1 = Math.sin(elapsed * 2.8 + oa.phase);
          const w2 = Math.sin(elapsed * 2.8 + oa.phase - 0.9);
          const w3 = Math.sin(elapsed * 2.8 + oa.phase - 1.8);
          oa.joint1.rotation.x = w1 * 0.14;
          oa.joint1.rotation.z = Math.cos(elapsed * 2.1 + oa.phase) * 0.10;
          oa.joint2.rotation.x = w2 * 0.22;
          oa.joint2.rotation.z = Math.sin(elapsed * 2.4 + oa.phase) * 0.16;
          oa.joint3.rotation.x = w3 * 0.32;
          oa.joint3.rotation.z = Math.cos(elapsed * 3.1 + oa.phase) * 0.24;
        });
      }

      // General Head, Tail & Core animations
      if (ap.headPivot) {
        ap.headPivot.rotation.y = Math.sin(elapsed * 2.2 + en.id) * 0.22;
      }
      if (ap.tailGroup) {
        ap.tailGroup.rotation.y = Math.sin(elapsed * 3.4 + en.id) * 0.26;
        ap.tailGroup.rotation.x = Math.cos(elapsed * 2.6 + en.id) * 0.12;
      }
      if (ap.heartCore) {
        ap.heartCore.rotation.y += dt * 3.0;
        ap.heartCore.scale.setScalar(1 + Math.sin(elapsed * 5) * 0.12);
      }
    } else {
      // Defeated Corpse State
      en.collapseProgress = Math.min(1, en.collapseProgress + dt * 3.2);
      en.bodyGroup.rotation.x = THREE.MathUtils.lerp(0, 1.32, en.collapseProgress);
      en.bodyGroup.position.y = THREE.MathUtils.lerp(0.32, 0.08, en.collapseProgress);
      en.unlockCrystal.rotation.y += dt * 2.8;
      en.unlockCrystal.position.y = 3.5 + Math.sin(elapsed * 3 + en.id) * 0.22;
    }

    // Project 3D Label to Screen — HANYA TAMPIL JIKA KARAKTER SUDAH DEKAT (< 34 unit)
    // agar Pos berikutnya di balik tikungan tidak langsung terlihat!
    if (isIntroMode) {
      en.labelEl.style.opacity = '0';
    } else {
      const worldPos = new THREE.Vector3(en.station.x, 4.2 * en.station.scale, en.station.z);
      const distToPlayer = playerPos.distanceTo(new THREE.Vector3(en.station.x, 0, en.station.z));
      worldPos.project(camera);

      if (worldPos.z < 1 && distToPlayer < 32) {
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
