// ============================================================================
// DATACENTER STAGE 3D — EMBEDDED THREE.JS SIMULATION FOR SLIDE PRESENTATION
// 3 Datacenters (Surabaya, Jakarta, Yogyakarta), Client Dispatcher Cloud Platform,
// AOA Autonomous Drones (÷, ×, -, +), Fiber Laser Trunks, and Bezier Flight Tasks
// ============================================================================

window.DatacenterStage3D = (function () {
  let dcScene, dcCamera, dcRenderer, dcControls;
  let containerEl = null;
  let animFrameId = null;
  let isLoopActive = false;
  let isInitialized = false;

  const dcNodes = {};
  let dispatcherPlatform = null;
  const laserLines = [];
  const networkPackets = [];
  const datacenterFans = [];
  const datacenterBeacons = [];
  const aoaExploreDrones = [];
  const aoaExploitDrones = [];
  let goldenCrown = null;
  let goldenBeam = null;

  let activeFlyingTasks = [];
  let landedTasks = [];
  let currentMode = 'topology';
  const rackTextureCache = {};

  // Procedural Server Rack Texture
  function getRackTexture(accentColorHex) {
    const key = String(accentColorHex);
    if (rackTextureCache[key]) return rackTextureCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#070b12';
    ctx.fillRect(0, 0, 128, 256);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 124, 252);

    const slotCount = 10;
    const slotH = 240 / slotCount;
    const accent = typeof accentColorHex === 'number' ? '#' + accentColorHex.toString(16).padStart(6, '0') : accentColorHex;

    for (let i = 0; i < slotCount; i++) {
      const y = 8 + i * slotH;
      ctx.fillStyle = i % 2 === 0 ? '#111827' : '#162032';
      ctx.fillRect(6, y + 1, 116, slotH - 3);

      ctx.fillStyle = '#05080f';
      ctx.fillRect(10, y + 4, 60, slotH - 8);

      ctx.fillStyle = '#1e293b';
      for (let g = 14; g < 66; g += 6) {
        ctx.fillRect(g, y + 6, 2, slotH - 12);
      }

      ctx.fillStyle = '#334155';
      ctx.fillRect(74, y + 5, 8, slotH - 10);

      ctx.fillStyle = Math.random() > 0.25 ? '#10b981' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(92, y + slotH / 2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = Math.random() > 0.4 ? '#0ea5e9' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(104, y + slotH / 2, 2.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(114, y + slotH / 2, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    rackTextureCache[key] = texture;
    return texture;
  }

  function getHazardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 32);
    ctx.fillStyle = '#f59e0b';
    const stripeW = 18;
    for (let x = -32; x < 288; x += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x + stripeW, 32);
      ctx.lineTo(x + stripeW + 16, 0);
      ctx.lineTo(x + 16, 0);
      ctx.closePath();
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return tex;
  }

  // Billboard Helper
  function createUnifiedBillboard(title, subtitle, status, colorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 140;
    updateBillboardCanvas(canvas, title, subtitle, status, colorHex);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(6.8, 1.85, 1);
    sp.userData = { canvas, texture, title, subtitle };
    return sp;
  }

  function updateBillboardCanvas(canvas, title, subtitle, status, colorHex) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.roundRect ? ctx.roundRect(8, 8, 496, 124, 18) : ctx.fillRect(8, 8, 496, 124);
    ctx.fill();

    ctx.lineWidth = 7;
    ctx.strokeStyle = typeof colorHex === 'number' ? '#' + colorHex.toString(16).padStart(6, '0') : colorHex;
    ctx.stroke();

    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 46);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(subtitle, 256, 82);

    ctx.fillStyle = typeof colorHex === 'number' ? '#' + colorHex.toString(16).padStart(6, '0') : colorHex;
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(status, 256, 116);
  }

  function setBillboardStatus(id, statusText, colorHex) {
    const node = dcNodes[id];
    if (!node) return;
    const sp = node.billboard;
    updateBillboardCanvas(sp.userData.canvas, node.name, node.subtitle, statusText, colorHex);
    sp.userData.texture.needsUpdate = true;
  }

  // Build Individual Datacenter Facility
  function buildDatacenterTower(id, name, subtitle, pos, height, bodyColor, ledColor) {
    const tower = new THREE.Group();
    const hazardTex = getHazardTexture();
    const rackTex = getRackTexture(ledColor);

    const plinthW = 5.6;
    const plinthD = 5.6;
    const plinthH = 0.5;

    // Plinth base
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(plinthW, plinthH, plinthD),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.25 })
    );
    plinth.position.set(pos[0], plinthH / 2, pos[2]);
    plinth.receiveShadow = true;
    tower.add(plinth);

    const hazardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(plinthW + 0.08, 0.12, plinthD + 0.08),
      new THREE.MeshBasicMaterial({ map: hazardTex })
    );
    hazardMesh.position.set(pos[0], plinthH - 0.06, pos[2]);
    tower.add(hazardMesh);

    // Main Facility Shell
    const bldgW = 3.8;
    const bldgD = 3.8;
    const bldgH = height;
    const bldgY = plinthH + bldgH / 2;

    const bldgShell = new THREE.Mesh(
      new THREE.BoxGeometry(bldgW, bldgH, bldgD),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.72, roughness: 0.32 })
    );
    bldgShell.position.set(pos[0], bldgY, pos[2]);
    bldgShell.castShadow = true;
    bldgShell.receiveShadow = true;
    tower.add(bldgShell);

    // Front Glass Atrium revealing glowing racks
    const glassW = bldgW * 0.72;
    const glassH = bldgH * 0.75;
    const glassFront = new THREE.Mesh(
      new THREE.PlaneGeometry(glassW, glassH),
      new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.82
      })
    );
    glassFront.position.set(pos[0], bldgY, pos[2] + bldgD / 2 + 0.02);
    tower.add(glassFront);

    const internalRacks = new THREE.Mesh(
      new THREE.PlaneGeometry(glassW - 0.2, glassH - 0.2),
      new THREE.MeshBasicMaterial({ map: rackTex, transparent: true, opacity: 0.92 })
    );
    internalRacks.position.set(pos[0], bldgY, pos[2] + bldgD / 2 - 0.06);
    tower.add(internalRacks);

    // Rooftop parapet & LED Ring
    const roofY = plinthH + bldgH;
    const ledRingMesh = new THREE.Mesh(
      new THREE.BoxGeometry(bldgW + 0.22, 0.14, bldgD + 0.22),
      new THREE.MeshBasicMaterial({ color: ledColor })
    );
    ledRingMesh.position.set(pos[0], roofY + 0.25, pos[2]);
    tower.add(ledRingMesh);

    // Rotating HVAC Chillers
    const chillerCount = id === 'sby' ? 3 : (id === 'jkt' ? 2 : 1);
    const chillerOffsets = id === 'sby'
      ? [[-0.85, -0.85], [0.85, -0.85], [0.0, 0.85]]
      : (id === 'jkt' ? [[-0.75, 0], [0.75, 0]] : [[0, 0]]);

    chillerOffsets.forEach(([cx, cz], chIdx) => {
      const chillerGroup = new THREE.Group();
      chillerGroup.position.set(pos[0] + cx, roofY + 0.35, pos[2] + cz);

      const chBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.55, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.35 })
      );
      chBody.position.y = 0.28;
      chillerGroup.add(chBody);

      const fanProp = new THREE.Group();
      fanProp.position.y = 0.62;
      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.03, 0.78),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
        );
        blade.rotation.y = (b * Math.PI) / 2;
        blade.rotation.x = 0.25;
        fanProp.add(blade);
      }
      chillerGroup.add(fanProp);
      tower.add(chillerGroup);

      datacenterFans.push({ fanMesh: fanProp, baseSpeed: 0.06 + chIdx * 0.015 });
    });

    // Aviation Red Warning Beacon
    const beaconOrb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    beaconOrb.position.set(pos[0] + 1.2, roofY + 2.2, pos[2] - 1.2);
    tower.add(beaconOrb);

    const beaconLight = new THREE.PointLight(0xef4444, 0.7, 8);
    beaconLight.position.copy(beaconOrb.position);
    dcScene.add(beaconLight);
    datacenterBeacons.push({ mesh: beaconOrb, light: beaconLight, offset: id === 'sby' ? 0 : (id === 'jkt' ? 0.33 : 0.66) });

    // Satellite Compute Pods (Server Racks around building)
    const rackCount = id === 'yog' ? 4 : 3;
    const rackRadius = id === 'sby' ? 4.0 : 3.6;

    for (let i = 0; i < rackCount; i++) {
      const satH = height * (0.5 + i * 0.1);
      const ang = (i * Math.PI * 2) / rackCount;
      const rx = pos[0] + Math.cos(ang) * rackRadius;
      const rz = pos[2] + Math.sin(ang) * rackRadius;

      const podGroup = new THREE.Group();
      podGroup.position.set(rx, plinthH + satH / 2, rz);

      const rackFrame = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, satH, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.35 })
      );
      rackFrame.castShadow = true;
      podGroup.add(rackFrame);

      const frontPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.25, satH * 0.95), new THREE.MeshBasicMaterial({ map: rackTex }));
      frontPanel.position.set(0, 0, 0.71);
      podGroup.add(frontPanel);

      tower.add(podGroup);
    }

    // Dynamic Point Light & Status Billboard HUD
    const dcLight = new THREE.PointLight(ledColor, 1.4, 20);
    dcLight.position.set(pos[0], roofY + 1.2, pos[2]);
    dcScene.add(dcLight);

    const billboard = createUnifiedBillboard(name, subtitle, 'STATUS: SIAP ALOKASI', ledColor);
    billboard.position.set(pos[0], roofY + 3.0, pos[2]);
    tower.add(billboard);

    dcScene.add(tower);

    dcNodes[id] = {
      id,
      group: tower,
      bodyMesh: bldgShell,
      ledMesh: ledRingMesh,
      light: dcLight,
      billboard,
      pos: new THREE.Vector3(...pos),
      height: roofY,
      name,
      subtitle,
      baseColor: bodyColor,
      baseLedColor: ledColor,
      landedCount: 0
    };
  }

  // Network Laser Fiber Trunks
  function buildNetworkTrunk(id, p1, p2, color) {
    const v1 = new THREE.Vector3(...p1);
    const v2 = new THREE.Vector3(...p2);

    const geom = new THREE.BufferGeometry().setFromPoints([v1, v2]);
    const mat = new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.8 });
    const line = new THREE.Line(geom, mat);
    line.userData = { id, baseColor: color, p1: v1, p2: v2 };
    dcScene.add(line);
    laserLines.push(line);

    for (let i = 0; i < 2; i++) {
      const packetMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
      );
      packetMesh.position.copy(v1);
      dcScene.add(packetMesh);
      networkPackets.push({
        mesh: packetMesh,
        p1: v1,
        p2: v2,
        progress: i * 0.5,
        speed: 0.009 + Math.random() * 0.004
      });
    }
  }

  // Client Workload Dispatcher (Cloud Platform)
  function buildDispatcherPlatform(pos) {
    dispatcherPlatform = new THREE.Group();

    const plat = new THREE.Mesh(
      new THREE.CylinderGeometry(3.0, 3.4, 0.45, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 })
    );
    plat.castShadow = true;
    dispatcherPlatform.add(plat);

    const ringOuter = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.07, 10, 36),
      new THREE.MeshBasicMaterial({ color: 0x0284c7 })
    );
    ringOuter.rotation.x = Math.PI / 2;
    dispatcherPlatform.add(ringOuter);

    const ringInner = new THREE.Mesh(
      new THREE.TorusGeometry(2.1, 0.05, 10, 28),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    ringInner.rotation.x = Math.PI / 2;
    ringInner.position.y = 0.08;
    dispatcherPlatform.add(ringInner);

    // Holographic Dispatcher Billboard (Stylized Cloud Header)
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.roundRect ? ctx.roundRect(6, 6, 468, 88, 16) : ctx.fillRect(6, 6, 468, 88);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#0284c7';
    ctx.stroke();

    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☁️ Client Workload Dispatcher', 240, 44);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 19px monospace';
    ctx.fillText('Antrean Tugas Ilmiah Riil (100 - 500 Tasks)', 240, 78);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(5.5, 1.2, 1);
    sp.position.set(0, 1.9, 0);
    dispatcherPlatform.add(sp);

    dispatcherPlatform.position.set(...pos);
    dcScene.add(dispatcherPlatform);
  }

  // AOA Autonomous Quadcopter Drones
  function buildQuadcopterMesh(accentColor, isExploit) {
    const droneGroup = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.20, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 })
    );
    droneGroup.add(body);

    const canopy = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.32, 0.45, 8),
      new THREE.MeshStandardMaterial({ color: accentColor, metalness: 0.9, roughness: 0.2 })
    );
    canopy.rotation.x = Math.PI / 2;
    canopy.position.set(0, 0.11, 0.05);
    canopy.scale.set(0.9, 1.2, 0.6);
    droneGroup.add(canopy);

    // Operator Glyph Sprite (÷, ×, -, +)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = isExploit ? '#10b981' : '#0284c7';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isExploit ? '-' : '÷', 32, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    sp.scale.set(0.7, 0.7, 1);
    sp.position.set(0, 0.48, 0);
    droneGroup.add(sp);

    // Downward Scanner Cone Light
    const scanCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 2.0, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    scanCone.rotation.x = Math.PI;
    scanCone.position.set(0, -1.0, 0);
    droneGroup.add(scanCone);

    droneGroup.scale.setScalar(0.9);
    return { droneGroup, sprite: sp };
  }

  function createAOADrones() {
    // 2 Exploration Drones (Division ÷ & Multiplication ×)
    [-1, 1].forEach((dir, idx) => {
      const drone = buildQuadcopterMesh(0x0284c7, false);
      dcScene.add(drone.droneGroup);
      aoaExploreDrones.push({
        group: drone.droneGroup,
        radius: 17 + idx * 2.5,
        speed: 0.012 * dir,
        angle: idx * Math.PI,
        height: 12 + idx * 1.5
      });
    });

    // 2 Exploitation Drones (Subtraction - & Addition +)
    [-1, 1].forEach((dir, idx) => {
      const drone = buildQuadcopterMesh(0x10b981, true);
      dcScene.add(drone.droneGroup);
      aoaExploitDrones.push({
        group: drone.droneGroup,
        center: new THREE.Vector3(-11, 10, -2), // Focused on Surabaya
        radius: 4.8 + idx * 1.2,
        speed: 0.024 * dir,
        angle: idx * Math.PI,
        height: 10 + idx * 1.2
      });
    });
  }

  // Calculate Landing Slot at Datacenter Pods
  function calculateLandingSlot(targetId, algo) {
    const node = dcNodes[targetId];
    const count = node.landedCount || 0;
    node.landedCount = count + 1;

    if (algo === 'random' && targetId === 'yog') {
      const stackH = count * 0.42;
      const wobbleX = (Math.random() - 0.5) * 0.4;
      const wobbleZ = (Math.random() - 0.5) * 0.4;
      return { x: wobbleX, y: node.height + 0.3 + stackH, z: wobbleZ };
    } else {
      const ang = (count * Math.PI * 2) / 5;
      const radius = 2.2;
      return {
        x: Math.cos(ang) * radius,
        y: 0.35 + Math.floor(count / 5) * 0.72,
        z: Math.sin(ang) * radius
      };
    }
  }

  // ============================================================================
  // PUBLIC CONTROLLER API
  // ============================================================================
  function init(container) {
    if (!container) return;
    if (isInitialized && dcRenderer && dcScene) {
      resize();
      return;
    }
    containerEl = container;
    isInitialized = true;

    // Reset container contents
    containerEl.innerHTML = '';
    const width = containerEl.clientWidth || 800;
    const height = containerEl.clientHeight || 320;

    dcScene = new THREE.Scene();
    dcScene.background = new THREE.Color(0xfbf8f2);
    dcScene.fog = new THREE.FogExp2(0xfbf8f2, 0.008);

    dcCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    dcCamera.position.set(0, 24, 34);

    dcRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    dcRenderer.setSize(width, height);
    dcRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    dcRenderer.shadowMap.enabled = true;
    dcRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerEl.appendChild(dcRenderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      dcControls = new THREE.OrbitControls(dcCamera, dcRenderer.domElement);
      dcControls.enableDamping = true;
      dcControls.dampingFactor = 0.05;
      dcControls.maxPolarAngle = Math.PI / 2 - 0.05;
      dcControls.target.set(0, 3.8, 0);
    }

    // Ambient & Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    dcScene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    sunLight.position.set(24, 42, 28);
    sunLight.castShadow = true;
    dcScene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 0.65);
    rimLight.position.set(-25, 20, -25);
    dcScene.add(rimLight);

    // Ground Grid Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0xf5ede2, roughness: 0.88, metalness: 0.1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    dcScene.add(floor);

    const gridHelper = new THREE.GridHelper(90, 45, 0x0284c7, 0xded2c0);
    gridHelper.position.y = 0.02;
    dcScene.add(gridHelper);

    // Build the 3 Datacenters
    buildDatacenterTower('sby', 'DC_SURABAYA (Host 0)', 'VM 0,1,2 • 6.000 MIPS', [-11, 0, -2], 9.2, 0x0284c7, 0x38bdf8);
    buildDatacenterTower('jkt', 'DC_JAKARTA (Host 1)', 'VM 3,4,5 • 3.600 MIPS', [11, 0, -2], 7.0, 0x7c3aed, 0xa855f7);
    buildDatacenterTower('yog', 'DC_YOGYAKARTA (Host 2)', 'VM 6..9 • 800 MIPS', [0, 0, 7.5], 4.8, 0x059669, 0x10b981);

    // Network Lines
    buildNetworkTrunk('sby_jkt', [-11, 0.6, -2], [11, 0.6, -2], 0x0284c7);
    buildNetworkTrunk('sby_yog', [-11, 0.6, -2], [0, 0.6, 7.5], 0x059669);
    buildNetworkTrunk('jkt_yog', [11, 0.6, -2], [0, 0.6, 7.5], 0x7c3aed);

    // Dispatcher Platform (Cloud Platform elevated at [0, 9.5, -12])
    buildDispatcherPlatform([0, 9.5, -12]);
    buildNetworkTrunk('disp_sby', [0, 9.5, -12], [-11, 5.0, -2], 0x38bdf8);
    buildNetworkTrunk('disp_jkt', [0, 9.5, -12], [11, 4.0, -2], 0xa855f7);
    buildNetworkTrunk('disp_yog', [0, 9.5, -12], [0, 2.8, 7.5], 0x10b981);

    // Golden Crown & Beam atop Surabaya for AOA
    goldenCrown = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.75, 0),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.95, roughness: 0.2 })
    );
    goldenCrown.position.set(-11, 10.8, -2);
    dcScene.add(goldenCrown);

    goldenBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 9, 16),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 })
    );
    goldenBeam.position.set(-11, 14.8, -2);
    goldenBeam.visible = false;
    dcScene.add(goldenBeam);

    // AOA Drones
    createAOADrones();

    // Start loop
    start();
  }

  function start() {
    if (isLoopActive) return;
    isLoopActive = true;
    animate();
  }

  function stop() {
    isLoopActive = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
  }

  function animate() {
    if (!isLoopActive) return;
    animFrameId = requestAnimationFrame(animate);

    if (dcControls) dcControls.update();

    // Rotate HVAC chiller fans
    datacenterFans.forEach(f => {
      f.fanMesh.rotation.y += f.baseSpeed;
    });

    // Pulse aviation beacons
    const time = Date.now() * 0.003;
    datacenterBeacons.forEach(b => {
      const flash = Math.sin(time * 3 + b.offset * Math.PI * 2);
      const intensity = flash > 0.4 ? 1.0 : 0.05;
      b.mesh.material.opacity = intensity;
      b.light.intensity = intensity * 0.8;
    });

    // Move network packet pulses along trunks
    networkPackets.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) p.progress = 0;
      p.mesh.position.lerpVectors(p.p1, p.p2, p.progress);
    });

    // Orbit AOA Drones
    aoaExploreDrones.forEach(d => {
      d.angle += d.speed;
      d.group.position.set(Math.cos(d.angle) * d.radius, d.height + Math.sin(d.angle * 2) * 0.8, Math.sin(d.angle) * d.radius);
      d.group.rotation.y = -d.angle + Math.PI / 2;
    });

    aoaExploitDrones.forEach(d => {
      d.angle += d.speed;
      d.group.position.set(d.center.x + Math.cos(d.angle) * d.radius, d.height + Math.sin(d.angle * 3) * 0.5, d.center.z + Math.sin(d.angle) * d.radius);
      d.group.rotation.y = -d.angle + Math.PI / 2;
    });

    if (goldenCrown) {
      goldenCrown.rotation.y += 0.03;
      goldenCrown.position.y = 10.8 + Math.sin(time * 2) * 0.2;
    }

    // Animate Flying Tasks along Bezier flight curves
    for (let i = activeFlyingTasks.length - 1; i >= 0; i--) {
      const t = activeFlyingTasks[i];
      t.progress += t.speed;

      if (t.progress < 0) {
        t.mesh.visible = false;
        continue;
      }
      t.mesh.visible = true;

      if (t.progress >= 1.0) {
        t.mesh.position.copy(t.endP);
        t.mesh.rotation.set(0, Math.random() * Math.PI, 0);
        landedTasks.push(t.mesh);
        activeFlyingTasks.splice(i, 1);

        // Update destination status
        const node = dcNodes[t.targetId];
        if (node) {
          if (t.targetId === 'yog' && t.algo === 'random') {
            setBillboardStatus('yog', 'STATUS: OVERLOAD (99.9%) ⚠️', 0xdc2626);
            node.ledMesh.material.color.setHex(0xdc2626);
            node.light.color.setHex(0xdc2626);
          } else {
            setBillboardStatus(t.targetId, 'STATUS: SEDANG MEMPROSES', node.baseLedColor);
          }
        }
      } else {
        const u = t.progress;
        const p0 = t.startP;
        const p1 = t.ctrlP;
        const p2 = t.endP;

        const x = (1 - u) * (1 - u) * p0.x + 2 * (1 - u) * u * p1.x + u * u * p2.x;
        const y = (1 - u) * (1 - u) * p0.y + 2 * (1 - u) * u * p1.y + u * u * p2.y;
        const z = (1 - u) * (1 - u) * p0.z + 2 * (1 - u) * u * p1.z + u * u * p2.z;

        t.mesh.position.set(x, y, z);
        t.mesh.rotation.x += 0.04;
        t.mesh.rotation.y += 0.06;
      }
    }

    if (dcRenderer && dcScene && dcCamera) {
      dcRenderer.render(dcScene, dcCamera);
    }
  }

  function resize() {
    if (!containerEl || !dcRenderer || !dcCamera) return;
    const width = containerEl.clientWidth;
    const height = containerEl.clientHeight;
    if (width === 0 || height === 0) return;
    dcCamera.aspect = width / height;
    dcCamera.updateProjectionMatrix();
    dcRenderer.setSize(width, height);
  }

  function clearTasks() {
    activeFlyingTasks.forEach(t => dcScene.remove(t.mesh));
    activeFlyingTasks = [];

    landedTasks.forEach(mesh => dcScene.remove(mesh));
    landedTasks = [];

    Object.values(dcNodes).forEach(node => {
      node.landedCount = 0;
      node.ledMesh.material.color.setHex(node.baseLedColor);
      node.light.color.setHex(node.baseLedColor);
      setBillboardStatus(node.id, 'STATUS: SIAP ALOKASI', node.baseLedColor);
    });

    if (goldenBeam) goldenBeam.visible = false;
  }

  function runSimulation(algo, datasetCount = 100) {
    clearTasks();

    const startP = new THREE.Vector3(0, 9.5, -12); // Elevated Dispatcher Cloud Platform

    let assignedTargets = [];
    if (algo === 'random') {
      for (let i = 0; i < 11; i++) assignedTargets.push('yog');
      for (let i = 0; i < 6; i++) assignedTargets.push('jkt');
      for (let i = 0; i < 3; i++) assignedTargets.push('sby');
      assignedTargets = assignedTargets.sort(() => Math.random() - 0.5);

      aoaExploreDrones.forEach(d => d.group.visible = false);
      aoaExploitDrones.forEach(d => d.group.visible = false);
      if (goldenBeam) goldenBeam.visible = false;
    } else {
      for (let i = 0; i < 10; i++) assignedTargets.push('sby'); // 50%
      for (let i = 0; i < 6; i++) assignedTargets.push('jkt');  // 30%
      for (let i = 0; i < 4; i++) assignedTargets.push('yog');  // 20%

      aoaExploreDrones.forEach(d => d.group.visible = true);
      aoaExploitDrones.forEach(d => d.group.visible = true);
      if (goldenBeam) goldenBeam.visible = true;
    }

    assignedTargets.forEach((targetId, idx) => {
      const destNode = dcNodes[targetId];
      const isHeavy = (algo === 'aoa' && targetId === 'sby') || (algo === 'random' && idx % 2 === 0);
      const cubeSize = isHeavy ? 1.15 : (targetId === 'jkt' ? 0.85 : 0.62);
      const cubeColor = isHeavy ? 0x0284c7 : (targetId === 'jkt' ? 0x7c3aed : 0x059669);

      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize),
        new THREE.MeshStandardMaterial({
          color: cubeColor,
          emissive: cubeColor,
          emissiveIntensity: 0.55,
          roughness: 0.3
        })
      );
      mesh.position.copy(startP);
      mesh.castShadow = true;
      dcScene.add(mesh);

      const landOffset = calculateLandingSlot(targetId, algo);
      const endP = new THREE.Vector3(
        destNode.pos.x + landOffset.x,
        destNode.pos.y + landOffset.y,
        destNode.pos.z + landOffset.z
      );

      const midX = (startP.x + endP.x) / 2;
      const midZ = (startP.z + endP.z) / 2;
      const midY = Math.max(startP.y, endP.y) + 3.5 + Math.random() * 2.0;
      const ctrlP = new THREE.Vector3(midX, midY, midZ);

      activeFlyingTasks.push({
        mesh,
        targetId,
        algo,
        startP,
        ctrlP,
        endP,
        progress: -(idx * 0.05),
        speed: 0.019 + Math.random() * 0.004
      });
    });
  }

  function setMode(mode) {
    currentMode = mode;
    const titleEl = document.getElementById('embeddedStageTitle');

    if (mode === 'topology') {
      if (titleEl) titleEl.innerText = '🌐 Panggung 3D: Topologi 3 Datacenter & Cloud Dispatcher';
      aoaExploreDrones.forEach(d => d.group.visible = false);
      aoaExploitDrones.forEach(d => d.group.visible = false);
      if (dcControls) {
        dcControls.target.set(0, 3.8, 0);
        dcCamera.position.set(0, 24, 34);
      }
    } else if (mode === 'aoa-explore') {
      if (titleEl) titleEl.innerText = '🔍 Mode Eksplorasi AOA: Drone Pembagian (÷) & Perkalian (×)';
      aoaExploreDrones.forEach(d => d.group.visible = true);
      aoaExploitDrones.forEach(d => d.group.visible = false);
      if (dcControls) {
        dcControls.target.set(0, 8, 0);
        dcCamera.position.set(0, 20, 28);
      }
    } else if (mode === 'aoa-exploit') {
      if (titleEl) titleEl.innerText = '🎯 Mode Eksploitasi AOA: Drone Pengurangan (-) & Penjumlahan (+)';
      aoaExploreDrones.forEach(d => d.group.visible = false);
      aoaExploitDrones.forEach(d => d.group.visible = true);
      if (dcControls) {
        dcControls.target.set(-11, 6, -2);
        dcCamera.position.set(-11, 16, 14);
      }
    }

    ['btnModeEmbeddedTopo', 'btnModeEmbeddedExplore', 'btnModeEmbeddedExploit'].forEach(btnId => {
      const b = document.getElementById(btnId);
      if (b) b.classList.remove('active');
    });
    if (mode === 'topology') document.getElementById('btnModeEmbeddedTopo')?.classList.add('active');
    if (mode === 'aoa-explore') document.getElementById('btnModeEmbeddedExplore')?.classList.add('active');
    if (mode === 'aoa-exploit') document.getElementById('btnModeEmbeddedExploit')?.classList.add('active');
  }

  return {
    init,
    start,
    stop,
    resize,
    runSimulation,
    clearTasks,
    setMode
  };
})();
