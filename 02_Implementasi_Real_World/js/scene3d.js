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

    function init3D() {
      const container = document.getElementById('threeCanvas');
      const width = container.clientWidth;
      const height = container.clientHeight;

      // 1. Scene & Warm Studio Lighting
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xfcf8f2);
      scene.fog = new THREE.FogExp2(0xfcf8f2, 0.01);

      // Camera angled for balanced isometric view of all 3 DCs & Dispatcher
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 24, 34);

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
      controls.target.set(0, 3.5, 0);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xfffaed, 1.25);
      sunLight.position.set(22, 40, 25);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      scene.add(sunLight);

      const fillLight = new THREE.DirectionalLight(0xfef3c7, 0.55);
      fillLight.position.set(-20, 25, -20);
      scene.add(fillLight);

      // Floor
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(80, 80),
        new THREE.MeshStandardMaterial({ color: 0xf4ede2, roughness: 0.9 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      const gridHelper = new THREE.GridHelper(80, 40, 0x0284c7, 0xdcd0be);
      gridHelper.position.y = 0.02;
      scene.add(gridHelper);

      // 2. Build 3 Datacenter Towers (Framed in Triangle Topology)
      // Surabaya: Host 0, Large MIPS (6.000 MIPS) at Left [-11, 0, -2]
      buildDatacenterTower('sby', 'DC_SURABAYA (Host 0)', 'VM 0,1,2 • 6.000 MIPS', [-11, 0, -2], 8.5, 0x0284c7, 0x38bdf8);
      
      // Jakarta: Host 1, Medium MIPS (3.600 MIPS) at Right [11, 0, -2]
      buildDatacenterTower('jkt', 'DC_JAKARTA (Host 1)', 'VM 3,4,5 • 3.600 MIPS', [11, 0, -2], 6.5, 0x7c3aed, 0xa855f7);
      
      // Yogyakarta: Host 2, Small MIPS (800 MIPS) at Center-Front [0, 0, 7]
      buildDatacenterTower('yog', 'DC_YOGYAKARTA (Host 2)', 'VM 6..9 • 800 MIPS', [0, 0, 7], 4.5, 0x059669, 0x10b981);

      // 3. Network Laser Lines connecting Datacenters
      buildNetworkTrunk('sby_jkt', [-11, 0.5, -2], [11, 0.5, -2], 0x0284c7);
      buildNetworkTrunk('sby_yog', [-11, 0.5, -2], [0, 0.5, 7], 0x059669);
      buildNetworkTrunk('jkt_yog', [11, 0.5, -2], [0, 0.5, 7], 0x7c3aed);

      // 4. Build Client Workload Dispatcher (Elevated at Center-Back [0, 9, -12])
      buildDispatcherPlatform([0, 9, -12]);

      // Connect Dispatcher to 3 Datacenters via Network Trunks
      buildNetworkTrunk('disp_sby', [0, 9, -12], [-11, 4.5, -2], 0x38bdf8);
      buildNetworkTrunk('disp_jkt', [0, 9, -12], [11, 3.5, -2], 0xa855f7);
      buildNetworkTrunk('disp_yog', [0, 9, -12], [0, 2.5, 7], 0x10b981);

      // 5. Golden Beacon & Crown atop Surabaya (Clean vertical beam, no giant diagonal!)
      goldenCrown = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.65, 0),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.9 })
      );
      goldenCrown.position.set(-11, 9.8, -2);
      scene.add(goldenCrown);

      const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, 8, 16);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.85 });
      goldenBeam = new THREE.Mesh(beamGeo, beamMat);
      goldenBeam.position.set(-11, 13.5, -2);
      goldenBeam.visible = false;
      scene.add(goldenBeam);

      // 6. AOA Drones
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
    // 3. DATACENTER & DISPATCHER BUILDERS
    // ============================================================================
    function buildDatacenterTower(id, name, subtitle, pos, height, bodyColor, ledColor) {
      const tower = new THREE.Group();
      
      // Main Server Tower Body
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, height, 3.8),
        new THREE.MeshStandardMaterial({ color: 0x3d2d22, metalness: 0.5, roughness: 0.4 })
      );
      body.position.set(pos[0], height / 2, pos[2]);
      body.castShadow = true;
      body.receiveShadow = true;
      tower.add(body);

      // LED Ring Top
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(3.9, 0.35, 3.9),
        ledMat
      );
      led.position.set(pos[0], height + 0.18, pos[2]);
      tower.add(led);

      // Dynamic Alert PointLight
      const dcLight = new THREE.PointLight(ledColor, 1.2, 16);
      dcLight.position.set(pos[0], height + 1.2, pos[2]);
      scene.add(dcLight);

      // Satellite VM Racks
      const rackCount = id === 'yog' ? 4 : 3;
      for (let i = 0; i < rackCount; i++) {
        const satH = height * (0.55 + i * 0.1);
        const sat = new THREE.Mesh(
          new THREE.BoxGeometry(1.4, satH, 1.4),
          new THREE.MeshStandardMaterial({ color: 0x5a4335, metalness: 0.3 })
        );
        const ang = (i * Math.PI * 2) / rackCount;
        sat.position.set(pos[0] + Math.cos(ang) * 3.6, satH / 2, pos[2] + Math.sin(ang) * 3.6);
        sat.castShadow = true;
        tower.add(sat);
      }

      // Single Unified Crisp Billboard Sprite (Placed cleanly above tower)
      const billboard = createUnifiedBillboard(name, subtitle, 'STATUS: SIAP ALOKASI', ledColor);
      billboard.position.set(pos[0], height + 2.5, pos[2]);
      tower.add(billboard);

      scene.add(tower);

      // Register Datacenter Node
      datacenterNodes[id] = {
        id,
        group: tower,
        bodyMesh: body,
        ledMesh: led,
        light: dcLight,
        billboard,
        pos: new THREE.Vector3(...pos),
        height,
        name,
        subtitle,
        baseColor: bodyColor,
        baseLedColor: ledColor,
        state: 'normal',
        landedCount: 0
      };
    }

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

      // Background rounded pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.roundRect ? ctx.roundRect(8, 8, 496, 124, 18) : ctx.fillRect(8, 8, 496, 124);
      ctx.fill();

      // Border with status color
      ctx.lineWidth = 7;
      ctx.strokeStyle = typeof colorHex === 'number' ? `#${colorHex.toString(16).padStart(6, '0')}` : colorHex;
      ctx.stroke();

      // Title
      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, 256, 46);

      // Subtitle
      ctx.fillStyle = '#78716c';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(subtitle, 256, 82);

      // Live Status
      ctx.fillStyle = typeof colorHex === 'number' ? `#${colorHex.toString(16).padStart(6, '0')}` : colorHex;
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

    function buildDispatcherPlatform(pos) {
      dispatcherPlatform = new THREE.Group();

      // Platform Disc Base
      const platGeo = new THREE.CylinderGeometry(2.8, 3.0, 0.4, 32);
      const platMat = new THREE.MeshStandardMaterial({ color: 0x292524, metalness: 0.7, roughness: 0.3 });
      const plat = new THREE.Mesh(platGeo, platMat);
      dispatcherPlatform.add(plat);

      // Pulsing Cyan Ring
      const ringGeo = new THREE.TorusGeometry(3.0, 0.08, 12, 36);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      dispatcherPlatform.add(ring);

      // Holographic Title Sprite
      const canvas = document.createElement('canvas');
      canvas.width = 460;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.roundRect ? ctx.roundRect(6, 6, 448, 88, 16) : ctx.fillRect(6, 6, 448, 88);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0284c7';
      ctx.stroke();

      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🌐 Client Workload Dispatcher', 230, 44);

      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('Antrean Tugas Ilmiah Riil (100 - 500 Tasks)', 230, 78);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(5.5, 1.2, 1);
      sp.position.set(0, 1.8, 0);
      dispatcherPlatform.add(sp);

      dispatcherPlatform.position.set(...pos);
      scene.add(dispatcherPlatform);
    }

    function buildNetworkTrunk(id, p1, p2, color) {
      const points = [new THREE.Vector3(...p1), new THREE.Vector3(...p2)];
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color, linewidth: 2, transparent: true, opacity: 0.75 });
      const line = new THREE.Line(geom, mat);
      line.userData = { id, baseColor: color, p1, p2 };
      scene.add(line);
      laserLines.push(line);
    }

    // ============================================================================
    // 4. AOA EXPLORATION & EXPLOITATION DRONES
    // ============================================================================
    function createAOAExploreDrones() {
      for (let i = 0; i < 5; i++) {
        const drone = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.3, 1.1),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6 })
        );
        drone.add(body);

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.7, 0.04, 8, 20),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        ring.rotation.x = Math.PI / 2;
        drone.add(ring);

        drone.position.set((Math.random() - 0.5) * 28, 6.5 + Math.random() * 3.5, (Math.random() - 0.5) * 20);
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
          new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.5 })
        );
        drone.add(body);

        const laser = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 4.0, 8),
          new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.85 })
        );
        laser.position.y = -2.0;
        drone.add(laser);

        drone.position.set(-11 + (Math.random() - 0.5) * 6, 8.5 + Math.random() * 2, -2 + (Math.random() - 0.5) * 6);
        drone.visible = false;
        scene.add(drone);
        aoaExploitDrones.push(drone);
      }
    }


    // ============================================================================
    // 7. 3D ANIMATION LOOP
    // ============================================================================
    const setDatacenterBadge = setDatacenterBillboardStatus;

    function animate() {
      animId = requestAnimationFrame(animate);

      const t = Date.now() * 0.001;

      // Update Simulation Clock Progress smoothly
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

      // Rotate golden crown & pulse beacon
      if (goldenCrown) {
        goldenCrown.rotation.y += 0.02;
        goldenCrown.rotation.x += 0.01;
      }

      // Update Flying Tasks
      if (activeFlyingTasks.length > 0) {
        for (let i = activeFlyingTasks.length - 1; i >= 0; i--) {
          const task = activeFlyingTasks[i];
          task.progress += task.speed;

          if (task.progress >= 0 && task.progress < 1) {
            task.mesh.visible = true;
            // Quadratic Bezier Interpolation
            const u = task.progress;
            const u1 = 1 - u;
            task.mesh.position.x = u1 * u1 * task.startP.x + 2 * u1 * u * task.ctrlP.x + u * u * task.endP.x;
            task.mesh.position.y = u1 * u1 * task.startP.y + 2 * u1 * u * task.ctrlP.y + u * u * task.endP.y;
            task.mesh.position.z = u1 * u1 * task.startP.z + 2 * u1 * u * task.ctrlP.z + u * u * task.endP.z;
            task.mesh.rotation.y += 0.04;
            task.mesh.rotation.x += 0.02;
          } else if (task.progress >= 1) {
            // Task Lands at Destination Datacenter
            task.mesh.position.copy(task.endP);
            task.mesh.rotation.set(0, 0, 0);
            landedTasks.push(task.mesh);
            activeFlyingTasks.splice(i, 1);

            // Update Datacenter Consequence Visuals
            triggerDatacenterLandingVisuals(task.targetId, currentSimAlgo);
          } else {
            task.mesh.visible = false;
          }
        }
      }

      // Animate Datacenter Visual Effects (Pulsing Overload / Optimal Glow)
      updateDatacenterGlows(t);

      // Animate AOA Drones
      if (currentSimAlgo === 'aoa' || current3DMode === 'aoa-explore') {
        aoaExploreDrones.forEach((dr, idx) => {
          dr.position.x += Math.sin(t * 0.7 + idx) * 0.12;
          dr.position.z += Math.cos(t * 0.7 + idx) * 0.12;
          dr.position.y = 7.0 + Math.sin(t * 1.4 + idx) * 0.5;
        });
      }
      if (currentSimAlgo === 'aoa' || current3DMode === 'aoa-exploit') {
        aoaExploitDrones.forEach((dr, idx) => {
          dr.position.x += Math.sin(t * 1.2 + idx) * 0.03;
          dr.position.z += Math.cos(t * 1.2 + idx) * 0.03;
          dr.position.y = 9.2 + Math.sin(t * 2.0 + idx) * 0.2;
        });
      }

      // Animate Default Data Cubes (idle floating)
      dataCubes.forEach((cb, idx) => {
        cb.rotation.y += 0.015 + idx * 0.002;
        cb.position.y = 5 + Math.sin(t * 1.5 + idx) * 0.4;
      });

      controls.update();
      renderer.render(scene, camera);
    }

    function triggerDatacenterLandingVisuals(targetId, algo) {
      const node = datacenterNodes[targetId];
      if (!node) return;

      if (algo === 'random') {
        if (targetId === 'yog') {
          // Yogyakarta Overloaded!
          node.state = 'overload';
          node.ledMesh.material.color.setHex(0xef4444); // Flash Red
          node.light.color.setHex(0xef4444);
          node.light.intensity = 3.5;
          setDatacenterBillboardStatus('yog', '⚠️ OVERLOAD 98% (BOTTLENECK)', '#ef4444');

          // Congest Network Trunk to Yogyakarta
          const line1 = laserLines.find(l => l.userData.id === 'sby_yog');
          if (line1) line1.material.color.setHex(0xef4444);
          const line2 = laserLines.find(l => l.userData.id === 'disp_yog');
          if (line2) line2.material.color.setHex(0xef4444);
        } else if (targetId === 'sby') {
          // Surabaya Underutilized / Idle
          node.state = 'idle';
          node.ledMesh.material.color.setHex(0x64748b); // Dim Gray
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
        node.light.intensity = 2.0;

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
        const pulse = (Math.sin(t * 12) + 1) * 0.5;
        yogNode.light.intensity = 2.0 + pulse * 2.5;
      }

      // Surabaya Golden Glow if AOA Optimal
      const sbyNode = datacenterNodes['sby'];
      if (sbyNode && sbyNode.state === 'optimal') {
        const pulse = (Math.sin(t * 3) + 1) * 0.5;
        sbyNode.light.intensity = 1.6 + pulse * 0.8;
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
        telemEl.innerText = 'Surabaya (6.000 MIPS) &bull; Jakarta (3.600 MIPS) &bull; Yogyakarta (800 MIPS)';
        dataCubes.forEach(c => c.visible = true);
        aoaExploreDrones.forEach(d => d.visible = false);
        aoaExploitDrones.forEach(d => d.visible = false);
        beaconGroup.visible = true;
      } else if (mode === 'aoa-explore') {
        titleEl.innerText = 'Fase Eksplorasi AOA: Pembagian (÷) & Perkalian (×)';
        telemEl.innerText = 'Drone Biru Melompat Jauh Menjelajahi Seluruh Ruang VM & Datacenter';
        dataCubes.forEach(c => c.visible = false);
        aoaExploreDrones.forEach(d => d.visible = true);
        aoaExploitDrones.forEach(d => d.visible = false);
        beaconGroup.visible = true;
      } else if (mode === 'aoa-exploit') {
        titleEl.innerText = 'Fase Eksploitasi AOA: Pengurangan (-) & Penambahan (+)';
        telemEl.innerText = 'Drone Hijau Memindai Presisi di Sekitar Solusi Terbaik (Surabaya 6.000 MIPS)';
        dataCubes.forEach(c => c.visible = true);
        aoaExploreDrones.forEach(d => d.visible = false);
        aoaExploitDrones.forEach(d => d.visible = true);
        beaconGroup.visible = true;
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
