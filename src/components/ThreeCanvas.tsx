import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Agent, AlgorithmType, GlobalBest } from '../types';
import { HETEROGENEOUS_DATACENTERS } from '../algorithms/benchmarks';

interface ThreeCanvasProps {
  algorithm: AlgorithmType;
  agents: Agent[];
  esOffspring: Agent[];
  globalBest: GlobalBest;
  isExploration: boolean;
  stepPhase?: number;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  algorithm,
  agents,
  esOffspring,
  globalBest,
  isExploration,
  stepPhase = 1,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const beaconRef = useRef<THREE.Group | null>(null);
  const shockwaveRef = useRef<THREE.Mesh | null>(null);
  const prevBestFitnessRef = useRef<number>(Infinity);

  // Mesh registries mapping agent ID to Three.js Object3D
  const agentMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const dataCubesRef = useRef<THREE.Mesh[]>([]);

  // 1. Initial Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06090e);
    scene.fog = new THREE.FogExp2(0x06090e, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 52, 68);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 15;
    controls.maxDistance = 170;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    dirLight.position.set(30, 65, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const purpleLight = new THREE.PointLight(0x8b5cf6, 1.6, 95);
    purpleLight.position.set(-25, 28, -20);
    scene.add(purpleLight);

    // Cyber Datacenter Grid Floor
    const floorGeo = new THREE.PlaneGeometry(100, 100, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090d14,
      roughness: 0.85,
      metalness: 0.15,
    });
    const groundMesh = new THREE.Mesh(floorGeo, floorMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    const gridHelper = new THREE.GridHelper(100, 50, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // 5 Heterogeneous Datacenter Clusters (CERN ALICE Architecture)
    HETEROGENEOUS_DATACENTERS.forEach((dc) => {
      // Main Center Tower
      const towerGeo = new THREE.BoxGeometry(3.5, dc.height, 3.5);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.35,
        metalness: 0.85,
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(dc.position[0], dc.height / 2, dc.position[1]);
      tower.castShadow = true;
      tower.receiveShadow = true;

      // Glow Beacon LED ring around top
      const colorHex = parseInt(dc.color.replace('#', '0x'), 16);
      const ledGeo = new THREE.BoxGeometry(3.6, 0.3, 3.6);
      const ledMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.y = dc.height / 2;
      tower.add(led);

      scene.add(tower);

      // Satellite secondary VM racks surrounding each datacenter
      for (let s = 0; s < 3; s++) {
        const satHeight = dc.height * (0.6 + Math.random() * 0.3);
        const sat = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, satHeight, 1.8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
        );
        const ang = (s * (2 * Math.PI)) / 3;
        sat.position.set(
          dc.position[0] + Math.cos(ang) * 4.5,
          satHeight / 2,
          dc.position[1] + Math.sin(ang) * 4.5
        );
        sat.castShadow = true;
        scene.add(sat);
      }
    });

    // Floating Data Cubes (Cloudlets)
    const cubes: THREE.Mesh[] = [];
    for (let c = 0; c < 12; c++) {
      const size = 0.6 + (c % 3) * 0.4; // Varying instruction length MI
      const cubeGeo = new THREE.BoxGeometry(size, size, size);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: c % 2 === 0 ? 0x06b6d4 : 0xec4899,
        emissive: c % 2 === 0 ? 0x06b6d4 : 0xec4899,
        emissiveIntensity: 0.5,
        roughness: 0.2,
      });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      const dcTarget = HETEROGENEOUS_DATACENTERS[c % HETEROGENEOUS_DATACENTERS.length];
      cube.position.set(
        dcTarget.position[0] + (Math.random() - 0.5) * 8,
        dcTarget.height + 1.5 + Math.random() * 2,
        dcTarget.position[1] + (Math.random() - 0.5) * 8
      );
      scene.add(cube);
      cubes.push(cube);
    }
    dataCubesRef.current = cubes;

    // Golden Beacon Beam for Global Best (S_best)
    const beacon = new THREE.Group();
    const beamGeo = new THREE.CylinderGeometry(0.18, 0.18, 45, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 22.5;
    beacon.add(beam);

    const ringGeo = new THREE.RingGeometry(1.6, 2.4, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    beacon.add(ring);

    // Shockwave pulse disk for S_best updates
    const shockGeo = new THREE.RingGeometry(2.0, 3.2, 32);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const shockwave = new THREE.Mesh(shockGeo, shockMat);
    shockwave.rotation.x = -Math.PI / 2;
    shockwave.position.y = 0.25;
    beacon.add(shockwave);
    shockwaveRef.current = shockwave;

    const diamondGeo = new THREE.OctahedronGeometry(1.3, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.65,
      roughness: 0.1,
      metalness: 0.9,
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.y = 12;
    diamond.name = 'diamond';
    beacon.add(diamond);

    scene.add(beacon);
    beaconRef.current = beacon;

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    // Continuous Animation Loop
    let animId: number;
    let shockwaveScale = 1;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate diamond
      if (diamond) {
        diamond.rotation.y += 0.025;
        diamond.rotation.x += 0.012;
      }

      // Shockwave expansion animation on new best
      if (shockwave && (shockwave.material as THREE.MeshBasicMaterial).opacity > 0) {
        shockwaveScale += 0.08;
        shockwave.scale.set(shockwaveScale, shockwaveScale, shockwaveScale);
        (shockwave.material as THREE.MeshBasicMaterial).opacity -= 0.025;
      }

      // Rotate data cubes floating over servers
      dataCubesRef.current.forEach((cb, idx) => {
        cb.rotation.y += 0.02 + idx * 0.003;
        cb.position.y += Math.sin(Date.now() * 0.003 + idx) * 0.015;
      });

      // Rotate agent rotors / halos & smooth lerp
      agentMeshesRef.current.forEach((mesh) => {
        mesh.traverse((child) => {
          if (child.name === 'rotor') {
            child.rotation.z += 0.45;
          } else if (child.name === 'halo') {
            child.rotation.z += 0.04;
          }
        });

        const target = mesh.userData.targetPosition;
        const targetAlt = mesh.userData.targetAltitude || 2.2;
        if (target) {
          mesh.position.x += (target[0] - mesh.position.x) * 0.14;
          mesh.position.z += (target[1] - mesh.position.z) * 0.14;
          mesh.position.y += (targetAlt - mesh.position.y) * 0.14;
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 2. Synchronize Beacon Position & Trigger Shockwave on S_best improvement
  useEffect(() => {
    if (!beaconRef.current || globalBest.fitness === Infinity) return;
    beaconRef.current.position.set(globalBest.position[0], 0, globalBest.position[1]);

    if (globalBest.fitness < prevBestFitnessRef.current && shockwaveRef.current) {
      prevBestFitnessRef.current = globalBest.fitness;
      shockwaveRef.current.scale.set(1, 1, 1);
      (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9;
    }
  }, [globalBest]);

  // 3. Helper: Build AOA Drone Mesh
  const buildDroneMesh = (agent: Agent): THREE.Group => {
    const drone = new THREE.Group();

    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
    );
    core.castShadow = true;
    drone.add(core);

    const eyeColor = agent.color === '#10b981' ? 0x10b981 : 0x38bdf8;
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshBasicMaterial({ color: eyeColor })
    );
    eye.position.set(0, 0.1, 0.5);
    eye.name = 'eye';
    drone.add(eye);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];

    angles.forEach((ang) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 1.2), armMat);
      arm.position.set(Math.cos(ang) * 0.8, 0, Math.sin(ang) * 0.8);
      arm.rotation.y = -ang;
      drone.add(arm);

      const rotor = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.04, 8, 16), rotorMat);
      rotor.rotation.x = Math.PI / 2;
      rotor.position.set(Math.cos(ang) * 1.4, 0.1, Math.sin(ang) * 1.4);
      rotor.name = 'rotor';
      drone.add(rotor);
    });

    // Downward Laser Scanner Line (active during exploitation)
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: agent.color === '#10b981' ? 0.75 : 0,
    });
    const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), laserMat);
    laser.name = 'laser';
    laser.position.y = -agent.altitude / 2;
    laser.scale.set(1, agent.altitude, 1);
    drone.add(laser);

    return drone;
  };

  // 4. Helper: Build ES Chromosome Bio-Digital Entity Mesh
  const buildESEntityMesh = (agent: Agent): THREE.Group => {
    const entity = new THREE.Group();
    const colorHex = parseInt(agent.color.replace('#', '0x'), 16) || 0x8b5cf6;

    // Capsule core
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 1.6, 16),
      new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: agent.isParent ? 0.55 : 0.35,
        roughness: 0.3,
        metalness: 0.7,
      })
    );
    body.position.y = 0.9;
    body.castShadow = true;
    body.name = 'body';
    entity.add(body);

    // Glowing orbiting halo (mutation ring)
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.05, 8, 24),
      new THREE.MeshBasicMaterial({ color: colorHex })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 1.2;
    halo.name = 'halo';
    entity.add(halo);

    // Parent Crown/Star for mu parents
    if (agent.isParent) {
      const crown = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.3, 0),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      crown.position.y = 2.0;
      entity.add(crown);
    }

    return entity;
  };

  // 5. Synchronize Agents with 3D Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMap = agentMeshesRef.current;
    const allActive = [...agents, ...(algorithm === 'ES' ? esOffspring : [])];
    const activeIds = new Set<number>();

    allActive.forEach((agent) => {
      activeIds.add(agent.id);
      let mesh = currentMap.get(agent.id);

      if (!mesh) {
        if (algorithm === 'AOA' || (algorithm === 'SPLIT' && agent.id < 500)) {
          mesh = buildDroneMesh(agent);
        } else {
          mesh = buildESEntityMesh(agent);
        }
        mesh.position.set(agent.position[0], agent.altitude, agent.position[1]);
        scene.add(mesh);
        currentMap.set(agent.id, mesh);
      }

      mesh.userData.targetPosition = agent.position;
      mesh.userData.targetAltitude = agent.altitude;

      // Update color if promoted to elite or parent
      const body = mesh.getObjectByName('body') as THREE.Mesh;
      const halo = mesh.getObjectByName('halo') as THREE.Mesh;
      if (body && halo) {
        const hex = parseInt(agent.color.replace('#', '0x'), 16);
        (body.material as THREE.MeshStandardMaterial).color.setHex(hex);
        (body.material as THREE.MeshStandardMaterial).emissive.setHex(hex);
        (halo.material as THREE.MeshBasicMaterial).color.setHex(hex);
      }
    });

    // Remove culled offspring / dissolved entities
    currentMap.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        scene.remove(mesh);
        currentMap.delete(id);
      }
    });
  }, [agents, esOffspring, algorithm]);

  return (
    <div className="relative w-full h-[460px] md:h-[540px] bg-cyber-950 overflow-hidden cursor-grab active:cursor-grabbing rounded-xl">
      <div ref={mountRef} className="w-full h-full" />
      <div className="scanline absolute inset-0 pointer-events-none opacity-20" />

      {/* Floating Instructions */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none text-[11px] font-mono text-slate-400 bg-cyber-900/80 px-2.5 py-1 rounded border border-cyber-800 backdrop-blur">
        Orbit: Klik Kiri + Geser | Pan: Klik Kanan | Zoom: Scroll
      </div>

      {/* Dynamic 3D Legend */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto text-[11px] font-mono bg-cyber-900/90 border border-cyber-700/80 p-2.5 rounded-lg space-y-1.5 shadow-lg backdrop-blur-md">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Legenda Agen 3D ({algorithm})
        </div>
        {(algorithm === 'AOA' || algorithm === 'SPLIT') && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-sky inline-block" />
              <span>Drone Eksplorasi (&divide;, &times;)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-emerald inline-block" />
              <span>Drone Eksploitasi (-, +)</span>
            </div>
          </>
        )}
        {(algorithm === 'ES' || algorithm === 'SPLIT') && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-purple inline-block shadow" />
              <span>Induk Terpilih (&mu; Parents)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-pink inline-block shadow" />
              <span>Keturunan Mutasi (&lambda; Offspring 1:7)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-lime inline-block shadow" />
              <span>Elitis Generasi Baru (Tercepat)</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyber-gold inline-block" />
          <span>Suar Target Terbaik (S<sub>best</sub>)</span>
        </div>
      </div>
    </div>
  );
};
