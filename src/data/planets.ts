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
      name: 'Sonda Lunokhod-X',
      sector: 'Borde Norte Tranquilidad',
      orbitCenterX: CX - 40,
      orbitCenterY: CY - 30,
      orbitRadiusX: 340,
      orbitRadiusY: 250,
      orbitSpeed: 0.16,
      orbitAngle: 3.85,
      x: CX - 40 + Math.cos(3.85) * 340,
      y: CY - 30 + Math.sin(3.85) * 250,
      shape: 'rover',
      frequency: '142.8 MHz',
      points: 250,
      transmissionTitle: 'Muestra de Regolito Basáltico',
      transmissionSummary:
        'La sonda transmitió espectros de titanio e ilmenita en el estrato superior, confirmando depósitos aprovechables para blindaje lunar.',
      telemetryReading: 'TiO₂: 8.4% · FeO: 17.2% · Radiación: 0.38 mSv/h',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'moon-obj-2',
      planet: 'moon',
      name: 'Baliza Apolo-19',
      sector: 'Cuenca Este',
      orbitCenterX: CX + 40,
      orbitCenterY: CY - 20,
      orbitRadiusX: 480,
      orbitRadiusY: 360,
      orbitSpeed: -0.14,
      orbitAngle: -0.65,
      x: CX + 40 + Math.cos(-0.65) * 480,
      y: CY - 20 + Math.sin(-0.65) * 360,
      shape: 'beacon',
      frequency: '218.4 MHz',
      points: 250,
      transmissionTitle: 'Registro de Viento Solar',
      transmissionSummary:
        'Baliza orbital recuperada con 400 horas de lectura de partículas alfa y flujo de Helio-3 atrapado en la superficie lunar.',
      telemetryReading: 'He-3: 18.6 ppb · Flujo Solar: 412 km/s',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'moon-obj-3',
      planet: 'moon',
      name: 'Reflector Sísmico Selene',
      sector: 'Fosa Meridional',
      orbitCenterX: CX,
      orbitCenterY: CY + 40,
      orbitRadiusX: 390,
      orbitRadiusY: 300,
      orbitSpeed: 0.19,
      orbitAngle: 2.35,
      x: CX + Math.cos(2.35) * 390,
      y: CY + 40 + Math.sin(2.35) * 300,
      shape: 'seismic',
      frequency: '305.1 MHz',
      points: 250,
      transmissionTitle: 'Actividad Tectónica Lunar',
      transmissionSummary:
        'Detectó tres micro-sismos lunares profundos a 850 km bajo la corteza, calibrando con precisión la estructura del manto.',
      telemetryReading: 'Magnitud: 1.9 Mw · Profundidad: 842 km',
      discovered: false,
      downloadProgress: 0,
    },
    {
      id: 'moon-obj-4',
      planet: 'moon',
      name: 'Cápsula Criogénica Tycho',
      sector: 'Órbita Exterior Sur',
      orbitCenterX: CX,
      orbitCenterY: CY,
      orbitRadiusX: 880,
      orbitRadiusY: 740,
      orbitSpeed: 0.1,
      orbitAngle: 0.72,
      x: CX + Math.cos(0.72) * 880,
      y: CY + Math.sin(0.72) * 740,
      shape: 'probe',
      frequency: '412.6 MHz',
      points: 250,
      transmissionTitle: 'Reserva de Hielo Subsuperficial',
      transmissionSummary:
        'Confirmó bolsas de hielo cristalino en micro-cráteres en sombra permanente, vital para producción de oxígeno y propelente.',
      telemetryReading: 'H₂O Sólida: 5.7% masa · Temp: -188 °C',
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
      orbitRadiusX: 360,
      orbitRadiusY: 260,
      orbitSpeed: -0.15,
      orbitAngle: 3.7,
      x: CX - 30 + Math.cos(3.7) * 360,
      y: CY - 20 + Math.sin(3.7) * 260,
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
      orbitRadiusX: 460,
      orbitRadiusY: 380,
      orbitSpeed: 0.14,
      orbitAngle: -0.7,
      x: CX + 30 + Math.cos(-0.7) * 460,
      y: CY + Math.sin(-0.7) * 380,
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
      orbitRadiusX: 390,
      orbitRadiusY: 300,
      orbitSpeed: -0.18,
      orbitAngle: 2.2,
      x: CX + Math.cos(2.2) * 390,
      y: CY + 30 + Math.sin(2.2) * 300,
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

export function generatePlanetCrystals(planet: PlanetId): CrystalNode[] {
  const rng = createRng(planet === 'moon' ? 51203 : 74819);
  const crystals: CrystalNode[] = [];
  const count = 22;

  for (let i = 0; i < count; i++) {
    // 14 crystals on the planet surface, 8 floating in the orbital space outside the planet!
    const inOrbit = i >= 14;
    const angle = rng() * Math.PI * 2;
    const dist = inOrbit
      ? PLANET_VISUAL_RADIUS + 80 + rng() * 260
      : 150 + rng() * (PLANET_VISUAL_RADIUS - 210);

    crystals.push({
      id: `${planet}-crystal-${i}`,
      x: CX + Math.cos(angle) * dist,
      y: CY + Math.sin(angle) * dist,
      value: planet === 'moon' ? 50 : 75,
      collected: false,
      pulseOffset: rng() * Math.PI * 2,
    });
  }
  return crystals;
}
