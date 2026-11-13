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

// 360-Degree Orbit Camera State
let cameraYaw = 0;       // 0 = Kamera di belakang karakter menghadap -Z (360° penuh)
let cameraPitch = 0.50;  // Sudut vertikal kamera
let cameraDist = 17.5;   // Jarak zoom kamera dari karakter
let isDraggingCamera = false;
let dragMouseButton = -1;
let dragStartPos = { x: 0, y: 0 };
let lastMousePos = { x: 0, y: 0 };
let totalDragDist = 0;

let hemiLight, dirLight, introSpotLight, introRingMesh;

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
  // Fog diatur agar Pos yang jauh di balik tikungan tertutup kabut atmosferik
  scene.fog = new THREE.FogExp2(0x130e26, 0.0135);

  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 260);
  camera.position.set(0, 13.5, 31.0);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  setupLighting();
  buildWindingRoadAndScenery();
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
  // POS 1: 🐍 ULAR KOBRA ABYSSAL (Articulated Multi-Vertebra S-Curve Spine,
  //        Sculpted Flared Cobra Hood, Hinged Jaw & Flickering Forked Tongue)
  // -------------------------------------------------------------------------
  if (st.monsterType === 'serpent') {
    // Coiled tail base using smooth organic spline tube
    const baseCoilPts = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      const angle = t * Math.PI * 3.6;
      const radius = 1.35 * (1 - t * 0.52);
      baseCoilPts.push(new THREE.Vector3(Math.cos(angle) * radius, t * 0.95 + 0.14, Math.sin(angle) * radius));
    }
    const baseCoilMesh = createOrganicTube(baseCoilPts, (u) => 0.32 * (1 - u * 0.22), 48, 14, primaryMat);
    bodyGroup.add(baseCoilMesh);

    // Articulated upper spine chain (10 joints rising in an S-curve so it slithers dynamically!)
    animParts.serpentSpine = [];
    let parentNode = bodyGroup;
    const spineOffsets = [
      [0, 0.95, 0],
      [0, 0.24, -0.06],
      [0, 0.24, -0.05],
      [0, 0.24, 0.02],
      [0, 0.24, 0.06],
      [0, 0.22, 0.08],
      [0, 0.20, 0.06],
      [0, 0.18, 0.04]
    ];

    spineOffsets.forEach((off, idx) => {
      const joint = new THREE.Group();
      joint.position.set(off[0], off[1], off[2]);

      const r = 0.26 * (1 - idx * 0.045);
      const segPts = [new THREE.Vector3(0, -0.04, 0), new THREE.Vector3(0, 0.22, 0)];
      const segMesh = createOrganicTube(segPts, () => r, 6, 12, idx % 2 === 0 ? primaryMat : secondaryMat);
      joint.add(segMesh);

      // Ventral belly scute
      const scute = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r * 0.85, 0.18, 8), bellyMat);
      scute.position.set(0, 0.09, r * 0.38);
      scute.scale.set(0.85, 1, 0.45);
      joint.add(scute);

      // Flared Sculpted Cobra Hood on upper neck segments (idx 4, 5, 6)
      if (idx >= 4 && idx <= 6) {
        const hoodSpan = idx === 5 ? 0.95 : 0.72;
        const hoodPts = [
          new THREE.Vector3(-hoodSpan, 0.08, -0.08),
          new THREE.Vector3(-hoodSpan * 0.55, 0.12, 0.06),
          new THREE.Vector3(0, 0.14, 0.10),
          new THREE.Vector3(hoodSpan * 0.55, 0.12, 0.06),
          new THREE.Vector3(hoodSpan, 0.08, -0.08)
        ];
        const hoodRib = createOrganicTube(hoodPts, (u) => 0.16 * Math.sin(u * Math.PI) + 0.05, 16, 10, primaryMat, 1.0, 1.8);
        joint.add(hoodRib);

        if (idx === 5) {
          [-0.48, 0.48].forEach(hx => {
            const hoodMark = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), accentMat);
            hoodMark.scale.set(1.2, 1.6, 0.35);
            hoodMark.position.set(hx, 0.12, 0.12);
            joint.add(hoodMark);
          });
        }
      }

      parentNode.add(joint);
      parentNode = joint;
      animParts.serpentSpine.push(joint);
    });

    // Sculpted Viper Head & Hinged Lower Jaw attached to top neck joint
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.22, 0.08);

    const skullPts = [
      new THREE.Vector3(0, 0, -0.18),
      new THREE.Vector3(0, 0.08, 0.12),
      new THREE.Vector3(0, 0.02, 0.48)
    ];
    const upperSkull = createOrganicTube(skullPts, (u) => 0.28 * (1 - u * 0.48), 10, 12, primaryMat, 1.35, 0.72);
    headPivot.add(upperSkull);

    // Glowing Viper Eyes & Brow Ridges
    [-0.18, 0.18].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), accentMat);
      eye.scale.set(0.8, 1.2, 1.3);
      eye.position.set(ex, 0.11, 0.18);
      headPivot.add(eye);
    });

    // Curved Venom Fangs
    [-0.11, 0.11].forEach(fx => {
      const fangPts = [
        new THREE.Vector3(fx, 0.02, 0.34),
        new THREE.Vector3(fx, -0.12, 0.38),
        new THREE.Vector3(fx, -0.22, 0.32)
      ];
      const fang = createOrganicTube(fangPts, (u) => 0.038 * (1 - u * 0.85), 8, 8, boneMat);
      headPivot.add(fang);
    });

    // Hinged Lower Jaw
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.04, 0.02);
    const jawPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.06, 0.22),
      new THREE.Vector3(0, -0.04, 0.44)
    ];
    const lowerJaw = createOrganicTube(jawPts, (u) => 0.21 * (1 - u * 0.52), 8, 10, bellyMat, 1.2, 0.55);
    jawPivot.add(lowerJaw);

    // Forked Tongue
    const tongueGroup = new THREE.Group();
    tongueGroup.position.set(0, -0.02, 0.38);
    [-0.06, 0.06].forEach(tx => {
      const tPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(tx * 0.5, -0.02, 0.22), new THREE.Vector3(tx * 1.4, -0.05, 0.42)];
      tongueGroup.add(createOrganicTube(tPts, (u) => 0.022 * (1 - u * 0.7), 8, 6, accentMat));
    });
    jawPivot.add(tongueGroup);
    animParts.tongue = tongueGroup;

    headPivot.add(jawPivot);
    animParts.jawPivot = jawPivot;
    animParts.headPivot = headPivot;
    parentNode.add(headPivot);
  }

  // -------------------------------------------------------------------------
  // POS 2: 🦅 ELANG BADAI PETIR (Sculpted Avian Body, 2-Stage Articulated
  //        Feathered Wings with 12 Individual Feathers, Fanned Tail & Talons)
  // -------------------------------------------------------------------------
  else if (st.monsterType === 'eagle') {
    const hoverGroup = new THREE.Group();
    hoverGroup.position.y = 1.95;

    // Aerodynamic Sculpted Bird Torso
    const bodyPts = [
      new THREE.Vector3(0, -0.55, -0.65),
      new THREE.Vector3(0, -0.15, -0.15),
      new THREE.Vector3(0, 0.25, 0.35),
      new THREE.Vector3(0, 0.58, 0.52)
    ];
    const torso = createOrganicTube(bodyPts, (u) => 0.46 * Math.sin(u * Math.PI * 0.85 + 0.2), 16, 14, primaryMat, 1.15, 1.0);
    hoverGroup.add(torso);

    // Layered Golden Breast Plumage
    const breast = createSculptedMesh(new THREE.SphereGeometry(0.44, 14, 14), 0.1, bellyMat, 0.95, 1.15, 0.85);
    breast.position.set(0, 0.18, 0.38);
    hoverGroup.add(breast);

    // Sculpted Raptor Head & Hooked Predatory Beak
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.68, 0.52);

    const headSculpt = createSculptedMesh(new THREE.SphereGeometry(0.32, 14, 14), 0.08, boneMat, 0.92, 0.95, 1.18);
    headPivot.add(headSculpt);

    // Hooked Upper Beak (Curved downward tip!)
    const beakPts = [
      new THREE.Vector3(0, 0.04, 0.22),
      new THREE.Vector3(0, 0.02, 0.48),
      new THREE.Vector3(0, -0.12, 0.64)
    ];
    const beakMesh = createOrganicTube(beakPts, (u) => 0.14 * (1 - u * 0.88), 10, 10, primaryMat, 0.85, 1.1);
    headPivot.add(beakMesh);

    // Fierce Storm Eyes
    [-0.16, 0.16].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), accentMat);
      eye.position.set(ex, 0.08, 0.22);
      headPivot.add(eye);
    });

    hoverGroup.add(headPivot);
    animParts.headPivot = headPivot;

    // 2-STAGE ARTICULATED FEATHERED WINGS (Shoulder -> Inner Wing -> Wrist -> Outer Wing)
    function buildArticulatedEagleWing(sideSign) {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(sideSign * 0.38, 0.32, 0.12);

      // Leading edge inner arm bone
      const innerBonePts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(sideSign * 0.65, 0.18, 0.08),
        new THREE.Vector3(sideSign * 1.25, 0.22, 0.04)
      ];
      shoulderPivot.add(createOrganicTube(innerBonePts, (u) => 0.13 * (1 - u * 0.3), 10, 8, primaryMat));

      // 6 Secondary Feathers along Inner Wing
      for (let f = 0; f < 6; f++) {
        const u = (f + 0.5) / 6;
        const fx = sideSign * (0.22 + u * 0.98);
        const fy = 0.05 + u * 0.15;
        const featherLen = 0.85 + f * 0.08;
        const fPts = [
          new THREE.Vector3(fx, fy, 0.04),
          new THREE.Vector3(fx + sideSign * 0.08, fy - 0.06, -featherLen * 0.5),
          new THREE.Vector3(fx + sideSign * 0.14, fy - 0.12, -featherLen)
        ];
        const fMat = f % 2 === 0 ? primaryMat : secondaryMat;
        shoulderPivot.add(createOrganicTube(fPts, (t) => 0.095 * (1 - t * 0.75), 8, 6, fMat, 1.6, 0.25));
      }

      // Outer Wrist Joint Pivot (Flexes with phase lag!)
      const wristPivot = new THREE.Group();
      wristPivot.position.set(sideSign * 1.25, 0.22, 0.04);

      const outerBonePts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(sideSign * 0.75, 0.08, -0.12),
        new THREE.Vector3(sideSign * 1.45, -0.05, -0.35)
      ];
      wristPivot.add(createOrganicTube(outerBonePts, (u) => 0.09 * (1 - u * 0.65), 10, 8, primaryMat));

      // 7 Fanned Primary Flight Feathers
      for (let p = 0; p < 7; p++) {
        const u = p / 6;
        const px = sideSign * (0.15 + u * 1.15);
        const pz = -u * 0.25;
        const fanAngle = (0.15 + u * 0.55) * sideSign;
        const len = 1.25 - u * 0.22;
        const pPts = [
          new THREE.Vector3(px, 0, pz),
          new THREE.Vector3(px + Math.sin(fanAngle) * len * 0.5, -0.05, pz - Math.cos(fanAngle) * len * 0.5),
          new THREE.Vector3(px + Math.sin(fanAngle) * len, -0.10, pz - Math.cos(fanAngle) * len)
        ];
        const pMat = p >= 4 ? accentMat : (p % 2 === 0 ? primaryMat : boneMat);
        wristPivot.add(createOrganicTube(pPts, (t) => 0.085 * (1 - t * 0.82), 8, 6, pMat, 1.8, 0.22));
      }

      shoulderPivot.add(wristPivot);
      return { shoulderPivot, wristPivot };
    }

    const wingLeft = buildArticulatedEagleWing(-1);
    const wingRight = buildArticulatedEagleWing(1);
    hoverGroup.add(wingLeft.shoulderPivot);
    hoverGroup.add(wingRight.shoulderPivot);
    animParts.wingL = wingLeft.shoulderPivot;
    animParts.wingR = wingRight.shoulderPivot;
    animParts.wristL = wingLeft.wristPivot;
    animParts.wristR = wingRight.wristPivot;

    // Fanned 7-Feather Tail
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, -0.48, -0.58);
    for (let t = -3; t <= 3; t++) {
      const a = t * 0.16;
      const tPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.sin(a) * 0.45, -0.12, -Math.cos(a) * 0.45),
        new THREE.Vector3(Math.sin(a) * 0.92, -0.22, -Math.cos(a) * 0.92)
      ];
      tailPivot.add(createOrganicTube(tPts, (u) => 0.08 * (1 - u * 0.65), 8, 6, t % 2 === 0 ? secondaryMat : primaryMat, 1.7, 0.22));
    }
    hoverGroup.add(tailPivot);
    animParts.tailGroup = tailPivot;

    // Articulated Raptor Legs & Curved Grasping Talons
    [-0.24, 0.24].forEach(lx => {
      const legPts = [new THREE.Vector3(lx, -0.22, 0.15), new THREE.Vector3(lx, -0.58, 0.28), new THREE.Vector3(lx, -0.82, 0.22)];
      hoverGroup.add(createOrganicTube(legPts, (u) => 0.11 * (1 - u * 0.45), 8, 8, primaryMat));
      [-0.07, 0, 0.07].forEach(cx => {
        const clawPts = [
          new THREE.Vector3(lx + cx, -0.82, 0.22),
          new THREE.Vector3(lx + cx * 1.3, -0.92, 0.38),
          new THREE.Vector3(lx + cx * 1.4, -1.04, 0.28)
        ];
        hoverGroup.add(createOrganicTube(clawPts, (u) => 0.032 * (1 - u * 0.85), 6, 6, secondaryMat));
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
  // POS 4: 🐺 SERIGALA FENRIR (Sculpted Lupine Spine, Frost-Fur Mane,
  //        4 Digitigrade Articulated Wolf Legs, Snarling Jaw & Bushy S-Tail)
  // -------------------------------------------------------------------------
  else if (st.monsterType === 'wolf') {
    const wolfRoot = new THREE.Group();
    wolfRoot.position.y = 0.05;

    // Anatomical Lupine Spine (Deep Ribcage tapering to Waist & Muscular Haunches)
    const spinePts = [
      new THREE.Vector3(0, 1.18, -0.82),
      new THREE.Vector3(0, 1.15, -0.25),
      new THREE.Vector3(0, 1.28, 0.38),
      new THREE.Vector3(0, 1.52, 0.78)
    ];
    const torsoMesh = createOrganicTube(
      spinePts,
      (u) => 0.36 + 0.14 * Math.sin(u * Math.PI * 1.1),
      18,
      14,
      secondaryMat,
      0.95,
      1.15
    );
    wolfRoot.add(torsoMesh);

    // Sculpted Frost-Fur Mane Shards around Neck & Shoulders
    for (let m = 0; m < 10; m++) {
      const a = (m / 10) * Math.PI * 2;
      const mPts = [
        new THREE.Vector3(Math.cos(a) * 0.32, 1.38 + Math.sin(a) * 0.28, 0.55),
        new THREE.Vector3(Math.cos(a) * 0.58, 1.48 + Math.sin(a) * 0.42, 0.25),
        new THREE.Vector3(Math.cos(a) * 0.68, 1.52 + Math.sin(a) * 0.48, -0.05)
      ];
      wolfRoot.add(createOrganicTube(mPts, (u) => 0.14 * (1 - u * 0.85), 8, 6, primaryMat));
    }

    // Sculpted Wolf Head, Muzzle, Pointed Ears & Hinged Snarling Jaw
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 1.68, 0.88);

    const skullPts = [
      new THREE.Vector3(0, 0, -0.15),
      new THREE.Vector3(0, 0.06, 0.18),
      new THREE.Vector3(0, -0.02, 0.62)
    ];
    headPivot.add(createOrganicTube(skullPts, (u) => 0.31 * (1 - u * 0.52), 12, 12, secondaryMat, 1.05, 0.92));

    // Pointed Lupine Ears
    [-0.2, 0.2].forEach(ex => {
      const earPts = [
        new THREE.Vector3(ex, 0.22, -0.02),
        new THREE.Vector3(ex * 1.35, 0.48, -0.08),
        new THREE.Vector3(ex * 1.45, 0.65, -0.12)
      ];
      headPivot.add(createOrganicTube(earPts, (u) => 0.11 * (1 - u * 0.85), 8, 8, primaryMat));
    });

    // Glowing Ice Eyes
    [-0.15, 0.15].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), accentMat);
      eye.position.set(ex, 0.12, 0.24);
      headPivot.add(eye);
    });

    // Hinged Lower Wolf Jaw with Fangs
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.1, 0.08);
    const jawPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.06, 0.46)];
    jawPivot.add(createOrganicTube(jawPts, (u) => 0.18 * (1 - u * 0.52), 8, 10, secondaryMat, 0.95, 0.55));
    [-0.08, 0.08].forEach(fx => {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.14, 6), boneMat);
      fang.position.set(fx, 0.04, 0.38);
      jawPivot.add(fang);
    });
    headPivot.add(jawPivot);
    animParts.jawPivot = jawPivot;
    animParts.headPivot = headPivot;
    wolfRoot.add(headPivot);

    // 4 Articulated Digitigrade Wolf Legs
    animParts.wolfLegs = [];
    const legConfigs = [
      { x: -0.34, y: 1.18, z: 0.55, isFront: true, phase: 0 },
      { x:  0.34, y: 1.18, z: 0.55, isFront: true, phase: Math.PI },
      { x: -0.36, y: 1.16, z: -0.68, isFront: false, phase: Math.PI },
      { x:  0.36, y: 1.16, z: -0.68, isFront: false, phase: 0 }
    ];
    legConfigs.forEach(cfg => {
      const legPivot = new THREE.Group();
      legPivot.position.set(cfg.x, cfg.y, cfg.z);

      const legPts = cfg.isFront
        ? [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.58, -0.06), new THREE.Vector3(0, -1.12, 0.08), new THREE.Vector3(0, -1.16, 0.24)]
        : [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.52, 0.16), new THREE.Vector3(0, -0.82, -0.14), new THREE.Vector3(0, -1.14, 0.08), new THREE.Vector3(0, -1.16, 0.24)];

      legPivot.add(createOrganicTube(legPts, (u) => 0.17 * (1 - u * 0.48), 14, 10, secondaryMat));
      wolfRoot.add(legPivot);
      animParts.wolfLegs.push({ legPivot, phase: cfg.phase });
    });

    // Bushy S-Curved Wolf Tail
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 1.22, -0.85);
    const tailPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.18, -0.48),
      new THREE.Vector3(0, -0.05, -0.98),
      new THREE.Vector3(0, 0.08, -1.38)
    ];
    tailPivot.add(createOrganicTube(tailPts, (u) => 0.24 * Math.sin(u * Math.PI * 0.85 + 0.25), 14, 10, primaryMat));
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
  // POS 6: 👹 MINOTAUR DATASET (Sculpted Muscular V-Torso, Digitigrade Hoofed
  //        Beast Legs, Spiral Bull Horns, Snorting Bull Head & Battle Axe)
  // -------------------------------------------------------------------------
  else if (st.monsterType === 'minotaur') {
    // 1. Digitigrade Cloven-Hoofed Beast Legs
    animParts.minotaurLegs = [];
    [-1, 1].forEach(side => {
      const legPivot = new THREE.Group();
      legPivot.position.set(side * 0.48, 1.32, 0);
      const legPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.05, -0.58, 0.16),
        new THREE.Vector3(0, -0.95, -0.14),
        new THREE.Vector3(0, -1.30, 0.08)
      ];
      legPivot.add(createOrganicTube(legPts, (u) => 0.28 * (1 - u * 0.38), 12, 12, secondaryMat));
      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.22, 10), boneMat);
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
    const chestMesh = new THREE.Mesh(new THREE.LatheGeometry(minoLathe, 18), primaryMat);
    chestMesh.scale.set(1.18, 1.0, 0.82);
    chestMesh.castShadow = true;
    torsoGroup.add(chestMesh);

    // Sculpted Pectoral & Shoulder Deltoid Muscle Plates
    [-0.32, 0.32].forEach(px => {
      const pec = createSculptedMesh(new THREE.SphereGeometry(0.34, 12, 12), 0.08, primaryMat, 1.15, 0.82, 0.75);
      pec.position.set(px, 0.34, 0.36);
      torsoGroup.add(pec);
    });

    // Champion Spiked War Belt
    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.08, 10, 20), secondaryMat);
    belt.rotation.x = Math.PI / 2;
    belt.scale.set(1.18, 0.82, 1.0);
    belt.position.y = -0.45;
    torsoGroup.add(belt);

    // 3. Ferocious Bull Head, Spiral 3D Horns & Gold Nose Ring
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.86, 0.24);

    const skullPts = [
      new THREE.Vector3(0, 0.08, -0.18),
      new THREE.Vector3(0, 0.02, 0.18),
      new THREE.Vector3(0, -0.12, 0.62)
    ];
    headPivot.add(createOrganicTube(skullPts, (u) => 0.42 * (1 - u * 0.38), 12, 12, secondaryMat, 1.05, 0.92));

    // Gold Bull Nose Ring
    const noseRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.038, 10, 20), accentMat);
    noseRing.position.set(0, -0.22, 0.66);
    noseRing.rotation.x = 0.35;
    headPivot.add(noseRing);

    // Glowing Rage Eyes
    [-0.22, 0.22].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), accentMat);
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

    // 4. Muscular Articulated Arms + Colossal Double-Bladed Battle Axe
    [-1, 1].forEach(side => {
      const armPivot = new THREE.Group();
      armPivot.position.set(side * 0.86, 0.48, 0);

      const armPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.18, -0.52, 0.12),
        new THREE.Vector3(side * 0.08, -1.02, 0.42)
      ];
      armPivot.add(createOrganicTube(armPts, (u) => 0.26 * (1 - u * 0.28), 12, 10, primaryMat));

      if (side === 1) {
        // Colossal Double-Bitted Labrys Battle Axe in Right Hand
        const axeGroup = new THREE.Group();
        axeGroup.position.set(0.08, -0.98, 0.45);
        axeGroup.rotation.x = Math.PI / 2.3;

        const handlePts = [new THREE.Vector3(0, -1.35, 0), new THREE.Vector3(0, 1.65, 0)];
        axeGroup.add(createOrganicTube(handlePts, () => 0.065, 10, 8, boneMat));

        // Curved Crescent Axe Blades
        [-1, 1].forEach(bSide => {
          const bladePts = [
            new THREE.Vector3(bSide * 0.12, 0.75, 0),
            new THREE.Vector3(bSide * 0.68, 1.15, 0),
            new THREE.Vector3(bSide * 0.12, 1.55, 0)
          ];
          axeGroup.add(createOrganicTube(bladePts, (u) => 0.22 * Math.sin(u * Math.PI) + 0.04, 12, 8, accentMat, 1.8, 0.18));
        });
        armPivot.add(axeGroup);
        animParts.wingR = armPivot;
      } else {
        animParts.wingL = armPivot;
      }

      torsoGroup.add(armPivot);
    });

    bodyGroup.add(torsoGroup);
  }

  // -------------------------------------------------------------------------
  // POS 7: 🐙 HYDRA KRAKEN (Coiled Sea-Serpent Base, 3 Multi-Jointed Sinuous
  //        Dragon-Serpent Necks with Finned Skulls & 6 Writhing Tentacles)
  // -------------------------------------------------------------------------
  else if (st.monsterType === 'hydra') {
    // Coiled Abyssal Serpent Lower Body
    const coilPts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const a = t * Math.PI * 3.0;
      const r = 1.25 * (1 - t * 0.45);
      coilPts.push(new THREE.Vector3(Math.cos(a) * r, t * 1.15 + 0.15, Math.sin(a) * r));
    }
    bodyGroup.add(createOrganicTube(coilPts, (u) => 0.42 * (1 - u * 0.25), 36, 14, secondaryMat));

    // 6 Writhing Tapered Kraken Tentacles around Base
    animParts.tentacles = [];
    for (let t = 0; t < 6; t++) {
      const a = (t / 6) * Math.PI * 2;
      const tentPivot = new THREE.Group();
      tentPivot.position.set(Math.cos(a) * 0.95, 0.25, Math.sin(a) * 0.95);
      tentPivot.rotation.y = -a + Math.PI / 2;

      const tPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.48, 0.55),
        new THREE.Vector3(0, 0.95, 0.85),
        new THREE.Vector3(0, 1.38, 0.62)
      ];
      tentPivot.add(createOrganicTube(tPts, (u) => 0.22 * (1 - u * 0.85), 14, 10, primaryMat));
      bodyGroup.add(tentPivot);
      animParts.tentacles.push({ tentPivot, phase: t * 1.05 });
    }

    // 3 Independent Multi-Jointed Serpentine Hydra Necks & Heads
    animParts.hydraNeckChains = [];
    const headBaseConfigs = [
      { x: -0.58, z: 0.12, yaw: 0.38, phase: 0.0 },
      { x:  0.00, z: 0.25, yaw: 0.00, phase: 2.1 },
      { x:  0.58, z: 0.12, yaw: -0.38, phase: 4.2 }
    ];

    headBaseConfigs.forEach(cfg => {
      const chain = [];
      let parent = bodyGroup;
      const jointCount = 5;

      for (let j = 0; j < jointCount; j++) {
        const jNode = new THREE.Group();
        if (j === 0) {
          jNode.position.set(cfg.x, 1.05, cfg.z);
          jNode.rotation.y = cfg.yaw;
        } else {
          jNode.position.set(0, 0.36, (j === 1 || j === 2) ? -0.06 : 0.08);
        }

        const r = 0.24 * (1 - j * 0.06);
        const segPts = [new THREE.Vector3(0, -0.04, 0), new THREE.Vector3(0, 0.38, 0)];
        jNode.add(createOrganicTube(segPts, () => r, 6, 10, j % 2 === 0 ? primaryMat : secondaryMat));

        // Dorsal sea-dragon spine fin
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 5), accentMat);
        fin.position.set(0, 0.18, -r * 0.95);
        fin.rotation.x = -Math.PI / 2.4;
        jNode.add(fin);

        parent.add(jNode);
        parent = jNode;
        chain.push(jNode);
      }

      // Sculpted Leviathan Head & Hinged Snapping Jaw at tip of neck chain
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.36, 0.08);

      const hPts = [new THREE.Vector3(0, 0, -0.15), new THREE.Vector3(0, 0.08, 0.18), new THREE.Vector3(0, 0, 0.56)];
      headGroup.add(createOrganicTube(hPts, (u) => 0.28 * (1 - u * 0.45), 10, 12, primaryMat, 1.15, 0.85));

      // Finned Side Frills
      [-1, 1].forEach(s => {
        const frillPts = [new THREE.Vector3(s * 0.18, 0.08, 0), new THREE.Vector3(s * 0.48, 0.24, -0.18)];
        headGroup.add(createOrganicTube(frillPts, (u) => 0.12 * (1 - u * 0.7), 6, 6, accentMat, 1.6, 0.25));
      });

      // Glowing Eyes
      [-0.16, 0.16].forEach(ex => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 8), accentMat);
        eye.position.set(ex, 0.12, 0.22);
        headGroup.add(eye);
      });

      // Hinged Lower Jaw
      const jawPivot = new THREE.Group();
      jawPivot.position.set(0, -0.06, 0.05);
      const jPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.06, 0.46)];
      jawPivot.add(createOrganicTube(jPts, (u) => 0.2 * (1 - u * 0.55), 8, 10, secondaryMat, 1.0, 0.55));
      headGroup.add(jawPivot);

      parent.add(headGroup);
      animParts.hydraNeckChains.push({ chain, jawPivot, phase: cfg.phase });
    });
  }

  // -------------------------------------------------------------------------
  // POS 8: 🐉 RAJA NAGA BAHAMUT (Final Boss: Sinuous S-Curved Dragon Body,
  //        Articulated Neck, Horned Dragon Skull with Fiery Hinged Jaw,
  //        2 Colossal Multi-Fingered Bat-Wings & Whipping Dragon Tail)
  // -------------------------------------------------------------------------
  else {
    const dragonRoot = new THREE.Group();

    // 1. Sinuous S-Curved Dragon Body (Chest -> Mid-Torso -> Haunches)
    const bodyPts = [
      new THREE.Vector3(0, 0.85, -1.05),
      new THREE.Vector3(0, 1.25, -0.35),
      new THREE.Vector3(0, 1.85, 0.25),
      new THREE.Vector3(0, 2.38, 0.48)
    ];
    const dragonBody = createOrganicTube(
      bodyPts,
      (u) => 0.58 * Math.sin(u * Math.PI * 0.85 + 0.22),
      22,
      16,
      secondaryMat,
      1.12,
      1.05
    );
    dragonRoot.add(dragonBody);

    // Golden Armored Ventral Belly Scales
    const bellyPts = [
      new THREE.Vector3(0, 0.92, -0.75),
      new THREE.Vector3(0, 1.32, -0.12),
      new THREE.Vector3(0, 1.88, 0.42),
      new THREE.Vector3(0, 2.32, 0.62)
    ];
    dragonRoot.add(createOrganicTube(bellyPts, (u) => 0.44 * Math.sin(u * Math.PI * 0.85 + 0.2), 18, 12, primaryMat, 0.95, 0.65));

    // Glowing Dragon Heart Core
    const heartCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 1), accentMat);
    heartCore.position.set(0, 1.98, 0.68);
    dragonRoot.add(heartCore);
    animParts.heartCore = heartCore;

    // 2. 4 Clawed Muscular Dragon Legs
    [
      [-0.58, 1.15, -0.55],
      [ 0.58, 1.15, -0.55],
      [-0.52, 1.82,  0.32],
      [ 0.52, 1.82,  0.32]
    ].forEach(([lx, ly, lz], idx) => {
      const isRear = idx < 2;
      const legPts = isRear
        ? [new THREE.Vector3(lx, ly, lz), new THREE.Vector3(lx * 1.25, 0.58, lz + 0.22), new THREE.Vector3(lx * 1.1, 0.08, lz + 0.48)]
        : [new THREE.Vector3(lx, ly, lz), new THREE.Vector3(lx * 1.35, 1.35, lz + 0.35), new THREE.Vector3(lx * 1.15, 0.95, lz + 0.68)];
      dragonRoot.add(createOrganicTube(legPts, (u) => (isRear ? 0.28 : 0.21) * (1 - u * 0.45), 10, 10, secondaryMat));
    });

    // 3. Articulated Dragon Neck & Majestic Horned Dragon Head
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 2.45, 0.52);

    const neckPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.45, 0.12),
      new THREE.Vector3(0, 0.82, 0.38)
    ];
    headPivot.add(createOrganicTube(neckPts, (u) => 0.38 * (1 - u * 0.25), 12, 12, secondaryMat));

    // Dragon Skull & Upper Snout
    const skullGroup = new THREE.Group();
    skullGroup.position.set(0, 0.85, 0.42);
    const snoutPts = [
      new THREE.Vector3(0, 0.06, -0.18),
      new THREE.Vector3(0, 0.12, 0.25),
      new THREE.Vector3(0, 0.04, 0.82)
    ];
    skullGroup.add(createOrganicTube(snoutPts, (u) => 0.42 * (1 - u * 0.48), 14, 12, secondaryMat, 1.12, 0.82));

    // 4 Swept-Back Golden Dragon Horns
    [-1, 1].forEach(side => {
      const mainHornPts = [
        new THREE.Vector3(side * 0.24, 0.22, -0.05),
        new THREE.Vector3(side * 0.52, 0.58, -0.48),
        new THREE.Vector3(side * 0.68, 0.98, -0.95)
      ];
      skullGroup.add(createOrganicTube(mainHornPts, (u) => 0.15 * (1 - u * 0.88), 12, 10, primaryMat));

      const subHornPts = [
        new THREE.Vector3(side * 0.28, 0.08, 0.02),
        new THREE.Vector3(side * 0.58, 0.22, -0.35),
        new THREE.Vector3(side * 0.72, 0.38, -0.68)
      ];
      skullGroup.add(createOrganicTube(subHornPts, (u) => 0.095 * (1 - u * 0.88), 10, 8, boneMat));
    });

    // Glowing Dragon Eyes
    [-0.22, 0.22].forEach(ex => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), accentMat);
      eye.position.set(ex, 0.18, 0.28);
      skullGroup.add(eye);
    });

    // Hinged Fiery Lower Jaw with Fangs
    const jawPivot = new THREE.Group();
    jawPivot.position.set(0, -0.08, 0.08);
    const jawPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.08, 0.68)];
    jawPivot.add(createOrganicTube(jawPts, (u) => 0.3 * (1 - u * 0.52), 10, 10, primaryMat, 1.0, 0.55));

    // Glowing Magma Throat Core inside mouth
    const throatGlow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), accentMat);
    throatGlow.position.set(0, 0.04, 0.25);
    jawPivot.add(throatGlow);

    skullGroup.add(jawPivot);
    headPivot.add(skullGroup);
    dragonRoot.add(headPivot);
    animParts.headPivot = headPivot;
    animParts.jawPivot = jawPivot;

    // 4. 2 Colossal 2-Stage Articulated Bat-Like Dragon Wings
    function buildDragonWing(sideSign) {
      const shoulderPivot = new THREE.Group();
      shoulderPivot.position.set(sideSign * 0.52, 2.15, 0.15);

      // Inner Wing Arm Bone
      const armPts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(sideSign * 0.85, 0.55, -0.08),
        new THREE.Vector3(sideSign * 1.55, 0.82, -0.15)
      ];
      shoulderPivot.add(createOrganicTube(armPts, (u) => 0.16 * (1 - u * 0.25), 10, 8, primaryMat));

      // Inner Wing Membrane Webbing
      const innerWebPts = [
        new THREE.Vector3(sideSign * 0.15, -0.25, -0.1),
        new THREE.Vector3(sideSign * 0.85, 0.12, -0.22),
        new THREE.Vector3(sideSign * 1.48, 0.38, -0.28)
      ];
      shoulderPivot.add(createOrganicTube(innerWebPts, (u) => 0.48 * Math.sin(u * Math.PI * 0.85 + 0.2), 12, 8, accentMat, 1.0, 0.12));

      // Outer Wing Wrist Joint + 4 Radiating Wing Fingers & Membranes
      const wristPivot = new THREE.Group();
      wristPivot.position.set(sideSign * 1.55, 0.82, -0.15);

      // Wing Thumb Claw at Apex
      const thumbPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(sideSign * 0.18, 0.32, 0.18)];
      wristPivot.add(createOrganicTube(thumbPts, (u) => 0.08 * (1 - u * 0.85), 6, 6, boneMat));

      const fingerTargets = [
        [sideSign * 1.65, 0.35, -0.25],
        [sideSign * 1.45, -0.28, -0.32],
        [sideSign * 1.05, -0.85, -0.35],
        [sideSign * 0.45, -1.15, -0.28]
      ];
      fingerTargets.forEach((ft, fIdx) => {
        const fPts = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(ft[0] * 0.55, ft[1] * 0.45 + 0.08, ft[2] * 0.5),
          new THREE.Vector3(ft[0], ft[1], ft[2])
        ];
        wristPivot.add(createOrganicTube(fPts, (u) => 0.095 * (1 - u * 0.78), 10, 8, primaryMat));

        // Membrane panel between fingers
        if (fIdx < fingerTargets.length - 1) {
          const nextFt = fingerTargets[fIdx + 1];
          const webPts = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3((ft[0] + nextFt[0]) * 0.35, (ft[1] + nextFt[1]) * 0.35, -0.22),
            new THREE.Vector3((ft[0] + nextFt[0]) * 0.48, (ft[1] + nextFt[1]) * 0.48, -0.30)
          ];
          wristPivot.add(createOrganicTube(webPts, (u) => 0.36 * u + 0.05, 10, 6, accentMat, 1.4, 0.12));
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

    // 5. Whipping Segmented Dragon Tail with Flame-Spade Tip
    const tailPivot = new THREE.Group();
    tailPivot.position.set(0, 0.85, -1.02);
    const tailPts = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.28, -0.38, -0.75),
      new THREE.Vector3(-0.22, -0.52, -1.55),
      new THREE.Vector3(0.15, -0.25, -2.25)
    ];
    tailPivot.add(createOrganicTube(tailPts, (u) => 0.38 * (1 - u * 0.78), 18, 12, secondaryMat));
    const tailBlade = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), accentMat);
    tailBlade.scale.set(0.75, 0.35, 1.5);
    tailBlade.position.set(0.15, -0.25, -2.35);
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

    const isModalOpen = document.getElementById('slideModalOverlay').classList.contains('active');
    if (!isModalOpen) {
      if (code === 'KeyJ' || code === 'Digit1') {
        castElementalSkill('fire');
      } else if (code === 'KeyK' || code === 'Digit2') {
        castElementalSkill('lightning');
      } else if (code === 'KeyL' || code === 'Space') {
        e.preventDefault();
        castElementalSkill('ultimate');
      } else if (code === 'KeyO' || code === 'Enter') {
        triggerOpenNearestDefeatedSlide();
      } else if (code === 'KeyR') {
        resetPlayerPosition();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keysPressed[e.code] = false;
  });

  // 360-DEGREE CAMERA ORBIT (Drag Mouse untuk putar 360°; Klik Cepat untuk Serang; Scroll untuk Zoom)
  const canvasEl = document.getElementById('gameCanvasContainer');

  canvasEl.addEventListener('mousedown', (e) => {
    if (isIntroMode) return;
    if (document.getElementById('slideModalOverlay').classList.contains('active')) return;
    isDraggingCamera = true;
    dragMouseButton = e.button;
    dragStartPos = { x: e.clientX, y: e.clientY };
    lastMousePos = { x: e.clientX, y: e.clientY };
    totalDragDist = 0;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDraggingCamera) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    lastMousePos = { x: e.clientX, y: e.clientY };
    totalDragDist += Math.hypot(dx, dy);

    // Putar kamera 360 derajat penuh secara horizontal (cameraYaw) & vertikal (cameraPitch)
    cameraYaw -= dx * 0.0075;
    cameraPitch = Math.max(0.18, Math.min(1.18, cameraPitch + dy * 0.006));
  });

  window.addEventListener('mouseup', (e) => {
    if (!isDraggingCamera) return;
    isDraggingCamera = false;

    if (isIntroMode) return;
    if (document.getElementById('slideModalOverlay').classList.contains('active')) return;

    // Jika hanya klik cepat (bukan drag memutar kamera), tembakkan Jurus Api / Listrik!
    if (totalDragDist < 6) {
      if (dragMouseButton === 0) {
        castElementalSkill('fire');
      } else if (dragMouseButton === 2) {
        castElementalSkill('lightning');
      }
    }
    dragMouseButton = -1;
  });

  canvasEl.addEventListener('wheel', (e) => {
    if (isIntroMode) return;
    if (document.getElementById('slideModalOverlay').classList.contains('active')) return;
    e.preventDefault();
    cameraDist = Math.max(8.5, Math.min(28.0, cameraDist + e.deltaY * 0.012));
  }, { passive: false });

  canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
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
  cameraPitch = 0.50;
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
    // Tombol Q & E untuk memutar kamera 360 derajat dari keyboard
    if (keysPressed['KeyQ']) cameraYaw += 2.2 * dt;
    if (keysPressed['KeyE']) cameraYaw -= 2.2 * dt;

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

  // 360-DEGREE ORBIT CAMERA CALCULATION AROUND PLAYER
  if (isIntroMode) {
    const introCamPos = new THREE.Vector3(0, 11.2, 29.0);
    camera.position.lerp(introCamPos, dt * 4.8);
    camera.lookAt(new THREE.Vector3(0, 1.8, 17.5));
  } else {
    const horizDist = cameraDist * Math.cos(cameraPitch);
    const vertHeight = cameraDist * Math.sin(cameraPitch) + 2.2;
    const camTargetPos = new THREE.Vector3(
      playerPos.x + Math.sin(cameraYaw) * horizDist,
      vertHeight,
      playerPos.z + Math.cos(cameraYaw) * horizDist
    );
    camera.position.lerp(camTargetPos, dt * 8.0);
    camera.lookAt(new THREE.Vector3(playerPos.x, 2.0, playerPos.z));
  }

  // Move directional light shadow frustum with player so shadows stay crisp along the whole trail
  dirLight.position.set(playerPos.x + 28, 55, playerPos.z + 25);
  dirLight.target.position.set(playerPos.x, 0, playerPos.z - 10);
  dirLight.target.updateMatrixWorld();

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

      // 6. 🐙 HYDRA 3 MULTI-JOINTED NECK CHAINS & WRITHING TENTACLES
      if (ap.hydraNeckChains) {
        ap.hydraNeckChains.forEach(nc => {
          nc.chain.forEach((jNode, jIdx) => {
            jNode.rotation.z = Math.sin(elapsed * 3.0 + nc.phase - jIdx * 0.5) * 0.16;
            jNode.rotation.x = Math.cos(elapsed * 2.4 + nc.phase - jIdx * 0.4) * 0.12;
          });
          nc.jawPivot.rotation.x = 0.15 + Math.max(0, Math.sin(elapsed * 4.2 + nc.phase)) * 0.35;
        });
      }
      if (ap.tentacles) {
        ap.tentacles.forEach(t => {
          t.tentPivot.rotation.x = Math.sin(elapsed * 3.5 + t.phase) * 0.24;
          t.tentPivot.rotation.z = Math.cos(elapsed * 2.8 + t.phase) * 0.18;
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
