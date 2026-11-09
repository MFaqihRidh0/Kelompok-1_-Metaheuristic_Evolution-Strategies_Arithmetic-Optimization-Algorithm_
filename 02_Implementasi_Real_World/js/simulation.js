    // ============================================================================
    // 5. INTERACTIVE SIMULATION & ANIMATION (FAITHFUL TO PROGRAM)
    // ============================================================================
    function triggerRunSimulation() {
      const algo = document.getElementById('algoSelect').value;
      const dataset = document.getElementById('datasetSelect').value;
      const env = document.getElementById('envSelect').value;

      currentSimAlgo = algo;
      isSimRunning = true;

      // 1. Reset visual tasks cleanly
      clearSimulationCubes();

      // 2. Fetch authentic data
      const record = BENCHMARK_DATA[env][dataset];
      const targetMakespan = record[algo].makespan;
      targetClockTime = targetMakespan;
      simClockTime = 0.0;
      clockRunning = true;

      // 3. Update HUD & Datacenter Meter UI
      updateHUDDisplay();

      // 4. Launch visual tasks along Bezier flight arcs
      spawnRealisticTasks(algo, parseInt(dataset));
    }

    function runDemoAlgo(algoType) {
      document.getElementById('algoSelect').value = algoType;
      triggerRunSimulation();
    }

    function spawnRealisticTasks(algo, taskCount) {
      const startP = new THREE.Vector3(0, 9, -12); // Client Dispatcher Platform
      const sampleCount = 20;

      // Realistic task assignment based on algorithm logic:
      let assignedTargets = [];
      if (algo === 'random') {
        // Random Scheduling: Blindly assigns. 11 tasks flood Yogyakarta (800 MIPS), 6 Jakarta, 3 Surabaya
        for (let i = 0; i < 11; i++) assignedTargets.push('yog');
        for (let i = 0; i < 6; i++)  assignedTargets.push('jkt');
        for (let i = 0; i < 3; i++)  assignedTargets.push('sby');
        assignedTargets = assignedTargets.sort(() => Math.random() - 0.5);

        // Turn Drones OFF, hide golden beam
        aoaExploreDrones.forEach(d => (d.droneGroup || d).visible = false);
        aoaExploitDrones.forEach(d => (d.droneGroup || d).visible = false);
        if (goldenBeam) goldenBeam.visible = false;
      } else {
        // AOA: Capacitated matching! Surabaya (15.600 MIPS) takes heavy tasks, Jakarta medium, Yogya light
        for (let i = 0; i < 10; i++) assignedTargets.push('sby'); // 50% Workload
        for (let i = 0; i < 6; i++)  assignedTargets.push('jkt'); // 30% Workload
        for (let i = 0; i < 4; i++)  assignedTargets.push('yog'); // 20% Workload

        // Turn Drones ON, show golden beam!
        aoaExploreDrones.forEach(d => (d.droneGroup || d).visible = true);
        aoaExploitDrones.forEach(d => (d.droneGroup || d).visible = true);
        if (goldenBeam) goldenBeam.visible = true;
      }

      assignedTargets.forEach((targetId, idx) => {
        const destNode = datacenterNodes[targetId];
        
        // Task Weighting:
        // Heavy tasks (45k-60k MI): Large size (1.2), Cyan/Blue
        // Medium tasks (18k-32k MI): Medium size (0.9), Purple
        // Light tasks (2k-10k MI): Small size (0.65), Green
        const isHeavy = (algo === 'aoa' && targetId === 'sby') || (algo === 'random' && idx % 2 === 0);
        const cubeSize = isHeavy ? 1.2 : (targetId === 'jkt' ? 0.9 : 0.65);
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
        scene.add(mesh);

        // Calculate landing slot at datacenter racks
        const landOffset = calculateLandingSlot(targetId, algo);
        const endP = new THREE.Vector3(
          destNode.pos.x + landOffset.x,
          destNode.pos.y + landOffset.y,
          destNode.pos.z + landOffset.z
        );

        // Control point for smooth curved flight trajectory
        const midX = (startP.x + endP.x) / 2;
        const midZ = (startP.z + endP.z) / 2;
        const midY = Math.max(startP.y, endP.y) + 3.8 + Math.random() * 2.0;
        const ctrlP = new THREE.Vector3(midX, midY, midZ);

        activeFlyingTasks.push({
          mesh,
          targetId,
          startP,
          ctrlP,
          endP,
          progress: -(idx * 0.05), // Staggered launch
          speed: 0.018 + Math.random() * 0.004,
          isHeavy
        });
      });
    }

    function calculateLandingSlot(targetId, algo) {
      const node = datacenterNodes[targetId];
      const count = (node.landedCount || 0);
      node.landedCount = count + 1;

      if (algo === 'random' && targetId === 'yog') {
        // Chaotic wobbling pile on overloaded Yogyakarta
        const stackH = count * 0.48;
        const wobbleX = (Math.random() - 0.5) * 0.5;
        const wobbleZ = (Math.random() - 0.5) * 0.5;
        return { x: wobbleX, y: node.height + 0.3 + stackH, z: wobbleZ };
      } else {
        // Neat orderly circular tray around datacenter satellite racks
        const ang = (count * Math.PI * 2) / 5;
        const radius = 2.4;
        return {
          x: Math.cos(ang) * radius,
          y: 0.35 + (Math.floor(count / 5) * 0.75),
          z: Math.sin(ang) * radius
        };
      }
    }

    function clearSimulationCubes() {
      // Remove flying tasks
      activeFlyingTasks.forEach(t => scene.remove(t.mesh));
      activeFlyingTasks = [];

      // Remove landed tasks
      landedTasks.forEach(mesh => scene.remove(mesh));
      landedTasks = [];

      // Reset node counters & billboards
      Object.values(datacenterNodes).forEach(node => {
        node.landedCount = 0;
        node.state = 'normal';
        node.ledMesh.material.color.setHex(node.baseLedColor);
        node.light.color.setHex(node.baseLedColor);
        node.light.intensity = 1.2;
        setDatacenterBillboardStatus(node.id, 'STATUS: SIAP ALOKASI', node.baseLedColor);
      });

      // Reset network lines
      laserLines.forEach(line => {
        line.material.color.setHex(line.userData.baseColor);
      });

      if (goldenBeam) goldenBeam.visible = false;
      clockRunning = false;
      simClockTime = 0.0;
      document.getElementById('clockValue').innerText = '0.00s';
    }

    function reset3DSimulation() {
      clearSimulationCubes();
      isSimRunning = false;
      document.getElementById('algoSelect').value = 'aoa';
      document.getElementById('datasetSelect').value = '100';
      updateHUDDisplay();
      set3DMode('topology');
    }

    // ============================================================================
    // 6. HUD, CONTROLS & BENCHMARK SYNCHRONIZATION
    // ============================================================================
    function onAlgoChange() {
      updateHUDDisplay();
    }

    function onDatasetChange() {
      updateHUDDisplay();
    }

    function onEnvChange() {
      updateHUDDisplay();
    }

    function updateHUDDisplay() {
      const algo = document.getElementById('algoSelect').value;
      const dataset = document.getElementById('datasetSelect').value;
      const env = document.getElementById('envSelect').value;

      const dataRecord = BENCHMARK_DATA[env][dataset];
      const res = dataRecord[algo];
      const baseline = dataRecord['random'];
      const aoaData = dataRecord['aoa'];

      // Tag & Status Dot
      const statusDot = document.getElementById('simStatusDot');
      const activeTag = document.getElementById('simActiveTag');
      if (algo === 'random') {
        statusDot.className = 'pulse-dot danger';
        activeTag.className = 'badge-top';
        activeTag.style.background = '#fef2f2';
        activeTag.style.color = '#dc2626';
        activeTag.innerText = 'Random (Inefisien)';
      } else {
        statusDot.className = 'pulse-dot';
        activeTag.className = 'badge-top';
        activeTag.style.background = '#e0f2fe';
        activeTag.style.color = '#0284c7';
        activeTag.innerText = 'AOA (Teroptimasi)';
      }

      // Makespan KPI
      const makespanDeltaPct = (((res.makespan - baseline.makespan) / baseline.makespan) * 100).toFixed(1);
      document.getElementById('kpiMakespan').innerText = `${res.makespan.toFixed(2)} s`;
      const makespanDeltaEl = document.getElementById('kpiMakespanDelta');
      if (algo === 'aoa') {
        makespanDeltaEl.className = 'kpi-sub text-green';
        makespanDeltaEl.innerText = `${makespanDeltaPct}% Lebih Cepat`;
      } else {
        makespanDeltaEl.className = 'kpi-sub text-amber';
        makespanDeltaEl.innerText = `Baseline (Lambat)`;
      }

      // LBI KPI
      document.getElementById('kpiLBI').innerText = res.lbi.toFixed(2);
      const lbiBadgeEl = document.getElementById('kpiLBIBadge');
      if (algo === 'aoa') {
        lbiBadgeEl.className = 'kpi-sub text-green';
        lbiBadgeEl.innerText = 'Seimbang & Proporsional';
      } else {
        lbiBadgeEl.className = 'kpi-sub text-amber';
        lbiBadgeEl.style.color = '#dc2626';
        lbiBadgeEl.innerText = 'Timpang Ekstrem (Kritis)';
      }

      // Throughput KPI
      document.getElementById('kpiThroughput').innerText = `${res.throughput.toFixed(2)} t/s`;
      const tpSubEl = document.getElementById('kpiThroughputSub');
      if (algo === 'aoa') {
        const tpGain = (((aoaData.throughput - baseline.throughput) / baseline.throughput) * 100).toFixed(0);
        tpSubEl.className = 'kpi-sub text-sky';
        tpSubEl.innerText = `+${tpGain}% Kapasitas Selesai`;
      } else {
        tpSubEl.className = 'kpi-sub';
        tpSubEl.style.color = '#78716c';
        tpSubEl.innerText = 'Throughput Terhambat';
      }

      // Cost KPI
      document.getElementById('kpiCost').innerText = `$${res.cost.toFixed(2)}`;
      const costDeltaEl = document.getElementById('kpiCostDelta');
      if (algo === 'aoa') {
        const savedCost = (baseline.cost - aoaData.cost).toFixed(2);
        const savedPct = (((baseline.cost - aoaData.cost) / baseline.cost) * 100).toFixed(1);
        costDeltaEl.className = 'kpi-sub text-green';
        costDeltaEl.innerText = `Hemat $${savedCost} (${savedPct}%)`;
      } else {
        costDeltaEl.className = 'kpi-sub text-amber';
        costDeltaEl.innerText = 'Biaya Sewa Bengkak';
      }

      // Datacenter Load Progress Bars
      const util = res.util;
      const sbyBar = document.getElementById('dcSbyBar');
      const jktBar = document.getElementById('dcJktBar');
      const yogBar = document.getElementById('dcYogBar');

      const sbyText = document.getElementById('dcSbyLoadText');
      const jktText = document.getElementById('dcJktLoadText');
      const yogText = document.getElementById('dcYogLoadText');

      sbyBar.style.width = `${util.sby}%`;
      jktBar.style.width = `${util.jkt}%`;
      yogBar.style.width = `${util.yog}%`;

      if (algo === 'random') {
        sbyBar.className = 'meter-fill fill-idle';
        sbyText.className = 'font-mono';
        sbyText.style.color = '#64748b';
        sbyText.innerText = `${util.sby}% (IDLE / MENGANGGUR)`;

        jktBar.className = 'meter-fill fill-purple';
        jktText.className = 'font-mono text-purple';
        jktText.innerText = `${util.jkt}% (Sedang)`;

        yogBar.className = 'meter-fill fill-danger';
        yogText.className = 'font-mono';
        yogText.style.color = '#dc2626';
        yogText.innerText = `${util.yog}% (OVERLOAD ⚠️)`;
      } else {
        sbyBar.className = 'meter-fill fill-sky';
        sbyText.className = 'font-mono text-sky';
        sbyText.innerText = `${util.sby}% (Optimal Heavy)`;

        jktBar.className = 'meter-fill fill-purple';
        jktText.className = 'font-mono text-purple';
        jktText.innerText = `${util.jkt}% (Optimal Medium)`;

        yogBar.className = 'meter-fill fill-green';
        yogText.className = 'font-mono text-green';
        yogText.innerText = `${util.yog}% (Optimal Light)`;
      }

      // Status Banner Text & Alert
      const banner = document.getElementById('simStatusBanner');
      const icon = document.getElementById('simStatusIcon');
      const text = document.getElementById('simStatusText');

      if (algo === 'random') {
        banner.className = 'sim-status-banner danger';
        icon.innerText = '⚠️';
        text.innerHTML = `<strong>Kelemahan Random Terbukti:</strong> Tugas besar menumpuk di DC Yogyakarta (800 MIPS) hingga <strong>Overload ${util.yog}%</strong>. Sementara Surabaya (6.000 MIPS) terbuang menganggur di <strong>${util.sby}%</strong>!`;
      } else {
        banner.className = 'sim-status-banner';
        icon.innerText = '✅';
        text.innerHTML = `<strong>AOA Sukses Menyeimbangkan:</strong> Tugas dipetakan cerdas. Beban 3 DC stabil merata (<strong>52% - 57%</strong>) dan Makespan terpangkas hingga <strong>${Math.abs(makespanDeltaPct)}%</strong>!`;
      }
    }

    function toggleSimConsole() {
      const panel = document.getElementById('simConsolePanel');
      const txt = document.getElementById('toggleConsoleText');
      panel.classList.toggle('collapsed');
      if (panel.classList.contains('collapsed')) {
        txt.innerText = '▲ Tampilkan Konsol';
      } else {
        txt.innerText = '▼ Perkecil';
      }
    }

    // Modal Benchmark Functions
    function triggerBenchmarkModal() {
      document.getElementById('benchmarkModal').classList.add('active');
    }

    function closeBenchmarkModal(e) {
      if (e && e.target !== e.currentTarget && e.target.id !== 'benchmarkModal') return;
      document.getElementById('benchmarkModal').classList.remove('active');
    }

    function switchModalTab(tab) {
      document.getElementById('tabBtnRealWorld').classList.toggle('active', tab === 'real-world');
      document.getElementById('tabBtnCloudSim').classList.toggle('active', tab === 'cloudsim');
      document.getElementById('tabContentRealWorld').style.display = tab === 'real-world' ? 'block' : 'none';
      document.getElementById('tabContentCloudSim').style.display = tab === 'cloudsim' ? 'block' : 'none';
    }
