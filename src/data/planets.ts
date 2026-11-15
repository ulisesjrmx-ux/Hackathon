import { CraterFeature, CrystalNode, PlanetConfig, PlanetId, RescueObject, RidgeFeature } from '../types/game';

export const WORLD_WIDTH = 2600;
export const WORLD_HEIGHT = 2200;
export const PLANET_VISUAL_RADIUS = 640;

export const SHIP_IDLE_IMAGE_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-14_at_4.04.51_PM_91056862.jpeg';
export const SHIP_THRUST_IMAGE_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-14_at_4.04.09_PM_109ec7cb.jpeg';
export const ASTEROID_IMAGE_URL =
  '/assets/aistudio/image_ac8dfdf7.png';
export const APOLLO_STORY_IMAGE_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-15_at_11.55.45_AM_c6d47da0.jpeg';
export const LRV_STORY_IMAGE_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-15_at_12.39.09_PM_8adbbf3c.jpeg';
export const ALSEP_STORY_IMAGE_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-15_at_12.30.01_PM__1__a9fd61f2.jpeg';
export const SURVEYOR_STORY_IMAGE_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-15_at_12.18.43_PM_fa122400.jpeg';

export const STORY_POPUP_BY_OBJECT_ID: Record<
  string,
  { kicker: string; title: string; imageUrl: string }
> = {
  'moon-obj-1': {
    kicker: 'Archivo Histórico Recuperado · La Luna',
    title: 'Apolo 11 · Módulo "Eagle"',
    imageUrl: APOLLO_STORY_IMAGE_URL,
  },
  'moon-obj-2': {
    kicker: 'Archivo Histórico Recuperado · La Luna',
    title: 'Apolo 15 · Lunar Roving Vehicle (LRV)',
    imageUrl: LRV_STORY_IMAGE_URL,
  },
  'moon-obj-3': {
    kicker: 'Archivo Histórico Recuperado · La Luna',
    title: 'Apolo 12 · Módulo Lunar / ALSEP',
    imageUrl: ALSEP_STORY_IMAGE_URL,
  },
  'moon-obj-4': {
    kicker: 'Archivo Histórico Recuperado · La Luna',
    title: 'Surveyor 3 · Landers',
    imageUrl: SURVEYOR_STORY_IMAGE_URL,
  },
};

export const PLANETS: Record<PlanetId, PlanetConfig> = {
  moon: {
    id: 'moon',
    name: 'La Luna',
    sectorName: 'Mare Tranquillitatis',
    gravityLabel: '1.62 m/s²',
    surfaceTemp: '-130 °C',
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    surfaceBaseColor: '#161A23',
    surfaceSecondaryColor: '#1E2430',
    craterColor: '#0E1118',
    craterRimColor: '#2F3748',
    gridColor: 'rgba(148, 163, 184, 0.06)',
    accentColor: '#06B6D4',
    crystalColor: '#38BDF8',
    dustColor: 'rgba(203, 213, 225, 0.45)',
    planetSphereColors: ['#E2E8F0', '#94A3B8', '#334155'],
    atmosphereGlow: 'rgba(148, 163, 184, 0.28)',
    targetPlanetId: 'mars',
    targetPlanetName: 'Marte',
    isCircularMap: true,
    mapRadius: PLANET_VISUAL_RADIUS,
    surfaceImageUrl: '/assets/aistudio/WhatsApp_Image_2026-11-14_at_4.32.16_PM__1__ee59bea7.jpeg',
  },
  mars: {
    id: 'mars',
    name: 'Marte',
    sectorName: 'Cráter Jezero',
    gravityLabel: '3.72 m/s²',
    surfaceTemp: '-63 °C',
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    surfaceBaseColor: '#27130E',
    surfaceSecondaryColor: '#361A13',
    craterColor: '#1A0B08',
    craterRimColor: '#5C2C1E',
    gridColor: 'rgba(251, 146, 60, 0.06)',
    accentColor: '#F59E0B',
    crystalColor: '#FBBF24',
    dustColor: 'rgba(251, 146, 60, 0.45)',
    planetSphereColors: ['#FDBA74', '#EA580C', '#7C2D12'],
    atmosphereGlow: 'rgba(234, 88, 12, 0.36)',
    targetPlanetId: 'moon',
    targetPlanetName: 'La Luna',
    isCircularMap: true,
    mapRadius: PLANET_VISUAL_RADIUS,
    surfaceImageUrl: '/assets/aistudio/image_65cc5da3.png',
  },
};

const CX = WORLD_WIDTH / 2;
const CY = WORLD_HEIGHT / 2;

export const INITIAL_RESCUE_OBJECTS: Record<PlanetId, RescueObject[]> = {
  moon: [
    {
      id: 'moon-obj-1',
      planet: 'moon',
      name: 'Apollo Lunar Modules',
      sector: 'Mare Tranquillitatis',
      orbitCenterX: CX - 40,
      orbitCenterY: CY - 30,
      orbitRadiusX: 460,
      orbitRadiusY: 360,
      orbitSpeed: 0.14,
      orbitAngle: 3.85,
      x: CX - 40 + Math.cos(3.85) * 460,
      y: CY - 30 + Math.sin(3.85) * 360,
      shape: 'probe',
      frequency: '2282.5 MHz',
      points: 250,
      transmissionTitle: 'Telemetría de Descenso Lunar',
      transmissionSummary:
        'Etapa de descenso recuperó los registros del alunizaje tripulado, control térmico de cabina y análisis inicial de rocas basálticas.',
      telemetryReading: 'Descenso: Nominal · Muestras: 21.5 kg · O₂: 100%',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'moon-obj-2',
      planet: 'moon',
      name: 'Lunar Roving Vehicles (LRVs)',
      sector: 'Rima Hadley / Apeninos',
      orbitCenterX: CX + 40,
      orbitCenterY: CY - 20,
      orbitRadiusX: 580,
      orbitRadiusY: 450,
      orbitSpeed: -0.12,
      orbitAngle: -0.65,
      x: CX + 40 + Math.cos(-0.65) * 580,
      y: CY - 20 + Math.sin(-0.65) * 450,
      shape: 'rover',
      frequency: '2265.0 MHz',
      points: 250,
      transmissionTitle: 'Registro de Travesía Lunar',
      transmissionSummary:
        'El vehículo eléctrico transmitió datos de tracción en regolito fino, navegación inercial y rutas geológicas de largo alcance.',
      telemetryReading: 'Recorrido: 35.9 km · Batería AgZn: 36 V · Vel: 13 km/h',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'moon-obj-3',
      planet: 'moon',
      name: 'ALSEP Scientific Packages',
      sector: 'Oceanus Procellarum',
      orbitCenterX: CX,
      orbitCenterY: CY + 40,
      orbitRadiusX: 650,
      orbitRadiusY: 510,
      orbitSpeed: 0.15,
      orbitAngle: 2.35,
      x: CX + Math.cos(2.35) * 650,
      y: CY + 40 + Math.sin(2.35) * 510,
      shape: 'seismic',
      frequency: '2278.5 MHz',
      points: 250,
      transmissionTitle: 'Estación Geofísica y Sísmica Lunar',
      transmissionSummary:
        'Conjunto de experimentos superficiales que registró micro-sismos profundos, flujo térmico del subsuelo y densidad del viento solar.',
      telemetryReading: 'Sismos: 1.9 Mw · Flujo Térmico: 21 mW/m² · RTG: Activo',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'moon-obj-4',
      planet: 'moon',
      name: 'Surveyor Landers',
      sector: 'Cráter Tycho / Órbita Sur',
      orbitCenterX: CX,
      orbitCenterY: CY,
      orbitRadiusX: 880,
      orbitRadiusY: 740,
      orbitSpeed: 0.1,
      orbitAngle: 0.72,
      x: CX + Math.cos(0.72) * 880,
      y: CY + Math.sin(0.72) * 740,
      shape: 'beacon',
      frequency: '2295.0 MHz',
      points: 250,
      transmissionTitle: 'Reconocimiento de Suelo y Superficie',
      transmissionSummary:
        'Aterrizador robótico previo al programa Apolo que comprobó la firmeza del polvo lunar y transmitió miles de fotografías panorámicas.',
      telemetryReading: 'Carga Suelo: 34 kPa · Panorámicas: 11,150 · -145 °C',
      discovered: false,
      downloadProgress: 0,
    },
  ],
  mars: [
    {
      id: 'mars-obj-1',
      planet: 'mars',
      name: 'Sojourner Rover',
      sector: 'Ares Vallis',
      orbitCenterX: CX - 30,
      orbitCenterY: CY - 20,
      orbitRadiusX: 390,
      orbitRadiusY: 310,
      orbitSpeed: -0.13,
      orbitAngle: 3.7,
      x: CX - 30 + Math.cos(3.7) * 390,
      y: CY - 20 + Math.sin(3.7) * 310,
      shape: 'rover',
      frequency: '164.2 MHz',
      points: 200,
      transmissionTitle: 'Sojourner Rover',
      transmissionSummary: 'Telemetría de Sojourner Rover registrada en la bitácora de Marte.',
      telemetryReading: 'Señal: Activa · Sector: Ares Vallis',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-2',
      planet: 'mars',
      name: 'Spirit & Opportunity',
      sector: 'Gusev / Meridiani',
      orbitCenterX: CX + 35,
      orbitCenterY: CY - 15,
      orbitRadiusX: 480,
      orbitRadiusY: 380,
      orbitSpeed: 0.12,
      orbitAngle: -0.7,
      x: CX + 35 + Math.cos(-0.7) * 480,
      y: CY - 15 + Math.sin(-0.7) * 380,
      shape: 'rover',
      frequency: '212.8 MHz',
      points: 200,
      transmissionTitle: 'Spirit & Opportunity',
      transmissionSummary: 'Telemetría de Spirit & Opportunity registrada en la bitácora de Marte.',
      telemetryReading: 'Señal: Activa · Sector: Gusev / Meridiani',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-3',
      planet: 'mars',
      name: 'Viking 1 & 2 Landers',
      sector: 'Chryse / Utopia Planitia',
      orbitCenterX: CX - 20,
      orbitCenterY: CY + 30,
      orbitRadiusX: 550,
      orbitRadiusY: 430,
      orbitSpeed: -0.14,
      orbitAngle: 2.2,
      x: CX - 20 + Math.cos(2.2) * 550,
      y: CY + 30 + Math.sin(2.2) * 430,
      shape: 'beacon',
      frequency: '248.9 MHz',
      points: 200,
      transmissionTitle: 'Viking 1 & 2 Landers',
      transmissionSummary: 'Telemetría de Viking 1 & 2 Landers registrada en la bitácora de Marte.',
      telemetryReading: 'Señal: Activa · Sector: Chryse / Utopia Planitia',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-4',
      planet: 'mars',
      name: 'Phoenix & InSight Landers',
      sector: 'Vastitas / Elysium',
      orbitCenterX: CX + 20,
      orbitCenterY: CY + 25,
      orbitRadiusX: 610,
      orbitRadiusY: 480,
      orbitSpeed: 0.115,
      orbitAngle: 0.55,
      x: CX + 20 + Math.cos(0.55) * 610,
      y: CY + 25 + Math.sin(0.55) * 480,
      shape: 'seismic',
      frequency: '332.0 MHz',
      points: 200,
      transmissionTitle: 'Phoenix & InSight Landers',
      transmissionSummary: 'Telemetría de Phoenix & InSight Landers registrada en la bitácora de Marte.',
      telemetryReading: 'Señal: Activa · Sector: Vastitas / Elysium',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-5',
      planet: 'mars',
      name: 'Dawn Spacecraft',
      sector: 'Órbita Ceres / Exterior',
      orbitCenterX: CX,
      orbitCenterY: CY,
      orbitRadiusX: 760,
      orbitRadiusY: 610,
      orbitSpeed: -0.11,
      orbitAngle: -2.4,
      x: CX + Math.cos(-2.4) * 760,
      y: CY + Math.sin(-2.4) * 610,
      shape: 'probe',
      frequency: '401.5 MHz',
      points: 250,
      transmissionTitle: 'Dawn Spacecraft',
      transmissionSummary: 'Telemetría de Dawn Spacecraft registrada en la bitácora de Marte.',
      telemetryReading: 'Señal: Activa · Sector: Órbita Exterior',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-6',
      planet: 'mars',
      name: 'NEAR Shoemaker',
      sector: 'Cinturón 433 Eros',
      orbitCenterX: CX + 25,
      orbitCenterY: CY - 20,
      orbitRadiusX: 830,
      orbitRadiusY: 670,
      orbitSpeed: 0.105,
      orbitAngle: 1.15,
      x: CX + 25 + Math.cos(1.15) * 830,
      y: CY - 20 + Math.sin(1.15) * 670,
      shape: 'probe',
      frequency: '449.5 MHz',
      points: 250,
      transmissionTitle: 'NEAR Shoemaker',
      transmissionSummary: 'Telemetría de NEAR Shoemaker registrada en la bitácora de Marte.',
      telemetryReading: 'Señal: Activa · Sector: Cinturón 433 Eros',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-7',
      planet: 'mars',
      name: 'Pioneer 10 & 11',
      sector: 'Espacio Profundo Exterior',
      orbitCenterX: CX - 25,
      orbitCenterY: CY,
      orbitRadiusX: 920,
      orbitRadiusY: 740,
      orbitSpeed: -0.095,
      orbitAngle: -1.1,
      x: CX - 25 + Math.cos(-1.1) * 920,
      y: CY + Math.sin(-1.1) * 740,
      shape: 'beacon',
      frequency: '518.4 MHz',
      points: 250,
      transmissionTitle: 'Pioneer 10 & 11',
      transmissionSummary: 'Telemetría de Pioneer 10 & 11 registrada en la bitácora de Marte.',
      telemetryReading: 'Señal: Activa · Sector: Espacio Profundo',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-8',
      planet: 'mars',
      name: 'Ingenuity Helicopter',
      sector: 'Cráter Jezero',
      orbitCenterX: CX,
      orbitCenterY: CY,
      orbitRadiusX: 430,
      orbitRadiusY: 340,
      orbitSpeed: 0.135,
      orbitAngle: 1.8,
      x: CX + Math.cos(1.8) * 430,
      y: CY + Math.sin(1.8) * 340,
      shape: 'probe',
      frequency: '612.0 MHz',
      points: 200,
      transmissionTitle: 'Ingenuity Helicopter',
      transmissionSummary: 'Telemetría de Ingenuity Helicopter registrada en la bitácora de Marte.',
      telemetryReading: 'Señal: Activa · Sector: Cráter Jezero',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-9',
      planet: 'mars',
      name: 'Kepler Space Telescope',
      sector: 'Órbita Heliocéntrica',
      orbitCenterX: CX,
      orbitCenterY: CY,
      orbitRadiusX: 980,
      orbitRadiusY: 785,
      orbitSpeed: 0.09,
      orbitAngle: 2.95,
      x: CX + Math.cos(2.95) * 980,
      y: CY + Math.sin(2.95) * 785,
      shape: 'seismic',
      frequency: '705.6 MHz',
      points: 300,
      transmissionTitle: 'Kepler Space Telescope',
      transmissionSummary: 'Telemetría de Kepler Space Telescope registrada en la bitácora de Marte.',
      telemetryReading: 'Señal: Activa · Sector: Órbita Heliocéntrica',
      discovered: false,
      downloadProgress: 0,
    },
  ],
};

function createRng(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function generatePlanetCraters(planet: PlanetId): CraterFeature[] {
  const rng = createRng(planet === 'moon' ? 104729 : 882377);
  const craters: CraterFeature[] = [];
  const count = planet === 'moon' ? 48 : 34;

  for (let i = 0; i < count; i++) {
    craters.push({
      x: 120 + rng() * (WORLD_WIDTH - 240),
      y: 120 + rng() * (WORLD_HEIGHT - 240),
      radius: 26 + rng() * 92,
      depth: 0.4 + rng() * 0.5,
      rimHighlight: 0.25 + rng() * 0.4,
    });
  }
  return craters;
}

export function generatePlanetRidges(planet: PlanetId): RidgeFeature[] {
  const rng = createRng(planet === 'moon' ? 33921 : 99123);
  const ridges: RidgeFeature[] = [];
  const count = planet === 'mars' ? 22 : 12;

  for (let i = 0; i < count; i++) {
    ridges.push({
      x: 180 + rng() * (WORLD_WIDTH - 360),
      y: 180 + rng() * (WORLD_HEIGHT - 360),
      width: 60 + rng() * 140,
      height: 16 + rng() * 28,
      angle: rng() * Math.PI,
    });
  }
  return ridges;
}

export const FUEL_NODE_COUNT = 10;

export function generatePlanetCrystals(planet: PlanetId): CrystalNode[] {
  const rng = createRng(planet === 'moon' ? 51203 : 74819);
  const crystals: CrystalNode[] = [];
  const count = FUEL_NODE_COUNT;

  for (let i = 0; i < count; i++) {
    // 6 fuel canisters distributed across planet surface, 4 in outer orbital space (kept scarce)
    const inOrbit = i >= 6;
    const baseAngle = ((Math.PI * 2) / (inOrbit ? 4 : 6)) * (inOrbit ? i - 6 : i);
    const angle = baseAngle + (rng() - 0.5) * 0.45;
    const dist = inOrbit
      ? PLANET_VISUAL_RADIUS + 95 + rng() * 220
      : 210 + rng() * (PLANET_VISUAL_RADIUS - 270);

    crystals.push({
      id: `${planet}-fuel-${i}`,
      x: CX + Math.cos(angle) * dist,
      y: CY + Math.sin(angle) * dist,
      value: planet === 'moon' ? 50 : 75,
      collected: false,
      pulseOffset: rng() * Math.PI * 2,
    });
  }
  return crystals;
}

export function pickFuelRespawnCoords(shipX: number, shipY: number): { x: number; y: number } {
  let bestX = CX + 450;
  let bestY = CY;
  let bestDist = -1;

  for (let attempt = 0; attempt < 12; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const inOrbit = Math.random() < 0.4;
    const distFromCenter = inOrbit
      ? PLANET_VISUAL_RADIUS + 95 + Math.random() * 210
      : 220 + Math.random() * (PLANET_VISUAL_RADIUS - 270);
    const cx = CX + Math.cos(angle) * distFromCenter;
    const cy = CY + Math.sin(angle) * distFromCenter;
    const d = Math.hypot(cx - shipX, cy - shipY);
    if (d >= 420 && d <= 920) {
      return { x: cx, y: cy };
    }
    if (d > bestDist) {
      bestDist = d;
      bestX = cx;
      bestY = cy;
    }
  }
  return { x: bestX, y: bestY };
}
