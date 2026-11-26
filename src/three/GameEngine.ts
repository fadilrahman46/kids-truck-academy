import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  VEHICLES,
  VEHICLE_MAP,
  type AgeMode,
  type MissionSnapshot,
  type VehicleId,
} from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { buildStorybookWorld, type WorldEnvironment } from './world';
import { buildTruck, disposeSharedTruckAssets, type TruckRig } from './trucks';
import { createMixerStripeTexture, disposeSharedStorybookTextures } from './textures';
import { createMissionController, type ActiveMissionController } from './missionScenes';

export interface EngineCallbacks {
  onSelectTruckFrom3D: (vehicleId: VehicleId) => void;
  onMissionSnapshot: (snap: MissionSnapshot) => void;
  onCelebrate: (vehicleId: VehicleId) => void;
  onContextLost: (lost: boolean) => void;
  onReady?: () => void;
}

const GARAGE_CAM_POS = new THREE.Vector3(0, 7.6, 13.8);
const GARAGE_CAM_TARGET = new THREE.Vector3(0, 1.2, -3.4);

// Pre-allocated scratch helpers (zero GC in render loop)
const _pointerNdc = new THREE.Vector2();
const _confettiDummy = new THREE.Object3D();

interface ConfettiPiece {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotVel: THREE.Vector3;
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
  private mode: 'GARAGE' | 'MISSION' = 'GARAGE';
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
    this.controls.maxDistance = 24;
    this.controls.minPolarAngle = 0.25;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.addEventListener('start', () => {
      // Cancel scripted camera move if user orbits manually
      this.camTransitionActive = false;
    });

    this.timer = new THREE.Timer();
    this.timer.connect(document);
    this.raycaster = new THREE.Raycaster();

    // Build sunlit 3D storybook town diorama
    this.world = buildStorybookWorld(this.scene, this.maxAnisotropy, this.isSoftwareGl);

    // Build all 6 composite 3D trucks parked in the sunny town plaza
    for (const cfg of VEHICLES) {
      const rig = buildTruck(cfg.id, this.maxAnisotropy);
      rig.root.position.set(...cfg.garagePos);
      rig.root.rotation.y = cfg.garageRotY;
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
      const hits = this.raycaster.intersectObjects(truckRoots, true);
      if (hits.length > 0) {
        const vid = hits[0].object.userData.vehicleId as VehicleId | undefined;
        if (vid) {
          this.honkTruck(vid);
          this.callbacks.onSelectTruckFrom3D(vid);
        }
      }
    } else if (this.activeMission && this.activeMission.raycastTargets.length > 0) {
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
    if (rig.chuteGroup) rig.chuteGroup.rotation.set(0, 0, 0);
    if (rig.id === 'molen' && rig.drumMaterial) {
      const oldMap = rig.drumMaterial.map;
      rig.drumMaterial.map = createMixerStripeTexture('#E8951B', this.maxAnisotropy);
      rig.drumMaterial.needsUpdate = true;
      oldMap?.dispose();
    }
  }

  public enterGarage(): void {
    this.isDraggingSpray = false;
    this.clearActiveMission();
    this.mode = 'GARAGE';
    this.confettiActive = false;
    this.confettiMesh.visible = false;

    for (const cfg of VEHICLES) {
      const rig = this.trucks.get(cfg.id)!;
      rig.root.visible = true;
      rig.root.position.set(...cfg.garagePos);
      rig.root.rotation.set(0, cfg.garageRotY, 0);
      this.resetTruckRig(rig);
    }

    this.controls.enabled = true;
    this.desiredCamPos.copy(GARAGE_CAM_POS);
    this.desiredCamTarget.copy(GARAGE_CAM_TARGET);
    this.camTransitionActive = true;
  }

  public startMission(vehicleId: VehicleId, ageMode: AgeMode): void {
    this.isDraggingSpray = false;
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
    const ctrl = createMissionController(vehicleId, activeTruck, ageMode, this.maxAnisotropy, {
      onSnapshot: (snap) => this.callbacks.onMissionSnapshot(snap),
      onCelebrate: (vid) => {
        this.launchConfetti(activeTruck.root.position);
        this.callbacks.onCelebrate(vid);
      },
    });

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

    // Gentle lively idle animations in Garage
    if (this.mode === 'GARAGE') {
      let i = 0;
      for (const [vid, rig] of this.trucks.entries()) {
        const bounce = this.truckBounce.get(vid) || 0;
        if (bounce > 0.01) {
          rig.bodyGroup.position.y = Math.sin(bounce * Math.PI) * 0.45;
          this.truckBounce.set(vid, Math.max(0, bounce - dt * 2.8));
        } else {
          rig.bodyGroup.position.y = Math.sin(elapsed * 2.2 + i * 0.9) * 0.03;
        }
        if (rig.drumGroup) {
          rig.drumGroup.rotation.x += dt * 0.7;
        }
        i += 1;
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
