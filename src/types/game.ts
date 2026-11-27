export type VehicleId =
  | 'molen'
  | 'angkut'
  | 'tangki'
  | 'crane'
  | 'pemadam'
  | 'sampah'
  | 'ekskavator'
  | 'bus';

export type AgeMode = 'toddler' | 'preschool';

export type LanguageMode = 'bilingual' | 'id' | 'en';

export type ViewMode = 'GARAGE' | 'MISSION';

export type MissionVariant = 'classic' | 'bonus';

export const BONUS_ELIGIBLE_VEHICLES: VehicleId[] = [
  'molen',
  'angkut',
  'tangki',
  'crane',
  'pemadam',
  'sampah',
];

export function hasBonusMission(vehicleId: VehicleId): boolean {
  return BONUS_ELIGIBLE_VEHICLES.includes(vehicleId);
}

export interface MissionVariantMeta {
  classicId: string;
  classicEn: string;
  bonusId: string;
  bonusEn: string;
}

export const MISSION_VARIANT_META: Partial<Record<VehicleId, MissionVariantMeta>> = {
  molen: {
    classicId: 'Bangun Kota',
    classicEn: 'Town Build',
    bonusId: 'Kincir Taman',
    bonusEn: 'Windmill',
  },
  angkut: {
    classicId: 'Muatan Tunggal',
    classicEn: 'Single Cargo',
    bonusId: 'Keranjang Panen',
    bonusEn: 'Harvest Mix',
  },
  tangki: {
    classicId: 'Isi Tangki',
    classicEn: 'Fill Tank',
    bonusId: 'Taman Bunga',
    bonusEn: 'Flower Garden',
  },
  crane: {
    classicId: 'Seimbangkan',
    classicEn: 'Balance Load',
    bonusId: 'Peti Emas',
    bonusEn: 'Golden Stack',
  },
  pemadam: {
    classicId: 'Pondok Desa',
    classicEn: 'Village Cottage',
    bonusId: 'Menara Lonceng',
    bonusEn: 'Bell Tower',
  },
  sampah: {
    classicId: 'Bersih Jalan',
    classicEn: 'Street Sort',
    bonusId: 'Piknik Taman',
    bonusEn: 'Park Picnic',
  },
};

/** Return localized string for single-slot UI labels */
export function pickLang(lang: LanguageMode, idText: string, enText: string, sep = ' · '): string {
  if (lang === 'id') return idText;
  if (lang === 'en') return enText;
  return `${idText}${sep}${enText}`;
}

export interface VehicleConfig {
  id: VehicleId;
  nameId: string;
  nameEn: string;
  topicId: string;
  topicEn: string;
  accentHex: string;
  accentDarkHex: string;
  lightBgHex: string;
  housePos: [number, number, number];
  houseRotY: number;
  garagePos: [number, number, number];
  garageRotY: number;
}

// Compute each vehicle's wide crescent cottage & interior parked truck coordinates
// so every truck rests snugly inside its open-archway house peeking out toward the plaza.
function makeCrescentSlot(index: number): {
  housePos: [number, number, number];
  houseRotY: number;
  garagePos: [number, number, number];
  garageRotY: number;
} {
  // 8 cottages evenly distributed along a wide crescent ellipse from -72 deg to +72 deg
  const t = index / 7;
  const phi = (-72 + t * 144) * (Math.PI / 180);
  const hx = Number((16.8 * Math.sin(phi)).toFixed(2));
  const hz = Number((-2.0 - 12.6 * Math.cos(phi)).toFixed(2));
  // Face each open archway gently inward toward the sunlit plaza & viewer
  const houseRotY = Number(Math.atan2(0 - hx, 8.5 - hz).toFixed(3));
  // Truck local +X points straight out along house local +Z when rotated by houseRotY - PI/2
  const garageRotY = Number((houseRotY - Math.PI / 2).toFixed(3));
  // Tuck truck inside the house bay with its cheerful front grille peeking slightly out the arch
  const peekOffset = 0.68;
  const gx = Number((hx + Math.sin(houseRotY) * peekOffset).toFixed(2));
  const gz = Number((hz + Math.cos(houseRotY) * peekOffset).toFixed(2));
  return {
    housePos: [hx, 0, hz],
    houseRotY,
    garagePos: [gx, 0, gz],
    garageRotY,
  };
}

export const VEHICLES: VehicleConfig[] = [
  {
    id: 'molen',
    nameId: 'Truk Molen',
    nameEn: 'Cement Mixer',
    topicId: 'Warna',
    topicEn: 'Colors',
    accentHex: '#F59E0B',
    accentDarkHex: '#B45309',
    lightBgHex: '#FEF3C7',
    ...makeCrescentSlot(0),
  },
  {
    id: 'angkut',
    nameId: 'Truk Angkut',
    nameEn: 'Cargo Truck',
    topicId: 'Angka',
    topicEn: 'Numbers',
    accentHex: '#2563EB',
    accentDarkHex: '#1D4ED8',
    lightBgHex: '#DBEAFE',
    ...makeCrescentSlot(1),
  },
  {
    id: 'tangki',
    nameId: 'Truk Tangki',
    nameEn: 'Water Tanker',
    topicId: 'Pipa Air',
    topicEn: 'Water Pipes',
    accentHex: '#0284C7',
    accentDarkHex: '#0369A1',
    lightBgHex: '#E0F2FE',
    ...makeCrescentSlot(2),
  },
  {
    id: 'crane',
    nameId: 'Truk Crane',
    nameEn: 'Crane Truck',
    topicId: 'Hitung & Seimbang',
    topicEn: 'Count & Balance',
    accentHex: '#EAB308',
    accentDarkHex: '#A16207',
    lightBgHex: '#FEF9C3',
    ...makeCrescentSlot(3),
  },
  {
    id: 'ekskavator',
    nameId: 'Truk Ekskavator',
    nameEn: 'Excavator',
    topicId: 'Bentuk & Gali',
    topicEn: 'Shapes & Dig',
    accentHex: '#EA580C',
    accentDarkHex: '#9A3412',
    lightBgHex: '#FFEDD5',
    ...makeCrescentSlot(4),
  },
  {
    id: 'pemadam',
    nameId: 'Truk Pemadam',
    nameEn: 'Fire Truck',
    topicId: 'Huruf & Api',
    topicEn: 'Letters & Fire',
    accentHex: '#DC2626',
    accentDarkHex: '#991B1B',
    lightBgHex: '#FEE2E2',
    ...makeCrescentSlot(5),
  },
  {
    id: 'sampah',
    nameId: 'Truk Sampah',
    nameEn: 'Garbage Truck',
    topicId: 'Pilah Sampah',
    topicEn: 'Sort & Count',
    accentHex: '#16A34A',
    accentDarkHex: '#15803D',
    lightBgHex: '#DCFCE7',
    ...makeCrescentSlot(6),
  },
  {
    id: 'bus',
    nameId: 'Bus Sekolah',
    nameEn: 'School Bus',
    topicId: 'Lampu & Pola',
    topicEn: 'Traffic & Patterns',
    accentHex: '#CA8A04',
    accentDarkHex: '#854D0E',
    lightBgHex: '#FEF08A',
    ...makeCrescentSlot(7),
  },
];

export const VEHICLE_MAP: Record<VehicleId, VehicleConfig> = VEHICLES.reduce(
  (acc, v) => {
    acc[v.id] = v;
    return acc;
  },
  {} as Record<VehicleId, VehicleConfig>,
);

export interface ColorOption {
  id: 'red' | 'yellow' | 'blue' | 'orange' | 'green' | 'purple';
  nameId: string;
  nameEn: string;
  hex: string;
}

export const PRIMARY_COLORS: ColorOption[] = [
  { id: 'red', nameId: 'Merah', nameEn: 'Red', hex: '#EF4444' },
  { id: 'yellow', nameId: 'Kuning', nameEn: 'Yellow', hex: '#FACC15' },
  { id: 'blue', nameId: 'Biru', nameEn: 'Blue', hex: '#3B82F6' },
];

export const ALL_COLORS: Record<ColorOption['id'], ColorOption> = {
  red: { id: 'red', nameId: 'Merah', nameEn: 'Red', hex: '#EF4444' },
  yellow: { id: 'yellow', nameId: 'Kuning', nameEn: 'Yellow', hex: '#FACC15' },
  blue: { id: 'blue', nameId: 'Biru', nameEn: 'Blue', hex: '#3B82F6' },
  orange: { id: 'orange', nameId: 'Oranye', nameEn: 'Orange', hex: '#F97316' },
  green: { id: 'green', nameId: 'Hijau', nameEn: 'Green', hex: '#22C55E' },
  purple: { id: 'purple', nameId: 'Ungu', nameEn: 'Purple', hex: '#A855F7' },
};

export function mixTwoColors(a: ColorOption['id'], b: ColorOption['id']): ColorOption {
  if (a === b) return ALL_COLORS[a];
  const pair = [a, b].sort().join('+');
  if (pair === 'red+yellow') return ALL_COLORS.orange;
  if (pair === 'blue+yellow') return ALL_COLORS.green;
  if (pair === 'blue+red') return ALL_COLORS.purple;
  return ALL_COLORS[a];
}

export type MolenBlueprintId = 'house' | 'tower' | 'bridge' | 'windmill';

export interface MolenBlueprintOption {
  id: MolenBlueprintId;
  nameId: string;
  nameEn: string;
}

export const MOLEN_BLUEPRINTS: MolenBlueprintOption[] = [
  { id: 'house', nameId: 'Rumah', nameEn: 'House' },
  { id: 'tower', nameId: 'Menara', nameEn: 'Tower' },
  { id: 'bridge', nameId: 'Jembatan', nameEn: 'Bridge' },
];

export interface NumberWord {
  value: number;
  id: string;
  en: string;
}

export const NUMBER_WORDS: Record<number, NumberWord> = {
  1: { value: 1, id: 'Satu', en: 'One' },
  2: { value: 2, id: 'Dua', en: 'Two' },
  3: { value: 3, id: 'Tiga', en: 'Three' },
  4: { value: 4, id: 'Empat', en: 'Four' },
  5: { value: 5, id: 'Lima', en: 'Five' },
  6: { value: 6, id: 'Enam', en: 'Six' },
  7: { value: 7, id: 'Tujuh', en: 'Seven' },
  8: { value: 8, id: 'Delapan', en: 'Eight' },
  9: { value: 9, id: 'Sembilan', en: 'Nine' },
  10: { value: 10, id: 'Sepuluh', en: 'Ten' },
};

export type CargoTypeId = 'apple' | 'wood' | 'box' | 'brick';

export interface CargoOption {
  id: CargoTypeId;
  nameId: string;
  nameEn: string;
  hex: string;
}

export const CARGO_OPTIONS: CargoOption[] = [
  { id: 'apple', nameId: 'Apel', nameEn: 'Apples', hex: '#EF4444' },
  { id: 'wood', nameId: 'Balok Kayu', nameEn: 'Wood Blocks', hex: '#D97706' },
  { id: 'box', nameId: 'Kotak Mainan', nameEn: 'Toy Boxes', hex: '#8B5CF6' },
  { id: 'brick', nameId: 'Batu Bata', nameEn: 'Bricks', hex: '#EA580C' },
];

export interface LetterEntry {
  letter: string;
  wordId: string;
  wordEn: string;
}

export const LETTERS_TODDLER: LetterEntry[] = [
  { letter: 'A', wordId: 'Api', wordEn: 'Apple' },
  { letter: 'B', wordId: 'Bola', wordEn: 'Ball' },
  { letter: 'E', wordId: 'Elang', wordEn: 'Eagle' },
  { letter: 'I', wordId: 'Ikan', wordEn: 'Igloo' },
  { letter: 'O', wordId: 'Obat', wordEn: 'Orange' },
  { letter: 'U', wordId: 'Ular', wordEn: 'Umbrella' },
];

export const LETTERS_PRESCHOOL: LetterEntry[] = [
  { letter: 'A', wordId: 'Api', wordEn: 'Apple' },
  { letter: 'B', wordId: 'Bola', wordEn: 'Ball' },
  { letter: 'C', wordId: 'Ceri', wordEn: 'Car' },
  { letter: 'D', wordId: 'Daun', wordEn: 'Duck' },
  { letter: 'E', wordId: 'Elang', wordEn: 'Elephant' },
  { letter: 'F', wordId: 'Foto', wordEn: 'Fire' },
  { letter: 'G', wordId: 'Gajah', wordEn: 'Giraffe' },
  { letter: 'H', wordId: 'Hujan', wordEn: 'House' },
  { letter: 'I', wordId: 'Ikan', wordEn: 'Igloo' },
  { letter: 'J', wordId: 'Jeruk', wordEn: 'Juice' },
  { letter: 'K', wordId: 'Kapal', wordEn: 'Kite' },
  { letter: 'L', wordId: 'Lampu', wordEn: 'Lion' },
  { letter: 'M', wordId: 'Mobil', wordEn: 'Moon' },
  { letter: 'N', wordId: 'Nanas', wordEn: 'Nest' },
  { letter: 'O', wordId: 'Obat', wordEn: 'Orange' },
  { letter: 'P', wordId: 'Pohon', wordEn: 'Plane' },
  { letter: 'Q', wordId: 'Quilt', wordEn: 'Queen' },
  { letter: 'R', wordId: 'Roda', wordEn: 'Rocket' },
  { letter: 'S', wordId: 'Surya', wordEn: 'Sun' },
  { letter: 'T', wordId: 'Truk', wordEn: 'Truck' },
  { letter: 'U', wordId: 'Ular', wordEn: 'Umbrella' },
  { letter: 'V', wordId: 'Vas', wordEn: 'Van' },
  { letter: 'W', wordId: 'Wortel', wordEn: 'Whale' },
  { letter: 'X', wordId: 'Xilofon', wordEn: 'Xylophone' },
  { letter: 'Y', wordId: 'Yoyo', wordEn: 'Yacht' },
  { letter: 'Z', wordId: 'Zebra', wordEn: 'Zebra' },
];

export type WasteCategory = 'organic' | 'non-organic';
export type WasteKind = 'banana' | 'apple_core' | 'leaf' | 'bottle' | 'can' | 'cardboard';

export interface WasteItemDef {
  uid: number;
  kind: WasteKind;
  category: WasteCategory;
  nameId: string;
  nameEn: string;
  hex: string;
  sorted: boolean;
}

export const WASTE_CATALOG: Omit<WasteItemDef, 'uid' | 'sorted'>[] = [
  { kind: 'banana', category: 'organic', nameId: 'Kulit Pisang', nameEn: 'Banana Peel', hex: '#FACC15' },
  { kind: 'apple_core', category: 'organic', nameId: 'Sisa Apel', nameEn: 'Apple Core', hex: '#EF4444' },
  { kind: 'leaf', category: 'organic', nameId: 'Daun Kering', nameEn: 'Dry Leaf', hex: '#22C55E' },
  { kind: 'bottle', category: 'non-organic', nameId: 'Botol Plastik', nameEn: 'Plastic Bottle', hex: '#38BDF8' },
  { kind: 'can', category: 'non-organic', nameId: 'Kaleng Bekas', nameEn: 'Tin Can', hex: '#94A3B8' },
  { kind: 'cardboard', category: 'non-organic', nameId: 'Kardus', nameEn: 'Cardboard Box', hex: '#D97706' },
];

export type ShapeId = 'circle' | 'square' | 'triangle' | 'star';

export interface ShapeOption {
  id: ShapeId;
  nameId: string;
  nameEn: string;
  hex: string;
}

export const SHAPE_OPTIONS: ShapeOption[] = [
  { id: 'circle', nameId: 'Lingkaran', nameEn: 'Circle', hex: '#E15A3E' },
  { id: 'square', nameId: 'Persegi', nameEn: 'Square', hex: '#2E7CC2' },
  { id: 'triangle', nameId: 'Segitiga', nameEn: 'Triangle', hex: '#2F9A58' },
  { id: 'star', nameId: 'Bintang', nameEn: 'Star', hex: '#E5A61C' },
];

export const SHAPE_MAP: Record<ShapeId, ShapeOption> = SHAPE_OPTIONS.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<ShapeId, ShapeOption>,
);

export type TrafficLightState = 'red' | 'yellow' | 'green';

export type BusRiderColorId = 'red' | 'blue' | 'yellow' | 'green';

export interface BusRiderColorOption {
  id: BusRiderColorId;
  nameId: string;
  nameEn: string;
  hex: string;
  hatHex: string;
}

export const BUS_RIDER_COLORS: BusRiderColorOption[] = [
  { id: 'red', nameId: 'Merah', nameEn: 'Red', hex: '#E04B3E', hatHex: '#B72F24' },
  { id: 'blue', nameId: 'Biru', nameEn: 'Blue', hex: '#2E7BC6', hatHex: '#1D5894' },
  { id: 'yellow', nameId: 'Kuning', nameEn: 'Yellow', hex: '#F0B928', hatHex: '#C68C0D' },
  { id: 'green', nameId: 'Hijau', nameEn: 'Green', hex: '#38A158', hatHex: '#22723B' },
];

export const BUS_RIDER_COLOR_MAP: Record<BusRiderColorId, BusRiderColorOption> =
  BUS_RIDER_COLORS.reduce(
    (acc, c) => {
      acc[c.id] = c;
      return acc;
    },
    {} as Record<BusRiderColorId, BusRiderColorOption>,
  );

export interface DigMoundState {
  index: number;
  dug: boolean;
  shapeId: ShapeId;
}

export interface PipeTileState {
  index: number;
  row: number;
  col: number;
  type: 'straight' | 'elbow';
  /** Rotation step 0..3 (each step = 90 degrees clockwise) */
  rotation: number;
  connected: boolean;
}

export interface MissionSnapshot {
  vehicleId: VehicleId;
  missionVariant?: MissionVariant;
  phase: string;
  promptId: string;
  promptEn: string;
  // Molen
  selectedColors?: ColorOption['id'][];
  mixedColor?: ColorOption | null;
  molenBlueprint?: MolenBlueprintId;
  molenBonusStage?: 1 | 2;
  structureProgress?: number;
  // Angkut
  cargoType?: CargoTypeId;
  secondaryCargoType?: CargoTypeId;
  primaryCargoCount?: number;
  secondaryCargoCount?: number;
  loadedCount?: number;
  targetCount?: number;
  numberChoices?: number[];
  // Tangki
  pipes?: PipeTileState[];
  pipeCols?: number;
  pipeRows?: number;
  pipeTemplateId?: number;
  tankFill?: number;
  gardenBloom?: number;
  // Crane
  craneCountTarget?: number;
  craneCountChoices?: number[];
  craneBoomOffset?: number; // -1..1
  craneTolerance?: number;
  craneBalanced?: boolean;
  craneDroppedCount?: number;
  craneTotalDrops?: number;
  // Pemadam
  targetLetter?: LetterEntry;
  letterChoices?: LetterEntry[];
  flamesRemaining?: number[];
  totalFlames?: number;
  // Sampah
  wasteItems?: WasteItemDef[];
  selectedWasteUid?: number | null;
  organicCount?: number;
  nonOrganicCount?: number;
  wasteCountCategory?: WasteCategory;
  wasteCountChoices?: number[];
  // Ekskavator (Shapes & Digging)
  digMounds?: DigMoundState[];
  discoveredShapes?: ShapeId[];
  placedShapes?: ShapeId[];
  activeShapeId?: ShapeId | null;
  // Bus Sekolah (Traffic Lights & Patterns)
  trafficLight?: TrafficLightState;
  busProgress?: number;
  patternSequence?: BusRiderColorId[];
  patternChoices?: BusRiderColorId[];
  ridersBoarded?: number;
  totalRidersToBoard?: number;
  // General
  hintKey?: string | null;
  wrongFeedbackKey?: number;
  completed?: boolean;
}
