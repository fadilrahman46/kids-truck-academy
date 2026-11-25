import * as THREE from 'three';
import {
  ALL_COLORS,
  CARGO_OPTIONS,
  LETTERS_PRESCHOOL,
  LETTERS_TODDLER,
  NUMBER_WORDS,
  PRIMARY_COLORS,
  WASTE_CATALOG,
  mixTwoColors,
  type AgeMode,
  type CargoTypeId,
  type ColorOption,
  type LetterEntry,
  type MissionSnapshot,
  type PipeTileState,
  type VehicleId,
  type WasteCategory,
  type WasteItemDef,
} from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { createMixerStripeTexture, createSignTexture } from './textures';
import { buildCargoProp, buildWasteProp, type TruckRig } from './trucks';

export interface MissionCallbacks {
  onSnapshot: (snap: MissionSnapshot) => void;
  onCelebrate: (vehicleId: VehicleId) => void;
}

export interface ActiveMissionController {
  vehicleId: VehicleId;
  group: THREE.Group;
  raycastTargets: THREE.Object3D[];
  cameraPos: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  update: (dt: number, elapsed: number) => void;
  handleRaycastHit: (hitObj: THREE.Object3D) => void;
  handleAction: (action: string, payload?: unknown) => void;
  dispose: () => void;
}

// Helper for pipe port directions: 0=Top(-Z), 1=Right(+X), 2=Bottom(+Z), 3=Left(-X)
function getPipePorts(type: 'straight' | 'elbow', rotation: number): number[] {
  const base = type === 'straight' ? [1, 3] : [0, 1];
  return base.map((d) => (d + (rotation % 4)) % 4);
}

function buildPipeMesh(
  type: 'straight' | 'elbow',
  index: number,
): { group: THREE.Group; pipeMat: THREE.MeshStandardMaterial; baseMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({
    color: '#E2E8F0',
    roughness: 0.7,
    metalness: 0.05,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.16, 1.42), baseMat);
  base.position.y = 0.08;
  base.receiveShadow = true;
  group.add(base);

  const pipeMat = new THREE.MeshStandardMaterial({
    color: '#94A3B8',
    roughness: 0.35,
    metalness: 0.45,
  });

  const flangeMat = new THREE.MeshStandardMaterial({
    color: '#475569',
    roughness: 0.4,
    metalness: 0.6,
  });

  if (type === 'straight') {
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.44, 16), pipeMat);
    cyl.rotation.z = Math.PI / 2;
    cyl.position.y = 0.38;
    cyl.castShadow = true;
    group.add(cyl);

    for (const fx of [-0.66, 0.66]) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.12, 16), flangeMat);
      f.rotation.z = Math.PI / 2;
      f.position.set(fx, 0.38, 0);
      group.add(f);
    }
  } else {
    // Elbow connects Top (-Z, dir 0) and Right (+X, dir 1)
    const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.72, 16), pipeMat);
    legA.rotation.x = Math.PI / 2;
    legA.position.set(0, 0.38, -0.36);
    legA.castShadow = true;
    group.add(legA);

    const legB = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.72, 16), pipeMat);
    legB.rotation.z = Math.PI / 2;
    legB.position.set(0.36, 0.38, 0);
    legB.castShadow = true;
    group.add(legB);

    const joint = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 12), pipeMat);
    joint.position.set(0, 0.38, 0);
    group.add(joint);

    const fTop = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.12, 16), flangeMat);
    fTop.rotation.x = Math.PI / 2;
    fTop.position.set(0, 0.38, -0.66);
    group.add(fTop);

    const fRight = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.12, 16), flangeMat);
    fRight.rotation.z = Math.PI / 2;
    fRight.position.set(0.66, 0.38, 0);
    group.add(fRight);
  }

  // Generous invisible hitbox so tiny fingers never miss
  const hit = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.9, 1.5),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hit.position.y = 0.45;
  hit.userData.pipeIndex = index;
  group.add(hit);

  group.traverse((o) => {
    o.userData.pipeIndex = index;
  });

  return { group, pipeMat, baseMat };
}

function makeNumberChoices(correct: number, maxVal: number, count: number): number[] {
  const set = new Set<number>([correct]);
  while (set.size < count) {
    const candidate = 1 + Math.floor(Math.random() * maxVal);
    set.add(candidate);
  }
  return Array.from(set).sort((a, b) => a - b);
}

export function createMissionController(
  vehicleId: VehicleId,
  truck: TruckRig,
  ageMode: AgeMode,
  maxAnisotropy: number,
  callbacks: MissionCallbacks,
): ActiveMissionController {
  const group = new THREE.Group();
  const raycastTargets: THREE.Object3D[] = [];
  const timeouts: number[] = [];

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeouts.push(id);
  };

  // Reset truck transforms cleanly for mission boulevard (z = 3.2)
  truck.root.position.set(0, 0, 3.2);
  truck.root.rotation.set(0, 0, 0);
  truck.bodyGroup.position.set(0, 0, 0);
  truck.bodyGroup.rotation.set(0, 0, 0);

  const disposeGroup = () => {
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
  };

  // =========================================================================
  // 1. TRUK MOLEN (Cement Mixer — Color Mixing & Building)
  // =========================================================================
  if (vehicleId === 'molen') {
    truck.root.position.set(2.2, 0, 3.2);
    truck.root.rotation.y = 0; // chute faces left (-X) toward building pad

    // Building pad on the left
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.16, 3.2),
      new THREE.MeshStandardMaterial({ color: '#CBD5E1', roughness: 0.85 }),
    );
    pad.position.set(-2.6, 0.08, 3.2);
    pad.receiveShadow = true;
    group.add(pad);

    // Paint stream mesh from chute
    const streamMat = new THREE.MeshStandardMaterial({
      color: '#F59E0B',
      roughness: 0.3,
    });
    const streamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.5, 12), streamMat);
    streamMesh.position.set(-0.2, 0.9, 3.2);
    streamMesh.rotation.z = -0.35;
    streamMesh.visible = false;
    group.add(streamMesh);

    // 3D Storybook house/tower blocks waiting to rise
    const buildGroup = new THREE.Group();
    buildGroup.position.set(-2.6, 0.16, 3.2);
    group.add(buildGroup);

    const blockDefs = [
      { pos: [-0.85, 0.45, 0], size: [1.1, 0.9, 1.4] },
      { pos: [0.85, 0.45, 0], size: [1.1, 0.9, 1.4] },
      { pos: [0, 1.35, 0], size: [2.8, 0.9, 1.4] },
      { pos: [0, 2.3, 0], size: [2.2, 1.0, 1.5], isRoof: true },
    ];
    const builtBlocks: { mesh: THREE.Mesh; targetY: number }[] = [];
    const blockMats: THREE.MeshStandardMaterial[] = [];

    blockDefs.forEach((b) => {
      const mat = new THREE.MeshStandardMaterial({ color: '#F59E0B', roughness: 0.45 });
      blockMats.push(mat);
      const geo = b.isRoof
        ? new THREE.ConeGeometry(1.75, 1.25, 4)
        : new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
      const mesh = new THREE.Mesh(geo, mat);
      if (b.isRoof) mesh.rotation.y = Math.PI / 4;
      mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
      mesh.scale.set(0.01, 0.01, 0.01);
      mesh.visible = false;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      buildGroup.add(mesh);
      builtBlocks.push({ mesh, targetY: b.pos[1] });
    });

    const maxPicks = ageMode === 'toddler' ? 1 : 2;
    let selectedColors: ColorOption['id'][] = [];
    let mixedColor: ColorOption | null = null;
    let phase: 'PICK' | 'SPINNING' | 'BUILDING' | 'DONE' = 'PICK';
    let spinTimer = 0;
    let buildProgress = 0;

    const emit = () => {
      let promptId =
        ageMode === 'toddler'
          ? 'Pilih 1 warna cat untuk dimasukkan ke Truk Molen!'
          : 'Pilih 2 warna untuk dicampur di dalam Truk Molen!';
      let promptEn =
        ageMode === 'toddler'
          ? 'Pick 1 paint color for the Cement Mixer!'
          : 'Pick 2 colors to mix inside the Cement Mixer!';

      if (phase === 'PICK' && selectedColors.length === maxPicks) {
        promptId = 'Tekan tombol Putar Molen agar adonan tercampur!';
        promptEn = 'Press Spin Mixer to mix the colors!';
      } else if (phase === 'SPINNING') {
        promptId = 'Molen sedang berputar mencampur warna...';
        promptEn = 'Spinning and mixing the colors...';
      } else if (phase === 'BUILDING' && mixedColor) {
        promptId = `Wah! Warna ${mixedColor.nameId} membangun rumah!`;
        promptEn = `Awesome! ${mixedColor.nameEn} is building the house!`;
      } else if (phase === 'DONE' && mixedColor) {
        promptId = `Rumah warna ${mixedColor.nameId} selesai!`;
        promptEn = `${mixedColor.nameEn} house is complete!`;
      }

      callbacks.onSnapshot({
        vehicleId: 'molen',
        phase,
        promptId,
        promptEn,
        selectedColors: [...selectedColors],
        mixedColor,
        structureProgress: buildProgress,
        completed: phase === 'DONE',
      });
    };

    emit();
    soundEngine.speakBilingual(
      ageMode === 'toddler'
        ? 'Truk Molen! Ayo pilih satu warna!'
        : 'Truk Molen! Ayo pilih dua warna untuk dicampur!',
      ageMode === 'toddler' ? 'Cement Mixer! Pick a color!' : 'Cement Mixer! Mix two colors!',
    );

    return {
      vehicleId: 'molen',
      group,
      raycastTargets,
      cameraPos: new THREE.Vector3(0.2, 5.4, 12.2),
      cameraTarget: new THREE.Vector3(-0.2, 1.3, 3.2),
      update: (dt, elapsed) => {
        if (phase === 'SPINNING') {
          spinTimer += dt;
          if (truck.drumGroup) truck.drumGroup.rotation.x += dt * 7.5;
          truck.bodyGroup.position.y = Math.abs(Math.sin(elapsed * 22)) * 0.05;
          if (spinTimer > 1.7) {
            phase = 'BUILDING';
            streamMesh.visible = true;
            if (mixedColor) {
              streamMat.color.set(mixedColor.hex);
              blockMats.forEach((m, i) => {
                m.color.set(mixedColor!.hex);
                if (i === blockMats.length - 1) m.color.offsetHSL(0, 0, -0.08);
              });
              if (truck.drumMaterial) {
                const oldMap = truck.drumMaterial.map;
                truck.drumMaterial.map = createMixerStripeTexture(mixedColor.hex, maxAnisotropy);
                truck.drumMaterial.needsUpdate = true;
                oldMap?.dispose();
              }
              soundEngine.playSuccessChime();
              soundEngine.speakBilingual(
                `Jadilah warna ${mixedColor.nameId}!`,
                `It's ${mixedColor.nameEn}!`,
              );
            }
            emit();
          }
        } else if (phase === 'BUILDING') {
          if (truck.drumGroup) truck.drumGroup.rotation.x += dt * 4.5;
          buildProgress = Math.min(1, buildProgress + dt * 0.45);
          builtBlocks.forEach((b, idx) => {
            const threshold = idx * 0.22;
            if (buildProgress > threshold) {
              b.mesh.visible = true;
              const localT = Math.min(1, (buildProgress - threshold) / 0.28);
              const s = THREE.MathUtils.damp(b.mesh.scale.x, localT, 9, dt);
              b.mesh.scale.set(s, s, s);
            }
          });
          if (buildProgress >= 1) {
            phase = 'DONE';
            streamMesh.visible = false;
            truck.bodyGroup.position.y = 0;
            emit();
            later(() => callbacks.onCelebrate('molen'), 600);
          }
        } else {
          if (truck.drumGroup) truck.drumGroup.rotation.x += dt * 0.6;
        }
      },
      handleRaycastHit: () => {},
      handleAction: (action, payload) => {
        if (action === 'PICK_COLOR' && phase === 'PICK') {
          const colorId = payload as ColorOption['id'];
          const opt = PRIMARY_COLORS.find((c) => c.id === colorId);
          if (!opt) return;
          soundEngine.playPop();
          soundEngine.speakBilingual(opt.nameId, opt.nameEn);
          if (selectedColors.length >= maxPicks) {
            selectedColors = [colorId];
          } else {
            selectedColors = [...selectedColors, colorId];
          }
          // Preview color tint on drum immediately
          if (truck.drumMaterial) {
            const previewHex =
              selectedColors.length === 1
                ? ALL_COLORS[selectedColors[0]].hex
                : mixTwoColors(selectedColors[0], selectedColors[1]).hex;
            const oldMap = truck.drumMaterial.map;
            truck.drumMaterial.map = createMixerStripeTexture(previewHex, maxAnisotropy);
            truck.drumMaterial.needsUpdate = true;
            oldMap?.dispose();
          }
          emit();
        } else if (action === 'CLEAR_COLORS' && phase === 'PICK') {
          selectedColors = [];
          soundEngine.playPop();
          emit();
        } else if (action === 'SPIN_MIXER' && phase === 'PICK' && selectedColors.length === maxPicks) {
          mixedColor =
            selectedColors.length === 1
              ? ALL_COLORS[selectedColors[0]]
              : mixTwoColors(selectedColors[0], selectedColors[1]);
          phase = 'SPINNING';
          spinTimer = 0;
          soundEngine.playMixerSpin();
          emit();
        }
      },
      dispose: disposeGroup,
    };
  }

  // =========================================================================
  // 2. TRUK ANGKUT (Cargo Truck — Choose Type, Load Items, Count to Drive)
  // =========================================================================
  if (vehicleId === 'angkut') {
    truck.root.position.set(-1.5, 0, 3.2);
    truck.root.rotation.y = 0;

    // Delivery barn archway down the right side of the road
    const barn = new THREE.Group();
    barn.position.set(11.5, 0, 3.2);
    const pillarMat = new THREE.MeshStandardMaterial({ color: '#EF4444', roughness: 0.55 });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#FACC15', roughness: 0.45 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 0.6), pillarMat);
    p1.position.set(0, 1.6, -2.2);
    const p2 = p1.clone();
    p2.position.z = 2.2;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 5.2), roofMat);
    beam.position.set(0, 3.4, 0);
    barn.add(p1, p2, beam);
    group.add(barn);

    const maxCargo = ageMode === 'toddler' ? 3 : 6;
    let cargoType: CargoTypeId = 'apple';
    let loadedCount = ageMode === 'toddler' ? 2 : 3;
    let phase: 'LOAD' | 'COUNT' | 'DRIVE' | 'DONE' = 'LOAD';
    let wrongKey = 0;
    let numberChoices: number[] = [];
    const cargoMeshes: THREE.Group[] = [];

    const rebuildCargoInBed = () => {
      if (!truck.cargoSlot) return;
      while (truck.cargoSlot.children.length > 0) {
        truck.cargoSlot.remove(truck.cargoSlot.children[0]);
      }
      cargoMeshes.length = 0;
      const slots: [number, number, number][] = [
        [-0.55, 0, -0.32],
        [0, 0, -0.32],
        [0.55, 0, -0.32],
        [-0.55, 0, 0.32],
        [0, 0, 0.32],
        [0.55, 0, 0.32],
      ];
      for (let i = 0; i < loadedCount; i++) {
        const prop = buildCargoProp(cargoType);
        const [sx, sy, sz] = slots[i % slots.length];
        prop.position.set(sx, sy + 0.05, sz);
        truck.cargoSlot.add(prop);
        cargoMeshes.push(prop);
      }
    };
    rebuildCargoInBed();

    const emit = () => {
      const cargoObj = CARGO_OPTIONS.find((c) => c.id === cargoType)!;
      let promptId = `Pilih barang & jumlahnya, lalu tekan Ayo Hitung!`;
      let promptEn = `Pick cargo & amount, then tap Let's Count!`;
      if (phase === 'COUNT') {
        promptId = `Ada berapa ${cargoObj.nameId} di bak truk? Hitung ya!`;
        promptEn = `How many ${cargoObj.nameEn} are in the truck?`;
      } else if (phase === 'DRIVE' || phase === 'DONE') {
        const nw = NUMBER_WORDS[loadedCount];
        promptId = `Benar! ${nw.id} ${cargoObj.nameId}! Truk melaju!`;
        promptEn = `Correct! ${nw.en} ${cargoObj.nameEn}! Off we go!`;
      }
      callbacks.onSnapshot({
        vehicleId: 'angkut',
        phase,
        promptId,
        promptEn,
        cargoType,
        loadedCount,
        targetCount: maxCargo,
        numberChoices,
        wrongFeedbackKey: wrongKey,
        completed: phase === 'DONE',
      });
    };

    emit();
    soundEngine.speakBilingual(
      'Truk Angkut! Pilih barang dan jumlahnya!',
      'Cargo Truck! Choose your cargo!',
    );

    return {
      vehicleId: 'angkut',
      group,
      raycastTargets,
      cameraPos: new THREE.Vector3(-0.2, 5.2, 11.4),
      cameraTarget: new THREE.Vector3(0.4, 1.2, 3.2),
      update: (dt, elapsed) => {
        if (phase === 'COUNT') {
          cargoMeshes.forEach((m, i) => {
            m.position.y = 0.05 + Math.abs(Math.sin(elapsed * 3.5 + i * 0.7)) * 0.08;
          });
        } else if (phase === 'DRIVE') {
          truck.root.position.x += dt * 6.8;
          truck.wheels.forEach((w) => {
            w.rotation.z -= dt * 11;
          });
          truck.bodyGroup.position.y = Math.abs(Math.sin(elapsed * 18)) * 0.04;
          if (truck.root.position.x >= 9.5) {
            phase = 'DONE';
            truck.bodyGroup.position.y = 0;
            emit();
            callbacks.onCelebrate('angkut');
          }
        }
      },
      handleRaycastHit: () => {},
      handleAction: (action, payload) => {
        if (action === 'SELECT_CARGO' && phase === 'LOAD') {
          const next = payload as CargoTypeId;
          cargoType = next;
          const info = CARGO_OPTIONS.find((c) => c.id === next)!;
          soundEngine.playPop();
          soundEngine.speakBilingual(info.nameId, info.nameEn);
          rebuildCargoInBed();
          emit();
        } else if (action === 'CHANGE_AMOUNT' && phase === 'LOAD') {
          const delta = payload as number;
          const next = THREE.MathUtils.clamp(loadedCount + delta, 1, maxCargo);
          if (next !== loadedCount) {
            loadedCount = next;
            const nw = NUMBER_WORDS[loadedCount];
            soundEngine.playPop();
            soundEngine.speakBilingual(nw.id, nw.en);
            rebuildCargoInBed();
            emit();
          }
        } else if (action === 'START_COUNT' && phase === 'LOAD') {
          phase = 'COUNT';
          numberChoices = makeNumberChoices(
            loadedCount,
            maxCargo,
            ageMode === 'toddler' ? 3 : 4,
          );
          const info = CARGO_OPTIONS.find((c) => c.id === cargoType)!;
          soundEngine.playPop();
          soundEngine.speakBilingual(
            `Ayo hitung! Ada berapa ${info.nameId} di bak truk?`,
            `Let's count! How many ${info.nameEn}?`,
          );
          emit();
        } else if (action === 'ANSWER_COUNT' && phase === 'COUNT') {
          const pick = payload as number;
          const nw = NUMBER_WORDS[pick];
          if (pick === loadedCount) {
            phase = 'DRIVE';
            soundEngine.playHorn('angkut');
            later(() => soundEngine.playEngineRev(), 260);
            soundEngine.speakBilingual(
              `Hebat! ${nw.id}! Truk berangkat!`,
              `Great! ${nw.en}! Truck is moving!`,
            );
            emit();
          } else {
            wrongKey += 1;
            soundEngine.playTryAgain();
            soundEngine.speakBilingual('Coba hitung lagi ya!', 'Try counting again!');
            emit();
          }
        }
      },
      dispose: () => {
        if (truck.cargoSlot) {
          while (truck.cargoSlot.children.length > 0) {
            truck.cargoSlot.remove(truck.cargoSlot.children[0]);
          }
        }
        disposeGroup();
      },
    };
  }

  // =========================================================================
  // 3. TRUK TANGKI (Water Tanker — 3D Pipe Puzzle & Tank Fill)
  // =========================================================================
  if (vehicleId === 'tangki') {
    truck.root.position.set(3.2, 0, 3.2);
    truck.root.rotation.y = 0;
    if (truck.waterFillMesh) truck.waterFillMesh.scale.y = 0.05;

    const rows = ageMode === 'toddler' ? 1 : 2;
    const cols = 3;
    const tileSize = 1.56;
    const boardOriginX = -3.6;
    const boardOriginZ = rows === 1 ? 3.2 : 2.5;

    // 3D City Water Hydrant on left inlet (row 0, col -1)
    const hydrant = new THREE.Group();
    hydrant.position.set(boardOriginX - tileSize, 0, boardOriginZ);
    const hydMat = new THREE.MeshStandardMaterial({ color: '#0284C7', roughness: 0.35, metalness: 0.3 });
    const hBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.25, 16), hydMat);
    hBody.position.y = 0.625;
    hBody.castShadow = true;
    const hCap = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), hydMat);
    hCap.position.y = 1.25;
    const hSpout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.55, 12),
      new THREE.MeshStandardMaterial({ color: '#38BDF8', roughness: 0.25 }),
    );
    hSpout.rotation.z = Math.PI / 2;
    hSpout.position.set(0.38, 0.38, 0);
    hydrant.add(hBody, hCap, hSpout);
    group.add(hydrant);

    // Connector hose from last pipe tile into truck rear
    const outRow = rows === 1 ? 0 : 1;
    const inletPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 1.85, 12),
      new THREE.MeshStandardMaterial({ color: '#64748B', roughness: 0.4, metalness: 0.5 }),
    );
    inletPipe.rotation.z = Math.PI / 2;
    inletPipe.position.set(boardOriginX + cols * tileSize - 0.15, 0.38, boardOriginZ + outRow * tileSize);
    group.add(inletPipe);

    // Build solvable pipe puzzle layout:
    // Toddler (1x3): 3 straight pipes: [straight, straight, straight] — start 1 or 2 rotated!
    // Preschool (2x3): Path goes (0,0) straight -> (0,1) elbow(down-left=rot2) -> (1,1) elbow(top-right=rot0) -> (1,2) straight
    const pipeSpecs: { row: number; col: number; type: 'straight' | 'elbow'; startRot: number }[] =
      rows === 1
        ? [
            { row: 0, col: 0, type: 'straight', startRot: 1 },
            { row: 0, col: 1, type: 'straight', startRot: 0 },
            { row: 0, col: 2, type: 'straight', startRot: 1 },
          ]
        : [
            { row: 0, col: 0, type: 'straight', startRot: 1 },
            { row: 0, col: 1, type: 'elbow', startRot: 0 }, // needs rot 2 (bottom+left: [2,3])
            { row: 0, col: 2, type: 'elbow', startRot: 1 },
            { row: 1, col: 0, type: 'elbow', startRot: 2 },
            { row: 1, col: 1, type: 'elbow', startRot: 3 }, // needs rot 0 (top+right: [0,1])
            { row: 1, col: 2, type: 'straight', startRot: 1 },
          ];

    const pipeStates: PipeTileState[] = [];
    const pipeVisuals: {
      group: THREE.Group;
      pipeMat: THREE.MeshStandardMaterial;
      baseMat: THREE.MeshStandardMaterial;
      targetAngle: number;
    }[] = [];

    pipeSpecs.forEach((spec, idx) => {
      const state: PipeTileState = {
        index: idx,
        row: spec.row,
        col: spec.col,
        type: spec.type,
        rotation: spec.startRot,
        connected: false,
      };
      pipeStates.push(state);

      const vis = buildPipeMesh(spec.type, idx);
      vis.group.position.set(
        boardOriginX + spec.col * tileSize,
        0.04,
        boardOriginZ + spec.row * tileSize,
      );
      const startAngle = -spec.startRot * (Math.PI / 2);
      vis.group.rotation.y = startAngle;
      group.add(vis.group);
      raycastTargets.push(vis.group);
      pipeVisuals.push({ ...vis, targetAngle: startAngle });
    });

    let phase: 'PUZZLE' | 'FILLING' | 'DRIVE' | 'DONE' = 'PUZZLE';
    let tankFill = 0;

    // BFS from Hydrant entering (0,0) via Left port (dir 3) to exit (outRow, cols-1) via Right port (dir 1)
    const evaluatePipes = (): boolean => {
      pipeStates.forEach((p) => {
        p.connected = false;
      });
      const getTile = (r: number, c: number) =>
        pipeStates.find((p) => p.row === r && p.col === c);

      const startTile = getTile(0, 0);
      let reachesTank = false;

      if (startTile && getPipePorts(startTile.type, startTile.rotation).includes(3)) {
        const queue: PipeTileState[] = [startTile];
        startTile.connected = true;
        const dirs = [
          { d: 0, dr: -1, dc: 0, opp: 2 },
          { d: 1, dr: 0, dc: 1, opp: 3 },
          { d: 2, dr: 1, dc: 0, opp: 0 },
          { d: 3, dr: 0, dc: -1, opp: 1 },
        ];

        while (queue.length > 0) {
          const curr = queue.shift()!;
          const ports = getPipePorts(curr.type, curr.rotation);
          if (curr.row === outRow && curr.col === cols - 1 && ports.includes(1)) {
            reachesTank = true;
          }
          for (const dir of dirs) {
            if (!ports.includes(dir.d)) continue;
            const nxt = getTile(curr.row + dir.dr, curr.col + dir.dc);
            if (!nxt || nxt.connected) continue;
            if (getPipePorts(nxt.type, nxt.rotation).includes(dir.opp)) {
              nxt.connected = true;
              queue.push(nxt);
            }
          }
        }
      }

      pipeStates.forEach((p, i) => {
        pipeVisuals[i].pipeMat.color.set(p.connected ? '#38BDF8' : '#94A3B8');
        pipeVisuals[i].pipeMat.emissive.set(p.connected ? '#0284C7' : '#000000');
        pipeVisuals[i].pipeMat.emissiveIntensity = p.connected ? 0.35 : 0;
        pipeVisuals[i].baseMat.color.set(p.connected ? '#BAE6FD' : '#E2E8F0');
      });

      return reachesTank;
    };

    evaluatePipes();

    const emit = () => {
      let promptId = 'Ketuk pipa 3D untuk memutarnya agar air mengalir ke tangki!';
      let promptEn = 'Tap the 3D pipes to rotate and connect water to the tank!';
      if (phase === 'FILLING') {
        promptId = `Air mengalir! Mengisi tangki ${Math.round(tankFill * 100)}%...`;
        promptEn = `Water flowing! Filling tank ${Math.round(tankFill * 100)}%...`;
      } else if (phase === 'DRIVE' || phase === 'DONE') {
        promptId = 'Tangki Penuh! Truk Tangki siap jalan!';
        promptEn = 'Tank Full! Water Tanker is rolling!';
      }
      callbacks.onSnapshot({
        vehicleId: 'tangki',
        phase,
        promptId,
        promptEn,
        pipes: pipeStates.map((p) => ({ ...p })),
        pipeCols: cols,
        pipeRows: rows,
        tankFill,
        completed: phase === 'DONE',
      });
    };

    emit();
    soundEngine.speakBilingual(
      'Truk Tangki! Ayo putar pipa air sampai tersambung!',
      'Water Tanker! Connect the water pipes!',
    );

    const rotatePipe = (idx: number) => {
      if (phase !== 'PUZZLE') return;
      const p = pipeStates[idx];
      if (!p) return;
      p.rotation = (p.rotation + 1) % 4;
      pipeVisuals[idx].targetAngle -= Math.PI / 2;
      soundEngine.playPipeClick();
      const solved = evaluatePipes();
      if (solved) {
        phase = 'FILLING';
        soundEngine.playWaterSplash();
        soundEngine.speakBilingual('Pipa tersambung! Air mengalir!', 'Connected! Water is flowing!');
      }
      emit();
    };

    return {
      vehicleId: 'tangki',
      group,
      raycastTargets,
      cameraPos: new THREE.Vector3(-0.2, 6.8, 11.4),
      cameraTarget: new THREE.Vector3(-0.2, 1.0, 3.2),
      update: (dt, elapsed) => {
        pipeVisuals.forEach((pv) => {
          pv.group.rotation.y = THREE.MathUtils.damp(pv.group.rotation.y, pv.targetAngle, 12, dt);
        });
        if (phase === 'FILLING') {
          tankFill = Math.min(1, tankFill + dt * 0.42);
          if (truck.waterFillMesh) {
            truck.waterFillMesh.scale.y = Math.max(0.05, tankFill);
          }
          if (Math.random() < dt * 2.5) soundEngine.playWaterSplash();
          if (tankFill >= 1) {
            phase = 'DRIVE';
            soundEngine.playHorn('tangki');
            soundEngine.speakBilingual('Tangki Penuh! Berangkat!', 'Tank Full! Let us go!');
            emit();
          } else {
            emit();
          }
        } else if (phase === 'DRIVE') {
          truck.root.position.x += dt * 5.8;
          truck.wheels.forEach((w) => {
            w.rotation.z -= dt * 10;
          });
          truck.bodyGroup.position.y = Math.abs(Math.sin(elapsed * 16)) * 0.035;
          if (truck.root.position.x >= 10.5) {
            phase = 'DONE';
            truck.bodyGroup.position.y = 0;
            emit();
            callbacks.onCelebrate('tangki');
          }
        }
      },
      handleRaycastHit: (hitObj) => {
        if (typeof hitObj.userData.pipeIndex === 'number') {
          rotatePipe(hitObj.userData.pipeIndex);
        }
      },
      handleAction: (action, payload) => {
        if (action === 'ROTATE_PIPE' && typeof payload === 'number') {
          rotatePipe(payload);
        }
      },
      dispose: disposeGroup,
    };
  }

  // =========================================================================
  // 4. TRUK CRANE (Crane Truck — Count Crates First, Then Balance on Platform)
  // =========================================================================
  if (vehicleId === 'crane') {
    truck.root.position.set(2.4, 0, 3.2);
    truck.root.rotation.y = 0;

    const maxCount = ageMode === 'toddler' ? 3 : 5;
    const countTarget =
      ageMode === 'toddler'
        ? 1 + Math.floor(Math.random() * 3)
        : 2 + Math.floor(Math.random() * 4);
    const numberChoices = makeNumberChoices(countTarget, maxCount, ageMode === 'toddler' ? 3 : 4);
    const tolerance = ageMode === 'toddler' ? 0.36 : 0.22;
    const totalDrops = ageMode === 'toddler' ? 1 : 2;

    // Counting crates displayed neatly in front-left for Phase 1
    const countGroup = new THREE.Group();
    countGroup.position.set(-2.5, 0, 3.2);
    group.add(countGroup);

    const crateGeo = new THREE.BoxGeometry(0.76, 0.76, 0.76);
    const crateMat = new THREE.MeshStandardMaterial({ color: '#F97316', roughness: 0.55 });
    const countCrates: THREE.Mesh[] = [];
    for (let i = 0; i < countTarget; i++) {
      const c = new THREE.Mesh(crateGeo, crateMat);
      const col = i % 3;
      const row = Math.floor(i / 3);
      c.position.set((col - 1) * 0.96, 0.38 + row * 0.82, 0);
      c.castShadow = true;
      c.receiveShadow = true;
      countGroup.add(c);
      countCrates.push(c);
    }

    // Balance Seesaw Platform (visible in Phase 2)
    const platformRoot = new THREE.Group();
    platformRoot.position.set(-2.4, 0, 3.2);
    platformRoot.visible = false;
    group.add(platformRoot);

    const fulcrum = new THREE.Mesh(
      new THREE.ConeGeometry(0.65, 1.05, 4),
      new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.6 }),
    );
    fulcrum.position.y = 0.525;
    fulcrum.rotation.y = Math.PI / 4;
    fulcrum.castShadow = true;
    platformRoot.add(fulcrum);

    const plankPivot = new THREE.Group();
    plankPivot.position.y = 1.08;
    platformRoot.add(plankPivot);

    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.22, 1.5),
      new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.65 }),
    );
    plank.castShadow = true;
    plank.receiveShadow = true;
    plankPivot.add(plank);

    // Glowing Green Balance Target Zone in center of plank
    const zoneMat = new THREE.MeshStandardMaterial({
      color: '#22C55E',
      emissive: '#16A34A',
      emissiveIntensity: 0.4,
      roughness: 0.35,
    });
    const zoneWidth = tolerance * 3.4;
    const centerZone = new THREE.Mesh(new THREE.BoxGeometry(zoneWidth, 0.24, 1.54), zoneMat);
    plankPivot.add(centerZone);

    // Suspended load crate hanging beneath the crane hook
    const hangingCrate = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.86, 0.86),
      new THREE.MeshStandardMaterial({ color: '#3B82F6', roughness: 0.42 }),
    );
    hangingCrate.position.set(0, -0.68, 0);
    hangingCrate.castShadow = true;
    hangingCrate.visible = false;
    if (truck.hookGroup) {
      truck.hookGroup.add(hangingCrate);
    }

    const landedCrates: THREE.Mesh[] = [];

    let phase: 'COUNT' | 'BALANCE' | 'DROPPING' | 'WOBBLE' | 'DONE' = 'COUNT';
    let boomOffset = ageMode === 'toddler' ? 0.55 : -0.65; // -1..1 relative to platform center
    let cableLength = 1.2;
    let targetCableLength = 1.2;
    let plankTilt = 0;
    let targetPlankTilt = 0;
    let droppedCount = 0;
    let wrongKey = 0;

    const emit = () => {
      let promptId = 'Hitung dulu jumlah peti agar Truk Crane menyala!';
      let promptEn = 'Count the crates first to start the Crane Truck!';
      if (phase === 'BALANCE') {
        const isAligned = Math.abs(boomOffset) <= tolerance;
        promptId = isAligned
          ? 'Tepat di tengah! Tekan Turunkan Beban!'
          : 'Geser Kiri atau Kanan ke zona hijau agar seimbang!';
        promptEn = isAligned
          ? 'Right in the middle! Press Drop Load!'
          : 'Move Left or Right into the green zone to balance!';
      } else if (phase === 'WOBBLE') {
        promptId = 'Wah miring! Geser lebih dekat ke tengah ya!';
        promptEn = 'Oops, tilted! Move closer to the center!';
      } else if (phase === 'DONE') {
        promptId = 'Beban seimbang sempurna! Hebat!';
        promptEn = 'Perfectly balanced! Awesome!';
      }

      callbacks.onSnapshot({
        vehicleId: 'crane',
        phase,
        promptId,
        promptEn,
        craneCountTarget: countTarget,
        craneCountChoices: numberChoices,
        craneBoomOffset: boomOffset,
        craneTolerance: tolerance,
        craneBalanced: Math.abs(boomOffset) <= tolerance,
        craneDroppedCount: droppedCount,
        craneTotalDrops: totalDrops,
        wrongFeedbackKey: wrongKey,
        completed: phase === 'DONE',
      });
    };

    emit();
    soundEngine.speakBilingual(
      'Truk Crane! Hitung dulu petinya sebelum mengangkat!',
      'Crane Truck! Count the crates first!',
    );

    return {
      vehicleId: 'crane',
      group,
      raycastTargets,
      cameraPos: new THREE.Vector3(0.0, 5.8, 12.2),
      cameraTarget: new THREE.Vector3(-0.3, 1.8, 3.2),
      update: (dt, elapsed) => {
        if (phase === 'COUNT') {
          countCrates.forEach((c, i) => {
            c.rotation.y = Math.sin(elapsed * 2 + i) * 0.08;
          });
        } else {
          // Move crane truck gently along X so hook tracks platform center + boomOffset*1.65
          const desiredTruckX = 2.4 + boomOffset * 1.65;
          truck.root.position.x = THREE.MathUtils.damp(truck.root.position.x, desiredTruckX, 7, dt);

          cableLength = THREE.MathUtils.damp(cableLength, targetCableLength, 7, dt);
          if (truck.cableMesh && truck.hookGroup) {
            truck.cableMesh.scale.y = cableLength;
            truck.hookGroup.position.y = 2.55 - cableLength;
          }

          plankTilt = THREE.MathUtils.damp(plankTilt, targetPlankTilt, 8, dt);
          plankPivot.rotation.z = plankTilt;
        }
      },
      handleRaycastHit: () => {},
      handleAction: (action, payload) => {
        if (action === 'CRANE_COUNT' && phase === 'COUNT') {
          const pick = payload as number;
          const nw = NUMBER_WORDS[pick];
          if (pick === countTarget) {
            phase = 'BALANCE';
            countGroup.visible = false;
            platformRoot.visible = true;
            hangingCrate.visible = true;
            soundEngine.playHorn('crane');
            soundEngine.speakBilingual(
              `Benar, ${nw.id}! Sekarang seimbangkan beban di zona hijau!`,
              `Correct, ${nw.en}! Now balance the load in the green zone!`,
            );
            emit();
          } else {
            wrongKey += 1;
            soundEngine.playTryAgain();
            soundEngine.speakBilingual('Coba hitung lagi ya!', 'Try counting again!');
            emit();
          }
        } else if (action === 'CRANE_MOVE' && phase === 'BALANCE') {
          const dir = payload as number; // -1 or +1
          boomOffset = THREE.MathUtils.clamp(boomOffset + dir * 0.18, -0.95, 0.95);
          soundEngine.playCraneMove();
          emit();
        } else if (action === 'CRANE_DROP' && phase === 'BALANCE') {
          phase = 'DROPPING';
          targetCableLength = 2.08 - droppedCount * 0.86;
          soundEngine.playCraneMove();
          emit();

          later(() => {
            if (Math.abs(boomOffset) <= tolerance) {
              // Balanced! Place crate onto plank
              droppedCount += 1;
              const placed = new THREE.Mesh(
                new THREE.BoxGeometry(0.86, 0.86, 0.86),
                new THREE.MeshStandardMaterial({
                  color: droppedCount === 1 ? '#3B82F6' : '#10B981',
                  roughness: 0.42,
                }),
              );
              placed.position.set(boomOffset * 1.1, 0.54 + (droppedCount - 1) * 0.86, 0);
              placed.castShadow = true;
              plankPivot.add(placed);
              landedCrates.push(placed);
              targetPlankTilt = -boomOffset * 0.12;
              soundEngine.playSuccessChime();

              if (droppedCount >= totalDrops) {
                hangingCrate.visible = false;
                targetCableLength = 1.1;
                phase = 'DONE';
                soundEngine.speakBilingual('Seimbang! Hebat sekali!', 'Balanced! Great job!');
                emit();
                later(() => callbacks.onCelebrate('crane'), 750);
              } else {
                // Hoist up for next crate
                targetCableLength = 1.1;
                boomOffset = 0.68;
                phase = 'BALANCE';
                soundEngine.speakBilingual('Bagus! Satu peti lagi!', 'Nice! One more crate!');
                emit();
              }
            } else {
              // Tilted! Gentle friendly recovery
              phase = 'WOBBLE';
              targetPlankTilt = boomOffset > 0 ? -0.34 : 0.34;
              soundEngine.playTryAgain();
              soundEngine.speakBilingual(
                'Wah miring! Geser ke zona hijau ya!',
                'Oops tilted! Move to the green zone!',
              );
              emit();
              later(() => {
                targetCableLength = 1.2;
                targetPlankTilt = 0;
                phase = 'BALANCE';
                emit();
              }, 900);
            }
          }, 550);
        }
      },
      dispose: () => {
        if (truck.hookGroup) {
          truck.hookGroup.remove(hangingCrate);
        }
        hangingCrate.geometry.dispose();
        (hangingCrate.material as THREE.Material).dispose();
        disposeGroup();
      },
    };
  }

  // =========================================================================
  // 5. TRUK PEMADAM (Fire Truck — Pick Letter to Roll Out, Then Spray Fires!)
  // =========================================================================
  if (vehicleId === 'pemadam') {
    truck.root.position.set(-5.8, 0, 3.2);
    truck.root.rotation.y = 0;

    const pool = ageMode === 'toddler' ? LETTERS_TODDLER : LETTERS_PRESCHOOL;
    const targetLetter: LetterEntry = pool[Math.floor(Math.random() * pool.length)];
    const choiceCount = ageMode === 'toddler' ? 2 : 4;
    const letterSet = new Set<LetterEntry>([targetLetter]);
    while (letterSet.size < choiceCount) {
      letterSet.add(pool[Math.floor(Math.random() * pool.length)]);
    }
    const letterChoices = Array.from(letterSet).sort((a, b) => a.letter.localeCompare(b.letter));

    // Giant 3D Letter Emergency Billboard near fire truck
    const signTex = createSignTexture(
      targetLetter.letter,
      `${targetLetter.wordId} / ${targetLetter.wordEn}`,
      '#DC2626',
      '#FFFFFF',
      maxAnisotropy,
    );
    const signGroup = new THREE.Group();
    signGroup.position.set(-1.2, 0, 0.2);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 2.2, 10),
      new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.6 }),
    );
    post.position.y = 1.1;
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.4, 0.18),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 }),
    );
    board.position.y = 2.8;
    board.castShadow = true;
    signGroup.add(post, board);
    group.add(signGroup);

    // Storybook Building with Animated 3D Flame Clusters on the right
    const building = new THREE.Group();
    building.position.set(3.2, 0, -0.4);
    const bWall = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 3.4, 2.8),
      new THREE.MeshStandardMaterial({ color: '#FEF3C7', roughness: 0.78 }),
    );
    bWall.position.y = 1.7;
    bWall.castShadow = true;
    bWall.receiveShadow = true;
    const bRoof = new THREE.Mesh(
      new THREE.ConeGeometry(3.4, 1.8, 4),
      new THREE.MeshStandardMaterial({ color: '#EA580C', roughness: 0.55 }),
    );
    bRoof.position.y = 4.3;
    bRoof.rotation.y = Math.PI / 4;
    bRoof.castShadow = true;
    building.add(bWall, bRoof);

    // Windows & door
    const wMat = new THREE.MeshStandardMaterial({ color: '#7DD3FC', roughness: 0.2 });
    const dMat = new THREE.MeshStandardMaterial({ color: '#92400E', roughness: 0.7 });
    const bDoor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.35, 0.12), dMat);
    bDoor.position.set(0, 0.68, 1.42);
    const winL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.12), wMat);
    winL.position.set(-1.3, 2.2, 1.42);
    const winR = winL.clone();
    winR.position.x = 1.3;
    building.add(bDoor, winL, winR);
    group.add(building);

    // Flame clusters
    const flamePositions: THREE.Vector3[] =
      ageMode === 'toddler'
        ? [
            new THREE.Vector3(1.9, 2.1, 1.15),
            new THREE.Vector3(3.2, 3.9, 0.9),
            new THREE.Vector3(4.5, 2.1, 1.15),
          ]
        : [
            new THREE.Vector3(1.9, 2.1, 1.15),
            new THREE.Vector3(3.2, 4.1, 0.8),
            new THREE.Vector3(4.5, 2.1, 1.15),
            new THREE.Vector3(3.2, 0.95, 1.25),
          ];

    const flames: {
      index: number;
      group: THREE.Group;
      outer: THREE.Mesh;
      inner: THREE.Mesh;
      steam: THREE.Mesh;
      alive: boolean;
      hp: number;
    }[] = [];

    flamePositions.forEach((pos, idx) => {
      const fg = new THREE.Group();
      fg.position.copy(pos);

      const outer = new THREE.Mesh(
        new THREE.ConeGeometry(0.52, 1.25, 10),
        new THREE.MeshStandardMaterial({
          color: '#F97316',
          emissive: '#EA580C',
          emissiveIntensity: 0.65,
          roughness: 0.4,
        }),
      );
      outer.position.y = 0.5;
      fg.add(outer);

      const inner = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.78, 8),
        new THREE.MeshStandardMaterial({
          color: '#FEF08A',
          emissive: '#FACC15',
          emissiveIntensity: 0.8,
          roughness: 0.3,
        }),
      );
      inner.position.y = 0.38;
      fg.add(inner);

      const steam = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 10, 8),
        new THREE.MeshStandardMaterial({
          color: '#FFFFFF',
          transparent: true,
          opacity: 0.0,
          roughness: 0.9,
        }),
      );
      steam.position.y = 0.6;
      fg.add(steam);

      // Generous clickable raycast sphere
      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hit.position.y = 0.5;
      hit.userData.flameIndex = idx;
      fg.add(hit);
      fg.traverse((o) => {
        o.userData.flameIndex = idx;
      });

      group.add(fg);
      raycastTargets.push(fg);
      flames.push({ index: idx, group: fg, outer, inner, steam, alive: true, hp: 1 });
    });

    // Water jet stream (curved arc of 14 glowing water droplets)
    const waterJetGroup = new THREE.Group();
    const jetDrops: THREE.Mesh[] = [];
    const dropGeo = new THREE.SphereGeometry(0.16, 10, 8);
    const dropMat = new THREE.MeshStandardMaterial({
      color: '#38BDF8',
      emissive: '#0EA5E9',
      emissiveIntensity: 0.45,
      roughness: 0.15,
    });
    for (let i = 0; i < 14; i++) {
      const d = new THREE.Mesh(dropGeo, dropMat);
      waterJetGroup.add(d);
      jetDrops.push(d);
    }
    waterJetGroup.visible = false;
    group.add(waterJetGroup);

    let phase: 'LETTER' | 'DRIVE' | 'SPRAY' | 'DONE' = 'LETTER';
    let wrongKey = 0;
    let activeSprayTarget: number | null = null;
    let sprayTimer = 0;
    const _nozzleWorld = new THREE.Vector3();

    const emit = () => {
      const remaining = flames.filter((f) => f.alive).map((f) => f.index);
      let promptId = `Cari huruf ${targetLetter.letter}! (${targetLetter.letter} untuk ${targetLetter.wordId})`;
      let promptEn = `Find letter ${targetLetter.letter}! (${targetLetter.letter} for ${targetLetter.wordEn})`;
      if (phase === 'DRIVE') {
        promptId = 'Wiu-wiu! Truk Pemadam melaju ke lokasi api!';
        promptEn = 'Wee-woo! Fire Truck rushing to the fire!';
      } else if (phase === 'SPRAY') {
        promptId = `Ketuk api di rumah 3D untuk menyemprotkan air! (${remaining.length} api tersisa)`;
        promptEn = `Tap the 3D flames to spray water! (${remaining.length} left)`;
      } else if (phase === 'DONE') {
        promptId = 'Semua api padam! Pahlawan pemadam hebat!';
        promptEn = 'All fires are out! Hero firefighter!';
      }

      callbacks.onSnapshot({
        vehicleId: 'pemadam',
        phase,
        promptId,
        promptEn,
        targetLetter,
        letterChoices,
        flamesRemaining: remaining,
        totalFlames: flames.length,
        wrongFeedbackKey: wrongKey,
        completed: phase === 'DONE',
      });
    };

    emit();
    soundEngine.speakBilingual(
      `Truk Pemadam! Cari huruf ${targetLetter.letter}! ${targetLetter.letter} untuk ${targetLetter.wordId}!`,
      `Fire Truck! Find letter ${targetLetter.letter}! ${targetLetter.letter} for ${targetLetter.wordEn}!`,
    );

    const sprayFlame = (idx: number) => {
      if (phase !== 'SPRAY') return;
      const f = flames[idx];
      if (!f || !f.alive) return;
      activeSprayTarget = idx;
      sprayTimer = 0.65;
      waterJetGroup.visible = true;
      soundEngine.playWaterSplash();
      f.alive = false;
      f.outer.visible = false;
      f.inner.visible = false;
      (f.steam.material as THREE.MeshStandardMaterial).opacity = 0.9;
      f.steam.position.y = 0.6;
      f.steam.scale.set(1, 1, 1);

      const leftCount = flames.filter((fl) => fl.alive).length;
      if (leftCount === 0) {
        phase = 'DONE';
        soundEngine.playSuccessChime();
        soundEngine.speakBilingual('Api padam semua! Hebat!', 'All fires out! Great job!');
        emit();
        later(() => callbacks.onCelebrate('pemadam'), 850);
      } else {
        soundEngine.speakBilingual('Padam! Semprot api lainnya!', 'Out! Spray the next fire!');
        emit();
      }
    };

    return {
      vehicleId: 'pemadam',
      group,
      raycastTargets,
      cameraPos: new THREE.Vector3(0.4, 5.4, 12.6),
      cameraTarget: new THREE.Vector3(0.4, 1.9, 1.5),
      update: (dt, elapsed) => {
        // Animate live flames flickering & steam rising
        flames.forEach((f, idx) => {
          if (f.alive) {
            const flicker = 0.88 + Math.sin(elapsed * 14 + idx * 2.1) * 0.16;
            f.outer.scale.set(flicker, 0.92 + Math.cos(elapsed * 16 + idx) * 0.18, flicker);
            f.inner.scale.set(flicker, 0.95 + Math.sin(elapsed * 19 + idx) * 0.15, flicker);
          } else {
            const mat = f.steam.material as THREE.MeshStandardMaterial;
            if (mat.opacity > 0.01) {
              mat.opacity = Math.max(0, mat.opacity - dt * 1.1);
              f.steam.position.y += dt * 1.3;
              f.steam.scale.addScalar(dt * 0.6);
            }
          }
        });

        // Strobe roof beacons once active
        if (phase !== 'LETTER' && truck.sirenLeftMat && truck.sirenRightMat) {
          const toggle = Math.sin(elapsed * 18) > 0;
          truck.sirenLeftMat.emissiveIntensity = toggle ? 2.2 : 0.15;
          truck.sirenRightMat.emissiveIntensity = toggle ? 0.15 : 2.2;
        }

        if (phase === 'DRIVE') {
          truck.root.position.x = THREE.MathUtils.damp(truck.root.position.x, 0.2, 4.2, dt);
          truck.wheels.forEach((w) => {
            w.rotation.z -= dt * 10;
          });
          if (Math.abs(truck.root.position.x - 0.2) < 0.18) {
            phase = 'SPRAY';
            signGroup.visible = false;
            soundEngine.speakBilingual(
              'Arahkan selang! Ketuk apinya untuk memadamkan!',
              'Aim the hose! Tap the flames to spray water!',
            );
            emit();
          }
        }

        // Update 3D arcing water jet drops
        if (sprayTimer > 0 && activeSprayTarget !== null) {
          sprayTimer -= dt;
          if (truck.nozzleGroup) {
            truck.nozzleGroup.getWorldPosition(_nozzleWorld);
            const targetPos = flamePositions[activeSprayTarget];
            truck.nozzleGroup.lookAt(targetPos);

            jetDrops.forEach((drop, i) => {
              const t = ((i / jetDrops.length) + (elapsed * 3.8)) % 1;
              drop.position.lerpVectors(_nozzleWorld, targetPos, t);
              drop.position.y += Math.sin(t * Math.PI) * 1.1;
              const s = 0.7 + Math.sin(t * Math.PI) * 0.7;
              drop.scale.set(s, s, s);
            });
          }
          if (sprayTimer <= 0) {
            waterJetGroup.visible = false;
          }
        }
      },
      handleRaycastHit: (hitObj) => {
        if (typeof hitObj.userData.flameIndex === 'number') {
          sprayFlame(hitObj.userData.flameIndex);
        }
      },
      handleAction: (action, payload) => {
        if (action === 'PICK_LETTER' && phase === 'LETTER') {
          const picked = payload as string;
          if (picked === targetLetter.letter) {
            phase = 'DRIVE';
            soundEngine.playSirenBurst();
            soundEngine.speakBilingual(
              `Benar! Huruf ${targetLetter.letter}! Truk Pemadam meluncur!`,
              `Correct! Letter ${targetLetter.letter}! Fire Truck on the way!`,
            );
            emit();
          } else {
            wrongKey += 1;
            soundEngine.playTryAgain();
            soundEngine.speakBilingual(
              `Cari huruf ${targetLetter.letter} ya!`,
              `Find letter ${targetLetter.letter}!`,
            );
            emit();
          }
        } else if (action === 'SPRAY_FLAME' && typeof payload === 'number') {
          sprayFlame(payload);
        }
      },
      dispose: () => {
        signTex.dispose();
        disposeGroup();
      },
    };
  }

  // =========================================================================
  // 6. TRUK SAMPAH (Garbage Truck — Sort Organic/Non-Organic & Count)
  // =========================================================================
  truck.root.position.set(3.1, 0, 3.2);
  truck.root.rotation.y = 0;

  const orgBinGroup = new THREE.Group();
  orgBinGroup.position.set(-3.2, 0, 1.3);
  const nonOrgBinGroup = new THREE.Group();
  nonOrgBinGroup.position.set(-0.6, 0, 1.3);

  const makeBin = (
    targetGroup: THREE.Group,
    colorHex: string,
    labelBig: string,
    labelSub: string,
    category: WasteCategory,
  ) => {
    const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.45 });
    const lidMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.6 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.65, 1.25), bodyMat);
    body.position.y = 0.825;
    body.castShadow = true;
    body.receiveShadow = true;
    targetGroup.add(body);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.2, 1.35), lidMat);
    lid.position.y = 1.72;
    targetGroup.add(lid);

    const signTex = createSignTexture(labelBig, labelSub, colorHex, '#FFFFFF', maxAnisotropy);
    const labelPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 1.18),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 }),
    );
    labelPlane.position.set(0, 0.86, 0.64);
    targetGroup.add(labelPlane);

    const hit = new THREE.Mesh(
      new THREE.BoxGeometry(1.7, 2.0, 1.5),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hit.position.y = 1.0;
    hit.userData.binCategory = category;
    targetGroup.add(hit);
    targetGroup.traverse((o) => {
      o.userData.binCategory = category;
    });

    group.add(targetGroup);
    raycastTargets.push(targetGroup);
    return signTex;
  };

  const orgTex = makeBin(orgBinGroup, '#16A34A', 'ORG', 'Organik', 'organic');
  const nonOrgTex = makeBin(nonOrgBinGroup, '#EAB308', 'NON', 'Non-Organik', 'non-organic');

  // Generate balanced list of waste items
  const organics = WASTE_CATALOG.filter((w) => w.category === 'organic');
  const nonOrganics = WASTE_CATALOG.filter((w) => w.category === 'non-organic');
  const itemPool =
    ageMode === 'toddler'
      ? [organics[0], nonOrganics[0], organics[1], nonOrganics[1]]
      : [organics[0], nonOrganics[0], organics[1], nonOrganics[1], organics[2], nonOrganics[2]];

  const wasteItems: WasteItemDef[] = itemPool.map((w, idx) => ({
    ...w,
    uid: idx,
    sorted: false,
  }));

  const wasteVisuals: { uid: number; mesh: THREE.Group; targetPos: THREE.Vector3 }[] = [];
  wasteItems.forEach((item, idx) => {
    const m = buildWasteProp(item.kind);
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const px = -3.4 + col * 1.45;
    const pz = 3.5 + row * 1.15;
    m.position.set(px, 0.06, pz);
    m.scale.set(1.35, 1.35, 1.35);

    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 8, 8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hit.position.y = 0.3;
    m.add(hit);
    m.traverse((o) => {
      o.userData.wasteUid = item.uid;
    });
    group.add(m);
    raycastTargets.push(m);
    wasteVisuals.push({ uid: item.uid, mesh: m, targetPos: new THREE.Vector3(px, 0.06, pz) });
  });

  let selectedWasteUid: number | null = wasteItems[0].uid;
  let organicCount = 0;
  let nonOrganicCount = 0;
  let phase: 'SORT' | 'COUNT' | 'DRIVE' | 'DONE' = 'SORT';
  const wasteCountCategory: WasteCategory = Math.random() > 0.5 ? 'organic' : 'non-organic';
  let wasteCountChoices: number[] = [];
  let wrongKey = 0;

  const emit = () => {
    const selectedItem = wasteItems.find((w) => w.uid === selectedWasteUid && !w.sorted);
    let promptId = selectedItem
      ? `Masukkan ${selectedItem.nameId} ke tong Organik atau Non-Organik!`
      : 'Pilih sampah untuk dimasukkan ke tong yang tepat!';
    let promptEn = selectedItem
      ? `Put ${selectedItem.nameEn} into the Organic or Non-Organic bin!`
      : 'Pick a waste item to sort into the right bin!';

    if (phase === 'COUNT') {
      const catId = wasteCountCategory === 'organic' ? 'Organik (Hijau)' : 'Non-Organik (Kuning)';
      const catEn = wasteCountCategory === 'organic' ? 'Organic (Green)' : 'Non-Organic (Yellow)';
      promptId = `Hebat! Sekarang hitung, ada berapa sampah di tong ${catId}?`;
      promptEn = `Awesome! How many items are in the ${catEn} bin?`;
    } else if (phase === 'DRIVE' || phase === 'DONE') {
      promptId = 'Benar! Truk Sampah mengangkut sampah daur ulang!';
      promptEn = 'Correct! Garbage Truck is taking the bins away!';
    }

    callbacks.onSnapshot({
      vehicleId: 'sampah',
      phase,
      promptId,
      promptEn,
      wasteItems: wasteItems.map((w) => ({ ...w })),
      selectedWasteUid,
      organicCount,
      nonOrganicCount,
      wasteCountCategory,
      wasteCountChoices,
      wrongFeedbackKey: wrongKey,
      completed: phase === 'DONE',
    });
  };

  emit();
  soundEngine.speakBilingual(
    'Truk Sampah! Ayo pilah sampah organik dan non organik!',
    'Garbage Truck! Sort organic and non-organic waste!',
  );

  const tryDropIntoBin = (category: WasteCategory) => {
    if (phase !== 'SORT' || selectedWasteUid === null) return;
    const item = wasteItems.find((w) => w.uid === selectedWasteUid && !w.sorted);
    if (!item) return;

    if (item.category === category) {
      item.sorted = true;
      if (category === 'organic') organicCount += 1;
      else nonOrganicCount += 1;

      const vis = wasteVisuals.find((v) => v.uid === item.uid);
      if (vis) {
        const binPos = category === 'organic' ? orgBinGroup.position : nonOrgBinGroup.position;
        vis.targetPos.set(binPos.x, 1.35, binPos.z);
      }

      soundEngine.playSuccessChime();
      const catId = category === 'organic' ? 'Organik' : 'Non Organik';
      const catEn = category === 'organic' ? 'Organic' : 'Non-Organic';
      soundEngine.speakBilingual(`${item.nameId}, ${catId}!`, `${item.nameEn}, ${catEn}!`);

      const nextUnsorted = wasteItems.find((w) => !w.sorted);
      if (nextUnsorted) {
        selectedWasteUid = nextUnsorted.uid;
      } else {
        selectedWasteUid = null;
        phase = 'COUNT';
        const targetVal = wasteCountCategory === 'organic' ? organicCount : nonOrganicCount;
        wasteCountChoices = makeNumberChoices(
          targetVal,
          Math.max(3, targetVal + 2),
          ageMode === 'toddler' ? 3 : 4,
        );
        later(() => {
          const cId = wasteCountCategory === 'organic' ? 'Organik' : 'Non Organik';
          const cEn = wasteCountCategory === 'organic' ? 'Organic' : 'Non-Organic';
          soundEngine.speakBilingual(
            `Ada berapa sampah di tong ${cId}?`,
            `How many items in the ${cEn} bin?`,
          );
        }, 1200);
      }
      emit();
    } else {
      wrongKey += 1;
      soundEngine.playTryAgain();
      soundEngine.speakBilingual('Ups! Coba tong satunya ya!', 'Oops! Try the other bin!');
      emit();
    }
  };

  return {
    vehicleId: 'sampah',
    group,
    raycastTargets,
    cameraPos: new THREE.Vector3(-0.3, 5.8, 12.2),
    cameraTarget: new THREE.Vector3(-0.2, 1.1, 2.5),
    update: (dt, elapsed) => {
      wasteVisuals.forEach((v) => {
        const item = wasteItems.find((w) => w.uid === v.uid)!;
        v.mesh.position.x = THREE.MathUtils.damp(v.mesh.position.x, v.targetPos.x, 8, dt);
        v.mesh.position.y = THREE.MathUtils.damp(v.mesh.position.y, v.targetPos.y, 8, dt);
        v.mesh.position.z = THREE.MathUtils.damp(v.mesh.position.z, v.targetPos.z, 8, dt);
        if (item.sorted && v.mesh.position.distanceTo(v.targetPos) < 0.25) {
          v.mesh.visible = false;
        } else if (v.uid === selectedWasteUid && !item.sorted) {
          v.mesh.position.y = 0.22 + Math.abs(Math.sin(elapsed * 5.5)) * 0.22;
          v.mesh.rotation.y += dt * 1.8;
        }
      });

      if (phase === 'DRIVE') {
        if (truck.hopperGroup) {
          truck.hopperGroup.rotation.z = THREE.MathUtils.damp(
            truck.hopperGroup.rotation.z,
            Math.sin(elapsed * 8) * 0.25,
            8,
            dt,
          );
        }
        truck.root.position.x += dt * 6.0;
        truck.wheels.forEach((w) => {
          w.rotation.z -= dt * 10;
        });
        if (truck.root.position.x >= 10.5) {
          phase = 'DONE';
          emit();
          callbacks.onCelebrate('sampah');
        }
      }
    },
    handleRaycastHit: (hitObj) => {
      if (phase !== 'SORT') return;
      if (typeof hitObj.userData.wasteUid === 'number') {
        const item = wasteItems.find((w) => w.uid === hitObj.userData.wasteUid && !w.sorted);
        if (item) {
          selectedWasteUid = item.uid;
          soundEngine.playPop();
          soundEngine.speakBilingual(item.nameId, item.nameEn);
          emit();
        }
      } else if (hitObj.userData.binCategory) {
        tryDropIntoBin(hitObj.userData.binCategory as WasteCategory);
      }
    },
    handleAction: (action, payload) => {
      if (action === 'SELECT_WASTE' && phase === 'SORT') {
        const uid = payload as number;
        const item = wasteItems.find((w) => w.uid === uid && !w.sorted);
        if (item) {
          selectedWasteUid = item.uid;
          soundEngine.playPop();
          soundEngine.speakBilingual(item.nameId, item.nameEn);
          emit();
        }
      } else if (action === 'DROP_BIN' && phase === 'SORT') {
        tryDropIntoBin(payload as WasteCategory);
      } else if (action === 'COUNT_WASTE' && phase === 'COUNT') {
        const pick = payload as number;
        const target = wasteCountCategory === 'organic' ? organicCount : nonOrganicCount;
        const nw = NUMBER_WORDS[pick];
        if (pick === target) {
          phase = 'DRIVE';
          soundEngine.playHorn('sampah');
          soundEngine.speakBilingual(
            `Benar, ${nw.id}! Truk Sampah berangkat!`,
            `Correct, ${nw.en}! Garbage Truck rolling out!`,
          );
          emit();
        } else {
          wrongKey += 1;
          soundEngine.playTryAgain();
          soundEngine.speakBilingual('Coba hitung lagi ya!', 'Try counting again!');
          emit();
        }
      }
    },
    dispose: () => {
      orgTex.dispose();
      nonOrgTex.dispose();
      disposeGroup();
    },
  };
}
