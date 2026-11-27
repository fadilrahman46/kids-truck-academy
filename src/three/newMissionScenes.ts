import * as THREE from 'three';
import {
  BUS_RIDER_COLOR_MAP,
  SHAPE_MAP,
  SHAPE_OPTIONS,
  type AgeMode,
  type BusRiderColorId,
  type DigMoundState,
  type MissionSnapshot,
  type ShapeId,
  type TrafficLightState,
  type VehicleId,
} from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import {
  createCobblestoneTexture,
  createCottageWallTexture,
  createGouachePaintTexture,
  createRoofShingleTexture,
  createWoodPlankTexture,
  getPaperBumpTexture,
} from './textures';
import { buildShapeStone, type TruckRig } from './trucks';
import type { ActiveMissionController, MissionCallbacks } from './missionScenes';

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createIdleTracker(ageMode: AgeMode) {
  const IDLE_HINT_SECONDS = 8.0;
  let idleSeconds = 0;
  let activeHintKey: string | null = null;

  return {
    getHintKey: () => activeHintKey,
    resetIdle: (onClear?: () => void) => {
      const had = activeHintKey !== null;
      idleSeconds = 0;
      activeHintKey = null;
      if (had && onClear) onClear();
    },
    tickIdle: (
      dt: number,
      isInteractive: boolean,
      computeHint: () => { key: string; sayId: string; sayEn: string } | null,
      onHintChange: () => void,
    ) => {
      if (ageMode !== 'toddler' || !isInteractive) {
        if (activeHintKey !== null) {
          activeHintKey = null;
          onHintChange();
        }
        idleSeconds = 0;
        return;
      }
      idleSeconds += dt;
      if (idleSeconds >= IDLE_HINT_SECONDS && activeHintKey === null) {
        const suggestion = computeHint();
        if (suggestion) {
          activeHintKey = suggestion.key;
          soundEngine.speakBilingual(suggestion.sayId, suggestion.sayEn);
          onHintChange();
        }
      }
    },
  };
}

function disposeGroupHierarchy(group: THREE.Group, timeouts: number[]): void {
  timeouts.forEach((id) => window.clearTimeout(id));
  group.traverse((obj) => {
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

// =========================================================================
// 7. TRUK EKSKAVATOR (Excavator — Digging & Geometric Shape Matching)
// =========================================================================
export function createExcavatorMission(
  truck: TruckRig,
  ageMode: AgeMode,
  maxAnisotropy: number,
  callbacks: MissionCallbacks,
): ActiveMissionController {
  const group = new THREE.Group();
  const raycastTargets: THREE.Object3D[] = [];
  const timeouts: number[] = [];
  const later = (fn: () => void, ms: number) => {
    timeouts.push(window.setTimeout(fn, ms));
  };
  const idle = createIdleTracker(ageMode);
  const paperBump = getPaperBumpTexture(maxAnisotropy);

  truck.root.position.set(-2.5, 0, 3.2);
  truck.root.rotation.set(0, 0, 0);

  const shapePool: ShapeId[] =
    ageMode === 'toddler'
      ? shuffleArray<ShapeId>(['circle', 'square', 'triangle'])
      : shuffleArray<ShapeId>(['circle', 'square', 'triangle', 'star']);

  // Sunlit Earthen Dig Site Pad in front of excavator
  const dirtPad = new THREE.Mesh(
    new THREE.CylinderGeometry(2.85, 3.05, 0.14, 24),
    new THREE.MeshStandardMaterial({
      map: createGouachePaintTexture('#C89E6E', maxAnisotropy),
      bumpMap: paperBump,
      bumpScale: 0.03,
      roughness: 0.92,
    }),
  );
  dirtPad.position.set(1.55, 0.07, 3.2);
  dirtPad.receiveShadow = true;
  group.add(dirtPad);

  // Carved Stone Mosaic Pedestal behind dig site (for Phase 2 matching)
  const mosaicGroup = new THREE.Group();
  mosaicGroup.position.set(1.6, 0.04, 0.35);
  group.add(mosaicGroup);

  const mosaicBase = new THREE.Mesh(
    new THREE.BoxGeometry(shapePool.length * 1.48 + 0.7, 0.28, 1.75),
    new THREE.MeshStandardMaterial({
      map: createCobblestoneTexture(maxAnisotropy, 3, 1),
      bumpMap: paperBump,
      bumpScale: 0.025,
      roughness: 0.85,
    }),
  );
  mosaicBase.position.y = 0.14;
  mosaicBase.receiveShadow = true;
  mosaicBase.castShadow = true;
  mosaicGroup.add(mosaicBase);

  // Socket targets in shuffled order on the mosaic plaque
  const socketOrder = shuffleArray([...shapePool]);
  const socketVisuals = new Map<
    ShapeId,
    { pos: THREE.Vector3; ringMat: THREE.MeshStandardMaterial; markerGroup: THREE.Group }
  >();

  socketOrder.forEach((shapeId, idx) => {
    const sx = (idx - (socketOrder.length - 1) / 2) * 1.48;
    const markerGroup = new THREE.Group();
    markerGroup.position.set(sx, 0.29, 0);

    const opt = SHAPE_MAP[shapeId];
    const ringMat = new THREE.MeshStandardMaterial({
      color: opt.hex,
      emissive: opt.hex,
      emissiveIntensity: 0.25,
      roughness: 0.65,
    });
    const recessMat = new THREE.MeshStandardMaterial({
      color: '#5B483A',
      roughness: 0.9,
    });

    // Recessed socket silhouette matching each geometric shape
    if (shapeId === 'circle') {
      const recess = new THREE.Mesh(new THREE.CylinderGeometry(0.49, 0.49, 0.05, 22), recessMat);
      const outline = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.055, 8, 24), ringMat);
      outline.rotation.x = Math.PI / 2;
      outline.position.y = 0.03;
      markerGroup.add(recess, outline);
    } else if (shapeId === 'square') {
      const recess = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.05, 0.92), recessMat);
      const border = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.04, 1.04), ringMat);
      border.position.y = -0.005;
      markerGroup.add(border, recess);
    } else if (shapeId === 'triangle') {
      const recess = new THREE.Mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.05, 3), recessMat);
      const border = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.04, 3), ringMat);
      border.position.y = -0.005;
      markerGroup.add(border, recess);
    } else {
      const recess = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05, 5), recessMat);
      const border = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.055, 8, 5), ringMat);
      border.rotation.x = Math.PI / 2;
      border.position.y = 0.03;
      markerGroup.add(recess, border);
    }

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.75, 1.25),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hit.position.y = 0.35;
    markerGroup.add(hit);
    markerGroup.traverse((o) => {
      o.userData.socketShape = shapeId;
    });

    mosaicGroup.add(markerGroup);
    raycastTargets.push(markerGroup);

    const worldTarget = new THREE.Vector3(
      mosaicGroup.position.x + sx,
      mosaicGroup.position.y + 0.3,
      mosaicGroup.position.z,
    );
    socketVisuals.set(shapeId, { pos: worldTarget, ringMat, markerGroup });
  });

  // Dirt mounds + hidden 3D carved geometric stones
  const digMounds: DigMoundState[] = shapePool.map((shapeId, idx) => ({
    index: idx,
    dug: false,
    shapeId,
  }));

  const moundVisuals: {
    index: number;
    moundMesh: THREE.Mesh;
    moundMat: THREE.MeshStandardMaterial;
    stoneGroup: THREE.Group;
    stoneTargetPos: THREE.Vector3;
    pos: THREE.Vector3;
  }[] = [];

  const moundCoords: [number, number][] =
    shapePool.length === 3
      ? [
          [0.45, 2.35],
          [1.85, 3.25],
          [0.55, 4.1],
        ]
      : [
          [0.35, 2.25],
          [1.85, 2.45],
          [0.45, 4.15],
          [2.05, 3.95],
        ];

  digMounds.forEach((m, idx) => {
    const [mx, mz] = moundCoords[idx];
    const moundMat = new THREE.MeshStandardMaterial({
      map: createGouachePaintTexture('#9A693C', maxAnisotropy),
      bumpMap: paperBump,
      bumpScale: 0.04,
      roughness: 0.92,
    });
    const moundMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.68, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
      moundMat,
    );
    moundMesh.scale.set(1.15, 0.72, 1.05);
    moundMesh.position.set(mx, 0.12, mz);
    moundMesh.castShadow = true;
    moundMesh.receiveShadow = true;

    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hit.position.y = 0.25;
    moundMesh.add(hit);
    moundMesh.traverse((o) => {
      o.userData.moundIndex = idx;
    });
    group.add(moundMesh);
    raycastTargets.push(moundMesh);

    const stoneGroup = buildShapeStone(m.shapeId, maxAnisotropy);
    stoneGroup.position.set(mx, 0.04, mz);
    stoneGroup.scale.set(0.01, 0.01, 0.01);
    stoneGroup.visible = false;
    group.add(stoneGroup);

    moundVisuals.push({
      index: idx,
      moundMesh,
      moundMat,
      stoneGroup,
      stoneTargetPos: new THREE.Vector3(mx, 0.22, mz),
      pos: new THREE.Vector3(mx, 0.12, mz),
    });
  });

  // Dirt puff particles triggered on each scoop
  const puffMat = new THREE.MeshStandardMaterial({ color: '#A97748', roughness: 0.9 });
  const puffGeo = new THREE.SphereGeometry(0.14, 8, 6);
  const dirtPuffs: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(puffGeo, puffMat);
    p.visible = false;
    group.add(p);
    dirtPuffs.push({ mesh: p, vel: new THREE.Vector3(), life: 0 });
  }

  let phase: 'DIG' | 'MATCH' | 'DONE' = 'DIG';
  const discoveredShapes: ShapeId[] = [];
  const placedShapes: ShapeId[] = [];
  let activeShapeId: ShapeId | null = null;
  let wrongKey = 0;

  // Excavator arm animation state
  let targetTurretY = 0;
  let scoopAnimTimer = 0;

  const emit = () => {
    const remainingMounds = digMounds.filter((m) => !m.dug).length;
    let promptId = `Ketuk gundukan tanah untuk menggali batu bentuk! (${remainingMounds} tersisa)`;
    let promptEn = `Tap the dirt mounds to dig up hidden shapes! (${remainingMounds} left)`;

    if (phase === 'MATCH' && activeShapeId) {
      const opt = SHAPE_MAP[activeShapeId];
      promptId = `Cocokkan batu bentuk ${opt.nameId} ke tempatnya!`;
      promptEn = `Match the ${opt.nameEn} stone into its carved slot!`;
    } else if (phase === 'DONE') {
      promptId = 'Semua bentuk terpasang sempurna! Ekskavator hebat!';
      promptEn = 'All shapes matched perfectly! Amazing Excavator!';
    }

    callbacks.onSnapshot({
      vehicleId: 'ekskavator',
      phase,
      promptId,
      promptEn,
      digMounds: digMounds.map((m) => ({ ...m })),
      discoveredShapes: [...discoveredShapes],
      placedShapes: [...placedShapes],
      activeShapeId,
      hintKey: idle.getHintKey(),
      wrongFeedbackKey: wrongKey,
      completed: phase === 'DONE',
    });
  };

  emit();
  soundEngine.speakBilingual(
    'Truk Ekskavator! Ayo gali tanah untuk menemukan batu bentuk!',
    'Excavator! Dig the mounds to find hidden shapes!',
  );

  const digMound = (idx: number) => {
    if (phase !== 'DIG') return;
    const mound = digMounds[idx];
    const vis = moundVisuals[idx];
    if (!mound || !vis || mound.dug) return;

    idle.resetIdle();
    mound.dug = true;
    discoveredShapes.push(mound.shapeId);

    // Aim excavator turret toward the dug mound
    const dx = vis.pos.x - truck.root.position.x;
    const dz = vis.pos.z - truck.root.position.z;
    targetTurretY = Math.atan2(-dz, dx);
    scoopAnimTimer = 0.72;

    // Launch playful dirt clod burst
    dirtPuffs.forEach((p, i) => {
      p.mesh.visible = true;
      p.mesh.position.set(vis.pos.x, 0.35, vis.pos.z);
      const ang = (i / dirtPuffs.length) * Math.PI * 2;
      p.vel.set(Math.cos(ang) * 2.2, 2.8 + Math.random() * 1.4, Math.sin(ang) * 2.2);
      p.life = 0.65;
    });

    vis.stoneGroup.visible = true;
    vis.stoneTargetPos.set(vis.pos.x, 0.36, vis.pos.z);

    soundEngine.playDigScoop();
    const shapeOpt = SHAPE_MAP[mound.shapeId];
    soundEngine.speakBilingual(
      `Wah! Ketemu bentuk ${shapeOpt.nameId}!`,
      `Yay! Found a ${shapeOpt.nameEn}!`,
    );

    const allDug = digMounds.every((dm) => dm.dug);
    if (allDug) {
      later(() => {
        phase = 'MATCH';
        activeShapeId = discoveredShapes[0] || null;
        if (activeShapeId) {
          const opt = SHAPE_MAP[activeShapeId];
          soundEngine.speakBilingual(
            `Sekarang pasang bentuk ${opt.nameId} ke kotak yang sama!`,
            `Now match the ${opt.nameEn} stone to its slot!`,
          );
        }
        emit();
      }, 900);
    }
    emit();
  };

  const placeShape = (pickedShape: ShapeId) => {
    if (phase !== 'MATCH' || !activeShapeId) return;
    idle.resetIdle();

    if (pickedShape === activeShapeId) {
      placedShapes.push(pickedShape);
      const vis = moundVisuals.find((v) => digMounds[v.index].shapeId === pickedShape);
      const sock = socketVisuals.get(pickedShape);
      if (vis && sock) {
        vis.stoneTargetPos.copy(sock.pos);
        sock.ringMat.emissiveIntensity = 0.9;
      }

      soundEngine.playSuccessChime();
      const opt = SHAPE_MAP[pickedShape];
      soundEngine.speakBilingual(`Hebat! Bentuk ${opt.nameId}!`, `Great! ${opt.nameEn}!`);

      const remaining = discoveredShapes.find((s) => !placedShapes.includes(s));
      if (remaining) {
        activeShapeId = remaining;
        emit();
      } else {
        activeShapeId = null;
        phase = 'DONE';
        targetTurretY = 0.25;
        soundEngine.playHorn('ekskavator');
        emit();
        later(() => callbacks.onCelebrate('ekskavator'), 800);
      }
    } else {
      wrongKey += 1;
      soundEngine.playTryAgain();
      const opt = SHAPE_MAP[activeShapeId];
      soundEngine.speakBilingual(
        `Coba cari bentuk ${opt.nameId} ya!`,
        `Try finding the ${opt.nameEn}!`,
      );
      emit();
    }
  };

  return {
    vehicleId: 'ekskavator',
    group,
    raycastTargets,
    cameraPos: new THREE.Vector3(0.1, 6.2, 11.8),
    cameraTarget: new THREE.Vector3(0.3, 1.0, 2.3),
    update: (dt, elapsed) => {
      // Smooth excavator turret swivel & articulated digging scoop animation
      if (truck.turretGroup) {
        truck.turretGroup.rotation.y = THREE.MathUtils.damp(
          truck.turretGroup.rotation.y,
          targetTurretY,
          7,
          dt,
        );
      }
      if (scoopAnimTimer > 0) {
        scoopAnimTimer = Math.max(0, scoopAnimTimer - dt);
        const swing = Math.sin((scoopAnimTimer / 0.72) * Math.PI);
        if (truck.armBaseGroup) truck.armBaseGroup.rotation.z = -swing * 0.42;
        if (truck.armForeGroup) truck.armForeGroup.rotation.z = -swing * 0.35;
        if (truck.bucketGroup) truck.bucketGroup.rotation.z = -swing * 0.65;
      } else {
        const restBob = Math.sin(elapsed * 2.2) * 0.04;
        if (truck.armBaseGroup) {
          truck.armBaseGroup.rotation.z = THREE.MathUtils.damp(
            truck.armBaseGroup.rotation.z,
            phase === 'DONE' ? 0.28 : restBob,
            6,
            dt,
          );
        }
        if (truck.armForeGroup) {
          truck.armForeGroup.rotation.z = THREE.MathUtils.damp(
            truck.armForeGroup.rotation.z,
            0,
            6,
            dt,
          );
        }
        if (truck.bucketGroup) {
          truck.bucketGroup.rotation.z = THREE.MathUtils.damp(
            truck.bucketGroup.rotation.z,
            restBob * 1.4,
            6,
            dt,
          );
        }
      }

      // Update mounds & carved stones
      moundVisuals.forEach((v) => {
        const m = digMounds[v.index];
        if (m.dug) {
          v.moundMesh.scale.y = THREE.MathUtils.damp(v.moundMesh.scale.y, 0.14, 8, dt);
          const s = THREE.MathUtils.damp(v.stoneGroup.scale.x, 1.12, 8, dt);
          v.stoneGroup.scale.set(s, s, s);
          v.stoneGroup.position.x = THREE.MathUtils.damp(
            v.stoneGroup.position.x,
            v.stoneTargetPos.x,
            7,
            dt,
          );
          v.stoneGroup.position.z = THREE.MathUtils.damp(
            v.stoneGroup.position.z,
            v.stoneTargetPos.z,
            7,
            dt,
          );
          const isCurrent = phase === 'MATCH' && activeShapeId === m.shapeId;
          const hoverY = isCurrent
            ? v.stoneTargetPos.y + 0.32 + Math.abs(Math.sin(elapsed * 5)) * 0.16
            : v.stoneTargetPos.y;
          v.stoneGroup.position.y = THREE.MathUtils.damp(v.stoneGroup.position.y, hoverY, 8, dt);
          if (isCurrent) {
            v.stoneGroup.rotation.y += dt * 1.6;
          } else {
            v.stoneGroup.rotation.y = THREE.MathUtils.damp(v.stoneGroup.rotation.y, 0, 7, dt);
          }
        } else {
          const pulse = idle.getHintKey() === `mound:${v.index}` ? 0.35 : 0;
          v.moundMat.emissive.set('#F59E0B');
          v.moundMat.emissiveIntensity = pulse * (0.6 + Math.sin(elapsed * 7) * 0.4);
        }
      });

      // Animate dirt clod burst
      dirtPuffs.forEach((p) => {
        if (p.life > 0) {
          p.life -= dt;
          p.vel.y -= dt * 9.5;
          p.mesh.position.addScaledVector(p.vel, dt);
          if (p.mesh.position.y < 0.08) p.mesh.position.y = 0.08;
          if (p.life <= 0) p.mesh.visible = false;
        }
      });

      idle.tickIdle(
        dt,
        phase === 'DIG' || phase === 'MATCH',
        () => {
          if (phase === 'DIG') {
            const firstUndug = digMounds.find((dm) => !dm.dug);
            if (!firstUndug) return null;
            return {
              key: `mound:${firstUndug.index}`,
              sayId: `Ayo gali gundukan nomor ${firstUndug.index + 1}!`,
              sayEn: `Dig mound number ${firstUndug.index + 1}!`,
            };
          }
          if (activeShapeId) {
            const opt = SHAPE_MAP[activeShapeId];
            return {
              key: `shape:${activeShapeId}`,
              sayId: `Ketuk bentuk ${opt.nameId} untuk memasangnya!`,
              sayEn: `Tap the ${opt.nameEn} to match it!`,
            };
          }
          return null;
        },
        emit,
      );
    },
    handleRaycastHit: (hitObj) => {
      if (phase === 'DIG' && typeof hitObj.userData.moundIndex === 'number') {
        digMound(hitObj.userData.moundIndex);
      } else if (phase === 'MATCH' && typeof hitObj.userData.socketShape === 'string') {
        placeShape(hitObj.userData.socketShape as ShapeId);
      }
    },
    handleAction: (action, payload) => {
      if (action === 'DIG_MOUND' && typeof payload === 'number') {
        digMound(payload);
      } else if (action === 'PLACE_SHAPE' && typeof payload === 'string') {
        placeShape(payload as ShapeId);
      }
    },
    dispose: () => disposeGroupHierarchy(group, timeouts),
  };
}

// Helper to build a cute storybook 3D village rider peg-doll
function buildVillageRider(colorId: BusRiderColorId, maxAnisotropy: number): THREE.Group {
  const opt = BUS_RIDER_COLOR_MAP[colorId];
  const g = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({
    map: createGouachePaintTexture(opt.hex, maxAnisotropy),
    roughness: 0.62,
  });
  const hatMat = new THREE.MeshStandardMaterial({
    map: createGouachePaintTexture(opt.hatHex, maxAnisotropy),
    roughness: 0.65,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: '#FAD5B5', roughness: 0.72 });
  const bagMat = new THREE.MeshStandardMaterial({ color: '#7D4E24', roughness: 0.8 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.76, 14), coatMat);
  body.position.y = 0.4;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skinMat);
  head.position.y = 0.96;
  head.castShadow = true;
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.31, 0.06, 14), hatMat);
  hatBrim.position.y = 1.12;
  const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hatMat);
  hatTop.position.y = 1.13;
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.16), bagMat);
  backpack.position.set(0, 0.52, -0.24);
  g.add(body, head, hatBrim, hatTop, backpack);
  return g;
}

interface BusPatternRound {
  sequence: BusRiderColorId[];
  answer: BusRiderColorId;
  choices: BusRiderColorId[];
}

function buildBusPatternRounds(ageMode: AgeMode): BusPatternRound[] {
  if (ageMode === 'toddler') {
    return [
      {
        sequence: ['red', 'blue', 'red'],
        answer: 'blue',
        choices: ['red', 'blue'],
      },
      {
        sequence: ['yellow', 'green', 'yellow'],
        answer: 'green',
        choices: ['yellow', 'green'],
      },
    ];
  }
  return [
    {
      sequence: ['red', 'red', 'blue'],
      answer: 'blue',
      choices: ['red', 'blue', 'yellow'],
    },
    {
      sequence: ['red', 'blue', 'green', 'red', 'blue'],
      answer: 'green',
      choices: ['red', 'blue', 'green'],
    },
  ];
}

// =========================================================================
// 8. BUS SEKOLAH (School Bus — Traffic Lights & Visual Pattern Pickup)
// =========================================================================
export function createSchoolBusMission(
  truck: TruckRig,
  ageMode: AgeMode,
  maxAnisotropy: number,
  callbacks: MissionCallbacks,
): ActiveMissionController {
  const group = new THREE.Group();
  const raycastTargets: THREE.Object3D[] = [];
  const timeouts: number[] = [];
  const later = (fn: () => void, ms: number) => {
    timeouts.push(window.setTimeout(fn, ms));
  };
  const idle = createIdleTracker(ageMode);
  const paperBump = getPaperBumpTexture(maxAnisotropy);

  const START_X = -5.4;
  const STOP_X = 1.4;
  truck.root.position.set(START_X, 0, 3.2);
  truck.root.rotation.set(0, 0, 0);

  // 1. Charming 3D Village Traffic Light Post along roadside
  const signalGroup = new THREE.Group();
  signalGroup.position.set(-1.1, 0, 0.9);
  const poleMat = new THREE.MeshStandardMaterial({ color: '#463C35', roughness: 0.72, metalness: 0.25 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.3, 12), poleMat);
  pole.position.y = 1.65;
  pole.castShadow = true;
  const signalBox = new THREE.Mesh(new THREE.BoxGeometry(0.76, 1.85, 0.52), poleMat);
  signalBox.position.set(0, 3.3, 0);
  signalBox.castShadow = true;

  const redLightMat = new THREE.MeshStandardMaterial({
    color: '#EF4444',
    emissive: '#EF4444',
    emissiveIntensity: 0.12,
    roughness: 0.24,
  });
  const yellowLightMat = new THREE.MeshStandardMaterial({
    color: '#FACC15',
    emissive: '#FACC15',
    emissiveIntensity: 0.12,
    roughness: 0.24,
  });
  const greenLightMat = new THREE.MeshStandardMaterial({
    color: '#22C55E',
    emissive: '#22C55E',
    emissiveIntensity: 1.8,
    roughness: 0.24,
  });

  const bulbGeo = new THREE.SphereGeometry(0.22, 14, 12);
  const redBulb = new THREE.Mesh(bulbGeo, redLightMat);
  redBulb.position.set(0, 3.86, 0.24);
  const yellowBulb = new THREE.Mesh(bulbGeo, yellowLightMat);
  yellowBulb.position.set(0, 3.3, 0.24);
  const greenBulb = new THREE.Mesh(bulbGeo, greenLightMat);
  greenBulb.position.set(0, 2.74, 0.24);
  signalGroup.add(pole, signalBox, redBulb, yellowBulb, greenBulb);
  group.add(signalGroup);

  // 2. Storybook Timber Bus Stop Shelter at STOP_X
  const shelterGroup = new THREE.Group();
  shelterGroup.position.set(2.5, 0, 0.55);
  const woodMat = new THREE.MeshStandardMaterial({
    map: createWoodPlankTexture('#A86F38', maxAnisotropy),
    bumpMap: paperBump,
    bumpScale: 0.025,
    roughness: 0.8,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: createRoofShingleTexture('terracotta', maxAnisotropy),
    bumpMap: paperBump,
    bumpScale: 0.035,
    roughness: 0.82,
  });
  for (const px of [-1.45, 1.45]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.35, 0.22), woodMat);
    post.position.set(px, 1.18, -0.55);
    post.castShadow = true;
    shelterGroup.add(post);
  }
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.65, 0.14), woodMat);
  backWall.position.set(0, 0.95, -0.66);
  backWall.castShadow = true;
  const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 0.56), woodMat);
  bench.position.set(0, 0.52, -0.35);
  const shelterRoof = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.22, 1.65), roofMat);
  shelterRoof.position.set(0, 2.42, -0.2);
  shelterRoof.rotation.x = 0.16;
  shelterRoof.castShadow = true;
  shelterGroup.add(backWall, bench, shelterRoof);
  group.add(shelterGroup);

  // 3. Charming Village Schoolhouse Gate down the road on the right
  const schoolGate = new THREE.Group();
  schoolGate.position.set(11.4, 0, 0.9);
  const wallMat = new THREE.MeshStandardMaterial({
    map: createCottageWallTexture('#F7EBD2', '#64452F', maxAnisotropy),
    roughness: 0.86,
  });
  const schoolBody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.8, 2.4), wallMat);
  schoolBody.position.y = 1.4;
  schoolBody.castShadow = true;
  const schoolRoof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 1.6, 4), roofMat);
  schoolRoof.position.y = 3.6;
  schoolRoof.rotation.y = Math.PI / 4;
  schoolRoof.castShadow = true;
  schoolGate.add(schoolBody, schoolRoof);
  group.add(schoolGate);

  // 4. Waiting Pattern Riders Group (populated per pattern round)
  const ridersRowGroup = new THREE.Group();
  ridersRowGroup.position.set(2.2, 0, 1.45);
  group.add(ridersRowGroup);

  const rounds = buildBusPatternRounds(ageMode);
  let roundIndex = 0;
  let ridersBoarded = 0;
  let boardingRider: { mesh: THREE.Group; target: THREE.Vector3 } | null = null;

  const rebuildRiderRow = () => {
    while (ridersRowGroup.children.length > 0) {
      const child = ridersRowGroup.children[0];
      ridersRowGroup.remove(child);
    }
    const r = rounds[roundIndex];
    if (!r) return;
    r.sequence.forEach((colId, idx) => {
      const doll = buildVillageRider(colId, maxAnisotropy);
      const sx = (idx - (r.sequence.length - 1) / 2) * 0.85;
      doll.position.set(sx, 0, 0);
      ridersRowGroup.add(doll);
    });
  };
  rebuildRiderRow();

  let phase: 'TRAFFIC' | 'PATTERN' | 'DRIVE' | 'DONE' = 'TRAFFIC';
  let trafficLight: TrafficLightState = 'green';
  let lightTimer = 0;
  let busProgress = 0;
  let isHoldingGo = false;
  let wrongKey = 0;
  let lastProgressEmitStep = -1;

  const updateSignalEmissives = () => {
    redLightMat.emissiveIntensity = trafficLight === 'red' ? 2.1 : 0.1;
    yellowLightMat.emissiveIntensity = trafficLight === 'yellow' ? 2.1 : 0.1;
    greenLightMat.emissiveIntensity = trafficLight === 'green' ? 2.1 : 0.1;
  };
  updateSignalEmissives();

  const emit = () => {
    const currentRound = rounds[roundIndex];
    let promptId =
      trafficLight === 'green'
        ? 'Lampu Hijau! Tekan tombol Jalan menuju halte!'
        : trafficLight === 'yellow'
          ? 'Lampu Kuning! Hati-hati dan bersiap berhenti!'
          : 'Lampu Merah! Berhenti dulu menunggu hijau ya!';
    let promptEn =
      trafficLight === 'green'
        ? 'Green Light! Press Go to drive to the bus stop!'
        : trafficLight === 'yellow'
          ? 'Yellow Light! Slow down and get ready to stop!'
          : 'Red Light! Stop and wait for green!';

    if (phase === 'PATTERN' && currentRound) {
      promptId = `Lengkapi pola warna penumpang yang naik ke Bus Sekolah! (${ridersBoarded}/${rounds.length})`;
      promptEn = `Complete the rider color pattern to board the School Bus! (${ridersBoarded}/${rounds.length})`;
    } else if (phase === 'DRIVE' || phase === 'DONE') {
      promptId = 'Semua penumpang siap! Bus Sekolah berangkat ke sekolah!';
      promptEn = 'All aboard! School Bus is rolling to school!';
    }

    callbacks.onSnapshot({
      vehicleId: 'bus',
      phase,
      promptId,
      promptEn,
      trafficLight,
      busProgress,
      patternSequence: currentRound ? [...currentRound.sequence] : [],
      patternChoices: currentRound ? [...currentRound.choices] : [],
      ridersBoarded,
      totalRidersToBoard: rounds.length,
      hintKey: idle.getHintKey(),
      wrongFeedbackKey: wrongKey,
      completed: phase === 'DONE',
    });
  };

  emit();
  soundEngine.speakBilingual(
    'Bus Sekolah! Jalan saat lampu hijau, dan berhenti saat lampu merah!',
    'School Bus! Go on green light, and stop on red light!',
  );

  return {
    vehicleId: 'bus',
    group,
    raycastTargets,
    cameraPos: new THREE.Vector3(-0.2, 5.6, 12.6),
    cameraTarget: new THREE.Vector3(0.2, 1.4, 2.5),
    update: (dt, elapsed) => {
      // Gentle bounce of waiting riders
      ridersRowGroup.children.forEach((child, i) => {
        child.position.y = Math.abs(Math.sin(elapsed * 3.4 + i * 0.8)) * 0.08;
      });

      // Animate boarding rider hopping into the school bus door
      if (boardingRider) {
        boardingRider.mesh.position.x = THREE.MathUtils.damp(
          boardingRider.mesh.position.x,
          boardingRider.target.x,
          8,
          dt,
        );
        boardingRider.mesh.position.z = THREE.MathUtils.damp(
          boardingRider.mesh.position.z,
          boardingRider.target.z,
          8,
          dt,
        );
        boardingRider.mesh.position.y = 0.2 + Math.abs(Math.sin(elapsed * 12)) * 0.3;
        if (boardingRider.mesh.position.distanceTo(boardingRider.target) < 0.35) {
          group.remove(boardingRider.mesh);
          boardingRider = null;
        }
      }

      // Swing STOP paddle smoothly out during PATTERN phase, fold flush otherwise
      if (truck.stopSignGroup) {
        const targetStopAngle = phase === 'PATTERN' ? Math.PI / 2 : 0;
        truck.stopSignGroup.rotation.y = THREE.MathUtils.damp(
          truck.stopSignGroup.rotation.y,
          targetStopAngle,
          9,
          dt,
        );
      }

      // Flash amber bus beacons gently when stopped at bus stop or red light
      if (truck.busBeaconMat) {
        const flash = phase === 'PATTERN' || trafficLight === 'red';
        truck.busBeaconMat.emissiveIntensity = flash
          ? 0.4 + Math.abs(Math.sin(elapsed * 8)) * 1.6
          : 0.45;
      }

      if (phase === 'TRAFFIC') {
        lightTimer += dt;
        const greenDur = ageMode === 'toddler' ? 4.4 : 3.6;
        const yellowDur = 1.4;
        const redDur = ageMode === 'toddler' ? 3.0 : 2.8;

        if (trafficLight === 'green' && lightTimer >= greenDur) {
          lightTimer = 0;
          trafficLight = ageMode === 'toddler' ? 'red' : 'yellow';
          isHoldingGo = false;
          updateSignalEmissives();
          soundEngine.playTrafficDing();
          emit();
        } else if (trafficLight === 'yellow' && lightTimer >= yellowDur) {
          lightTimer = 0;
          trafficLight = 'red';
          isHoldingGo = false;
          updateSignalEmissives();
          soundEngine.playTrafficDing();
          emit();
        } else if (trafficLight === 'red' && lightTimer >= redDur) {
          lightTimer = 0;
          trafficLight = 'green';
          updateSignalEmissives();
          soundEngine.playTrafficDing();
          emit();
        }

        if (isHoldingGo && trafficLight === 'green') {
          busProgress = Math.min(1, busProgress + dt * 0.42);
          truck.root.position.x = THREE.MathUtils.lerp(START_X, STOP_X, busProgress);
          truck.wheels.forEach((w) => {
            w.rotation.z -= dt * 9.5;
          });
          truck.bodyGroup.position.y = Math.abs(Math.sin(elapsed * 16)) * 0.035;

          const step = Math.floor(busProgress * 20);
          if (step !== lastProgressEmitStep) {
            lastProgressEmitStep = step;
            emit();
          }

          if (busProgress >= 1) {
            isHoldingGo = false;
            truck.bodyGroup.position.y = 0;
            phase = 'PATTERN';
            soundEngine.playHorn('bus');
            soundEngine.speakBilingual(
              'Sampai di halte! Lihat pola warna, siapa yang naik berikutnya?',
              'At the bus stop! Look at the color pattern—who boards next?',
            );
            emit();
          }
        } else {
          truck.bodyGroup.position.y = THREE.MathUtils.damp(truck.bodyGroup.position.y, 0, 10, dt);
        }
      } else if (phase === 'DRIVE') {
        truck.root.position.x += dt * 6.0;
        truck.wheels.forEach((w) => {
          w.rotation.z -= dt * 10.5;
        });
        truck.bodyGroup.position.y = Math.abs(Math.sin(elapsed * 16)) * 0.035;
        if (truck.root.position.x >= 9.6) {
          phase = 'DONE';
          truck.bodyGroup.position.y = 0;
          emit();
          callbacks.onCelebrate('bus');
        }
      }

      idle.tickIdle(
        dt,
        phase === 'TRAFFIC' || phase === 'PATTERN',
        () => {
          if (phase === 'TRAFFIC') {
            if (trafficLight === 'green') {
              return {
                key: 'bus:go',
                sayId: 'Lampu hijau! Tekan tombol Jalan!',
                sayEn: 'Green light! Press Go!',
              };
            }
            return null;
          }
          const currentRound = rounds[roundIndex];
          if (!currentRound) return null;
          const opt = BUS_RIDER_COLOR_MAP[currentRound.answer];
          return {
            key: `rider:${currentRound.answer}`,
            sayId: `Lihat polanya! Penumpang warna ${opt.nameId}!`,
            sayEn: `Look at the pattern! Pick ${opt.nameEn}!`,
          };
        },
        emit,
      );
    },
    handleRaycastHit: () => {},
    handleAction: (action, payload) => {
      idle.resetIdle();
      if (phase === 'TRAFFIC') {
        if (action === 'BUS_GO') {
          if (trafficLight === 'green') {
            isHoldingGo = true;
            // Give a nice instant burst for single taps by toddlers too
            busProgress = Math.min(1, busProgress + 0.16);
            truck.root.position.x = THREE.MathUtils.lerp(START_X, STOP_X, busProgress);
            soundEngine.playPop();
            if (busProgress >= 1) {
              isHoldingGo = false;
              phase = 'PATTERN';
              soundEngine.playHorn('bus');
              soundEngine.speakBilingual(
                'Sampai di halte! Lengkapi pola warnanya ya!',
                'Bus stop reached! Complete the color pattern!',
              );
            }
            emit();
          } else {
            isHoldingGo = false;
            wrongKey += 1;
            soundEngine.playTryAgain();
            soundEngine.speakBilingual(
              'Lampu merah! Kita berhenti dulu tunggu lampu hijau ya!',
              'Wait! Stop on red and wait for green!',
            );
            emit();
          }
        } else if (action === 'BUS_STOP') {
          isHoldingGo = false;
          soundEngine.playPop();
          emit();
        }
      } else if (phase === 'PATTERN' && action === 'PICK_PATTERN_RIDER') {
        const picked = payload as BusRiderColorId;
        const currentRound = rounds[roundIndex];
        if (!currentRound) return;

        if (picked === currentRound.answer) {
          ridersBoarded += 1;
          const opt = BUS_RIDER_COLOR_MAP[picked];

          // Spawn a happy boarding 3D rider hopping into the school bus!
          const hopper = buildVillageRider(picked, maxAnisotropy);
          hopper.position.set(2.2, 0, 1.85);
          group.add(hopper);
          boardingRider = {
            mesh: hopper,
            target: new THREE.Vector3(truck.root.position.x + 0.8, 0.4, truck.root.position.z - 0.1),
          };

          soundEngine.playSuccessChime();
          soundEngine.speakBilingual(
            `Benar! Penumpang ${opt.nameId} naik bus!`,
            `Correct! ${opt.nameEn} rider hops aboard!`,
          );

          if (roundIndex + 1 < rounds.length) {
            roundIndex += 1;
            later(() => {
              rebuildRiderRow();
              emit();
            }, 550);
          } else {
            later(() => {
              ridersRowGroup.visible = false;
              phase = 'DRIVE';
              soundEngine.playHorn('bus');
              later(() => soundEngine.playEngineRev(), 260);
              soundEngine.speakBilingual(
                'Semua sudah naik! Bus Sekolah berangkat ke sekolah!',
                'All aboard! School Bus is driving to school!',
              );
              emit();
            }, 700);
          }
          emit();
        } else {
          wrongKey += 1;
          soundEngine.playTryAgain();
          soundEngine.speakBilingual(
            'Lihat urutan warnanya lagi ya!',
            'Look closely at the color pattern!',
          );
          emit();
        }
      }
    },
    dispose: () => disposeGroupHierarchy(group, timeouts),
  };
}
