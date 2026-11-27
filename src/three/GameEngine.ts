import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  VEHICLES,
  VEHICLE_MAP,
  type AgeMode,
  type MissionSnapshot,
  type MissionVariant,
  type VehicleId,
} from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { buildStorybookWorld, type WorldEnvironment } from './world';
import { buildTruck, disposeSharedTruckAssets, type TruckRig } from './trucks';
import { createMixerStripeTexture, disposeSharedStorybookTextures } from './textures';
import { createMissionController, type ActiveMissionController } from './missionScenes';

export interface EngineCallbacks {
  onSelectTruckFrom3D: (vehicleId: VehicleId) => void;
  onMissionStarted?: (vehicleId: VehicleId, missionVariant: MissionVariant) => void;
  onMissionSnapshot: (snap: MissionSnapshot) => void;
  onCelebrate: (vehicleId: VehicleId) => void;
  onContextLost: (lost: boolean) => void;
  onReady?: () => void;
}

const GARAGE_CAM_POS = new THREE.Vector3(0, 11.2, 18.8);
const GARAGE_CAM_TARGET = new THREE.Vector3(0, 1.4, -7.2);

interface MissionStartPreset {
  pos: [number, number, number];
  rotY: number;
  camPos: [number, number, number];
  camTarget: [number, number, number];
  /** Intermediate roundabout waypoints (XZ) routing cleanly around the central fountain at (0, -2.6) */
  midPoints: [number, number][];
}

// Exact mission start positions, rotations (0 = facing +X along boulevard z = 3.2), and camera presets
const MISSION_START_PRESETS: Record<VehicleId, MissionStartPreset> = {
  molen: {
    pos: [2.2, 0, 3.2],
    rotY: 0,
    camPos: [0.2, 5.4, 12.2],
    camTarget: [-0.2, 1.3, 3.2],
    midPoints: [[-7.2, 1.4]],
  },
  angkut: {
    pos: [-1.5, 0, 3.2],
    rotY: 0,
    camPos: [-0.2, 5.2, 11.4],
    camTarget: [0.4, 1.2, 3.2],
    midPoints: [[-7.0, 0.2]],
  },
  tangki: {
    pos: [3.2, 0, 3.2],
    rotY: 0,
    camPos: [-0.2, 6.8, 11.4],
    camTarget: [-0.2, 1.0, 3.0],
    midPoints: [[-6.2, -1.2], [-3.8, 2.6]],
  },
  crane: {
    pos: [2.4, 0, 3.2],
    rotY: 0,
    camPos: [0.0, 5.8, 12.2],
    camTarget: [-0.3, 1.8, 3.2],
    midPoints: [[-6.0, -4.4], [-4.8, 2.2]],
  },
  ekskavator: {
    pos: [-2.5, 0, 3.2],
    rotY: 0,
    camPos: [0.1, 6.2, 11.8],
    camTarget: [0.3, 1.0, 2.3],
    midPoints: [[-3.6, -8.0], [-7.2, -1.2]],
  },
  pemadam: {
    pos: [-5.8, 0, 3.2],
    rotY: 0,
    camPos: [0.4, 5.4, 12.6],
    camTarget: [0.4, 1.9, 1.5],
    midPoints: [[-0.6, -8.5], [-8.4, -2.0]],
  },
  sampah: {
    pos: [3.1, 0, 3.2],
    rotY: 0,
    camPos: [-0.3, 5.8, 12.2],
    camTarget: [-0.2, 1.1, 2.5],
    midPoints: [[2.2, -8.6], [-6.2, -3.4], [-4.2, 2.4]],
  },
  bus: {
    pos: [-5.4, 0, 3.2],
    rotY: 0,
    camPos: [-0.2, 5.6, 12.6],
    camTarget: [0.2, 1.4, 2.5],
    midPoints: [[8.2, -6.4], [-0.8, -8.5], [-8.8, -1.8]],
  },
};

// Pre-allocated scratch helpers (zero GC in render loop)
const _pointerNdc = new THREE.Vector2();
const _confettiDummy = new THREE.Object3D();
const _launchPos = new THREE.Vector3();
const _launchTan = new THREE.Vector3();
const _followCamPos = new THREE.Vector3();
const _followCamTarget = new THREE.Vector3();

interface ConfettiPiece {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotVel: THREE.Vector3;
}

interface LaunchState {
  vehicleId: VehicleId;
  ageMode: AgeMode;
  missionVariant: MissionVariant;
  elapsed: number;
  driveDuration: number;
  pauseDuration: number;
  arrivedAtStart: boolean;
  curve: THREE.CatmullRomCurve3;
  endPos: THREE.Vector3;
  endRotY: number;
  missionCamPos: THREE.Vector3;
  missionCamTarget: THREE.Vector3;
  prevPos: THREE.Vector3;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private timer: THREE.Timer;
  private envRenderTarget: THREE.WebGLRenderTarget | null = null;
  private raycaster: THREE.Raycaster;
  private isSoftwareGl: boolean;
  private maxAnisotropy: number;
  private world: WorldEnvironment;
  private trucks: Map<VehicleId, TruckRig> = new Map();
  private callbacks: EngineCallbacks;

  private activeMission: ActiveMissionController | null = null;
  private mode: 'GARAGE' | 'LAUNCHING' | 'MISSION' = 'GARAGE';
  private launchState: LaunchState | null = null;
  private desiredCamPos = GARAGE_CAM_POS.clone();
  private desiredCamTarget = GARAGE_CAM_TARGET.clone();
  private camTransitionActive = false;

  private truckBounce: Map<VehicleId, number> = new Map();
  private frameId = 0;
  private disposed = false;
  private contextLost = false;

  // 3D Celebration Confetti (InstancedMesh)
  private confettiMesh: THREE.InstancedMesh;
  private confettiPieces: ConfettiPiece[] = [];
  private confettiActive = false;
  private confettiTimer = 0;

  private pointerDownPos = { x: 0, y: 0 };
  private isDraggingSpray = false;
  private lastDragSprayTime = 0;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Detect software WebGL (SwiftShader/llvmpipe) strictly for rendering cost & loop pacing
    this.isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        probeCanvas.width = 1;
        probeCanvas.height = 1;
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.03;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.scene = new THREE.Scene();

    // Procedural Studio Environment Reflection (RoomEnvironment via PMREMGenerator)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new RoomEnvironment();
    this.envRenderTarget = pmrem.fromScene(envScene, 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    envScene.dispose();
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 180);
    this.camera.position.copy(GARAGE_CAM_POS);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(GARAGE_CAM_TARGET);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 36;
    this.controls.minPolarAngle = 0.25;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.addEventListener('start', () => {
      // Cancel scripted camera move if user orbits manually
      this.camTransitionActive = false;
    });

    this.timer = new THREE.Timer();
    this.timer.connect(document);
    this.raycaster = new THREE.Raycaster();

    // Build sunlit 3D storybook town diorama with 8 open-archway truck garage houses
    this.world = buildStorybookWorld(this.scene, this.maxAnisotropy, this.isSoftwareGl);

    // Build all 8 composite 3D trucks parked snugly inside their own storybook garage houses
    for (const cfg of VEHICLES) {
      const rig = buildTruck(cfg.id, this.maxAnisotropy);
      rig.root.position.set(...cfg.garagePos);
      rig.root.rotation.y = cfg.garageRotY;
      this.applyGarageParkedPose(rig);
      this.scene.add(rig.root);
      this.trucks.set(cfg.id, rig);
      this.truckBounce.set(cfg.id, 0);
    }

    // Build 3D celebration confetti InstancedMesh (64 colorful squares)
    const confettiGeo = new THREE.BoxGeometry(0.24, 0.24, 0.04);
    const confettiMat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
    const count = 64;
    this.confettiMesh = new THREE.InstancedMesh(confettiGeo, confettiMat, count);
    this.confettiMesh.frustumCulled = false;
    this.confettiMesh.visible = false;
    const palette = ['#DF5342', '#F3C443', '#3E82C6', '#4CA95E', '#A168C4', '#E88836'];
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(palette[i % palette.length]);
      this.confettiMesh.setColorAt(i, c);
      this.confettiPieces.push({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Euler(),
        rotVel: new THREE.Vector3(),
      });
    }
    if (this.confettiMesh.instanceColor) this.confettiMesh.instanceColor.needsUpdate = true;
    this.scene.add(this.confettiMesh);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.tick();
    this.callbacks.onReady?.();
  }

  private bindEvents(): void {
    const dom = this.renderer.domElement;
    window.addEventListener('resize', this.onResize);
    window.addEventListener('pointerup', this.onPointerCancel);
    dom.addEventListener('pointerdown', this.onPointerDown);
    dom.addEventListener('pointermove', this.onPointerMove);
    dom.addEventListener('pointerup', this.onPointerUp);
    dom.addEventListener('pointercancel', this.onPointerCancel);
    dom.addEventListener('webglcontextlost', this.onWebglLost);
    dom.addEventListener('webglcontextrestored', this.onWebglRestored);
  }

  private onWebglLost = (e: Event): void => {
    e.preventDefault();
    this.contextLost = true;
    this.callbacks.onContextLost(true);
  };

  private onWebglRestored = (): void => {
    this.contextLost = false;
    this.callbacks.onContextLost(false);
    this.tick();
  };

  private onResize = (): void => {
    if (this.disposed) return;
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private setPointerNdcFromEvent(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown = (e: PointerEvent): void => {
    soundEngine.unlock();
    this.pointerDownPos = { x: e.clientX, y: e.clientY };

    // P1-4: Start continuous drag-to-spray when pressing on flames or burning house during Pemadam SPRAY phase
    if (
      this.mode === 'MISSION' &&
      this.activeMission?.supportsDragSpray?.() &&
      this.activeMission.raycastTargets.length > 0
    ) {
      this.setPointerNdcFromEvent(e);
      this.raycaster.setFromCamera(_pointerNdc, this.camera);
      const hits = this.raycaster.intersectObjects(this.activeMission.raycastTargets, true);
      if (hits.length > 0) {
        const hit = hits[0];
        if (
          typeof hit.object.userData.flameIndex === 'number' ||
          hit.object.userData.isSpraySurface
        ) {
          this.isDraggingSpray = true;
          this.controls.enabled = false;
          this.lastDragSprayTime = performance.now();
          this.activeMission.handleDragSpray?.(hit.point, hit.object);
        }
      }
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDraggingSpray) return;
    if (!this.activeMission?.supportsDragSpray?.()) {
      this.onPointerCancel();
      return;
    }
    const now = performance.now();
    if (now - this.lastDragSprayTime < 40) return;
    this.lastDragSprayTime = now;

    this.setPointerNdcFromEvent(e);
    this.raycaster.setFromCamera(_pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.activeMission.raycastTargets, true);
    if (hits.length > 0) {
      this.activeMission.handleDragSpray?.(hits[0].point, hits[0].object);
    }
  };

  private onPointerCancel = (): void => {
    if (this.isDraggingSpray) {
      this.isDraggingSpray = false;
      this.controls.enabled = true;
      this.activeMission?.stopDragSpray?.();
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (this.isDraggingSpray) {
      this.isDraggingSpray = false;
      this.controls.enabled = true;
      this.activeMission?.stopDragSpray?.();
      return;
    }

    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    // Ignore drag-orbit gestures (>14px)
    if (dx * dx + dy * dy > 196) return;

    this.setPointerNdcFromEvent(e);
    this.raycaster.setFromCamera(_pointerNdc, this.camera);

    if (this.mode === 'GARAGE') {
      const truckRoots = Array.from(this.trucks.values()).map((t) => t.root);
      const garageTargets: THREE.Object3D[] = [...truckRoots, ...this.world.garageHouses];
      const hits = this.raycaster.intersectObjects(garageTargets, true);
      if (hits.length > 0) {
        const vid = hits[0].object.userData.vehicleId as VehicleId | undefined;
        if (vid) {
          this.callbacks.onSelectTruckFrom3D(vid);
        }
      }
    } else if (this.mode === 'MISSION' && this.activeMission && this.activeMission.raycastTargets.length > 0) {
      const hits = this.raycaster.intersectObjects(this.activeMission.raycastTargets, true);
      if (hits.length > 0) {
        this.activeMission.handleRaycastHit(hits[0].object);
      }
    }
  };

  public honkTruck(vehicleId: VehicleId): void {
    this.truckBounce.set(vehicleId, 1.0);
    soundEngine.playHorn(vehicleId);
    const cfg = VEHICLE_MAP[vehicleId];
    soundEngine.speakBilingual(cfg.nameId, cfg.nameEn);
  }

  private resetTruckRig(rig: TruckRig): void {
    rig.bodyGroup.position.set(0, 0, 0);
    rig.bodyGroup.rotation.set(0, 0, 0);
    if (rig.sirenLeftMat) rig.sirenLeftMat.emissiveIntensity = 0.25;
    if (rig.sirenRightMat) rig.sirenRightMat.emissiveIntensity = 0.25;
    if (rig.nozzleGroup) rig.nozzleGroup.rotation.set(0, 0, 0);
    if (rig.cableMesh) rig.cableMesh.scale.y = 1.3;
    if (rig.hookGroup) rig.hookGroup.position.set(-2.55, 1.25, 0);
    if (rig.waterFillMesh) rig.waterFillMesh.scale.y = 0.05;
    if (rig.hopperGroup) rig.hopperGroup.rotation.set(0, 0, 0);
    if (rig.bedGroup) rig.bedGroup.rotation.set(0, 0, 0);
    if (rig.turretGroup) rig.turretGroup.rotation.set(0, 0, 0);
    if (rig.boomGroup) rig.boomGroup.rotation.set(0, 0, 0);
    if (rig.armBaseGroup) rig.armBaseGroup.rotation.set(0, 0, 0);
    if (rig.armForeGroup) rig.armForeGroup.rotation.set(0, 0, 0);
    if (rig.bucketGroup) rig.bucketGroup.rotation.set(0, 0, 0);
    if (rig.stopSignGroup) rig.stopSignGroup.rotation.set(0, 0, 0);
    if (rig.busBeaconMat) rig.busBeaconMat.emissiveIntensity = 0.5;
    if (rig.chuteGroup) rig.chuteGroup.rotation.set(0, 0, 0);
    if (rig.id === 'molen' && rig.drumMaterial) {
      const oldMap = rig.drumMaterial.map;
      rig.drumMaterial.map = createMixerStripeTexture('#E8951B', this.maxAnisotropy);
      rig.drumMaterial.needsUpdate = true;
      oldMap?.dispose();
    }
  }

  // Neatly tuck tall equipment (crane boom & excavator arm) while parked inside its garage cottage
  private applyGarageParkedPose(rig: TruckRig): void {
    this.resetTruckRig(rig);
    if (rig.id === 'crane') {
      if (rig.turretGroup) rig.turretGroup.rotation.y = Math.PI;
      if (rig.boomGroup) rig.boomGroup.rotation.z = 0.54;
      if (rig.cableMesh) rig.cableMesh.scale.y = 0.45;
      if (rig.hookGroup) rig.hookGroup.position.set(-2.55, 2.1, 0);
    } else if (rig.id === 'ekskavator') {
      if (rig.armBaseGroup) rig.armBaseGroup.rotation.z = -0.22;
      if (rig.armForeGroup) rig.armForeGroup.rotation.z = -0.26;
      if (rig.bucketGroup) rig.bucketGroup.rotation.z = 0.2;
    }
  }

  public enterGarage(): void {
    this.isDraggingSpray = false;
    this.launchState = null;
    this.clearActiveMission();
    this.mode = 'GARAGE';
    this.confettiActive = false;
    this.confettiMesh.visible = false;

    for (const cfg of VEHICLES) {
      const rig = this.trucks.get(cfg.id)!;
      rig.root.visible = true;
      rig.root.position.set(...cfg.garagePos);
      rig.root.rotation.set(0, cfg.garageRotY, 0);
      this.applyGarageParkedPose(rig);
    }

    this.controls.enabled = true;
    this.desiredCamPos.copy(GARAGE_CAM_POS);
    this.desiredCamTarget.copy(GARAGE_CAM_TARGET);
    this.camTransitionActive = true;
  }

  /** Slowly drive the chosen truck out of its cottage around the village pond and stop at its exact mission start spot */
  public launchMissionFromGarage(
    vehicleId: VehicleId,
    ageMode: AgeMode,
    missionVariant: MissionVariant = 'classic',
  ): void {
    if (this.mode === 'LAUNCHING') return;
    if (this.mode === 'MISSION') {
      this.startMission(vehicleId, ageMode, missionVariant);
      return;
    }

    const cfg = VEHICLE_MAP[vehicleId];
    const rig = this.trucks.get(vehicleId);
    const preset = MISSION_START_PRESETS[vehicleId];
    if (!cfg || !rig || !preset) return;

    this.mode = 'LAUNCHING';
    this.truckBounce.set(vehicleId, 0.65);

    const fx = Math.sin(cfg.houseRotY);
    const fz = Math.cos(cfg.houseRotY);

    soundEngine.playHorn(vehicleId);
    soundEngine.playEngineRev();
    soundEngine.speakBilingual(
      `${cfg.nameId} melaju keluar menuju lokasi misi!`,
      `${cfg.nameEn} is driving out to the mission!`,
    );

    // Build collision-free Catmull-Rom spline:
    // inside cottage -> straight out open archway -> scenic roundabout around pond -> aligned boulevard approach -> exact mission start
    const p0 = new THREE.Vector3(...cfg.garagePos);
    const exitDist = vehicleId === 'bus' ? 3.3 : 4.2;
    const p1 = new THREE.Vector3(
      cfg.housePos[0] + fx * exitDist,
      0,
      cfg.housePos[2] + fz * exitDist,
    );
    const endPos = new THREE.Vector3(...preset.pos);
    const approachPos = new THREE.Vector3(endPos.x - 2.6, 0, endPos.z);

    const waypoints: THREE.Vector3[] = [p0, p1];
    for (const [mx, mz] of preset.midPoints) {
      waypoints.push(new THREE.Vector3(mx, 0, mz));
    }
    waypoints.push(approachPos, endPos);

    const curve = new THREE.CatmullRomCurve3(waypoints, false, 'centripetal', 0.45);
    const totalLen = curve.getLength();
    // Calm, kid-friendly cruising pace (~5.4 units/sec, clamped 3.6–5.2s)
    const driveDuration = THREE.MathUtils.clamp(totalLen / 5.4, 3.6, 5.2);

    this.launchState = {
      vehicleId,
      ageMode,
      missionVariant,
      elapsed: 0,
      driveDuration,
      pauseDuration: 0.55,
      arrivedAtStart: false,
      curve,
      endPos,
      endRotY: preset.rotY,
      missionCamPos: new THREE.Vector3(...preset.camPos),
      missionCamTarget: new THREE.Vector3(...preset.camTarget),
      prevPos: p0.clone(),
    };

    // Gently frame the cottage exit and village plaza
    this.desiredCamPos.set(p0.x * 0.32, 8.2, 11.4);
    this.desiredCamTarget.set(p0.x * 0.42, 1.35, p0.z * 0.5 - 1.0);
    this.camTransitionActive = true;
  }

  public startMission(
    vehicleId: VehicleId,
    ageMode: AgeMode,
    missionVariant: MissionVariant = 'classic',
  ): void {
    this.isDraggingSpray = false;
    this.launchState = null;
    this.clearActiveMission();
    this.mode = 'MISSION';
    this.confettiActive = false;
    this.confettiMesh.visible = false;

    // Show only the selected hero truck on the sunlit mission boulevard
    for (const [id, rig] of this.trucks.entries()) {
      rig.root.visible = id === vehicleId;
    }

    const activeTruck = this.trucks.get(vehicleId)!;
    this.resetTruckRig(activeTruck);
    const ctrl = createMissionController(
      vehicleId,
      activeTruck,
      ageMode,
      this.maxAnisotropy,
      {
        onSnapshot: (snap) => this.callbacks.onMissionSnapshot(snap),
        onCelebrate: (vid) => {
          this.launchConfetti(activeTruck.root.position);
          this.callbacks.onCelebrate(vid);
        },
      },
      missionVariant,
    );

    this.activeMission = ctrl;
    this.scene.add(ctrl.group);

    // Gentle limited orbit in missions so kids can view cleanly without getting lost
    this.controls.enabled = true;
    this.desiredCamPos.copy(ctrl.cameraPos);
    this.desiredCamTarget.copy(ctrl.cameraTarget);
    this.camTransitionActive = true;
  }

  public dispatchMissionAction(action: string, payload?: unknown): void {
    if (this.activeMission) {
      this.activeMission.handleAction(action, payload);
    }
  }

  private clearActiveMission(): void {
    if (this.activeMission) {
      this.scene.remove(this.activeMission.group);
      this.activeMission.dispose();
      this.activeMission = null;
    }
  }

  private launchConfetti(origin: THREE.Vector3): void {
    this.confettiActive = true;
    this.confettiTimer = 0;
    this.confettiMesh.visible = true;
    for (const p of this.confettiPieces) {
      p.pos.set(origin.x, origin.y + 2.4, origin.z);
      p.vel.set(
        (Math.random() - 0.5) * 9,
        5.5 + Math.random() * 5.5,
        (Math.random() - 0.5) * 7,
      );
      p.rot.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      p.rotVel.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
      );
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed || this.contextLost) return;

    this.timer.update();
    const dt = Math.min(this.timer.getDelta(), 0.08);
    const elapsed = this.timer.getElapsed();

    // Drift fluffy storybook clouds slowly across the sky
    this.world.clouds.forEach((cloud, idx) => {
      cloud.position.x += dt * (0.45 + (idx % 3) * 0.15);
      if (cloud.position.x > 36) cloud.position.x = -36;
    });

    // Smooth camera preset damping
    if (this.camTransitionActive) {
      this.camera.position.x = THREE.MathUtils.damp(
        this.camera.position.x,
        this.desiredCamPos.x,
        5.5,
        dt,
      );
      this.camera.position.y = THREE.MathUtils.damp(
        this.camera.position.y,
        this.desiredCamPos.y,
        5.5,
        dt,
      );
      this.camera.position.z = THREE.MathUtils.damp(
        this.camera.position.z,
        this.desiredCamPos.z,
        5.5,
        dt,
      );
      this.controls.target.x = THREE.MathUtils.damp(
        this.controls.target.x,
        this.desiredCamTarget.x,
        5.5,
        dt,
      );
      this.controls.target.y = THREE.MathUtils.damp(
        this.controls.target.y,
        this.desiredCamTarget.y,
        5.5,
        dt,
      );
      this.controls.target.z = THREE.MathUtils.damp(
        this.controls.target.z,
        this.desiredCamTarget.z,
        5.5,
        dt,
      );

      if (
        this.camera.position.distanceTo(this.desiredCamPos) < 0.05 &&
        this.controls.target.distanceTo(this.desiredCamTarget) < 0.05
      ) {
        this.camTransitionActive = false;
      }
    }
    this.controls.update();

    // Gentle lively idle animations in Garage & smooth drive-out rollout in Launching mode
    if (this.mode === 'GARAGE' || this.mode === 'LAUNCHING') {
      const activeLaunch = this.mode === 'LAUNCHING' ? this.launchState : null;
      let i = 0;
      for (const [vid, rig] of this.trucks.entries()) {
        if (activeLaunch && activeLaunch.vehicleId === vid) {
          i += 1;
          continue;
        }
        const bounce = this.truckBounce.get(vid) || 0;
        if (bounce > 0.01) {
          rig.bodyGroup.position.y = Math.sin(bounce * Math.PI) * 0.38;
          this.truckBounce.set(vid, Math.max(0, bounce - dt * 2.8));
        } else {
          rig.bodyGroup.position.y = Math.sin(elapsed * 2.2 + i * 0.9) * 0.03;
        }
        if (rig.drumGroup) {
          rig.drumGroup.rotation.x += dt * 0.7;
        }
        if (rig.armBaseGroup && rig.bucketGroup) {
          rig.armBaseGroup.rotation.z = -0.22 + Math.sin(elapsed * 1.4) * 0.05;
          rig.bucketGroup.rotation.z = 0.2 + Math.sin(elapsed * 1.4 + 0.8) * 0.08;
        }
        if (rig.busBeaconMat) {
          rig.busBeaconMat.emissiveIntensity = 0.45 + Math.sin(elapsed * 4.5) * 0.25;
        }
        i += 1;
      }

      if (activeLaunch) {
        const rig = this.trucks.get(activeLaunch.vehicleId);
        if (rig) {
          activeLaunch.elapsed += dt;

          if (activeLaunch.elapsed < activeLaunch.driveDuration) {
            const u = Math.min(1, activeLaunch.elapsed / activeLaunch.driveDuration);
            // Smootherstep ease-in-out so the truck accelerates gently and brakes smoothly at mission start
            const s = u * u * u * (u * (6 * u - 15) + 10);

            activeLaunch.curve.getPointAt(s, _launchPos);
            activeLaunch.curve.getTangentAt(s, _launchTan);

            const stepDist = _launchPos.distanceTo(activeLaunch.prevPos);
            activeLaunch.prevPos.copy(_launchPos);
            rig.root.position.copy(_launchPos);

            if (_launchTan.lengthSq() > 0.0001) {
              // Blend steering seamlessly onto exact mission orientation (endRotY = 0) during final straight approach
              const rawRotY = Math.atan2(-_launchTan.z, _launchTan.x);
              const alignBlend = THREE.MathUtils.smoothstep(s, 0.86, 0.98);
              const deltaToEnd = Math.atan2(
                Math.sin(activeLaunch.endRotY - rawRotY),
                Math.cos(activeLaunch.endRotY - rawRotY),
              );
              const targetRotY = rawRotY + deltaToEnd * alignBlend;
              const diff = Math.atan2(
                Math.sin(targetRotY - rig.root.rotation.y),
                Math.cos(targetRotY - rig.root.rotation.y),
              );
              rig.root.rotation.y += diff * (1 - Math.exp(-9 * dt));
            }

            // Wheel spin synced cleanly to actual distance rolled
            rig.wheels.forEach((w) => {
              w.rotation.z -= stepDist / 0.44;
            });

            const speedFactor = Math.min(1, stepDist / Math.max(dt, 0.001) / 4.2);
            rig.bodyGroup.position.y = Math.abs(Math.sin(activeLaunch.elapsed * 14)) * 0.045 * speedFactor;
            if (rig.drumGroup) {
              rig.drumGroup.rotation.x += dt * (1.2 + speedFactor * 1.8);
            }

            // Smoothly unfold tucked garage posture (crane boom & excavator arm) before reaching mission start
            const unfoldT = THREE.MathUtils.smoothstep(u, 0.55, 0.96);
            if (unfoldT > 0) {
              if (rig.id === 'crane') {
                if (rig.turretGroup) rig.turretGroup.rotation.y = Math.PI * (1 - unfoldT);
                if (rig.boomGroup) rig.boomGroup.rotation.z = 0.54 * (1 - unfoldT);
                if (rig.cableMesh) rig.cableMesh.scale.y = THREE.MathUtils.lerp(0.45, 1.3, unfoldT);
                if (rig.hookGroup) rig.hookGroup.position.y = THREE.MathUtils.lerp(2.1, 1.25, unfoldT);
              } else if (rig.id === 'ekskavator') {
                if (rig.armBaseGroup) rig.armBaseGroup.rotation.z = -0.22 * (1 - unfoldT);
                if (rig.armForeGroup) rig.armForeGroup.rotation.z = -0.26 * (1 - unfoldT);
                if (rig.bucketGroup) rig.bucketGroup.rotation.z = 0.2 * (1 - unfoldT);
              }
            }

            // Smoothly blend camera from plaza follow-cam directly into the exact mission camera preset
            _followCamPos.set(rig.root.position.x * 0.3, 8.0, 11.4);
            _followCamTarget.set(
              rig.root.position.x * 0.45,
              1.35,
              rig.root.position.z * 0.5 - 0.8,
            );
            const camBlend = THREE.MathUtils.smoothstep(u, 0.52, 0.98);
            this.desiredCamPos.lerpVectors(_followCamPos, activeLaunch.missionCamPos, camBlend);
            this.desiredCamTarget.lerpVectors(
              _followCamTarget,
              activeLaunch.missionCamTarget,
              camBlend,
            );
            this.camTransitionActive = true;
          } else {
            // Stopped cleanly at the EXACT mission start position & orientation!
            if (!activeLaunch.arrivedAtStart) {
              activeLaunch.arrivedAtStart = true;
              rig.root.position.copy(activeLaunch.endPos);
              rig.root.rotation.set(0, activeLaunch.endRotY, 0);
              this.desiredCamPos.copy(activeLaunch.missionCamPos);
              this.desiredCamTarget.copy(activeLaunch.missionCamTarget);
              this.camTransitionActive = true;
              soundEngine.playPop();
            }
            const pauseElapsed = activeLaunch.elapsed - activeLaunch.driveDuration;
            const bouncePhase = Math.min(1, pauseElapsed / 0.36);
            rig.bodyGroup.position.y = Math.sin(bouncePhase * Math.PI) * 0.14;

            if (pauseElapsed >= activeLaunch.pauseDuration) {
              rig.bodyGroup.position.y = 0;
              const { vehicleId, ageMode, missionVariant } = activeLaunch;
              this.launchState = null;
              this.startMission(vehicleId, ageMode, missionVariant);
              this.callbacks.onMissionStarted?.(vehicleId, missionVariant);
            }
          }
        }
      }
    } else if (this.activeMission) {
      this.activeMission.update(dt, elapsed);
    }

    // Update 3D Celebration Confetti
    if (this.confettiActive) {
      this.confettiTimer += dt;
      this.confettiPieces.forEach((p, idx) => {
        p.vel.y -= dt * 9.8;
        p.pos.addScaledVector(p.vel, dt);
        if (p.pos.y < 0.12) {
          p.pos.y = 0.12;
          p.vel.multiplyScalar(0.5);
        }
        p.rot.x += p.rotVel.x * dt;
        p.rot.y += p.rotVel.y * dt;
        p.rot.z += p.rotVel.z * dt;
        _confettiDummy.position.copy(p.pos);
        _confettiDummy.rotation.copy(p.rot);
        _confettiDummy.updateMatrix();
        this.confettiMesh.setMatrixAt(idx, _confettiDummy.matrix);
      });
      this.confettiMesh.instanceMatrix.needsUpdate = true;
      if (this.confettiTimer > 4.5) {
        this.confettiActive = false;
        this.confettiMesh.visible = false;
      }
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = window.requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    window.cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    this.clearActiveMission();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointerup', this.onPointerCancel);
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.onPointerDown);
    dom.removeEventListener('pointermove', this.onPointerMove);
    dom.removeEventListener('pointerup', this.onPointerUp);
    dom.removeEventListener('pointercancel', this.onPointerCancel);
    dom.removeEventListener('webglcontextlost', this.onWebglLost);
    dom.removeEventListener('webglcontextrestored', this.onWebglRestored);
    this.timer.dispose();
    this.controls.dispose();
    this.world.dispose();
    for (const rig of this.trucks.values()) {
      this.scene.remove(rig.root);
      if (rig.drumMaterial?.map) {
        rig.drumMaterial.map.dispose();
      }
      rig.root.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
    }
    this.trucks.clear();
    disposeSharedTruckAssets();
    disposeSharedStorybookTextures();
    this.confettiMesh.geometry.dispose();
    (this.confettiMesh.material as THREE.Material).dispose();
    if (this.envRenderTarget) {
      this.envRenderTarget.dispose();
      this.envRenderTarget = null;
      this.scene.environment = null;
    }
    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
