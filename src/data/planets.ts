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
      name: 'Rover Perseverancia-IV',
      sector: 'Delta Occidental',
      orbitCenterX: CX - 30,
      orbitCenterY: CY - 20,
      orbitRadiusX: 470,
      orbitRadiusY: 360,
      orbitSpeed: -0.13,
      orbitAngle: 3.7,
      x: CX - 30 + Math.cos(3.7) * 470,
      y: CY - 20 + Math.sin(3.7) * 360,
      shape: 'rover',
      frequency: '164.2 MHz',
      points: 300,
      transmissionTitle: 'Sedimentos Lacustres Antiguos',
      transmissionSummary:
        'El rover envió un perfil estratigráfico con arcillas ricas en filosilicatos que prueban corrientes de agua líquida hace 3.5 mil millones de años.',
      telemetryReading: 'pH Paleo: 7.2 · Carbonatos: 12.1% · O₂ traza',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-2',
      planet: 'mars',
      name: 'Estación Meteo Ares-7',
      sector: 'Llanura Óxido Norte',
      orbitCenterX: CX + 30,
      orbitCenterY: CY,
      orbitRadiusX: 580,
      orbitRadiusY: 460,
      orbitSpeed: 0.12,
      orbitAngle: -0.7,
      x: CX + 30 + Math.cos(-0.7) * 580,
      y: CY + Math.sin(-0.7) * 460,
      shape: 'beacon',
      frequency: '248.9 MHz',
      points: 300,
      transmissionTitle: 'Dinámica de Tormentas de Polvo',
      transmissionSummary:
        'Telemetría barométrica continua que predice frentes de polvo cargados electrostáticamente y ráfagas de hasta 94 km/h.',
      telemetryReading: 'Presión: 6.4 mbar · CO₂: 95.3% · Viento: 68 km/h',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-3',
      planet: 'mars',
      name: 'Perforadora Subterránea Valles',
      sector: 'Cañón Meridional',
      orbitCenterX: CX,
      orbitCenterY: CY + 30,
      orbitRadiusX: 650,
      orbitRadiusY: 500,
      orbitSpeed: -0.15,
      orbitAngle: 2.2,
      x: CX + Math.cos(2.2) * 650,
      y: CY + 30 + Math.sin(2.2) * 500,
      shape: 'seismic',
      frequency: '332.0 MHz',
      points: 300,
      transmissionTitle: 'Acuífero Salino Profundo',
      transmissionSummary:
        'Radar de penetración terrestre halló capas de salmuera estable a 1.4 km de profundidad protegidas de la radiación superficial.',
      telemetryReading: 'Conductividad: 4.8 S/m · Profundidad: 1.42 km',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'mars-obj-4',
      planet: 'mars',
      name: 'Satélite Caído Phobos-Relay',
      sector: 'Órbita Exterior Este',
      orbitCenterX: CX,
      orbitCenterY: CY,
      orbitRadiusX: 910,
      orbitRadiusY: 750,
      orbitSpeed: 0.105,
      orbitAngle: 0.65,
      x: CX + Math.cos(0.65) * 910,
      y: CY + Math.sin(0.65) * 750,
      shape: 'probe',
      frequency: '449.5 MHz',
      points: 300,
      transmissionTitle: 'Archivo Orbital de Cartografía',
      transmissionSummary:
        'Caja negra recuperada con mapas topográficos de alta resolución y anomalías magnéticas de la corteza marciana.',
      telemetryReading: 'Campo Magnético: 145 nT · Datos: 4.2 TB',
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
