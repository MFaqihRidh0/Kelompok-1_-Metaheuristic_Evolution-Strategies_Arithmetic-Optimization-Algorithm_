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

  const agentMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const dataCubesRef = useRef<THREE.Mesh[]>([]);

  // 1. Initial Scene Setup (Bright Warm Studio Lighting)
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfcf8f2); // Bright Warm Cream/Ivory
    scene.fog = new THREE.FogExp2(0xfcf8f2, 0.009);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 50, 68);

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

    // Bright Warm Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95); // High ambient for bright visibility
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    sunLight.position.set(35, 70, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const warmFillLight = new THREE.DirectionalLight(0xfef3c7, 0.6);
    warmFillLight.position.set(-30, 40, -30);
    scene.add(warmFillLight);

    // Bright Sand/Cream Grid Floor
    const floorGeo = new THREE.PlaneGeometry(100, 100, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xf3ede2, // Warm Sand Cream
      roughness: 0.9,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(floorGeo, floorMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Warm Caramel Grid Lines
    const gridHelper = new THREE.GridHelper(100, 50, 0xb45309, 0xdbcdb8);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // 5 Heterogeneous Datacenter Towers (Warm Coffee & Bronze Styling)
    HETEROGENEOUS_DATACENTERS.forEach((dc) => {
      // Main Center Tower
      const towerGeo = new THREE.BoxGeometry(3.6, dc.height, 3.6);
      const towerMat = new THREE.MeshStandardMaterial({
        color: 0x443024, // Warm Deep Coffee
        roughness: 0.35,
        metalness: 0.6,
      });
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(dc.position[0], dc.height / 2, dc.position[1]);
      tower.castShadow = true;
      tower.receiveShadow = true;

      // Glow Beacon LED ring around top
      const colorHex = parseInt(dc.color.replace('#', '0x'), 16);
      const ledGeo = new THREE.BoxGeometry(3.7, 0.35, 3.7);
      const ledMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.y = dc.height / 2;
      tower.add(led);

      scene.add(tower);

      // Satellite VM racks
      for (let s = 0; s < 3; s++) {
        const satHeight = dc.height * (0.6 + Math.random() * 0.3);
        const sat = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, satHeight, 1.8),
          new THREE.MeshStandardMaterial({ color: 0x694e3d, metalness: 0.4, roughness: 0.4 })
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
      const size = 0.65 + (c % 3) * 0.35;
      const cubeGeo = new THREE.BoxGeometry(size, size, size);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: c % 2 === 0 ? 0x0284c7 : 0xe11d48, // Warm Azure vs Rose Pink
        emissive: c % 2 === 0 ? 0x0284c7 : 0xe11d48,
        emissiveIntensity: 0.4,
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
    const beamGeo = new THREE.CylinderGeometry(0.2, 0.2, 45, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xd97706, // Warm Amber Gold
      transparent: true,
      opacity: 0.9,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 22.5;
    beacon.add(beam);

    const ringGeo = new THREE.RingGeometry(1.6, 2.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xb45309,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.2;
    beacon.add(ring);

    // Shockwave pulse disk for S_best updates
    const shockGeo = new THREE.RingGeometry(2.0, 3.4, 32);
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
      color: 0xd97706,
      emissive: 0xd97706,
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

    // Continuous Animation Loop with smooth calm lerp
    let animId: number;
    let shockwaveScale = 1;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate diamond
      if (diamond) {
        diamond.rotation.y += 0.02;
        diamond.rotation.x += 0.01;
      }

      // Shockwave expansion animation on new best
      if (shockwave && (shockwave.material as THREE.MeshBasicMaterial).opacity > 0) {
        shockwaveScale += 0.06;
        shockwave.scale.set(shockwaveScale, shockwaveScale, shockwaveScale);
        (shockwave.material as THREE.MeshBasicMaterial).opacity -= 0.02;
      }

      // Rotate data cubes floating over servers
      dataCubesRef.current.forEach((cb, idx) => {
        cb.rotation.y += 0.015 + idx * 0.002;
        cb.position.y += Math.sin(Date.now() * 0.002 + idx) * 0.012;
      });

      // Rotate agent rotors / halos & smooth calm lerp (0.08 for readable glide)
      agentMeshesRef.current.forEach((mesh) => {
        mesh.traverse((child) => {
          if (child.name === 'rotor') {
            child.rotation.z += 0.35;
          } else if (child.name === 'halo') {
            child.rotation.z += 0.03;
          }
        });

        const target = mesh.userData.targetPosition;
        const targetAlt = mesh.userData.targetAltitude || 2.2;
        if (target) {
          mesh.position.x += (target[0] - mesh.position.x) * 0.08;
          mesh.position.z += (target[1] - mesh.position.z) * 0.08;
          mesh.position.y += (targetAlt - mesh.position.y) * 0.08;
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
      new THREE.MeshStandardMaterial({ color: 0x3d2817, metalness: 0.8, roughness: 0.2 })
    );
    core.castShadow = true;
    drone.add(core);

    const eyeColor = agent.color === '#059669' ? 0x059669 : 0x0284c7;
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshBasicMaterial({ color: eyeColor })
    );
    eye.position.set(0, 0.1, 0.5);
    eye.name = 'eye';
    drone.add(eye);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x785642 });
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, wireframe: true });
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
      color: 0x059669,
      transparent: true,
      opacity: agent.color === '#059669' ? 0.8 : 0,
    });
    const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), laserMat);
    laser.name = 'laser';
    laser.position.y = -agent.altitude / 2;
    laser.scale.set(1, agent.altitude, 1);
    drone.add(laser);

    return drone;
  };

  // 4. Helper: Build ES Chromosome Bio-Digital Entity Mesh
  const buildESEntityMesh = (agent: Agent): THREE.Group => {
    const entity = new THREE.Group();
    const colorHex = parseInt(agent.color.replace('#', '0x'), 16) || 0x7c3aed;

    // Capsule core
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 1.6, 16),
      new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: agent.isParent ? 0.45 : 0.3,
        roughness: 0.3,
        metalness: 0.6,
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
        new THREE.OctahedronGeometry(0.32, 0),
        new THREE.MeshBasicMaterial({ color: 0xd97706 })
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

      // Update color and laser
      const body = mesh.getObjectByName('body') as THREE.Mesh;
      const halo = mesh.getObjectByName('halo') as THREE.Mesh;
      const eye = mesh.getObjectByName('eye') as THREE.Mesh;
      const laser = mesh.getObjectByName('laser') as THREE.Mesh;

      if (body && halo) {
        const hex = parseInt(agent.color.replace('#', '0x'), 16);
        (body.material as THREE.MeshStandardMaterial).color.setHex(hex);
        (body.material as THREE.MeshStandardMaterial).emissive.setHex(hex);
        (halo.material as THREE.MeshBasicMaterial).color.setHex(hex);
      }

      if (eye && laser) {
        if (agent.color === '#059669') {
          (eye.material as THREE.MeshBasicMaterial).color.setHex(0x059669);
          (laser.material as THREE.MeshBasicMaterial).opacity = 0.8;
          laser.scale.set(1, agent.altitude, 1);
          laser.position.y = -agent.altitude / 2;
        } else {
          (eye.material as THREE.MeshBasicMaterial).color.setHex(0x0284c7);
          (laser.material as THREE.MeshBasicMaterial).opacity = 0;
        }
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
    <div className="relative w-full h-[460px] md:h-[540px] bg-[#fbf8f3] overflow-hidden cursor-grab active:cursor-grabbing rounded-xl border border-[#e5dac9]">
      <div ref={mountRef} className="w-full h-full" />

      {/* Floating Instructions */}
      <div className="absolute bottom-3 right-3 z-10 pointer-events-none text-[11px] font-mono text-coffee-700 bg-white/90 px-3 py-1.5 rounded-lg border border-sand-200 shadow-sm backdrop-blur">
        Orbit: Klik Kiri + Geser | Pan: Klik Kanan | Zoom: Scroll
      </div>

      {/* Dynamic 3D Legend */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto text-[11px] font-mono bg-white/95 border border-sand-200 p-3 rounded-xl space-y-1.5 shadow-md backdrop-blur-md">
        <div className="text-[10px] text-coffee-800 font-bold uppercase tracking-wider">
          Legenda Agen 3D ({algorithm})
        </div>
        {(algorithm === 'AOA' || algorithm === 'SPLIT') && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] inline-block shadow-sm" />
              <span className="text-coffee-900 font-medium">Drone Eksplorasi (&divide;, &times;)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669] inline-block shadow-sm" />
              <span className="text-coffee-900 font-medium">Drone Eksploitasi (-, +)</span>
            </div>
          </>
        )}
        {(algorithm === 'ES' || algorithm === 'SPLIT') && (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7c3aed] inline-block shadow-sm" />
              <span className="text-coffee-900 font-medium">Induk Terpilih (&mu; Parents)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] inline-block shadow-sm" />
              <span className="text-coffee-900 font-medium">Keturunan Mutasi (&lambda; 1:7)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] inline-block shadow-sm" />
              <span className="text-coffee-900 font-medium">Elitis Generasi Baru</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] inline-block shadow-sm" />
          <span className="text-coffee-900 font-medium">Suar Target Terbaik (S<sub>best</sub>)</span>
        </div>
      </div>
    </div>
  );
};
