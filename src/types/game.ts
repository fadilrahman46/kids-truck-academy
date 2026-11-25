export type VehicleId = 'molen' | 'angkut' | 'tangki' | 'crane' | 'pemadam' | 'sampah';

export type AgeMode = 'toddler' | 'preschool';

export type ViewMode = 'GARAGE' | 'MISSION';

export interface VehicleConfig {
  id: VehicleId;
  nameId: string;
  nameEn: string;
  topicId: string;
  topicEn: string;
  accentHex: string;
  accentDarkHex: string;
  lightBgHex: string;
  garagePos: [number, number, number];
  garageRotY: number;
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
    garagePos: [-7.5, 0, -2.5],
    garageRotY: 0.45,
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
    garagePos: [-4.5, 0, -5.8],
    garageRotY: 0.22,
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
    garagePos: [-1.5, 0, -7.2],
    garageRotY: 0.08,
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
    garagePos: [1.9, 0, -7.2],
    garageRotY: -0.08,
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
    garagePos: [5.0, 0, -5.8],
    garageRotY: -0.25,
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
    garagePos: [7.6, 0, -2.5],
    garageRotY: -0.48,
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
  { letter: 'F', wordId: 'Foto', wordEn: 'Fire' },
  { letter: 'G', wordId: 'Gajah', wordEn: 'Giraffe' },
  { letter: 'H', wordId: 'Hujan', wordEn: 'House' },
  { letter: 'K', wordId: 'Kapal', wordEn: 'Kite' },
  { letter: 'L', wordId: 'Lampu', wordEn: 'Lion' },
  { letter: 'M', wordId: 'Mobil', wordEn: 'Moon' },
  { letter: 'P', wordId: 'Pohon', wordEn: 'Plane' },
  { letter: 'R', wordId: 'Roda', wordEn: 'Rocket' },
  { letter: 'S', wordId: 'Surya', wordEn: 'Sun' },
  { letter: 'T', wordId: 'Truk', wordEn: 'Truck' },
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
  phase: string;
  promptId: string;
  promptEn: string;
  // Molen
  selectedColors?: ColorOption['id'][];
  mixedColor?: ColorOption | null;
  structureProgress?: number;
  // Angkut
  cargoType?: CargoTypeId;
  loadedCount?: number;
  targetCount?: number;
  numberChoices?: number[];
  // Tangki
  pipes?: PipeTileState[];
  pipeCols?: number;
  pipeRows?: number;
  tankFill?: number;
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
  // General
  wrongFeedbackKey?: number;
  completed?: boolean;
}
