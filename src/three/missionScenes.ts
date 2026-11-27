import * as THREE from 'three';
import {
  ALL_COLORS,
  CARGO_OPTIONS,
  LETTERS_PRESCHOOL,
  LETTERS_TODDLER,
  MOLEN_BLUEPRINTS,
  NUMBER_WORDS,
  PRIMARY_COLORS,
  WASTE_CATALOG,
  mixTwoColors,
  type AgeMode,
  type CargoTypeId,
  type ColorOption,
  type LetterEntry,
  type MissionSnapshot,
  type MissionVariant,
  type MolenBlueprintId,
  type PipeTileState,
  type VehicleId,
  type WasteCategory,
  type WasteItemDef,
} from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import {
  createBrickTexture,
  createCobblestoneTexture,
  createCottageWallTexture,
  createGouachePaintTexture,
  createMixerStripeTexture,
  createRoofShingleTexture,
  createSignTexture,
  createWoodPlankTexture,
  getPaperBumpTexture,
} from './textures';
import { buildCargoProp, buildWasteProp, type TruckRig } from './trucks';
import { createExcavatorMission, createSchoolBusMission } from './newMissionScenes';

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
  supportsDragSpray?: () => boolean;
  handleDragSpray?: (worldPoint: THREE.Vector3, hitObj?: THREE.Object3D | null) => void;
  stopDragSpray?: () => void;
  dispose: () => void;
}

// Helper for pipe port directions: 0=Top(-Z), 1=Right(+X), 2=Bottom(+Z), 3=Left(-X)
export function getPipePorts(type: 'straight' | 'elbow', rotation: number): number[] {
  const base = type === 'straight' ? [1, 3] : [0, 1];
  return base.map((d) => (d + (rotation % 4)) % 4);
}

export interface PipeTemplateTile {
  row: number;
  col: number;
  type: 'straight' | 'elbow';
  /** Solved rotation (null if decoy tile) */
  solvedRot: number | null;
}

/**
 * 3 distinct solvable 2×3 pipe path templates for Prasekolah (4–6) mode:
 *  - Template 0 (Middle Z-step): (0,0) -> (0,1) -> (1,1) -> (1,2)
 *  - Template 1 (Early L-drop):  (0,0) -> (1,0) -> (1,1) -> (1,2)
 *  - Template 2 (Far-right drop): (0,0) -> (0,1) -> (0,2) -> (1,2)
 */
export const PRESCHOOL_PIPE_TEMPLATES: PipeTemplateTile[][] = [
  [
    { row: 0, col: 0, type: 'straight', solvedRot: 0 },
    { row: 0, col: 1, type: 'elbow', solvedRot: 2 },
    { row: 0, col: 2, type: 'elbow', solvedRot: null },
    { row: 1, col: 0, type: 'elbow', solvedRot: null },
    { row: 1, col: 1, type: 'elbow', solvedRot: 0 },
    { row: 1, col: 2, type: 'straight', solvedRot: 0 },
  ],
  [
    { row: 0, col: 0, type: 'elbow', solvedRot: 2 },
    { row: 0, col: 1, type: 'straight', solvedRot: null },
    { row: 0, col: 2, type: 'elbow', solvedRot: null },
    { row: 1, col: 0, type: 'elbow', solvedRot: 0 },
    { row: 1, col: 1, type: 'straight', solvedRot: 0 },
    { row: 1, col: 2, type: 'straight', solvedRot: 0 },
  ],
  [
    { row: 0, col: 0, type: 'straight', solvedRot: 0 },
    { row: 0, col: 1, type: 'straight', solvedRot: 0 },
    { row: 0, col: 2, type: 'elbow', solvedRot: 2 },
    { row: 1, col: 0, type: 'elbow', solvedRot: null },
    { row: 1, col: 1, type: 'straight', solvedRot: null },
    { row: 1, col: 2, type: 'elbow', solvedRot: 0 },
  ],
];

export function checkPipePathSolved(
  tiles: { row: number; col: number; type: 'straight' | 'elbow'; rotation: number }[],
  rows: number,
  cols: number,
): boolean {
  const outRow = rows === 1 ? 0 : 1;
  const visited = new Set<string>();
  const getTile = (r: number, c: number) => tiles.find((p) => p.row === r && p.col === c);
  const startTile = getTile(0, 0);
  if (!startTile || !getPipePorts(startTile.type, startTile.rotation).includes(3)) return false;

  const queue = [startTile];
  visited.add('0,0');
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
      return true;
    }
    for (const dir of dirs) {
      if (!ports.includes(dir.d)) continue;
      const nxt = getTile(curr.row + dir.dr, curr.col + dir.dc);
      const key = `${curr.row + dir.dr},${curr.col + dir.dc}`;
      if (!nxt || visited.has(key)) continue;
      if (getPipePorts(nxt.type, nxt.rotation).includes(dir.opp)) {
        visited.add(key);
        queue.push(nxt);
      }
    }
  }
  return false;
}

export function generateRandomizedPipeSpecs(
  rows: number,
  forcedTemplateId?: number,
): {
  templateId: number;
  specs: { row: number; col: number; type: 'straight' | 'elbow'; startRot: number; solvedRot: number | null }[];
} {
  if (rows === 1) {
    const base: PipeTemplateTile[] = [
      { row: 0, col: 0, type: 'straight', solvedRot: 0 },
      { row: 0, col: 1, type: 'straight', solvedRot: 0 },
      { row: 0, col: 2, type: 'straight', solvedRot: 0 },
    ];
    // Guarantee at least 2 of 3 straight tiles start misaligned (rot 1 or 3)
    const specs = base.map((t) => ({
      ...t,
      startRot: Math.floor(Math.random() * 4),
    }));
    const countMisaligned = () => specs.filter((s) => s.startRot % 2 !== 0).length;
    while (countMisaligned() < 2) {
      const idx = Math.floor(Math.random() * specs.length);
      specs[idx].startRot = Math.random() < 0.5 ? 1 : 3;
    }
    return { templateId: 0, specs };
  }

  const templateId =
    typeof forcedTemplateId === 'number'
      ? ((forcedTemplateId % PRESCHOOL_PIPE_TEMPLATES.length) + PRESCHOOL_PIPE_TEMPLATES.length) %
        PRESCHOOL_PIPE_TEMPLATES.length
      : Math.floor(Math.random() * PRESCHOOL_PIPE_TEMPLATES.length);

  const template = PRESCHOOL_PIPE_TEMPLATES[templateId];
  const specs = template.map((t) => ({
    ...t,
    startRot: Math.floor(Math.random() * 4),
  }));

  const isMisaligned = (s: { type: 'straight' | 'elbow'; startRot: number; solvedRot: number | null }) => {
    if (s.solvedRot === null) return false;
    return s.type === 'straight' ? s.startRot % 2 !== s.solvedRot % 2 : s.startRot !== s.solvedRot;
  };

  const pathIndices = specs
    .map((s, i) => (s.solvedRot !== null ? i : -1))
    .filter((i) => i >= 0);

  // Guarantee at least 2 solution-path tiles need rotating AND puzzle is not auto-solved
  let guard = 0;
  while (
    (specs.filter(isMisaligned).length < 2 ||
      checkPipePathSolved(
        specs.map((s) => ({ row: s.row, col: s.col, type: s.type, rotation: s.startRot })),
        2,
        3,
      )) &&
    guard < 24
  ) {
    const pickIdx = pathIndices[Math.floor(Math.random() * pathIndices.length)];
    const tile = specs[pickIdx];
    const offset = tile.type === 'straight' ? 1 : 1 + Math.floor(Math.random() * 3);
    tile.startRot = ((tile.solvedRot ?? 0) + offset) % 4;
    guard += 1;
  }

  return { templateId, specs };
}

interface MolenBlockSpec {
  pos: [number, number, number];
  size: [number, number, number];
  shape?: 'box' | 'cone';
  shadeOffset?: number;
}

const MOLEN_BLUEPRINT_BLOCKS: Record<MolenBlueprintId, MolenBlockSpec[]> = {
  house: [
    { pos: [-0.85, 0.45, 0], size: [1.1, 0.9, 1.4] },
    { pos: [0.85, 0.45, 0], size: [1.1, 0.9, 1.4] },
    { pos: [0, 1.35, 0], size: [2.8, 0.9, 1.4] },
    { pos: [0, 2.35, 0], size: [1.75, 1.25, 4], shape: 'cone', shadeOffset: -0.08 },
  ],
  tower: [
    { pos: [0, 0.45, 0], size: [2.15, 0.9, 1.7] },
    { pos: [0, 1.32, 0], size: [1.68, 0.86, 1.42] },
    { pos: [0, 2.16, 0], size: [1.28, 0.84, 1.14] },
    { pos: [0, 3.12, 0], size: [1.15, 1.18, 4], shape: 'cone', shadeOffset: -0.1 },
  ],
  bridge: [
    { pos: [-1.25, 0.55, 0], size: [0.95, 1.1, 1.55] },
    { pos: [1.25, 0.55, 0], size: [0.95, 1.1, 1.55] },
    { pos: [0, 1.28, 0], size: [3.7, 0.36, 1.65] },
    { pos: [0, 1.72, -0.68], size: [3.2, 0.32, 0.22], shadeOffset: -0.08 },
    { pos: [0, 1.72, 0.68], size: [3.2, 0.32, 0.22], shadeOffset: -0.08 },
  ],
  windmill: [
    { pos: [0, 0.55, 0], size: [1.95, 1.1, 1.75] },
    { pos: [0, 1.52, 0], size: [1.52, 0.96, 1.42] },
    { pos: [0, 2.42, 0], size: [1.16, 0.88, 1.12] },
    { pos: [0, 3.35, 0], size: [1.1, 1.05, 4], shape: 'cone', shadeOffset: -0.1 },
  ],
};

let molenBlueprintCursor = 0;

function buildPipeMesh(
  type: 'straight' | 'elbow',
  index: number,
  maxAnisotropy: number,
): { group: THREE.Group; pipeMat: THREE.MeshStandardMaterial; baseMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const paperBump = getPaperBumpTexture(maxAnisotropy);
  const baseMat = new THREE.MeshStandardMaterial({
    map: createCobblestoneTexture(maxAnisotropy, 1, 1),
    color: '#FAF1DF',
    bumpMap: paperBump,
    bumpScale: 0.025,
    roughness: 0.86,
    metalness: 0.02,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.16, 1.42), baseMat);
  base.position.y = 0.08;
  base.receiveShadow = true;
  group.add(base);

  const pipeMat = new THREE.MeshStandardMaterial({
    color: '#9BA5AF',
    bumpMap: paperBump,
    bumpScale: 0.015,
    roughness: 0.46,
    metalness: 0.36,
  });

  const flangeMat = new THREE.MeshStandardMaterial({
    color: '#5C4F46',
    roughness: 0.5,
    metalness: 0.48,
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
  missionVariant: MissionVariant = 'classic',
): ActiveMissionController {
  if (vehicleId === 'ekskavator') {
    return createExcavatorMission(truck, ageMode, maxAnisotropy, callbacks);
  }
  if (vehicleId === 'bus') {
    return createSchoolBusMission(truck, ageMode, maxAnisotropy, callbacks);
  }

  const isBonus = missionVariant === 'bonus';
  const group = new THREE.Group();
  const raycastTargets: THREE.Object3D[] = [];
  const timeouts: number[] = [];

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeouts.push(id);
  };

  // P1-3: Gentle idle visual + bilingual voice hint tracker (active in Balita 2–3 mode)
  const IDLE_HINT_SECONDS = 8.0;
  let idleSeconds = 0;
  let activeHintKey: string | null = null;
  const resetIdle = (onClear?: () => void) => {
    const hadHint = activeHintKey !== null;
    idleSeconds = 0;
    activeHintKey = null;
    if (hadHint && onClear) {
      onClear();
    }
  };
  const tickIdle = (
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

    // Sandstone cobblestone building pad on the left
    const paperBump = getPaperBumpTexture(maxAnisotropy);
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.16, 3.2),
      new THREE.MeshStandardMaterial({
        map: createCobblestoneTexture(maxAnisotropy, 2, 2),
        bumpMap: paperBump,
        bumpScale: 0.025,
        roughness: 0.88,
      }),
    );
    pad.position.set(-2.6, 0.08, 3.2);
    pad.receiveShadow = true;
    group.add(pad);

    // Paint stream mesh from chute
    const streamMat = new THREE.MeshStandardMaterial({
      color: '#E8951B',
      roughness: 0.42,
    });
    const streamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.5, 12), streamMat);
    streamMesh.position.set(-0.2, 0.9, 3.2);
    streamMesh.rotation.z = -0.35;
    streamMesh.visible = false;
    group.add(streamMesh);

    // 3D Storybook structure blocks waiting to rise (P2-2: Rumah / Menara / Jembatan)
    const buildGroup = new THREE.Group();
    buildGroup.position.set(-2.6, 0.16, 3.2);
    group.add(buildGroup);

    let blueprintId: MolenBlueprintId = isBonus
      ? 'windmill'
      : MOLEN_BLUEPRINTS[molenBlueprintCursor % MOLEN_BLUEPRINTS.length].id;
    if (!isBonus) molenBlueprintCursor += 1;

    const builtBlocks: { mesh: THREE.Mesh; targetY: number; shadeOffset: number }[] = [];
    const blockMats: THREE.MeshStandardMaterial[] = [];
    const neutralBrickTex = createBrickTexture('#EBE4D8', maxAnisotropy);
    const neutralGouacheTex = createGouachePaintTexture('#F4EFE6', maxAnisotropy);

    // Bonus Windmill spinning sails rotor (attached to front of windmill tower)
    const windmillSailPivot = new THREE.Group();
    windmillSailPivot.position.set(0, 2.45, 0.72);
    windmillSailPivot.visible = false;
    const sailMat = new THREE.MeshStandardMaterial({
      map: neutralGouacheTex,
      color: '#F59E0B',
      bumpMap: paperBump,
      bumpScale: 0.02,
      roughness: 0.56,
    });
    const sailWoodMat = new THREE.MeshStandardMaterial({ color: '#6E4726', roughness: 0.82 });
    const sailHub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.28, 12), sailWoodMat);
    sailHub.rotation.x = Math.PI / 2;
    windmillSailPivot.add(sailHub);
    for (let i = 0; i < 4; i++) {
      const armPivot = new THREE.Group();
      armPivot.rotation.z = (i * Math.PI) / 2;
      const spar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.08), sailWoodMat);
      spar.position.y = 0.78;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.15, 0.06), sailMat);
      blade.position.set(0.24, 0.92, 0.02);
      blade.castShadow = true;
      armPivot.add(spar, blade);
      windmillSailPivot.add(armPivot);
    }

    const rebuildStructureMeshes = (bp: MolenBlueprintId) => {
      while (buildGroup.children.length > 0) {
        const child = buildGroup.children[0] as THREE.Mesh;
        buildGroup.remove(child);
        if (child !== (windmillSailPivot as unknown as THREE.Mesh)) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else (child.material as THREE.Material)?.dispose();
        }
      }
      builtBlocks.length = 0;
      blockMats.length = 0;

      const specs = MOLEN_BLUEPRINT_BLOCKS[bp];
      specs.forEach((b) => {
        const mat = new THREE.MeshStandardMaterial({
          map: b.shape === 'cone' ? neutralGouacheTex : neutralBrickTex,
          color: '#F59E0B',
          bumpMap: paperBump,
          bumpScale: 0.025,
          roughness: 0.65,
        });
        blockMats.push(mat);
        const geo =
          b.shape === 'cone'
            ? new THREE.ConeGeometry(b.size[0], b.size[1], b.size[2])
            : new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
        const mesh = new THREE.Mesh(geo, mat);
        if (b.shape === 'cone') mesh.rotation.y = Math.PI / 4;
        mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
        mesh.scale.set(0.01, 0.01, 0.01);
        mesh.visible = false;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        buildGroup.add(mesh);
        builtBlocks.push({ mesh, targetY: b.pos[1], shadeOffset: b.shadeOffset ?? 0 });
      });

      if (bp === 'windmill') {
        windmillSailPivot.visible = false;
        windmillSailPivot.scale.set(0.01, 0.01, 0.01);
        buildGroup.add(windmillSailPivot);
      }
    };
    rebuildStructureMeshes(blueprintId);

    const maxPicks = ageMode === 'toddler' ? 1 : 2;
    let selectedColors: ColorOption['id'][] = [];
    let mixedColor: ColorOption | null = null;
    let phase: 'PICK' | 'SPINNING' | 'BUILDING' | 'DONE' = 'PICK';
    let molenBonusStage: 1 | 2 = 1;
    let spinTimer = 0;
    let buildProgress = 0;

    const getBlueprintMeta = () =>
      blueprintId === 'windmill'
        ? { id: 'windmill' as MolenBlueprintId, nameId: 'Kincir Taman', nameEn: 'Garden Windmill' }
        : MOLEN_BLUEPRINTS.find((b) => b.id === blueprintId)!;

    const emit = () => {
      const bp = getBlueprintMeta();
      let promptId = isBonus
        ? molenBonusStage === 1
          ? 'Misi 2: Pilih cat untuk menara Kincir Taman!'
          : 'Langkah 2: Pilih warna baling-baling Kincir Taman!'
        : ageMode === 'toddler'
          ? `Pilih 1 warna cat untuk membangun ${bp.nameId}!`
          : `Pilih 2 warna untuk dicampur dan membangun ${bp.nameId}!`;
      let promptEn = isBonus
        ? molenBonusStage === 1
          ? 'Bonus Mission: Pick paint for the Garden Windmill tower!'
          : 'Step 2: Pick a color for the spinning Windmill sails!'
        : ageMode === 'toddler'
          ? `Pick 1 paint color to build the ${bp.nameEn}!`
          : `Pick 2 colors to mix and build the ${bp.nameEn}!`;

      if (phase === 'PICK' && selectedColors.length === maxPicks) {
        promptId = 'Tekan tombol Putar Molen agar adonan tercampur!';
        promptEn = 'Press Spin Mixer to mix the colors!';
      } else if (phase === 'SPINNING') {
        promptId = 'Molen sedang berputar mencampur warna...';
        promptEn = 'Spinning and mixing the colors...';
      } else if (phase === 'BUILDING' && mixedColor) {
        promptId =
          isBonus && molenBonusStage === 2
            ? `Baling-baling warna ${mixedColor.nameId} mulai terpasang!`
            : `Wah! Warna ${mixedColor.nameId} membangun ${bp.nameId.toLowerCase()}!`;
        promptEn =
          isBonus && molenBonusStage === 2
            ? `Attaching ${mixedColor.nameEn} windmill sails!`
            : `Awesome! ${mixedColor.nameEn} is building the ${bp.nameEn.toLowerCase()}!`;
      } else if (phase === 'DONE' && mixedColor) {
        promptId = `${bp.nameId} warna-warni selesai dan berputar!`;
        promptEn = `Colorful ${bp.nameEn} is complete!`;
      }

      callbacks.onSnapshot({
        vehicleId: 'molen',
        missionVariant,
        phase,
        promptId,
        promptEn,
        selectedColors: [...selectedColors],
        mixedColor,
        molenBlueprint: blueprintId,
        molenBonusStage: isBonus ? molenBonusStage : undefined,
        structureProgress: buildProgress,
        hintKey: activeHintKey,
        completed: phase === 'DONE',
      });
    };

    emit();
    const initialBp = getBlueprintMeta();
    soundEngine.speakBilingual(
      isBonus
        ? 'Misi dua Truk Molen! Ayo cat menara Kincir Taman dulu!'
        : ageMode === 'toddler'
          ? `Truk Molen! Ayo pilih satu warna untuk membangun ${initialBp.nameId}!`
          : `Truk Molen! Ayo pilih dua warna untuk membangun ${initialBp.nameId}!`,
      isBonus
        ? 'Bonus Cement Mixer! Let us paint the Garden Windmill tower first!'
        : ageMode === 'toddler'
          ? `Cement Mixer! Pick a color to build a ${initialBp.nameEn}!`
          : `Cement Mixer! Mix two colors to build a ${initialBp.nameEn}!`,
    );

    return {
      vehicleId: 'molen',
      group,
      raycastTargets,
      cameraPos: new THREE.Vector3(0.2, 5.4, 12.2),
      cameraTarget: new THREE.Vector3(-0.2, 1.3, 3.2),
      update: (dt, elapsed) => {
        if (windmillSailPivot.visible) {
          windmillSailPivot.rotation.z -= dt * (phase === 'DONE' ? 1.85 : 0.8);
        }

        if (phase === 'SPINNING') {
          spinTimer += dt;
          if (truck.drumGroup) truck.drumGroup.rotation.x += dt * 7.5;
          truck.bodyGroup.position.y = Math.abs(Math.sin(elapsed * 22)) * 0.05;
          if (spinTimer > 1.55) {
            phase = 'BUILDING';
            streamMesh.visible = true;
            if (mixedColor) {
              streamMat.color.set(mixedColor.hex);
              if (isBonus && molenBonusStage === 2) {
                sailMat.color.set(mixedColor.hex);
                windmillSailPivot.visible = true;
              } else {
                blockMats.forEach((m, i) => {
                  m.color.set(mixedColor!.hex);
                  const shade = builtBlocks[i]?.shadeOffset ?? 0;
                  if (shade !== 0) m.color.offsetHSL(0, 0, shade);
                });
              }
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
          buildProgress = Math.min(1, buildProgress + dt * 0.48);

          if (isBonus && molenBonusStage === 2) {
            const s = THREE.MathUtils.damp(windmillSailPivot.scale.x, 1, 8, dt);
            windmillSailPivot.scale.set(s, s, s);
          } else {
            const stepSpan = 0.72 / Math.max(1, builtBlocks.length);
            builtBlocks.forEach((b, idx) => {
              const threshold = idx * stepSpan;
              if (buildProgress > threshold) {
                b.mesh.visible = true;
                const localT = Math.min(1, (buildProgress - threshold) / 0.28);
                const s = THREE.MathUtils.damp(b.mesh.scale.x, localT, 9, dt);
                b.mesh.scale.set(s, s, s);
              }
            });
          }

          if (buildProgress >= 1) {
            streamMesh.visible = false;
            truck.bodyGroup.position.y = 0;

            if (isBonus && molenBonusStage === 1) {
              molenBonusStage = 2;
              selectedColors = [];
              mixedColor = null;
              buildProgress = 0;
              phase = 'PICK';
              soundEngine.speakBilingual(
                'Menara jadi! Sekarang pilih warna baling-baling kincir!',
                'Tower built! Now pick a color for the spinning sails!',
              );
              emit();
            } else {
              phase = 'DONE';
              const bp = getBlueprintMeta();
              if (mixedColor) {
                soundEngine.speakBilingual(
                  `${bp.nameId} selesai! Hebat sekali!`,
                  `${bp.nameEn} is complete! Great job!`,
                );
              }
              emit();
              later(() => callbacks.onCelebrate('molen'), 650);
            }
          }
        } else {
          if (truck.drumGroup) truck.drumGroup.rotation.x += dt * 0.6;
        }
        tickIdle(
          dt,
          phase === 'PICK',
          () =>
            selectedColors.length < maxPicks
              ? {
                  key: 'color:red',
                  sayId: 'Ayo ketuk warna Merah!',
                  sayEn: 'Try tapping Red!',
                }
              : {
                  key: 'spin',
                  sayId: 'Sekarang tekan tombol Putar Molen!',
                  sayEn: 'Now tap Spin Mixer!',
                },
          emit,
        );
      },
      handleRaycastHit: () => {},
      handleAction: (action, payload) => {
        resetIdle(emit);
        if (action === 'SELECT_BLUEPRINT' && phase === 'PICK' && !isBonus) {
          const nextBp = payload as MolenBlueprintId;
          const meta = MOLEN_BLUEPRINTS.find((b) => b.id === nextBp);
          if (!meta || nextBp === blueprintId) return;
          blueprintId = nextBp;
          rebuildStructureMeshes(blueprintId);
          soundEngine.playPop();
          soundEngine.speakBilingual(meta.nameId, meta.nameEn);
          emit();
        } else if (action === 'PICK_COLOR' && phase === 'PICK') {
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

    // Storybook timber & terracotta delivery barn archway down the right side of the road
    const barn = new THREE.Group();
    barn.position.set(11.5, 0, 3.2);
    const paperBump = getPaperBumpTexture(maxAnisotropy);
    const pillarMat = new THREE.MeshStandardMaterial({
      map: createWoodPlankTexture('#C64938', maxAnisotropy),
      bumpMap: paperBump,
      bumpScale: 0.025,
      roughness: 0.78,
    });
    const beamMat = new THREE.MeshStandardMaterial({
      map: createWoodPlankTexture('#C4873D', maxAnisotropy),
      bumpMap: paperBump,
      bumpScale: 0.025,
      roughness: 0.76,
    });
    const roofCapMat = new THREE.MeshStandardMaterial({
      map: createRoofShingleTexture('terracotta', maxAnisotropy),
      bumpMap: paperBump,
      bumpScale: 0.035,
      roughness: 0.82,
    });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 3.2, 0.62), pillarMat);
    p1.position.set(0, 1.6, -2.2);
    p1.castShadow = true;
    const p2 = p1.clone();
    p2.position.z = 2.2;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.64, 5.3), beamMat);
    beam.position.set(0, 3.36, 0);
    beam.castShadow = true;
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.28, 5.6), roofCapMat);
    roofCap.position.set(0, 3.82, 0);
    roofCap.castShadow = true;
    barn.add(p1, p2, beam, roofCap);
    group.add(barn);

    const maxCargo = ageMode === 'toddler' ? 4 : 10;
    let cargoType: CargoTypeId = 'apple';
    const secondaryCargoType: CargoTypeId = 'box';
    let primaryCount = isBonus ? (ageMode === 'toddler' ? 2 : 3) : ageMode === 'toddler' ? 2 : 5;
    let secondaryCount = isBonus ? (ageMode === 'toddler' ? 1 : 3) : 0;
    let loadedCount = primaryCount + secondaryCount;
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
        [-0.6, 0.05, -0.34],
        [0, 0.05, -0.34],
        [0.6, 0.05, -0.34],
        [-0.6, 0.05, 0.34],
        [0, 0.05, 0.34],
        [0.6, 0.05, 0.34],
        [-0.34, 0.52, -0.28],
        [0.34, 0.52, -0.28],
        [-0.34, 0.52, 0.28],
        [0.34, 0.52, 0.28],
      ];
      loadedCount = primaryCount + (isBonus ? secondaryCount : 0);
      for (let i = 0; i < loadedCount; i++) {
        const itemKind = isBonus && i >= primaryCount ? secondaryCargoType : cargoType;
        const prop = buildCargoProp(itemKind);
        const [sx, sy, sz] = slots[i % slots.length];
        prop.position.set(sx, sy, sz);
        prop.userData.baseY = sy;
        truck.cargoSlot.add(prop);
        cargoMeshes.push(prop);
      }
    };
    rebuildCargoInBed();

    const emit = () => {
      const cargoObj = CARGO_OPTIONS.find((c) => c.id === cargoType)!;
      const secondObj = CARGO_OPTIONS.find((c) => c.id === secondaryCargoType)!;
      let promptId = isBonus
        ? `Misi 2 Panen Campur! Muat ${cargoObj.nameId} & ${secondObj.nameId}, lalu hitung totalnya!`
        : `Pilih barang & jumlahnya, lalu tekan Ayo Hitung!`;
      let promptEn = isBonus
        ? `Bonus Harvest Mix! Load ${cargoObj.nameEn} & ${secondObj.nameEn}, then count the total!`
        : `Pick cargo & amount, then tap Let's Count!`;
      if (phase === 'COUNT') {
        promptId = isBonus
          ? `Ada berapa total barang panen di bak truk? Hitung semuanya!`
          : `Ada berapa ${cargoObj.nameId} di bak truk? Hitung ya!`;
        promptEn = isBonus
          ? `How many harvest items are in the truck altogether?`
          : `How many ${cargoObj.nameEn} are in the truck?`;
      } else if (phase === 'DRIVE' || phase === 'DONE') {
        const nw = NUMBER_WORDS[loadedCount];
        promptId = `Benar! ${nw.id} muatan siap diantar! Truk melaju!`;
        promptEn = `Correct! ${nw.en} items ready! Off we go!`;
      }
      callbacks.onSnapshot({
        vehicleId: 'angkut',
        missionVariant,
        phase,
        promptId,
        promptEn,
        cargoType,
        secondaryCargoType: isBonus ? secondaryCargoType : undefined,
        primaryCargoCount: primaryCount,
        secondaryCargoCount: isBonus ? secondaryCount : undefined,
        loadedCount,
        targetCount: maxCargo,
        numberChoices,
        hintKey: activeHintKey,
        wrongFeedbackKey: wrongKey,
        completed: phase === 'DONE',
      });
    };

    emit();
    soundEngine.speakBilingual(
      isBonus
        ? 'Misi dua Truk Angkut! Keranjang Panen Campur! Ayo muat dan hitung totalnya!'
        : 'Truk Angkut! Pilih barang dan jumlahnya!',
      isBonus
        ? 'Bonus Cargo Truck! Mixed Harvest Basket! Load and count the total!'
        : 'Cargo Truck! Choose your cargo!',
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
            const baseY = typeof m.userData.baseY === 'number' ? m.userData.baseY : 0.05;
            m.position.y = baseY + Math.abs(Math.sin(elapsed * 3.5 + i * 0.7)) * 0.06;
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
        tickIdle(
          dt,
          phase === 'LOAD' || phase === 'COUNT',
          () => {
            if (phase === 'LOAD') {
              return {
                key: 'start_count',
                sayId: 'Yuk tekan tombol Ayo Hitung!',
                sayEn: "Tap Let's Count!",
              };
            }
            const nw = NUMBER_WORDS[loadedCount];
            return {
              key: `count:${loadedCount}`,
              sayId: `Hitung bareng yuk! Ada ${nw.id}!`,
              sayEn: `Let's count! There are ${nw.en}!`,
            };
          },
          emit,
        );
      },
      handleRaycastHit: () => {},
      handleAction: (action, payload) => {
        resetIdle(emit);
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
          if (isBonus) {
            const nextPrimary = THREE.MathUtils.clamp(primaryCount + delta, 1, Math.max(1, maxCargo - secondaryCount));
            if (nextPrimary !== primaryCount) {
              primaryCount = nextPrimary;
              rebuildCargoInBed();
              const nw = NUMBER_WORDS[loadedCount];
              soundEngine.playPop();
              soundEngine.speakBilingual(nw.id, nw.en);
              emit();
            }
          } else {
            const next = THREE.MathUtils.clamp(primaryCount + delta, 1, maxCargo);
            if (next !== primaryCount) {
              primaryCount = next;
              rebuildCargoInBed();
              const nw = NUMBER_WORDS[loadedCount];
              soundEngine.playPop();
              soundEngine.speakBilingual(nw.id, nw.en);
              emit();
            }
          }
        } else if (action === 'CHANGE_SECONDARY_AMOUNT' && phase === 'LOAD' && isBonus) {
          const delta = payload as number;
          const nextSec = THREE.MathUtils.clamp(secondaryCount + delta, 1, Math.max(1, maxCargo - primaryCount));
          if (nextSec !== secondaryCount) {
            secondaryCount = nextSec;
            rebuildCargoInBed();
            const nw = NUMBER_WORDS[loadedCount];
            soundEngine.playPop();
            soundEngine.speakBilingual(nw.id, nw.en);
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
            isBonus
              ? 'Ayo hitung semua barang panen di bak truk!'
              : `Ayo hitung! Ada berapa ${info.nameId} di bak truk?`,
            isBonus
              ? 'Count all the harvest items in the truck!'
              : `Let's count! How many ${info.nameEn}?`,
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

    // Vintage Storybook Village Water Hydrant on left inlet (row 0, col -1)
    const hydrant = new THREE.Group();
    hydrant.position.set(boardOriginX - tileSize, 0, boardOriginZ);
    const paperBump = getPaperBumpTexture(maxAnisotropy);
    const hydMat = new THREE.MeshStandardMaterial({
      map: createGouachePaintTexture('#1D7FB4', maxAnisotropy),
      bumpMap: paperBump,
      bumpScale: 0.02,
      roughness: 0.52,
      metalness: 0.22,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: '#E2B454',
      roughness: 0.36,
      metalness: 0.56,
    });
    const hBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, 0.22, 16),
      new THREE.MeshStandardMaterial({ color: '#C9BBA3', roughness: 0.88 }),
    );
    hBase.position.y = 0.11;
    const hBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.25, 16), hydMat);
    hBody.position.y = 0.64;
    hBody.castShadow = true;
    const hCap = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), brassMat);
    hCap.position.y = 1.27;
    const hSpout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.55, 12),
      new THREE.MeshStandardMaterial({ color: '#46BBE8', roughness: 0.32 }),
    );
    hSpout.rotation.z = Math.PI / 2;
    hSpout.position.set(0.38, 0.38, 0);
    hydrant.add(hBase, hBody, hCap, hSpout);
    group.add(hydrant);

    // Connector hose from last pipe tile into truck rear
    const outRow = rows === 1 ? 0 : 1;
    const inletPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 1.85, 12),
      new THREE.MeshStandardMaterial({ color: '#6E645C', roughness: 0.52, metalness: 0.38 }),
    );
    inletPipe.rotation.z = Math.PI / 2;
    inletPipe.position.set(boardOriginX + cols * tileSize - 0.15, 0.38, boardOriginZ + outRow * tileSize);
    group.add(inletPipe);

    // P2-1: Generate randomized solvable pipe layout (3 templates for Prasekolah, ≥2 tiles scrambled)
    const { templateId: pipeTemplateId, specs: pipeSpecs } = generateRandomizedPipeSpecs(rows);

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

      const vis = buildPipeMesh(spec.type, idx, maxAnisotropy);
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

    // Bonus 2nd Mission: Sunlit 3D Village Flowerbed that sprouts and blooms as water flows!
    const flowerStems: THREE.Group[] = [];
    if (isBonus) {
      const gardenBox = new THREE.Group();
      gardenBox.position.set(-1.5, 0, 0.35);
      const timberMat = new THREE.MeshStandardMaterial({
        map: createWoodPlankTexture('#A86F38', maxAnisotropy),
        roughness: 0.82,
      });
      const soilMat = new THREE.MeshStandardMaterial({ color: '#6E4A2C', roughness: 0.94 });
      const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.42, 1.45), timberMat);
      bedFrame.position.y = 0.21;
      bedFrame.castShadow = true;
      bedFrame.receiveShadow = true;
      const bedSoil = new THREE.Mesh(new THREE.BoxGeometry(4.85, 0.36, 1.15), soilMat);
      bedSoil.position.y = 0.28;
      gardenBox.add(bedFrame, bedSoil);

      const petalPalette = ['#E85D4A', '#F3C13A', '#9A69D6', '#F472B6', '#38BDF8', '#FB923C', '#EF4444'];
      const stemMat = new THREE.MeshStandardMaterial({ color: '#3F9A4B', roughness: 0.72 });
      const centerMat = new THREE.MeshStandardMaterial({ color: '#FDE047', roughness: 0.45 });

      for (let i = 0; i < 7; i++) {
        const fl = new THREE.Group();
        const fx = -2.0 + i * 0.67;
        const fz = (i % 2 === 0 ? -0.22 : 0.22);
        fl.position.set(fx, 0.42, fz);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.95, 8), stemMat);
        stem.position.y = 0.47;
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), centerMat);
        head.position.y = 0.98;
        const pMat = new THREE.MeshStandardMaterial({
          map: createGouachePaintTexture(petalPalette[i % petalPalette.length], maxAnisotropy),
          roughness: 0.55,
        });
        for (let p = 0; p < 5; p++) {
          const ang = (p / 5) * Math.PI * 2;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), pMat);
          petal.scale.set(1.25, 0.5, 0.9);
          petal.position.set(Math.cos(ang) * 0.2, 0.98, Math.sin(ang) * 0.2);
          fl.add(petal);
        }
        fl.add(stem, head);
        fl.scale.set(0.32, 0.22, 0.32); // Thirsty buds before water arrives!
        gardenBox.add(fl);
        flowerStems.push(fl);
      }
      group.add(gardenBox);
    }

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
        pipeVisuals[i].pipeMat.color.set(p.connected ? '#46BBE8' : '#9BA5AF');
        pipeVisuals[i].pipeMat.emissive.set(p.connected ? '#1484B8' : '#000000');
        pipeVisuals[i].pipeMat.emissiveIntensity = p.connected ? 0.35 : 0;
        pipeVisuals[i].baseMat.color.set(p.connected ? '#C7ECFA' : '#FAF1DF');
      });

      return reachesTank;
    };

    evaluatePipes();

    const emit = () => {
      let promptId = isBonus
        ? 'Misi 2 Taman Bunga! Sambung pipa air agar bunga-bunga bermekaran!'
        : 'Ketuk pipa 3D untuk memutarnya agar air mengalir ke tangki!';
      let promptEn = isBonus
        ? 'Bonus Flower Garden! Connect the pipes to bloom the village flowers!'
        : 'Tap the 3D pipes to rotate and connect water to the tank!';
      if (phase === 'FILLING') {
        promptId = isBonus
          ? `Air menyiram taman! Bunga bermekaran ${Math.round(tankFill * 100)}%...`
          : `Air mengalir! Mengisi tangki ${Math.round(tankFill * 100)}%...`;
        promptEn = isBonus
          ? `Watering the garden! Flowers blooming ${Math.round(tankFill * 100)}%...`
          : `Water flowing! Filling tank ${Math.round(tankFill * 100)}%...`;
      } else if (phase === 'DRIVE' || phase === 'DONE') {
        promptId = isBonus
          ? 'Taman Bunga mekar indah! Truk Tangki hebat!'
          : 'Tangki Penuh! Truk Tangki siap jalan!';
        promptEn = isBonus
          ? 'Flower Garden is in full bloom! Awesome Water Tanker!'
          : 'Tank Full! Water Tanker is rolling!';
      }
      callbacks.onSnapshot({
        vehicleId: 'tangki',
        missionVariant,
        phase,
        promptId,
        promptEn,
        pipes: pipeStates.map((p) => ({ ...p })),
        pipeCols: cols,
        pipeRows: rows,
        pipeTemplateId,
        tankFill,
        gardenBloom: isBonus ? tankFill : undefined,
        hintKey: activeHintKey,
        completed: phase === 'DONE',
      });
    };

    emit();
    soundEngine.speakBilingual(
      isBonus
        ? 'Misi dua Truk Tangki! Sambungkan pipa untuk menyiram Taman Bunga!'
        : 'Truk Tangki! Ayo putar pipa air sampai tersambung!',
      isBonus
        ? 'Bonus Water Tanker! Connect the pipes to water the Flower Garden!'
        : 'Water Tanker! Connect the water pipes!',
    );

    const rotatePipe = (idx: number) => {
      if (phase !== 'PUZZLE') return;
      const p = pipeStates[idx];
      if (!p) return;
      resetIdle();
      p.rotation = (p.rotation + 1) % 4;
      pipeVisuals[idx].targetAngle -= Math.PI / 2;
      soundEngine.playPipeClick();
      const solved = evaluatePipes();
      if (solved) {
        phase = 'FILLING';
        soundEngine.playWaterSplash();
        soundEngine.speakBilingual(
          isBonus ? 'Pipa tersambung! Bunga-bunga mulai mekar!' : 'Pipa tersambung! Air mengalir!',
          isBonus ? 'Connected! The flowers are blooming!' : 'Connected! Water is flowing!',
        );
      }
      emit();
    };

    let lastEmittedFillStep = 0;

    return {
      vehicleId: 'tangki',
      group,
      raycastTargets,
      cameraPos: new THREE.Vector3(-0.2, 6.8, 11.4),
      cameraTarget: new THREE.Vector3(-0.2, 1.0, 3.0),
      update: (dt, elapsed) => {
        pipeVisuals.forEach((pv) => {
          pv.group.rotation.y = THREE.MathUtils.damp(pv.group.rotation.y, pv.targetAngle, 12, dt);
        });
        if (flowerStems.length > 0) {
          const bloomTarget = 0.25 + tankFill * 0.95;
          flowerStems.forEach((fl, i) => {
            const s = THREE.MathUtils.damp(fl.scale.y, bloomTarget, 6, dt);
            fl.scale.set(0.32 + tankFill * 0.78, s, 0.32 + tankFill * 0.78);
            fl.rotation.z = Math.sin(elapsed * 2.5 + i * 0.9) * 0.06 * tankFill;
          });
        }
        if (phase === 'FILLING') {
          tankFill = Math.min(1, tankFill + dt * 0.42);
          if (truck.waterFillMesh) {
            truck.waterFillMesh.scale.y = Math.max(0.05, tankFill);
          }
          if (Math.random() < dt * 2.5) soundEngine.playWaterSplash();
          if (tankFill >= 1) {
            phase = 'DRIVE';
            soundEngine.playHorn('tangki');
            soundEngine.speakBilingual(
              isBonus ? 'Bunga mekar indah! Berangkat!' : 'Tangki Penuh! Berangkat!',
              isBonus ? 'Flowers are blooming! Let us go!' : 'Tank Full! Let us go!',
            );
            emit();
          } else {
            const fillStep = Math.floor(tankFill * 20);
            if (fillStep !== lastEmittedFillStep) {
              lastEmittedFillStep = fillStep;
              emit();
            }
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
        tickIdle(
          dt,
          phase === 'PUZZLE',
          () => {
            const firstWrong = pipeStates.find((p) => p.type === 'straight' && p.rotation % 2 !== 0) ||
              pipeStates.find((p) => !p.connected);
            if (!firstWrong) return null;
            pipeVisuals[firstWrong.index].baseMat.color.set('#FDE047');
            return {
              key: `pipe:${firstWrong.index}`,
              sayId: `Ketuk Pipa ${firstWrong.index + 1} untuk memutarnya!`,
              sayEn: `Tap Pipe ${firstWrong.index + 1} to rotate it!`,
            };
          },
          emit,
        );
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

    const maxCount = ageMode === 'toddler' ? 3 : 10;
    const countTarget =
      ageMode === 'toddler'
        ? 1 + Math.floor(Math.random() * 3)
        : 4 + Math.floor(Math.random() * 7); // 4..10 in Prasekolah mode
    const numberChoices = makeNumberChoices(countTarget, maxCount, ageMode === 'toddler' ? 3 : 4);
    const tolerance = ageMode === 'toddler' ? 0.36 : 0.22;
    const totalDrops = isBonus ? (ageMode === 'toddler' ? 2 : 3) : ageMode === 'toddler' ? 1 : 2;

    // Counting crates displayed neatly in front-left for Phase 1 (supports 1..10 without clipping)
    const countGroup = new THREE.Group();
    countGroup.position.set(-2.5, 0, 3.2);
    group.add(countGroup);

    const crateSize = countTarget > 6 ? 0.64 : 0.74;
    const crateGap = crateSize + 0.16;
    const colsPerRow = countTarget > 6 ? 4 : 3;
    const paperBump = getPaperBumpTexture(maxAnisotropy);
    const crateGeo = new THREE.BoxGeometry(crateSize, crateSize, crateSize);
    const crateMat = new THREE.MeshStandardMaterial({
      map: createWoodPlankTexture('#DC8232', maxAnisotropy),
      bumpMap: paperBump,
      bumpScale: 0.025,
      roughness: 0.72,
    });
    const countCrates: THREE.Mesh[] = [];
    for (let i = 0; i < countTarget; i++) {
      const c = new THREE.Mesh(crateGeo, crateMat);
      const row = Math.floor(i / colsPerRow);
      const col = i % colsPerRow;
      const itemsInRow = Math.min(colsPerRow, countTarget - row * colsPerRow);
      const xOffset = (col - (itemsInRow - 1) / 2) * crateGap;
      c.position.set(xOffset, crateSize / 2 + row * (crateSize + 0.08), 0);
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
      new THREE.MeshStandardMaterial({
        color: '#63564B',
        bumpMap: paperBump,
        bumpScale: 0.025,
        roughness: 0.78,
      }),
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
      new THREE.MeshStandardMaterial({
        map: createWoodPlankTexture('#C5853B', maxAnisotropy, 2, 1),
        bumpMap: paperBump,
        bumpScale: 0.028,
        roughness: 0.76,
      }),
    );
    plank.castShadow = true;
    plank.receiveShadow = true;
    plankPivot.add(plank);

    // Painted Meadow-Green Balance Target Zone in center of plank
    const zoneMat = new THREE.MeshStandardMaterial({
      map: createGouachePaintTexture('#44A854', maxAnisotropy),
      emissive: '#2B7D3B',
      emissiveIntensity: 0.34,
      roughness: 0.48,
    });
    const zoneWidth = tolerance * 3.4;
    const centerZone = new THREE.Mesh(new THREE.BoxGeometry(zoneWidth, 0.24, 1.54), zoneMat);
    plankPivot.add(centerZone);

    // Suspended wooden load crate hanging beneath the crane hook
    const paintedWoodTex = createWoodPlankTexture('#F2EBE0', maxAnisotropy);
    const hangingCrate = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.86, 0.86),
      new THREE.MeshStandardMaterial({
        map: paintedWoodTex,
        color: '#4E92D6',
        bumpMap: paperBump,
        bumpScale: 0.025,
        roughness: 0.62,
      }),
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
    let lastCraneSoundTime = 0;

    const emit = () => {
      let promptId = isBonus
        ? 'Misi 2 Peti Emas! Hitung dulu petinya sebelum menumpuk ke atas!'
        : 'Hitung dulu jumlah peti agar Truk Crane menyala!';
      let promptEn = isBonus
        ? 'Bonus Golden Stack! Count the crates before building a tall golden stack!'
        : 'Count the crates first to start the Crane Truck!';
      if (phase === 'BALANCE') {
        const isAligned = Math.abs(boomOffset) <= tolerance;
        const onGoldFinal = isBonus && droppedCount === totalDrops - 1;
        promptId = isAligned
          ? onGoldFinal
            ? 'Peti Emas tepat di tengah! Tekan Turunkan!'
            : 'Tepat di tengah! Tekan Turunkan Beban!'
          : 'Geser Kiri atau Kanan ke zona hijau agar seimbang!';
        promptEn = isAligned
          ? onGoldFinal
            ? 'Golden Crate aligned! Press Drop!'
            : 'Right in the middle! Press Drop Load!'
          : 'Move Left or Right into the green zone to balance!';
      } else if (phase === 'WOBBLE') {
        promptId = 'Wah miring! Geser lebih dekat ke tengah ya!';
        promptEn = 'Oops, tilted! Move closer to the center!';
      } else if (phase === 'DONE') {
        promptId = isBonus
          ? 'Menara Peti Emas berdiri seimbang sempurna!'
          : 'Beban seimbang sempurna! Hebat!';
        promptEn = isBonus
          ? 'Golden Treasure Stack balanced perfectly!'
          : 'Perfectly balanced! Awesome!';
      }

      callbacks.onSnapshot({
        vehicleId: 'crane',
        missionVariant,
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
        hintKey: activeHintKey,
        wrongFeedbackKey: wrongKey,
        completed: phase === 'DONE',
      });
    };

    emit();
    soundEngine.speakBilingual(
      isBonus
        ? 'Misi dua Truk Crane! Hitung petinya lalu susun Menara Peti Emas!'
        : 'Truk Crane! Hitung dulu petinya sebelum mengangkat!',
      isBonus
        ? 'Bonus Crane Truck! Count the crates and build the Golden Stack!'
        : 'Crane Truck! Count the crates first!',
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
        tickIdle(
          dt,
          phase === 'COUNT' || phase === 'BALANCE',
          () => {
            if (phase === 'COUNT') {
              const nw = NUMBER_WORDS[countTarget];
              return {
                key: `craneCount:${countTarget}`,
                sayId: `Hitung petinya yuk! Ada ${nw.id}!`,
                sayEn: `Count the crates! There are ${nw.en}!`,
              };
            }
            if (Math.abs(boomOffset) <= tolerance) {
              return {
                key: 'craneDrop',
                sayId: 'Sudah di zona hijau! Tekan Turunkan!',
                sayEn: 'In the green zone! Press Drop!',
              };
            }
            const dir = boomOffset > 0 ? -1 : 1;
            return {
              key: `craneMove:${dir}`,
              sayId: dir < 0 ? 'Geser ke Kiri menuju zona hijau!' : 'Geser ke Kanan menuju zona hijau!',
              sayEn: dir < 0 ? 'Move Left to the green zone!' : 'Move Right to the green zone!',
            };
          },
          emit,
        );
      },
      handleRaycastHit: () => {},
      handleAction: (action, payload) => {
        resetIdle();
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
          const isObj = typeof payload === 'object' && payload !== null;
          const dir = isObj ? (payload as { dir: number; step?: number }).dir : (payload as number);
          const step = isObj && typeof (payload as { step?: number }).step === 'number'
            ? (payload as { step: number }).step
            : 0.18;
          boomOffset = THREE.MathUtils.clamp(boomOffset + dir * step, -0.95, 0.95);
          const now = Date.now();
          if (now - lastCraneSoundTime >= 220) {
            lastCraneSoundTime = now;
            soundEngine.playCraneMove();
          }
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
              const isGoldenFinal = isBonus && droppedCount === totalDrops;
              const placed = new THREE.Mesh(
                new THREE.BoxGeometry(0.86, 0.86, 0.86),
                new THREE.MeshStandardMaterial({
                  map: paintedWoodTex,
                  color: isGoldenFinal
                    ? '#F2BE2C'
                    : droppedCount === 1
                      ? '#4E92D6'
                      : '#48A868',
                  emissive: isGoldenFinal ? '#B47A0E' : '#000000',
                  emissiveIntensity: isGoldenFinal ? 0.35 : 0,
                  bumpMap: paperBump,
                  bumpScale: 0.025,
                  roughness: isGoldenFinal ? 0.34 : 0.62,
                  metalness: isGoldenFinal ? 0.45 : 0.05,
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
                // Hoist up for next crate; tint hanging crate gold if next is the Golden Finale!
                const nextIsGold = isBonus && droppedCount === totalDrops - 1;
                const hangMat = hangingCrate.material as THREE.MeshStandardMaterial;
                hangMat.color.set(nextIsGold ? '#F2BE2C' : '#48A868');
                hangMat.metalness = nextIsGold ? 0.45 : 0.05;
                targetCableLength = Math.max(0.55, 1.1 - droppedCount * 0.2);
                boomOffset = droppedCount % 2 === 1 ? 0.68 : -0.62;
                phase = 'BALANCE';
                soundEngine.speakBilingual(
                  nextIsGold ? 'Sekarang angkat Peti Emas ke puncak!' : 'Bagus! Satu peti lagi!',
                  nextIsGold ? 'Now lift the Golden Crate to the top!' : 'Nice! One more crate!',
                );
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

    // Giant 3D Letter Emergency Storybook Plaque near fire truck
    const paperBump = getPaperBumpTexture(maxAnisotropy);
    const signTex = createSignTexture(
      targetLetter.letter,
      `${targetLetter.wordId} / ${targetLetter.wordEn}`,
      '#CB3329',
      '#FFFDF6',
      maxAnisotropy,
    );
    const signGroup = new THREE.Group();
    signGroup.position.set(-1.2, 0, 0.2);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 2.2, 10),
      new THREE.MeshStandardMaterial({ color: '#6E4A2D', roughness: 0.84 }),
    );
    post.position.y = 1.1;
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.4, 0.18),
      new THREE.MeshStandardMaterial({
        map: signTex,
        bumpMap: paperBump,
        bumpScale: 0.015,
        roughness: 0.58,
      }),
    );
    board.position.y = 2.8;
    board.castShadow = true;
    signGroup.add(post, board);
    group.add(signGroup);

    // Storybook Timber-and-Terracotta Village Cottage with Animated 3D Flame Clusters
    const building = new THREE.Group();
    building.position.set(3.2, 0, -0.4);
    const bWall = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 3.4, 2.8),
      new THREE.MeshStandardMaterial({
        map: createCottageWallTexture('#F6ECD7', '#5E422E', maxAnisotropy),
        bumpMap: paperBump,
        bumpScale: 0.03,
        roughness: 0.88,
      }),
    );
    bWall.position.y = 1.7;
    bWall.castShadow = true;
    bWall.receiveShadow = true;
    const bRoofMat = new THREE.MeshStandardMaterial({
      map: createRoofShingleTexture('terracotta', maxAnisotropy),
      bumpMap: paperBump,
      bumpScale: 0.04,
      roughness: 0.82,
    });
    const bRoof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.85, 4), bRoofMat);
    bRoof.position.y = 4.32;
    bRoof.rotation.y = Math.PI / 4;
    bRoof.castShadow = true;
    const bChimney = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 1.35, 0.65),
      new THREE.MeshStandardMaterial({ color: '#CFC2AD', roughness: 0.9 }),
    );
    bChimney.position.set(1.25, 4.7, -0.45);
    building.add(bWall, bRoof, bChimney);

    // Storybook windows with shutters, flower boxes & oak door with porch awning
    const wMat = new THREE.MeshStandardMaterial({
      color: '#CBE7F8',
      emissive: '#FFE8B0',
      emissiveIntensity: 0.16,
      roughness: 0.25,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: '#5E422E', roughness: 0.85 });
    const shutterMat = new THREE.MeshStandardMaterial({ color: '#568055', roughness: 0.8 });
    const dMat = new THREE.MeshStandardMaterial({
      map: createWoodPlankTexture('#8E5A32', maxAnisotropy),
      roughness: 0.82,
    });
    const bDoor = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.38, 0.14), dMat);
    bDoor.position.set(0, 0.69, 1.42);
    const porch = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.14, 0.66), bRoofMat);
    porch.position.set(0, 1.54, 1.66);
    porch.rotation.x = 0.28;
    building.add(bDoor, porch);

    for (const wx of [-1.3, 1.3]) {
      const wFrame = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.98, 0.1), frameMat);
      wFrame.position.set(wx, 2.2, 1.41);
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.84, 0.12), wMat);
      win.position.set(wx, 2.2, 1.43);
      const shL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.88, 0.1), shutterMat);
      shL.position.set(wx - 0.62, 2.2, 1.43);
      const shR = shL.clone();
      shR.position.x = wx + 0.62;
      const fBox = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.22, 0.26), frameMat);
      fBox.position.set(wx, 1.66, 1.52);
      building.add(wFrame, win, shL, shR, fBox);
    }
    // Bonus 2nd Mission: Tall Storybook Village Bell Tower Spire & Clock Face
    if (isBonus) {
      const belfry = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 1.9, 1.9),
        new THREE.MeshStandardMaterial({
          map: createCottageWallTexture('#F6ECD7', '#5E422E', maxAnisotropy),
          roughness: 0.88,
        }),
      );
      belfry.position.set(0, 5.15, 0);
      belfry.castShadow = true;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.6, 4), bRoofMat);
      spire.position.set(0, 6.85, 0);
      spire.rotation.y = Math.PI / 4;
      spire.castShadow = true;
      const clockFace = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 0.1, 18),
        new THREE.MeshStandardMaterial({ color: '#FFFDF5', roughness: 0.45 }),
      );
      clockFace.rotation.x = Math.PI / 2;
      clockFace.position.set(0, 5.25, 0.98);
      const clockRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.54, 0.06, 8, 20),
        new THREE.MeshStandardMaterial({ color: '#DFAF4B', metalness: 0.55, roughness: 0.35 }),
      );
      clockRim.position.set(0, 5.25, 1.01);
      building.add(belfry, spire, clockFace, clockRim);
    }

    // Invisible front spray plane so continuous drag-to-spray sweeps smoothly across the building
    const spraySurface = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, isBonus ? 7.6 : 5.4),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    spraySurface.position.set(0, isBonus ? 3.5 : 2.5, 1.55);
    spraySurface.userData.isSpraySurface = true;
    building.add(spraySurface);
    group.add(building);
    raycastTargets.push(spraySurface);

    // Flame clusters (+1 high bell-tower flame in Bonus 2nd Mission!)
    const flamePositions: THREE.Vector3[] = isBonus
      ? ageMode === 'toddler'
        ? [
            new THREE.Vector3(1.9, 2.1, 1.15),
            new THREE.Vector3(3.2, 5.1, 0.72),
            new THREE.Vector3(4.5, 2.1, 1.15),
            new THREE.Vector3(3.2, 3.6, 0.95),
          ]
        : [
            new THREE.Vector3(1.9, 2.1, 1.15),
            new THREE.Vector3(3.2, 5.3, 0.72),
            new THREE.Vector3(4.5, 2.1, 1.15),
            new THREE.Vector3(3.2, 3.6, 0.95),
            new THREE.Vector3(3.2, 0.95, 1.25),
          ]
      : ageMode === 'toddler'
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
    let useDragTarget = false;
    let lastSpraySoundTime = 0;
    const _nozzleWorld = new THREE.Vector3();
    const _dragTargetPos = new THREE.Vector3();

    const emit = () => {
      const remaining = flames.filter((f) => f.alive).map((f) => f.index);
      let promptId = `Cari huruf ${targetLetter.letter}! (${targetLetter.letter} untuk ${targetLetter.wordId})`;
      let promptEn = `Find letter ${targetLetter.letter}! (${targetLetter.letter} for ${targetLetter.wordEn})`;
      if (phase === 'DRIVE') {
        promptId = 'Wiu-wiu! Truk Pemadam melaju ke lokasi api!';
        promptEn = 'Wee-woo! Fire Truck rushing to the fire!';
      } else if (phase === 'SPRAY') {
        promptId = `Ketuk atau geser jari ke api di rumah 3D! (${remaining.length} api tersisa)`;
        promptEn = `Tap or drag across the 3D flames to spray water! (${remaining.length} left)`;
      } else if (phase === 'DONE') {
        promptId = 'Semua api padam! Pahlawan pemadam hebat!';
        promptEn = 'All fires are out! Hero firefighter!';
      }

      callbacks.onSnapshot({
        vehicleId: 'pemadam',
        missionVariant,
        phase,
        promptId,
        promptEn,
        targetLetter,
        letterChoices,
        flamesRemaining: remaining,
        totalFlames: flames.length,
        hintKey: activeHintKey,
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
      resetIdle();
      useDragTarget = false;
      activeSprayTarget = idx;
      sprayTimer = 0.65;
      waterJetGroup.visible = true;
      const now = Date.now();
      if (now - lastSpraySoundTime >= 160) {
        lastSpraySoundTime = now;
        soundEngine.playWaterSplash();
      }
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

        // Update 3D arcing water jet drops (supports both single tap and continuous drag-spray)
        if (sprayTimer > 0 && (useDragTarget || activeSprayTarget !== null)) {
          sprayTimer -= dt;
          if (truck.nozzleGroup) {
            truck.nozzleGroup.getWorldPosition(_nozzleWorld);
            const targetPos = useDragTarget
              ? _dragTargetPos
              : flamePositions[activeSprayTarget!];
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
            useDragTarget = false;
          }
        }

        tickIdle(
          dt,
          phase === 'LETTER' || phase === 'SPRAY',
          () => {
            if (phase === 'LETTER') {
              return {
                key: `letter:${targetLetter.letter}`,
                sayId: `Ini huruf ${targetLetter.letter}! Ketuk huruf ${targetLetter.letter}!`,
                sayEn: `Here is letter ${targetLetter.letter}! Tap ${targetLetter.letter}!`,
              };
            }
            const firstAlive = flames.find((fl) => fl.alive);
            if (!firstAlive) return null;
            return {
              key: `flame:${firstAlive.index}`,
              sayId: `Ayo semprot api nomor ${firstAlive.index + 1}!`,
              sayEn: `Spray fire number ${firstAlive.index + 1}!`,
            };
          },
          emit,
        );
      },
      supportsDragSpray: () => phase === 'SPRAY',
      handleDragSpray: (worldPoint, hitObj) => {
        if (phase !== 'SPRAY') return;
        resetIdle();
        _dragTargetPos.copy(worldPoint);
        useDragTarget = true;
        sprayTimer = 0.25;
        waterJetGroup.visible = true;

        const now = Date.now();
        if (now - lastSpraySoundTime >= 240) {
          lastSpraySoundTime = now;
          soundEngine.playWaterSplash();
        }

        // Direct hit on flame sphere
        if (hitObj && typeof hitObj.userData.flameIndex === 'number') {
          sprayFlame(hitObj.userData.flameIndex);
          // Keep smooth drag jet aiming at finger while dragging
          useDragTarget = true;
          sprayTimer = 0.25;
          return;
        }

        // Proximity extinguish while sweeping jet across burning wall/roof
        for (const f of flames) {
          if (!f.alive) continue;
          const dx = worldPoint.x - flamePositions[f.index].x;
          const dy = worldPoint.y - (flamePositions[f.index].y + 0.45);
          if (dx * dx + dy * dy <= 1.25 * 1.25) {
            sprayFlame(f.index);
            useDragTarget = true;
            sprayTimer = 0.25;
            break;
          }
        }
      },
      stopDragSpray: () => {
        if (useDragTarget) {
          sprayTimer = Math.min(sprayTimer, 0.12);
        }
      },
      handleRaycastHit: (hitObj) => {
        if (typeof hitObj.userData.flameIndex === 'number') {
          sprayFlame(hitObj.userData.flameIndex);
        }
      },
      handleAction: (action, payload) => {
        resetIdle();
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
    const paperBump = getPaperBumpTexture(maxAnisotropy);
    const bodyMat = new THREE.MeshStandardMaterial({
      map: createGouachePaintTexture(colorHex, maxAnisotropy),
      bumpMap: paperBump,
      bumpScale: 0.02,
      roughness: 0.62,
    });
    const lidMat = new THREE.MeshStandardMaterial({
      color: '#4E4138',
      bumpMap: paperBump,
      bumpScale: 0.018,
      roughness: 0.72,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.65, 1.25), bodyMat);
    body.position.y = 0.825;
    body.castShadow = true;
    body.receiveShadow = true;
    targetGroup.add(body);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.2, 1.35), lidMat);
    lid.position.y = 1.72;
    targetGroup.add(lid);

    const signTex = createSignTexture(labelBig, labelSub, colorHex, '#FFFDF6', maxAnisotropy);
    const labelPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 1.18),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.56 }),
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

  const orgTex = makeBin(orgBinGroup, '#2B8E4C', 'ORG', 'Organik', 'organic');
  const nonOrgTex = makeBin(nonOrgBinGroup, '#DCA21A', 'NON', 'Non-Organik', 'non-organic');

  // Bonus 2nd Mission: Park Picnic Cleanup Bench & Checkered Picnic Mat beside bins
  if (isBonus) {
    const picnicGroup = new THREE.Group();
    picnicGroup.position.set(-2.0, 0, 4.15);
    const matCloth = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.05, 2.4),
      new THREE.MeshStandardMaterial({
        map: createGouachePaintTexture('#E5644E', maxAnisotropy),
        roughness: 0.88,
      }),
    );
    matCloth.position.y = 0.03;
    matCloth.receiveShadow = true;
    const benchWood = new THREE.MeshStandardMaterial({
      map: createWoodPlankTexture('#A86F38', maxAnisotropy),
      roughness: 0.82,
    });
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.6), benchWood);
    benchSeat.position.set(0, 0.56, -1.65);
    benchSeat.castShadow = true;
    const benchBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.44, 0.12), benchWood);
    benchBack.position.set(0, 0.92, -1.9);
    benchBack.castShadow = true;
    picnicGroup.add(matCloth, benchSeat, benchBack);
    group.add(picnicGroup);
  }

  // Generate balanced list of waste items (+2 extra festive picnic items in Bonus mode!)
  const organics = WASTE_CATALOG.filter((w) => w.category === 'organic');
  const nonOrganics = WASTE_CATALOG.filter((w) => w.category === 'non-organic');
  const itemPool = isBonus
    ? ageMode === 'toddler'
      ? [organics[0], nonOrganics[0], organics[1], nonOrganics[1], organics[2], nonOrganics[2]]
      : [organics[0], nonOrganics[0], organics[1], nonOrganics[1], organics[2], nonOrganics[2], organics[0], nonOrganics[1]]
    : ageMode === 'toddler'
      ? [organics[0], nonOrganics[0], organics[1], nonOrganics[1]]
      : [organics[0], nonOrganics[0], organics[1], nonOrganics[1], organics[2], nonOrganics[2]];

  const wasteItems: WasteItemDef[] = itemPool.map((w, idx) => ({
    ...w,
    uid: idx,
    sorted: false,
  }));

  const wasteVisuals: { uid: number; mesh: THREE.Group; targetPos: THREE.Vector3 }[] = [];
  const colsPerWasteRow = wasteItems.length > 6 ? 4 : 3;
  wasteItems.forEach((item, idx) => {
    const m = buildWasteProp(item.kind);
    const col = idx % colsPerWasteRow;
    const row = Math.floor(idx / colsPerWasteRow);
    const px = (colsPerWasteRow === 4 ? -3.6 : -3.4) + col * (colsPerWasteRow === 4 ? 1.15 : 1.45);
    const pz = 3.5 + row * 1.15;
    m.position.set(px, 0.06, pz);
    m.scale.set(1.3, 1.3, 1.3);

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
      ? isBonus
        ? `Piknik Taman! Masukkan ${selectedItem.nameId} ke tong Organik atau Non-Organik!`
        : `Masukkan ${selectedItem.nameId} ke tong Organik atau Non-Organik!`
      : 'Pilih sampah untuk dimasukkan ke tong yang tepat!';
    let promptEn = selectedItem
      ? isBonus
        ? `Park Picnic! Put ${selectedItem.nameEn} into the Organic or Non-Organic bin!`
        : `Put ${selectedItem.nameEn} into the Organic or Non-Organic bin!`
      : 'Pick a waste item to sort into the right bin!';

    if (phase === 'COUNT') {
      const catId = wasteCountCategory === 'organic' ? 'Organik (Hijau)' : 'Non-Organik (Kuning)';
      const catEn = wasteCountCategory === 'organic' ? 'Organic (Green)' : 'Non-Organic (Yellow)';
      promptId = `Hebat! Sekarang hitung, ada berapa sampah di tong ${catId}?`;
      promptEn = `Awesome! How many items are in the ${catEn} bin?`;
    } else if (phase === 'DRIVE' || phase === 'DONE') {
      promptId = isBonus
        ? 'Taman piknik bersih ceria! Truk Sampah berangkat!'
        : 'Benar! Truk Sampah mengangkut sampah daur ulang!';
      promptEn = isBonus
        ? 'Picnic park is sparkling clean! Garbage Truck rolling!'
        : 'Correct! Garbage Truck is taking the bins away!';
    }

    callbacks.onSnapshot({
      vehicleId: 'sampah',
      missionVariant,
      phase,
      promptId,
      promptEn,
      wasteItems: wasteItems.map((w) => ({ ...w })),
      selectedWasteUid,
      organicCount,
      nonOrganicCount,
      wasteCountCategory,
      wasteCountChoices,
      hintKey: activeHintKey,
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

      tickIdle(
        dt,
        phase === 'SORT' || phase === 'COUNT',
        () => {
          if (phase === 'SORT') {
            const selectedItem =
              wasteItems.find((w) => w.uid === selectedWasteUid && !w.sorted) ||
              wasteItems.find((w) => !w.sorted);
            if (!selectedItem) return null;
            selectedWasteUid = selectedItem.uid;
            const catId = selectedItem.category === 'organic' ? 'Organik' : 'Non Organik';
            const catEn = selectedItem.category === 'organic' ? 'Organic' : 'Non-Organic';
            return {
              key: `bin:${selectedItem.category}`,
              sayId: `Masukkan ${selectedItem.nameId} ke tong ${catId}!`,
              sayEn: `Put ${selectedItem.nameEn} into the ${catEn} bin!`,
            };
          }
          const target = wasteCountCategory === 'organic' ? organicCount : nonOrganicCount;
          const nw = NUMBER_WORDS[target];
          return {
            key: `wasteCount:${target}`,
            sayId: `Hitung bareng yuk! Ada ${nw.id}!`,
            sayEn: `Let's count! There are ${nw.en}!`,
          };
        },
        emit,
      );
    },
    handleRaycastHit: (hitObj) => {
      if (phase !== 'SORT') return;
      resetIdle();
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
      resetIdle();
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
