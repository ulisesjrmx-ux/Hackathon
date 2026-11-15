export type PlanetId = 'moon' | 'mars';

export type Language = 'es' | 'en';

export type GamePhase =
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'STORY_POPUP'
  | 'TAKEOFF_TRANSITION'
  | 'SHIP_DESTROYED'
  | 'OUT_OF_FUEL'
  | 'ALL_COMPLETED';

export type ObjectShape = 'probe' | 'beacon' | 'rover' | 'seismic';

export interface RescueObject {
  id: string;
  planet: PlanetId;
  name: string;
  sector: string;
  x: number;
  y: number;
  orbitCenterX: number;
  orbitCenterY: number;
  orbitRadiusX: number;
  orbitRadiusY: number;
  orbitSpeed: number;
  orbitAngle: number;
  vx?: number;
  vy?: number;
  shape: ObjectShape;
  frequency: string;
  points: number;
  transmissionTitle: string;
  transmissionSummary: string;
  telemetryReading: string;
  discovered: boolean;
  downloadProgress: number; // 0 to 1
  storyTitle?: string;
  storyImageUrl?: string;
}

export interface CrystalNode {
  id: string;
  x: number;
  y: number;
  value: number;
  collected: boolean;
  pulseOffset: number;
}

export interface CraterFeature {
  x: number;
  y: number;
  radius: number;
  depth: number;
  rimHighlight: number;
}

export interface RidgeFeature {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

export interface PlanetConfig {
  id: PlanetId;
  name: string;
  sectorName: string;
  gravityLabel: string;
  surfaceTemp: string;
  worldWidth: number;
  worldHeight: number;
  surfaceBaseColor: string;
  surfaceSecondaryColor: string;
  craterColor: string;
  craterRimColor: string;
  gridColor: string;
  accentColor: string;
  crystalColor: string;
  dustColor: string;
  planetSphereColors: [string, string, string];
  atmosphereGlow: string;
  targetPlanetId: PlanetId;
  targetPlanetName: string;
  isCircularMap?: boolean;
  mapRadius?: number;
  surfaceImageUrl?: string;
}

export interface ShipState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  thrusting: boolean;
  boosting: boolean;
  boostEnergy: number; // 0 to 100
  hull: number; // 0 to 100
  invulnTimer: number; // seconds
}

export interface LogEntry {
  id: string;
  objectId: string;
  planet: PlanetId;
  planetName: string;
  objectName: string;
  sector: string;
  coordinates: string;
  frequency: string;
  transmissionTitle: string;
  transmissionSummary: string;
  telemetryReading: string;
  pointsEarned: number;
  timestamp: string;
}

export interface TelemetryToast {
  id: string;
  objectId?: string;
  title: string;
  subtitle: string;
  reading: string;
  points: number;
  planet: PlanetId;
}

export interface TransitionState {
  fromPlanet: PlanetId;
  toPlanet: PlanetId;
  progress: number; // 0 to 1
  stageLabel: string;
}
