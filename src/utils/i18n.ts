import { Language, PlanetId, RescueObject } from '../types/game';

export const LANG_STORAGE_KEY = 'horizonte_orbital_lang_v1';

export function getPlanetDisplayName(planetId: PlanetId, lang: Language): string {
  if (lang === 'en') {
    return planetId === 'moon' ? 'The Moon' : 'Mars';
  }
  return planetId === 'moon' ? 'La Luna' : 'Marte';
}

export function getPlanetSectorName(planetId: PlanetId, lang: Language): string {
  if (lang === 'en') {
    return planetId === 'moon' ? 'Mare Tranquillitatis' : 'Jezero Crater';
  }
  return planetId === 'moon' ? 'Mare Tranquillitatis' : 'Cráter Jezero';
}

const OBJECT_COPY_EN: Record<
  string,
  {
    name: string;
    sector: string;
    transmissionTitle: string;
    transmissionSummary: string;
    telemetryReading: string;
  }
> = {
  'moon-obj-1': {
    name: 'Apollo Lunar Modules',
    sector: 'Mare Tranquillitatis',
    transmissionTitle: 'Lunar Descent Telemetry',
    transmissionSummary:
      'Descent stage recovered crewed landing logs, cabin thermal control telemetry, and initial basalt rock sample records.',
    telemetryReading: 'Descent: Nominal · Samples: 21.5 kg · O₂: 100%',
  },
  'moon-obj-2': {
    name: 'Lunar Roving Vehicles (LRVs)',
    sector: 'Hadley Rille / Apennines',
    transmissionTitle: 'Lunar Traverse Log',
    transmissionSummary:
      'Electric rover transmitted regolith traction curves, inertial navigation headings, and long-range geological traverse routes.',
    telemetryReading: 'Distance: 35.9 km · AgZn Battery: 36 V · Speed: 13 km/h',
  },
  'moon-obj-3': {
    name: 'ALSEP Scientific Packages',
    sector: 'Oceanus Procellarum',
    transmissionTitle: 'Lunar Geophysical & Seismic Station',
    transmissionSummary:
      'Surface experiment array recorded deep moonquakes, subsurface heat flow, and solar wind particle density.',
    telemetryReading: 'Quakes: 1.9 Mw · Heat Flow: 21 mW/m² · RTG: Active',
  },
  'moon-obj-4': {
    name: 'Surveyor Landers',
    sector: 'Tycho Crater / South Orbit',
    transmissionTitle: 'Surface Soil & Bearing Survey',
    transmissionSummary:
      'Pre-Apollo robotic lander verified lunar dust bearing strength and beamed thousands of panoramic surface frames.',
    telemetryReading: 'Soil Bearing: 34 kPa · Panoramas: 11,150 · -145 °C',
  },
  'mars-obj-1': {
    name: 'Sojourner Rover',
    sector: 'Ares Vallis',
    transmissionTitle: 'Sojourner Rover',
    transmissionSummary: 'Sojourner Rover telemetry logged in Mars mission records.',
    telemetryReading: 'Signal: Active · Sector: Ares Vallis',
  },
  'mars-obj-2': {
    name: 'Spirit & Opportunity',
    sector: 'Gusev / Meridiani',
    transmissionTitle: 'Spirit & Opportunity',
    transmissionSummary: 'Spirit & Opportunity telemetry logged in Mars mission records.',
    telemetryReading: 'Signal: Active · Sector: Gusev / Meridiani',
  },
  'mars-obj-3': {
    name: 'Viking 1 & 2 Landers',
    sector: 'Chryse / Utopia Planitia',
    transmissionTitle: 'Viking 1 & 2 Landers',
    transmissionSummary: 'Viking 1 & 2 Landers telemetry logged in Mars mission records.',
    telemetryReading: 'Signal: Active · Sector: Chryse / Utopia Planitia',
  },
  'mars-obj-4': {
    name: 'Phoenix & InSight Landers',
    sector: 'Vastitas / Elysium',
    transmissionTitle: 'Phoenix & InSight Landers',
    transmissionSummary: 'Phoenix & InSight Landers telemetry logged in Mars mission records.',
    telemetryReading: 'Signal: Active · Sector: Vastitas / Elysium',
  },
  'mars-obj-5': {
    name: 'Dawn Spacecraft',
    sector: 'Ceres / Outer Orbit',
    transmissionTitle: 'Dawn Spacecraft',
    transmissionSummary: 'Dawn Spacecraft telemetry logged in Mars mission records.',
    telemetryReading: 'Signal: Active · Sector: Outer Orbit',
  },
  'mars-obj-6': {
    name: 'NEAR Shoemaker',
    sector: '433 Eros Belt',
    transmissionTitle: 'NEAR Shoemaker',
    transmissionSummary: 'NEAR Shoemaker telemetry logged in Mars mission records.',
    telemetryReading: 'Signal: Active · Sector: 433 Eros Belt',
  },
  'mars-obj-7': {
    name: 'Pioneer 10 & 11',
    sector: 'Outer Deep Space',
    transmissionTitle: 'Pioneer 10 & 11',
    transmissionSummary: 'Pioneer 10 & 11 telemetry logged in Mars mission records.',
    telemetryReading: 'Signal: Active · Sector: Deep Space',
  },
  'mars-obj-8': {
    name: 'Ingenuity Helicopter',
    sector: 'Jezero Crater',
    transmissionTitle: 'Ingenuity Helicopter',
    transmissionSummary: 'Ingenuity Helicopter telemetry logged in Mars mission records.',
    telemetryReading: 'Signal: Active · Sector: Jezero Crater',
  },
  'mars-obj-9': {
    name: 'Kepler Space Telescope',
    sector: 'Heliocentric Orbit',
    transmissionTitle: 'Kepler Space Telescope',
    transmissionSummary: 'Kepler Space Telescope telemetry logged in Mars mission records.',
    telemetryReading: 'Signal: Active · Sector: Heliocentric Orbit',
  },
};

export function getLocalizedObjectCopy(
  obj: Pick<
    RescueObject,
    'id' | 'name' | 'sector' | 'transmissionTitle' | 'transmissionSummary' | 'telemetryReading'
  >,
  lang: Language
) {
  if (lang === 'en' && OBJECT_COPY_EN[obj.id]) {
    return OBJECT_COPY_EN[obj.id];
  }
  return {
    name: obj.name,
    sector: obj.sector,
    transmissionTitle: obj.transmissionTitle,
    transmissionSummary: obj.transmissionSummary,
    telemetryReading: obj.telemetryReading,
  };
}

export const UI_TEXT = {
  es: {
    brandTitle: 'Horizonte Orbital',
    scoreLabel: 'Puntos',
    rescuedLabel: 'Rescatados',
    logbookLabel: 'Bitácora',
    pause: 'Pausa',
    resume: 'Reanudar',
    pauseAria: 'Pausar misión',
    resumeAria: 'Reanudar misión',
    audio: 'Audio',
    muted: 'Silenciado',
    muteAria: 'Silenciar audio',
    unmuteAria: 'Activar audio',
    reset: 'Reiniciar',
    langSwitchLabel: 'ES',
    langSwitchTitle: 'Cambiar idioma a Inglés',
    gravity: 'Gravedad',
    temp: 'Temp',
    outOfGasBanner: '¡Sin gasolina! Motores apagados',
    lowGasBanner: (pct: number) => `¡Gasolina baja (${pct}%)! Recoge los tanques verdes`,
    dataReceivedSuffix: 'Información recibida',
    viewInLogbook: 'Ver registro en Bitácora',
    controlsHint: 'WASD o Flechas para volar · Espacio para turbo · Recoge tanques verdes de gasolina',
    missionCompleted: (planet: string, total: number) =>
      `Misión en ${planet} completada (${total}/${total} objetos)`,
    thrustersReady: (target: string) => `Propulsores listos para despegar hacia ${target}.`,
    launchTo: (target: string) => `Despegar hacia ${target}`,
    switchToPrefix: 'Cambiar a',
    switchPlanetAria: (target: string) => `Cambiar a ${target}`,
    origin: 'Origen',
    destination: 'Destino',
    menuKicker: 'Exploración y Rescate de Datos',
    menuDesc:
      'Pilota tu nave espacial sobre la superficie planetaria, vigila tu nivel de gasolina recogiendo tanques verdes en el mapa y localiza los objetivos científicos en orden para transmitir su información hacia tu bitácora.',
    chooseStart: 'Elige tu destino inicial',
    objectsCountLabel: (n: number) => `${n} objetos`,
    menuControls: ['Controles: WASD / Flechas', 'Clic sostenido para volar', 'Espacio: Propulsor'],
    startMission: 'Comenzar Misión',
    pausedFromLogbook: 'Bitácora Abierta · Juego en Pausa',
    pausedManual: 'Nave Detenida · Pausa Activa',
    pausedTitle: 'Misión en Pausa',
    pausedLogbookDesc:
      'El vuelo, los meteoritos y el consumo de gasolina se pausaron automáticamente mientras revisas la bitácora.',
    pausedManualDesc:
      'Los motores, los asteroides y el consumo de gasolina están detenidos hasta que reanudes la misión.',
    resetMission: 'Reiniciar Misión',
    hullKicker: 'Impacto de Asteroide · Casco Crítico',
    hullTitle: 'Nave Averiada',
    hullDesc:
      'Los asteroides de alta velocidad superaron la integridad del casco. Tus datos rescatados en la bitácora siguen a salvo.',
    repairAndRelaunch: 'Reparar y Relanzar',
    fuelKicker: 'Tanque Vacío · Propulsión Detenida',
    fuelTitle: 'Sin Gasolina',
    fuelDesc:
      'El movimiento de la nave consumió toda la gasolina disponible. Recoge los tanques verdes dispersos antes de que el medidor llegue a cero. Tus objetos rescatados siguen en la bitácora.',
    refuelAndRelaunch: 'Reabastecer y Relanzar',
    allKicker: 'Misión Interplanetaria Completada',
    allTitle: 'Todos los datos rescatados',
    allDesc: (moonTotal: number, marsTotal: number) =>
      `Has recuperado exitosamente la información de los ${moonTotal} objetos de La Luna y los ${marsTotal} objetos de Marte. Todos los reportes científicos están archivados en tu bitácora.`,
    finalScore: 'Puntuación Final',
    keepExploring: 'Seguir Explorando',
    newMission: 'Nueva Misión',
    tabRadar: 'Radar',
    tabLogbook: 'Bitácora',
    interplanetaryPropulsion: 'Propulsión Interplanetaria',
    unlocked: 'Desbloqueado',
    locked: 'Bloqueado',
    launchUnlockedDesc: (planet: string, target: string) =>
      `Todos los objetos de ${planet} fueron rescatados. Puedes despegar hacia ${target}.`,
    launchLockedDesc: (planet: string, target: string, total: number) =>
      `Rescata los ${total} objetos de ${planet} para habilitar el despegue hacia ${target}.`,
    // RadarPanel
    radarTitle: 'Radar de Rescate',
    radarRescued: (n: number, total: number) => `${n}/${total} rescatados`,
    currentPos: 'Posición actual',
    activeTarget: (idx: number, total: number) => `Objetivo activo (${idx}/${total})`,
    bearing: 'Rumbo',
    sweepComplete: 'Barrido completado',
    sweepCompleteDesc: (planet: string) => `Todas las señales de ${planet} han sido recuperadas.`,
    unconfirmedSignal: 'Señal por confirmar',
    appearsNextDesc: 'Aparecerá al recoger el objeto actual',
    rescuedBadge: 'Rescatado',
    standbyBadge: 'En espera',
    // ProbeMinimap
    minimapTitle: 'Radar de Sondas',
    minimapTarget: (dist: number) => `Objetivo actual: ${dist} m`,
    minimapAllScanned: (total: number) => `${total}/${total} sondas escaneadas`,
    minimapScanning: 'Escaneando sector...',
    // LogbookPanel
    logbookTitle: 'Bitácora de Misión',
    unlockedCount: (n: number, total: number) => `${n}/${total} desbloqueados`,
    tapToOpenImage: 'Desbloqueado · Toca para abrir imagen',
    tapToViewLog: 'Desbloqueado · Toca para ver registro',
    lockedCollect: 'Bloqueado · Recógelo para desbloquear',
    viewImage: 'Ver imagen',
    open: 'Abierto',
    pendingImage: 'Imagen de bitácora pendiente por agregar.',
    // StoryPopupModal
    exitStory: 'Salir',
    // Canvas
    canvasSaved: 'DATOS EN BITÁCORA',
    canvasTransmitting: (pct: number) => `TRANSMITIENDO ${pct}%`,
    cardinals: ['E', 'SE', 'S', 'SO', 'O', 'NO', 'N', 'NE'],
    canvasCardinals: { n: 'N', s: 'S', w: 'O', e: 'E' },
    stageIgnition: 'Ignición de Propulsores',
    stageTakeoff: (from: string) => `Despegando de ${from}`,
    stageTransit: (to: string) => `Tránsito propulsado hacia ${to}`,
    stageDescent: (to: string) => `Descenso orbital en ${to}`,
    stageLanding: (sector: string) => `Aterrizaje en ${sector}`,
  },
  en: {
    brandTitle: 'Horizonte Orbital',
    scoreLabel: 'Score',
    rescuedLabel: 'Rescued',
    logbookLabel: 'Logbook',
    pause: 'Pause',
    resume: 'Resume',
    pauseAria: 'Pause mission',
    resumeAria: 'Resume mission',
    audio: 'Audio',
    muted: 'Muted',
    muteAria: 'Mute audio',
    unmuteAria: 'Unmute audio',
    reset: 'Reset',
    langSwitchLabel: 'EN',
    langSwitchTitle: 'Switch language to Spanish',
    gravity: 'Gravity',
    temp: 'Temp',
    outOfGasBanner: 'Out of gas! Engines off',
    lowGasBanner: (pct: number) => `Low gas (${pct}%)! Collect green fuel tanks`,
    dataReceivedSuffix: 'Data received',
    viewInLogbook: 'View in Logbook',
    controlsHint: 'WASD or Arrows to fly · Space for boost · Collect green gas tanks',
    missionCompleted: (planet: string, total: number) =>
      `${planet} mission complete (${total}/${total} objects)`,
    thrustersReady: (target: string) => `Thrusters ready for launch toward ${target}.`,
    launchTo: (target: string) => `Launch to ${target}`,
    switchToPrefix: 'Switch to',
    switchPlanetAria: (target: string) => `Switch to ${target}`,
    origin: 'Origin',
    destination: 'Destination',
    menuKicker: 'Exploration & Data Rescue',
    menuDesc:
      'Pilot your spacecraft across the planetary surface, watch your gas gauge by collecting green fuel tanks on the map, and locate all scientific targets in order to transmit their data to your logbook.',
    chooseStart: 'Choose your starting destination',
    objectsCountLabel: (n: number) => `${n} objects`,
    menuControls: ['Controls: WASD / Arrows', 'Hold click to steer', 'Space: Booster'],
    startMission: 'Start Mission',
    pausedFromLogbook: 'Logbook Open · Game Paused',
    pausedManual: 'Ship Halted · Pause Active',
    pausedTitle: 'Mission Paused',
    pausedLogbookDesc:
      'Flight, incoming meteors, and fuel burn paused automatically while you review the logbook.',
    pausedManualDesc:
      'Engines, asteroids, and fuel consumption are paused until you resume the mission.',
    resetMission: 'Reset Mission',
    hullKicker: 'Asteroid Impact · Critical Hull',
    hullTitle: 'Ship Damaged',
    hullDesc:
      'High-speed asteroids overwhelmed hull integrity. Your rescued data in the logbook remains safe.',
    repairAndRelaunch: 'Repair & Relaunch',
    fuelKicker: 'Empty Tank · Propulsion Halted',
    fuelTitle: 'Out of Gas',
    fuelDesc:
      'Ship movement burned through all available gasoline. Collect the scattered green tanks before the gauge hits zero. Your rescued targets stay in the logbook.',
    refuelAndRelaunch: 'Refuel & Relaunch',
    allKicker: 'Interplanetary Mission Complete',
    allTitle: 'All Data Rescued',
    allDesc: (moonTotal: number, marsTotal: number) =>
      `You successfully recovered telemetry from all ${moonTotal} objects on The Moon and ${marsTotal} objects on Mars. All scientific reports are stored in your logbook.`,
    finalScore: 'Final Score',
    keepExploring: 'Keep Exploring',
    newMission: 'New Mission',
    tabRadar: 'Radar',
    tabLogbook: 'Logbook',
    interplanetaryPropulsion: 'Interplanetary Propulsion',
    unlocked: 'Unlocked',
    locked: 'Locked',
    launchUnlockedDesc: (planet: string, target: string) =>
      `All targets on ${planet} have been rescued. You are cleared to launch toward ${target}.`,
    launchLockedDesc: (planet: string, target: string, total: number) =>
      `Rescue all ${total} targets on ${planet} to unlock launch toward ${target}.`,
    // RadarPanel
    radarTitle: 'Rescue Radar',
    radarRescued: (n: number, total: number) => `${n}/${total} rescued`,
    currentPos: 'Current position',
    activeTarget: (idx: number, total: number) => `Active target (${idx}/${total})`,
    bearing: 'Bearing',
    sweepComplete: 'Sweep complete',
    sweepCompleteDesc: (planet: string) => `All signals from ${planet} have been recovered.`,
    unconfirmedSignal: 'Unconfirmed signal',
    appearsNextDesc: 'Appears after rescuing current target',
    rescuedBadge: 'Rescued',
    standbyBadge: 'Standby',
    // ProbeMinimap
    minimapTitle: 'Probe Radar',
    minimapTarget: (dist: number) => `Active target: ${dist} m`,
    minimapAllScanned: (total: number) => `${total}/${total} probes scanned`,
    minimapScanning: 'Scanning sector...',
    // LogbookPanel
    logbookTitle: 'Mission Logbook',
    unlockedCount: (n: number, total: number) => `${n}/${total} unlocked`,
    tapToOpenImage: 'Unlocked · Tap to open image',
    tapToViewLog: 'Unlocked · Tap to view log',
    lockedCollect: 'Locked · Collect to unlock',
    viewImage: 'View image',
    open: 'Open',
    pendingImage: 'Logbook image pending.',
    // StoryPopupModal
    exitStory: 'Exit',
    // Canvas
    canvasSaved: 'SAVED IN LOGBOOK',
    canvasTransmitting: (pct: number) => `TRANSMITTING ${pct}%`,
    cardinals: ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'],
    canvasCardinals: { n: 'N', s: 'S', w: 'W', e: 'E' },
    stageIgnition: 'Thruster Ignition',
    stageTakeoff: (from: string) => `Taking off from ${from}`,
    stageTransit: (to: string) => `Powered transit to ${to}`,
    stageDescent: (to: string) => `Orbital descent at ${to}`,
    stageLanding: (sector: string) => `Landing at ${sector}`,
  },
} as const;
