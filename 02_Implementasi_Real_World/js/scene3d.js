    // ============================================================================
    // 2. THREE.JS GLOBAL STATE & SCENE ASSETS
    // ============================================================================
    let scene, camera, renderer, controls;
    let current3DMode = 'topology';
    let dataCubes = [];
    let aoaExploreDrones = [];
    let aoaExploitDrones = [];
    let laserLines = [];
    let goldenCrown, goldenBeam;
    let animId;

    // Registry Datacenter Towers & Dynamic Assets
    const datacenterNodes = {};
    let dispatcherPlatform;
    let activeFlyingTasks = [];
    let landedTasks = [];
    let isSimRunning = false;
    let currentSimAlgo = 'aoa';

    // Simulation Clock State
    let simClockTime = 0.0;
    let targetClockTime = 206.99;
    let clockRunning = false;

    // Realistic Datacenter Animation Assets
    const datacenterFans = [];       // Rooftop HVAC chiller spinning fans
    const datacenterBeacons = [];    // Aviation obstacle flashing lights
    const networkPackets = [];       // Glowing data packets flowing on trunk lines
    const rackTextureCache = {};     // Procedural server blade canvas textures

    // ============================================================================
    // PROCEDURAL TEXTURE GENERATORS (HIGH-TECH ENTERPRISE LOOK)
    // ============================================================================
    function getOrCreateRackTexture(accentColorHex) {
      const key = String(accentColorHex);
      if (rackTextureCache[key]) return rackTextureCache[key];

      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Dark chassis interior
      ctx.fillStyle = '#070b12';
      ctx.fillRect(0, 0, 128, 256);

      // Chassis metallic bezel
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 124, 252);

      // 10 Server Blade Slots
      const slotCount = 10;
      const slotH = 240 / slotCount;
      const accent = typeof accentColorHex === 'number' ? '#' + accentColorHex.toString(16).padStart(6, '0') : accentColorHex;

      for (let i = 0; i < slotCount; i++) {
        const y = 8 + i * slotH;

        // Blade faceplate
        ctx.fillStyle = i % 2 === 0 ? '#111827' : '#162032';
        ctx.fillRect(6, y + 1, 116, slotH - 3);

        // Perforated air grille area
        ctx.fillStyle = '#05080f';
        ctx.fillRect(10, y + 4, 60, slotH - 8);

        // Tiny grille lines
        ctx.fillStyle = '#1e293b';
        for (let g = 14; g < 66; g += 6) {
          ctx.fillRect(g, y + 6, 2, slotH - 12);
        }

        // Drive bay latch handles
        ctx.fillStyle = '#334155';
        ctx.fillRect(74, y + 5, 8, slotH - 10);

        // Activity & Status LEDs (Green, Cyan, Accent)
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

    function createHazardBorderTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 256, 32);

      // Yellow/Black diagonal hazard stripes
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

    // ============================================================================
    // SCENE INITIALIZATION & LIGHTING
    // ============================================================================
    function init3D() {
      const container = document.getElementById('threeCanvas');
      const width = container.clientWidth;
      const height = container.clientHeight;

      // 1. Scene & Warm Architectural Lighting
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xfbf8f2);
      scene.fog = new THREE.FogExp2(0xfbf8f2, 0.009);

      // Camera angled for cinematic balanced perspective of all 3 DCs & Dispatcher
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 25, 35);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      // OrbitControls with polite damping
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2 - 0.05;
      controls.target.set(0, 3.8, 0);

      // Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.92);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
      sunLight.position.set(24, 42, 28);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 120;
      sunLight.shadow.camera.left = -25;
      sunLight.shadow.camera.right = 25;
      sunLight.shadow.camera.top = 25;
      sunLight.shadow.camera.bottom = -25;
      sunLight.shadow.bias = -0.0005;
      scene.add(sunLight);

      const rimLight = new THREE.DirectionalLight(0xe0f2fe, 0.65);
      rimLight.position.set(-25, 20, -25);
      scene.add(rimLight);

      // Ground Floor with Architectural Grid
      const floorGeo = new THREE.PlaneGeometry(100, 100);
      const floorMat = new THREE.MeshStandardMaterial({ color: 0xf5ede2, roughness: 0.88, metalness: 0.1 });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      const gridHelper = new THREE.GridHelper(90, 45, 0x0284c7, 0xded2c0);
      gridHelper.position.y = 0.02;
      scene.add(gridHelper);

      // 2. Build 3 Realistic Datacenter Facilities
      // Surabaya: Host 0, Enterprise Tier-IV Mega Datacenter (6.000 MIPS) at Left [-11, 0, -2]
      buildDatacenterTower('sby', 'DC_SURABAYA (Host 0)', 'VM 0,1,2 • 6.000 MIPS', [-11, 0, -2], 9.2, 0x0284c7, 0x38bdf8);

      // Jakarta: Host 1, Metro Enterprise Hub (3.600 MIPS) at Right [11, 0, -2]
      buildDatacenterTower('jkt', 'DC_JAKARTA (Host 1)', 'VM 3,4,5 • 3.600 MIPS', [11, 0, -2], 7.0, 0x7c3aed, 0xa855f7);

      // Yogyakarta: Host 2, Regional Edge Facility (800 MIPS) at Front-Center [0, 0, 7.5]
      buildDatacenterTower('yog', 'DC_YOGYAKARTA (Host 2)', 'VM 6..9 • 800 MIPS', [0, 0, 7.5], 4.8, 0x059669, 0x10b981);

      // 3. Network Laser Lines connecting Datacenters
      buildNetworkTrunk('sby_jkt', [-11, 0.6, -2], [11, 0.6, -2], 0x0284c7);
      buildNetworkTrunk('sby_yog', [-11, 0.6, -2], [0, 0.6, 7.5], 0x059669);
      buildNetworkTrunk('jkt_yog', [11, 0.6, -2], [0, 0.6, 7.5], 0x7c3aed);

      // 4. Build Client Workload Dispatcher (Elevated at Center-Back [0, 9.5, -12])
      buildDispatcherPlatform([0, 9.5, -12]);

      // Connect Dispatcher to 3 Datacenters via Fiber Optic Trunks
      buildNetworkTrunk('disp_sby', [0, 9.5, -12], [-11, 5.0, -2], 0x38bdf8);
      buildNetworkTrunk('disp_jkt', [0, 9.5, -12], [11, 4.0, -2], 0xa855f7);
      buildNetworkTrunk('disp_yog', [0, 9.5, -12], [0, 2.8, 7.5], 0x10b981);

      // 5. Golden Beacon & Crown atop Surabaya (Exclusive to AOA optimal execution)
      goldenCrown = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.75, 0),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.95, roughness: 0.2 })
      );
      goldenCrown.position.set(-11, 10.8, -2);
      scene.add(goldenCrown);

      const beamGeo = new THREE.CylinderGeometry(0.14, 0.14, 9, 16);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 });
      goldenBeam = new THREE.Mesh(beamGeo, beamMat);
      goldenBeam.position.set(-11, 14.8, -2);
      goldenBeam.visible = false;
      scene.add(goldenBeam);

      // 6. AOA Autonomous Drones
      createAOAExploreDrones();
      createAOAExploitDrones();

      // Window Resize Listener
      window.addEventListener('resize', onResize);

      // Start Animation Loop
      animate();

      // Initial HUD Update
      updateHUDDisplay();
    }

    // ============================================================================
    // 3. HIGH-TECH REALISTIC DATACENTER BUILDER
    // ============================================================================
    function buildDatacenterTower(id, name, subtitle, pos, height, bodyColor, ledColor) {
      const tower = new THREE.Group();
      const hazardTex = createHazardBorderTexture();
      const rackTex = getOrCreateRackTexture(ledColor);

      // --------------------------------------------------------------------------
      // A. Concrete Foundation & Anti-Seismic Plinth
      // --------------------------------------------------------------------------
      const plinthW = 5.8;
      const plinthD = 5.8;
      const plinthH = 0.5;

      const plinthGeo = new THREE.BoxGeometry(plinthW, plinthH, plinthD);
      const plinthMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.25 });
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.set(pos[0], plinthH / 2, pos[2]);
      plinth.receiveShadow = true;
      plinth.castShadow = true;
      tower.add(plinth);

      // Hazard safety boundary strip around foundation
      const hazardGeo = new THREE.BoxGeometry(plinthW + 0.08, 0.12, plinthD + 0.08);
      const hazardMat = new THREE.MeshBasicMaterial({ map: hazardTex });
      const hazardMesh = new THREE.Mesh(hazardGeo, hazardMat);
      hazardMesh.position.set(pos[0], plinthH - 0.06, pos[2]);
      tower.add(hazardMesh);

      // Inset Perimeter Floor LED Guide Lights
      const perimeterLightsGroup = new THREE.Group();
      const cornerOffsets = [
        [-plinthW / 2 + 0.3, -plinthD / 2 + 0.3],
        [plinthW / 2 - 0.3, -plinthD / 2 + 0.3],
        [-plinthW / 2 + 0.3, plinthD / 2 - 0.3],
        [plinthW / 2 - 0.3, plinthD / 2 - 0.3]
      ];
      cornerOffsets.forEach(([ox, oz]) => {
        const pMarker = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12),
          new THREE.MeshBasicMaterial({ color: ledColor })
        );
        pMarker.position.set(pos[0] + ox, plinthH + 0.04, pos[2] + oz);
        perimeterLightsGroup.add(pMarker);
      });
      tower.add(perimeterLightsGroup);

      // --------------------------------------------------------------------------
      // B. Main Server Facility Building (Dark Slate Composite & Architectural Fins)
      // --------------------------------------------------------------------------
      const bldgW = 4.0;
      const bldgD = 4.0;
      const bldgH = height;
      const bldgY = plinthH + bldgH / 2;

      // Primary Structural Shell
      const shellGeo = new THREE.BoxGeometry(bldgW, bldgH, bldgD);
      const shellMat = new THREE.MeshStandardMaterial({
        color: 0x111827,       // Dark obsidian titanium panel
        metalness: 0.72,
        roughness: 0.32
      });
      const bldgShell = new THREE.Mesh(shellGeo, shellMat);
      bldgShell.position.set(pos[0], bldgY, pos[2]);
      bldgShell.castShadow = true;
      bldgShell.receiveShadow = true;
      tower.add(bldgShell);

      // 4 Heavy Corner Pilasters / Structural Columns
      const colW = 0.45;
      const colGeo = new THREE.BoxGeometry(colW, bldgH + 0.1, colW);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 });
      const colPositions = [
        [-bldgW / 2 + colW / 2, -bldgD / 2 + colW / 2],
        [bldgW / 2 - colW / 2, -bldgD / 2 + colW / 2],
        [-bldgW / 2 + colW / 2, bldgD / 2 - colW / 2],
        [bldgW / 2 - colW / 2, bldgD / 2 - colW / 2]
      ];
      colPositions.forEach(([cx, cz]) => {
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(pos[0] + cx, bldgY, pos[2] + cz);
        col.castShadow = true;
        tower.add(col);
      });

      // Front Observation Glass Atrium (Revealing internal glowing server racks)
      const glassW = bldgW * 0.7;
      const glassH = bldgH * 0.75;
      const glassGeo = new THREE.PlaneGeometry(glassW, glassH);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
        reflectivity: 0.9
      });
      const glassFront = new THREE.Mesh(glassGeo, glassMat);
      glassFront.position.set(pos[0], bldgY, pos[2] + bldgD / 2 + 0.02);
      tower.add(glassFront);

      // Internal Server Rack Silhouettes behind the glass
      const internalRackGeo = new THREE.PlaneGeometry(glassW - 0.2, glassH - 0.2);
      const internalRackMat = new THREE.MeshBasicMaterial({ map: rackTex, transparent: true, opacity: 0.92 });
      const internalRacks = new THREE.Mesh(internalRackGeo, internalRackMat);
      internalRacks.position.set(pos[0], bldgY, pos[2] + bldgD / 2 - 0.08);
      tower.add(internalRacks);

      // --------------------------------------------------------------------------
      // C. Rooftop Infrastructure: Parapet, HVAC Chillers & Telecom Antenna
      // --------------------------------------------------------------------------
      const roofY = plinthH + bldgH;

      // Rooftop Safety Parapet Wall
      const parapetGeo = new THREE.BoxGeometry(bldgW + 0.15, 0.45, bldgD + 0.15);
      const parapetMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
      const parapet = new THREE.Mesh(parapetGeo, parapetMat);
      parapet.position.set(pos[0], roofY + 0.22, pos[2]);
      tower.add(parapet);

      // Neon LED Accent Ring along top parapet
      const ledRingGeo = new THREE.BoxGeometry(bldgW + 0.22, 0.14, bldgD + 0.22);
      const ledRingMat = new THREE.MeshBasicMaterial({ color: ledColor });
      const ledRingMesh = new THREE.Mesh(ledRingGeo, ledRingMat);
      ledRingMesh.position.set(pos[0], roofY + 0.35, pos[2]);
      tower.add(ledRingMesh);

      // Industrial Rooftop HVAC Chillers with Rotating Cooling Fans
      // Surabaya: 3 Chillers | Jakarta: 2 Chillers | Yogyakarta: 1 Chiller
      const chillerCount = id === 'sby' ? 3 : (id === 'jkt' ? 2 : 1);
      const chillerOffsets = id === 'sby'
        ? [[-0.9, -0.9], [0.9, -0.9], [0.0, 0.9]]
        : (id === 'jkt' ? [[-0.8, 0], [0.8, 0]] : [[0, 0]]);

      chillerOffsets.forEach(([cx, cz], chIdx) => {
        const chillerGroup = new THREE.Group();
        chillerGroup.position.set(pos[0] + cx, roofY + 0.45, pos[2] + cz);

        // Chiller housing box
        const chBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.3, 0.6, 1.3),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.75, roughness: 0.35 })
        );
        chBody.position.y = 0.3;
        chBody.castShadow = true;
        chillerGroup.add(chBody);

        // Circular fan cowling
        const cowl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.48, 0.48, 0.18, 20),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
        );
        cowl.position.y = 0.68;
        chillerGroup.add(cowl);

        // 4-Blade Rotating Fan Propeller
        const fanProp = new THREE.Group();
        fanProp.position.y = 0.68;
        for (let b = 0; b < 4; b++) {
          const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.03, 0.82),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
          );
          blade.rotation.y = (b * Math.PI) / 2;
          blade.rotation.x = 0.25; // Aerodynamic pitch
          fanProp.add(blade);
        }
        chillerGroup.add(fanProp);
        tower.add(chillerGroup);

        // Register fan for dynamic animation
        datacenterFans.push({
          fanMesh: fanProp,
          nodeId: id,
          baseSpeed: 0.06 + chIdx * 0.015
        });
      });

      // Rooftop Telecommunications Antenna & Aviation Obstacle Warning Beacon
      const antMast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.08, 2.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
      );
      antMast.position.set(pos[0] + 1.3, roofY + 1.5, pos[2] - 1.3);
      tower.add(antMast);

      // Parabolic Microwave Telemetry Dish
      const dish = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.05, 0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.25 })
      );
      dish.position.set(pos[0] + 1.3, roofY + 1.7, pos[2] - 1.15);
      dish.rotation.x = Math.PI / 2.8;
      tower.add(dish);

      // Aviation Red Flashing Warning Beacon at Antenna Tip
      const beaconOrb = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      beaconOrb.position.set(pos[0] + 1.3, roofY + 2.65, pos[2] - 1.3);
      tower.add(beaconOrb);

      const beaconLight = new THREE.PointLight(0xef4444, 0.8, 8);
      beaconLight.position.copy(beaconOrb.position);
      scene.add(beaconLight);

      datacenterBeacons.push({
        mesh: beaconOrb,
        light: beaconLight,
        offset: id === 'sby' ? 0 : (id === 'jkt' ? 0.33 : 0.66)
      });

      // --------------------------------------------------------------------------
      // D. Satellite Compute Pods (42U Server Rack Aisles with Conduit Runners)
      // --------------------------------------------------------------------------
      const rackCount = id === 'yog' ? 4 : 3;
      const rackRadius = id === 'sby' ? 4.2 : 3.8;

      for (let i = 0; i < rackCount; i++) {
        const satH = height * (0.5 + i * 0.1);
        const ang = (i * Math.PI * 2) / rackCount;
        const rx = pos[0] + Math.cos(ang) * rackRadius;
        const rz = pos[2] + Math.sin(ang) * rackRadius;

        // Individual Server Rack Pod
        const podGroup = new THREE.Group();
        podGroup.position.set(rx, plinthH + satH / 2, rz);

        // Rack Frame
        const rackFrame = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, satH, 1.5),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.35 })
        );
        rackFrame.castShadow = true;
        rackFrame.receiveShadow = true;
        podGroup.add(rackFrame);

        // Front & Back Server Blade Faceplates
        const frontPanel = new THREE.Mesh(
          new THREE.PlaneGeometry(1.35, satH * 0.95),
          new THREE.MeshBasicMaterial({ map: rackTex })
        );
        frontPanel.position.set(0, 0, 0.76);
        podGroup.add(frontPanel);

        const backPanel = new THREE.Mesh(
          new THREE.PlaneGeometry(1.35, satH * 0.95),
          new THREE.MeshBasicMaterial({ map: rackTex })
        );
        backPanel.position.set(0, 0, -0.76);
        backPanel.rotation.y = Math.PI;
        podGroup.add(backPanel);

        // Overhead Fiber Conduit Runner connecting Rack to Main Facility
        const conduitPoints = [
          new THREE.Vector3(rx, plinthH + satH, rz),
          new THREE.Vector3((rx + pos[0]) / 2, plinthH + satH + 0.4, (rz + pos[2]) / 2),
          new THREE.Vector3(pos[0] + Math.cos(ang) * 2.0, plinthH + bldgH * 0.75, pos[2] + Math.sin(ang) * 2.0)
        ];
        const conduitCurve = new THREE.CatmullRomCurve3(conduitPoints);
        const conduitGeo = new THREE.TubeGeometry(conduitCurve, 12, 0.05, 8, false);
        const conduitMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
        const conduitMesh = new THREE.Mesh(conduitGeo, conduitMat);
        tower.add(conduitMesh);

        tower.add(podGroup);
      }

      // --------------------------------------------------------------------------
      // E. Dynamic Central PointLight & Status Billboard HUD
      // --------------------------------------------------------------------------
      const dcLight = new THREE.PointLight(ledColor, 1.4, 20);
      dcLight.position.set(pos[0], roofY + 1.2, pos[2]);
      scene.add(dcLight);

      // High-Definition Crisp Billboard Sprite
      const billboard = createUnifiedBillboard(name, subtitle, 'STATUS: SIAP ALOKASI', ledColor);
      billboard.position.set(pos[0], roofY + 3.2, pos[2]);
      tower.add(billboard);

      scene.add(tower);

      // Register Datacenter Node with full compatibility
      datacenterNodes[id] = {
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
        state: 'normal',
        landedCount: 0
      };
    }

    // ============================================================================
    // BILLBOARDS & HUD CANVASES
    // ============================================================================
    function createUnifiedBillboard(title, subtitle, status, colorHex) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 140;
      updateBillboardCanvas(canvas, title, subtitle, status, colorHex);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(7.0, 1.9, 1);
      sp.userData = { canvas, texture, title, subtitle };
      return sp;
    }

    function updateBillboardCanvas(canvas, title, subtitle, status, colorHex) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background rounded pill with subtle shadow
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.roundRect ? ctx.roundRect(8, 8, 496, 124, 18) : ctx.fillRect(8, 8, 496, 124);
      ctx.fill();

      // Border with dynamic status indicator color
      ctx.lineWidth = 7;
      ctx.strokeStyle = typeof colorHex === 'number' ? '#' + colorHex.toString(16).padStart(6, '0') : colorHex;
      ctx.stroke();

      // Datacenter Name Title
      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 256, 46);

      // Subtitle (MIPS & Specs)
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 21px monospace';
      ctx.fillText(subtitle, 256, 82);

      // Live Operational Status
      ctx.fillStyle = typeof colorHex === 'number' ? '#' + colorHex.toString(16).padStart(6, '0') : colorHex;
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(status, 256, 116);
    }

    function setDatacenterBillboardStatus(id, statusText, colorHex) {
      const node = datacenterNodes[id];
      if (!node) return;
      const sp = node.billboard;
      updateBillboardCanvas(sp.userData.canvas, node.name, node.subtitle, statusText, colorHex);
      sp.userData.texture.needsUpdate = true;
    }

    // ============================================================================
    // CLIENT DISPATCHER PLATFORM & NETWORK TRUNKS
    // ============================================================================
    function buildDispatcherPlatform(pos) {
      dispatcherPlatform = new THREE.Group();

      // Multi-layer Aerospace Dispatcher Pedestal
      const platGeo = new THREE.CylinderGeometry(3.2, 3.6, 0.5, 36);
      const platMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 });
      const plat = new THREE.Mesh(platGeo, platMat);
      plat.castShadow = true;
      dispatcherPlatform.add(plat);

      // Dual Pulsing Concentric Neon Rings
      const ringOuterGeo = new THREE.TorusGeometry(3.4, 0.08, 12, 40);
      const ringOuterMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
      const ringOuter = new THREE.Mesh(ringOuterGeo, ringOuterMat);
      ringOuter.rotation.x = Math.PI / 2;
      dispatcherPlatform.add(ringOuter);

      const ringInnerGeo = new THREE.TorusGeometry(2.2, 0.06, 12, 32);
      const ringInnerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ringInner = new THREE.Mesh(ringInnerGeo, ringInnerMat);
      ringInner.rotation.x = Math.PI / 2;
      ringInner.position.y = 0.1;
      dispatcherPlatform.add(ringInner);

      // Holographic Dispatcher Billboard
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.roundRect ? ctx.roundRect(6, 6, 468, 88, 16) : ctx.fillRect(6, 6, 468, 88);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0284c7';
      ctx.stroke();

      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌐 Client Workload Dispatcher', 240, 44);

      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('Antrean Tugas Ilmiah Riil (100 - 500 Tasks)', 240, 78);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(5.8, 1.25, 1);
      sp.position.set(0, 2.0, 0);
      dispatcherPlatform.add(sp);

      dispatcherPlatform.position.set(...pos);
      scene.add(dispatcherPlatform);
    }

    function buildNetworkTrunk(id, p1, p2, color) {
      const v1 = new THREE.Vector3(...p1);
      const v2 = new THREE.Vector3(...p2);

      // Fiber Optic Line
      const geom = new THREE.BufferGeometry().setFromPoints([v1, v2]);
      const mat = new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.75 });
      const line = new THREE.Line(geom, mat);
      line.userData = { id, baseColor: color, p1: v1, p2: v2 };
      scene.add(line);
      laserLines.push(line);

      // Active Glowing Data Packet Beads moving on Trunk
      for (let i = 0; i < 2; i++) {
        const packetMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 12, 12),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
        );
        packetMesh.position.copy(v1);
        scene.add(packetMesh);

        networkPackets.push({
          mesh: packetMesh,
          p1: v1,
          p2: v2,
          progress: i * 0.5,
          speed: 0.008 + Math.random() * 0.004
        });
      }
    }

    // ============================================================================
    // 4. AOA EXPLORATION & EXPLOITATION DRONES
    // ============================================================================
    function createAOAExploreDrones() {
      for (let i = 0; i < 5; i++) {
        const drone = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.3, 1.1),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 })
        );
        drone.add(body);

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.7, 0.04, 8, 20),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        ring.rotation.x = Math.PI / 2;
        drone.add(ring);

        drone.position.set((Math.random() - 0.5) * 28, 7.0 + Math.random() * 3.5, (Math.random() - 0.5) * 20);
        drone.visible = false;
        scene.add(drone);
        aoaExploreDrones.push(drone);
      }
    }

    function createAOAExploitDrones() {
      for (let i = 0; i < 4; i++) {
        const drone = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, 0.28, 1.0),
          new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.6, roughness: 0.3 })
        );
        drone.add(body);

        const laser = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 4.5, 8),
          new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.85 })
        );
        laser.position.y = -2.25;
        drone.add(laser);

        drone.position.set(-11 + (Math.random() - 0.5) * 6, 9.5 + Math.random() * 2, -2 + (Math.random() - 0.5) * 6);
        drone.visible = false;
        scene.add(drone);
        aoaExploitDrones.push(drone);
      }
    }

    // ============================================================================
    // 7. 3D ANIMATION LOOP (LIVING DATACENTER WORLD)
    // ============================================================================
    const setDatacenterBadge = setDatacenterBillboardStatus;

    function animate() {
      animId = requestAnimationFrame(animate);

      const t = Date.now() * 0.001;

      // 1. Simulation Stopwatch Countup
      if (clockRunning) {
        if (simClockTime < targetClockTime) {
          simClockTime += (targetClockTime / 90);
          if (simClockTime > targetClockTime) simClockTime = targetClockTime;
          const clockEl = document.getElementById('clockValue');
          if (clockEl) clockEl.innerText = simClockTime.toFixed(2) + 's';
        } else {
          simClockTime = targetClockTime;
          const clockEl = document.getElementById('clockValue');
          if (clockEl) clockEl.innerText = targetClockTime.toFixed(2) + 's';
          clockRunning = false;
        }
      }

      // 2. Animate Rooftop HVAC Chiller Fans (Real-Time Cooling Rotation)
      datacenterFans.forEach(fanObj => {
        const node = datacenterNodes[fanObj.nodeId];
        // If overloaded, fans spin 4.5x faster in emergency thermal cooling mode!
        const multiplier = (node && node.state === 'overload') ? 4.5 : 1.0;
        fanObj.fanMesh.rotation.y += fanObj.baseSpeed * multiplier;
      });

      // 3. Animate Aviation Obstacle Flashing Beacons (1Hz authentic strobe)
      datacenterBeacons.forEach(b => {
        const flash = Math.sin(t * 6 + b.offset * Math.PI) > 0.4;
        b.light.intensity = flash ? 1.4 : 0.08;
        b.mesh.material.color.setHex(flash ? 0xef4444 : 0x581c1c);
      });

      // 4. Animate Flowing Data Packet Beads on Fiber Trunks
      networkPackets.forEach(pkt => {
        pkt.progress += pkt.speed;
        if (pkt.progress > 1) pkt.progress = 0;
        pkt.mesh.position.lerpVectors(pkt.p1, pkt.p2, pkt.progress);
      });

      // 5. Rotate Golden Crown & Animate Beacon atop Surabaya
      if (goldenCrown) {
        goldenCrown.rotation.y += 0.025;
        goldenCrown.rotation.x += 0.012;
      }

      // 6. Flying Task Physics (Quadratic Bezier Curves from Dispatcher to Datacenters)
      if (activeFlyingTasks.length > 0) {
        for (let i = activeFlyingTasks.length - 1; i >= 0; i--) {
          const task = activeFlyingTasks[i];
          task.progress += task.speed;

          if (task.progress >= 0 && task.progress < 1) {
            task.mesh.visible = true;
            const u = task.progress;
            const u1 = 1 - u;
            task.mesh.position.x = u1 * u1 * task.startP.x + 2 * u1 * u * task.ctrlP.x + u * u * task.endP.x;
            task.mesh.position.y = u1 * u1 * task.startP.y + 2 * u1 * u * task.ctrlP.y + u * u * task.endP.y;
            task.mesh.position.z = u1 * u1 * task.startP.z + 2 * u1 * u * task.ctrlP.z + u * u * task.endP.z;
            task.mesh.rotation.y += 0.04;
            task.mesh.rotation.x += 0.02;
          } else if (task.progress >= 1) {
            task.mesh.position.copy(task.endP);
            task.mesh.rotation.set(0, 0, 0);
            landedTasks.push(task.mesh);
            activeFlyingTasks.splice(i, 1);
            triggerDatacenterLandingVisuals(task.targetId, currentSimAlgo);
          } else {
            task.mesh.visible = false;
          }
        }
      }

      // 7. Animate Datacenter Visual Effects (Pulsing Overload / Optimal Glow)
      updateDatacenterGlows(t);

      // 8. Animate AOA Drones
      if (currentSimAlgo === 'aoa' || current3DMode === 'aoa-explore') {
        aoaExploreDrones.forEach((dr, idx) => {
          dr.position.x += Math.sin(t * 0.7 + idx) * 0.12;
          dr.position.z += Math.cos(t * 0.7 + idx) * 0.12;
          dr.position.y = 7.5 + Math.sin(t * 1.4 + idx) * 0.5;
        });
      }
      if (currentSimAlgo === 'aoa' || current3DMode === 'aoa-exploit') {
        aoaExploitDrones.forEach((dr, idx) => {
          dr.position.x += Math.sin(t * 1.2 + idx) * 0.03;
          dr.position.z += Math.cos(t * 1.2 + idx) * 0.03;
          dr.position.y = 10.2 + Math.sin(t * 2.0 + idx) * 0.2;
        });
      }

      controls.update();
      renderer.render(scene, camera);
    }

    // ============================================================================
    // STATE TRANSITIONS & CONSEQUENCE VISUALS
    // ============================================================================
    function triggerDatacenterLandingVisuals(targetId, algo) {
      const node = datacenterNodes[targetId];
      if (!node) return;

      if (algo === 'random') {
        if (targetId === 'yog') {
          // Yogyakarta Overloaded Bottleneck!
          node.state = 'overload';
          node.ledMesh.material.color.setHex(0xef4444); // Red Alarm
          node.light.color.setHex(0xef4444);
          node.light.intensity = 3.8;
          setDatacenterBillboardStatus('yog', '⚠️ OVERLOAD 98% (BOTTLENECK)', '#ef4444');

          // Congest Network Trunk to Yogyakarta
          const line1 = laserLines.find(l => l.userData.id === 'sby_yog');
          if (line1) line1.material.color.setHex(0xef4444);
          const line2 = laserLines.find(l => l.userData.id === 'disp_yog');
          if (line2) line2.material.color.setHex(0xef4444);
        } else if (targetId === 'sby') {
          // Surabaya Underutilized / Idle
          node.state = 'idle';
          node.ledMesh.material.color.setHex(0x64748b); // Dim Slate
          node.light.color.setHex(0x64748b);
          node.light.intensity = 0.4;
          setDatacenterBillboardStatus('sby', '💤 IDLE 14% (KAPASITAS TERBUANG)', '#64748b');
        } else {
          setDatacenterBillboardStatus('jkt', 'BEBAN 36% (SEDANG)', '#7c3aed');
        }
      } else {
        // AOA: All nodes reach harmonious optimal balance
        node.state = 'optimal';
        node.ledMesh.material.color.setHex(0x10b981); // Emerald Green
        node.light.color.setHex(0x10b981);
        node.light.intensity = 2.2;

        setDatacenterBillboardStatus('sby', '✅ OPTIMAL 54% (HEAVY LOAD)', '#0284c7');
        setDatacenterBillboardStatus('jkt', '✅ OPTIMAL 53% (MEDIUM LOAD)', '#7c3aed');
        setDatacenterBillboardStatus('yog', '✅ OPTIMAL 55% (LIGHT LOAD)', '#059669');

        // Synchronized Green Flow on Network Trunks
        laserLines.forEach(l => l.material.color.setHex(0x10b981));
      }
    }

    function updateDatacenterGlows(t) {
      // Yogyakarta Pulsing Alarm if Overloaded
      const yogNode = datacenterNodes['yog'];
      if (yogNode && yogNode.state === 'overload') {
        const pulse = (Math.sin(t * 14) + 1) * 0.5;
        yogNode.light.intensity = 2.2 + pulse * 2.8;
      }

      // Surabaya Golden Glow if AOA Optimal
      const sbyNode = datacenterNodes['sby'];
      if (sbyNode && sbyNode.state === 'optimal') {
        const pulse = (Math.sin(t * 3.5) + 1) * 0.5;
        sbyNode.light.intensity = 1.8 + pulse * 0.9;
      }
    }

    function set3DMode(mode) {
      current3DMode = mode;

      document.getElementById('btnModeTopology').classList.toggle('active', mode === 'topology');
      document.getElementById('btnModeAOAExplore').classList.toggle('active', mode === 'aoa-explore');
      document.getElementById('btnModeAOAExploit').classList.toggle('active', mode === 'aoa-exploit');

      const titleEl = document.getElementById('stageTitle');
      const telemEl = document.getElementById('stageTelemetry');

      if (mode === 'topology') {
        titleEl.innerText = 'Topologi 3 Datacenter (Minggu 3)';
        telemEl.innerText = 'Surabaya (6.000 MIPS) • Jakarta (3.600 MIPS) • Yogyakarta (800 MIPS)';
        aoaExploreDrones.forEach(d => d.visible = false);
        aoaExploitDrones.forEach(d => d.visible = false);
        if (goldenBeam) goldenBeam.visible = false;
      } else if (mode === 'aoa-explore') {
        titleEl.innerText = 'Fase Eksplorasi AOA: Pembagian (÷) & Perkalian (×)';
        telemEl.innerText = 'Drone Biru Melompat Jauh Menjelajahi Seluruh Ruang VM & Datacenter';
        aoaExploreDrones.forEach(d => d.visible = true);
        aoaExploitDrones.forEach(d => d.visible = false);
        if (goldenBeam) goldenBeam.visible = true;
      } else if (mode === 'aoa-exploit') {
        titleEl.innerText = 'Fase Eksploitasi AOA: Pengurangan (-) & Penambahan (+)';
        telemEl.innerText = 'Drone Hijau Memindai Presisi di Sekitar Solusi Terbaik (Surabaya 6.000 MIPS)';
        aoaExploreDrones.forEach(d => d.visible = false);
        aoaExploitDrones.forEach(d => d.visible = true);
        if (goldenBeam) goldenBeam.visible = true;
      }
    }

    function onResize() {
      const container = document.getElementById('threeCanvas');
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
