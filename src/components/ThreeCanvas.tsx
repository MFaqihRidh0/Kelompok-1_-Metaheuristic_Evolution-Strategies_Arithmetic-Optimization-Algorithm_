import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Agent, AlgorithmType, GlobalBest } from '../types';

interface ThreeCanvasProps {
  algorithm: AlgorithmType;
  agents: Agent[];
  esOffspring: Agent[];
  globalBest: GlobalBest;
  isExploration: boolean;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  algorithm,
  agents,
  esOffspring,
  globalBest,
  isExploration,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const beaconRef = useRef<THREE.Group | null>(null);

  // Mesh registries mapping agent ID to Three.js Object3D
  const agentMeshesRef = useRef<Map<number, THREE.Group>>(new Map());
  const offspringMeshesRef = useRef<Map<number, THREE.Group>>(new Map());

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
    camera.position.set(0, 48, 62);

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
    controls.maxDistance = 160;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    dirLight.position.set(30, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const purpleLight = new THREE.PointLight(0x8b5cf6, 1.5, 90);
    purpleLight.position.set(-30, 25, -20);
    scene.add(purpleLight);

    // Terrain: Cyber Datacenter Grid
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

    // 3D Server Racks representing compute clusters
    const rackGeo = new THREE.BoxGeometry(2, 4, 2);
    const rackMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.4,
      metalness: 0.8,
    });
    const ledCyan = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const ledEmerald = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    const clusterPositions = [
      [-25, -20], [-20, 25], [25, 20], [22, -22], [0, -32], [0, 32], [-35, 0], [35, 0],
    ];

    clusterPositions.forEach(([cx, cz]) => {
      for (let i = 0; i < 3; i++) {
        const rack = new THREE.Mesh(rackGeo, rackMat);
        const scaleH = 0.8 + Math.random() * 1.5;
        rack.scale.set(1, scaleH, 1);
        rack.position.set(cx + (Math.random() - 0.5) * 8, (4 * scaleH) / 2, cz + (Math.random() - 0.5) * 8);
        rack.castShadow = true;
        rack.receiveShadow = true;

        const led = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.2, 1.8),
          Math.random() > 0.5 ? ledCyan : ledEmerald
        );
        led.position.y = 2 * scaleH;
        rack.add(led);

        scene.add(rack);
      }
    });

    // Golden Beacon Beam for Global Best
    const beacon = new THREE.Group();
    const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, 45, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 22.5;
    beacon.add(beam);

    const ringGeo = new THREE.RingGeometry(1.5, 2.3, 32);
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

    const diamondGeo = new THREE.OctahedronGeometry(1.2, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.6,
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
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Rotate beacon diamond
      if (diamond) {
        diamond.rotation.y += 0.025;
        diamond.rotation.x += 0.012;
      }

      // Rotate drone rotors & smooth interpolation (lerp) for agent movement
      agentMeshesRef.current.forEach((mesh) => {
        mesh.traverse((child) => {
          if (child.name === 'rotor') {
            child.rotation.z += 0.45;
          } else if (child.name === 'halo') {
            child.rotation.z += 0.035;
          }
        });

        // Lerp towards targetPosition
        const target = mesh.userData.targetPosition;
        const targetAlt = mesh.userData.targetAltitude || 2.5;
        if (target) {
          mesh.position.x += (target[0] - mesh.position.x) * 0.12;
          mesh.position.z += (target[1] - mesh.position.z) * 0.12;
          mesh.position.y += (targetAlt - mesh.position.y) * 0.12;
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

  // 2. Synchronize Beacon Position with Global Best
  useEffect(() => {
    if (!beaconRef.current || globalBest.fitness === Infinity) return;
    beaconRef.current.position.set(globalBest.position[0], 0, globalBest.position[1]);
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

  // 4. Helper: Build ES Chromosome Entity Mesh
  const buildESEntityMesh = (agent: Agent): THREE.Group => {
    const entity = new THREE.Group();
    const colorHex = parseInt(agent.color.replace('#', '0x'), 16) || 0x8b5cf6;

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 1.5, 12),
      new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.4,
        roughness: 0.3,
        metalness: 0.7,
      })
    );
    body.position.y = 0.9;
    body.castShadow = true;
    entity.add(body);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.05, 8, 24),
      new THREE.MeshBasicMaterial({ color: colorHex })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 1.2;
    halo.name = 'halo';
    entity.add(halo);

    return entity;
  };

  // 5. Synchronize Agents with 3D Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const currentMap = agentMeshesRef.current;
    const activeIds = new Set<number>();

    agents.forEach((agent) => {
      activeIds.add(agent.id);
      let mesh = currentMap.get(agent.id);

      if (!mesh) {
        // Create new mesh based on algorithm
        if (algorithm === 'AOA' || (algorithm === 'SPLIT' && agent.id < 500)) {
          mesh = buildDroneMesh(agent);
        } else {
          mesh = buildESEntityMesh(agent);
        }
        mesh.position.set(agent.position[0], agent.altitude, agent.position[1]);
        scene.add(mesh);
        currentMap.set(agent.id, mesh);
      }

      // Update target for lerp
      mesh.userData.targetPosition = agent.position;
      mesh.userData.targetAltitude = agent.altitude;

      // Update appearance based on phase
      const eye = mesh.getObjectByName('eye') as THREE.Mesh;
      const laser = mesh.getObjectByName('laser') as THREE.Mesh;
      if (eye && laser) {
        if (agent.color === '#10b981') {
          (eye.material as THREE.MeshBasicMaterial).color.setHex(0x10b981);
          (laser.material as THREE.MeshBasicMaterial).opacity = 0.75;
          laser.scale.set(1, agent.altitude, 1);
          laser.position.y = -agent.altitude / 2;
        } else {
          (eye.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
          (laser.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }
    });

    // Remove obsolete meshes
    currentMap.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        scene.remove(mesh);
        currentMap.delete(id);
      }
    });
  }, [agents, algorithm]);

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
              <span>Drone Eksplorasi (÷, ×)</span>
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
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-purple inline-block" />
              <span>Induk Terpilih (&mu;)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyber-lime inline-block" />
              <span>Elitis Generasi Baru</span>
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyber-gold inline-block" />
          <span>Suar Target Terbaik (Best)</span>
        </div>
      </div>
    </div>
  );
};

