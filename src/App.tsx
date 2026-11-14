import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Download,
  Flame,
  Radio,
  Rocket,
  RotateCcw,
  Shield,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { LogbookPanel } from './components/LogbookPanel';
import { ProbeMinimap } from './components/ProbeMinimap';
import { RadarPanel } from './components/RadarPanel';
import {
  generatePlanetCrystals,
  INITIAL_RESCUE_OBJECTS,
  PLANETS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './data/planets';
import {
  CrystalNode,
  GamePhase,
  LogEntry,
  PlanetId,
  RescueObject,
  ShipState,
  TelemetryToast,
  TransitionState,
} from './types/game';
import { soundEngine } from './utils/audio';

const STORAGE_KEY = 'horizonte_orbital_save_v4';

interface SavedState {
  planetId: PlanetId;
  score: number;
  objectsByPlanet: Record<PlanetId, RescueObject[]>;
  crystalsByPlanet: Record<PlanetId, CrystalNode[]>;
  logEntries: LogEntry[];
  allCompletedShown: boolean;
}

function createFreshState(startPlanet: PlanetId = 'moon'): SavedState {
  return {
    planetId: startPlanet,
    score: 0,
    objectsByPlanet: {
      moon: INITIAL_RESCUE_OBJECTS.moon.map((o) => ({ ...o })),
      mars: INITIAL_RESCUE_OBJECTS.mars.map((o) => ({ ...o })),
    },
    crystalsByPlanet: {
      moon: generatePlanetCrystals('moon'),
      mars: generatePlanetCrystals('mars'),
    },
    logEntries: [],
    allCompletedShown: false,
  };
}

function loadSavedState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedState;
    if (
      !parsed.objectsByPlanet?.moon?.[0]?.orbitRadiusX ||
      !parsed.objectsByPlanet?.mars?.[0]?.orbitRadiusX
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function App() {
  const saved = useMemo(() => loadSavedState(), []);

  const [phase, setPhase] = useState<GamePhase>(
    saved && saved.logEntries.length > 0 ? 'PLAYING' : 'MENU'
  );
  const [selectedStartPlanet, setSelectedStartPlanet] = useState<PlanetId>(
    saved?.planetId ?? 'moon'
  );
  const [planetId, setPlanetId] = useState<PlanetId>(saved?.planetId ?? 'moon');
  const [score, setScore] = useState<number>(saved?.score ?? 0);
  const [objectsByPlanet, setObjectsByPlanet] = useState<
    Record<PlanetId, RescueObject[]>
  >(() => saved?.objectsByPlanet ?? createFreshState().objectsByPlanet);
  const [crystalsByPlanet, setCrystalsByPlanet] = useState<
    Record<PlanetId, CrystalNode[]>
  >(() => saved?.crystalsByPlanet ?? createFreshState().crystalsByPlanet);
  const [logEntries, setLogEntries] = useState<LogEntry[]>(
    () => saved?.logEntries ?? []
  );
  const [allCompletedShown, setAllCompletedShown] = useState<boolean>(
    saved?.allCompletedShown ?? false
  );

  const [sidebarTab, setSidebarTab] = useState<'radar' | 'logbook'>('radar');
  const [muted, setMuted] = useState<boolean>(false);
  const [toast, setToast] = useState<TelemetryToast | null>(null);
  const [transitionState, setTransitionState] =
    useState<TransitionState | null>(null);

  const [shipCoords, setShipCoords] = useState<{ x: number; y: number }>({
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
  });
  const [boostEnergy, setBoostEnergy] = useState<number>(100);
  const [hull, setHull] = useState<number>(100);

  const shipRef = useRef<ShipState>({
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    thrusting: false,
    boosting: false,
    boostEnergy: 100,
    hull: 100,
    invulnTimer: 0,
  });

  const activePlanet = PLANETS[planetId];
  const currentObjects = objectsByPlanet[planetId];
  const currentCrystals = crystalsByPlanet[planetId];

  const rescuedCountCurrent = currentObjects.filter((o) => o.discovered).length;
  const totalRescued =
    objectsByPlanet.moon.filter((o) => o.discovered).length +
    objectsByPlanet.mars.filter((o) => o.discovered).length;
  const currentMissionComplete = rescuedCountCurrent === 4;

  // Persist progress to localStorage
  useEffect(() => {
    const payload: SavedState = {
      planetId,
      score,
      objectsByPlanet,
      crystalsByPlanet,
      logEntries,
      allCompletedShown,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    planetId,
    score,
    objectsByPlanet,
    crystalsByPlanet,
    logEntries,
    allCompletedShown,
  ]);

  // Auto-dismiss telemetry toast
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Trigger ALL_COMPLETED celebration once all 8 objects are rescued
  useEffect(() => {
    if (
      totalRescued === 8 &&
      !allCompletedShown &&
      phase === 'PLAYING'
    ) {
      const timer = window.setTimeout(() => {
        setAllCompletedShown(true);
        setPhase('ALL_COMPLETED');
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [totalRescued, allCompletedShown, phase]);

  const handleToggleMute = () => {
    const next = !muted;
    soundEngine.muted = next;
    setMuted(next);
  };

  const handleStartMission = () => {
    const fresh = createFreshState(selectedStartPlanet);
    setPlanetId(selectedStartPlanet);
    setScore(0);
    setObjectsByPlanet(fresh.objectsByPlanet);
    setCrystalsByPlanet(fresh.crystalsByPlanet);
    setLogEntries([]);
    setAllCompletedShown(false);
    setToast(null);
    shipRef.current = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      thrusting: false,
      boosting: false,
      boostEnergy: 100,
      hull: 100,
      invulnTimer: 0,
    };
    setShipCoords({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });
    setBoostEnergy(100);
    setHull(100);
    setPhase('PLAYING');
  };

  const handleResetMission = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = createFreshState('moon');
    setSelectedStartPlanet('moon');
    setPlanetId('moon');
    setScore(0);
    setObjectsByPlanet(fresh.objectsByPlanet);
    setCrystalsByPlanet(fresh.crystalsByPlanet);
    setLogEntries([]);
    setAllCompletedShown(false);
    setToast(null);
    setTransitionState(null);
    setSidebarTab('radar');
    shipRef.current = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      thrusting: false,
      boosting: false,
      boostEnergy: 100,
      hull: 100,
      invulnTimer: 0,
    };
    setHull(100);
    setPhase('MENU');
  };

  const handleRepairAndRespawn = () => {
    shipRef.current = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      thrusting: false,
      boosting: false,
      boostEnergy: 100,
      hull: 100,
      invulnTimer: 1.6,
    };
    setShipCoords({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });
    setBoostEnergy(100);
    setHull(100);
    setPhase('PLAYING');
  };

  const handleCrystalCollect = useCallback(
    (crystalId: string, value: number) => {
      setScore((prev) => prev + value);
      setCrystalsByPlanet((prev) => ({
        ...prev,
        [planetId]: prev[planetId].map((c) =>
          c.id === crystalId ? { ...c, collected: true } : c
        ),
      }));
    },
    [planetId]
  );

  const handleObjectRescued = useCallback(
    (objectId: string) => {
      const targetObj = objectsByPlanet[planetId].find((o) => o.id === objectId);
      if (!targetObj || targetObj.discovered) return;

      setScore((prev) => prev + targetObj.points);
      setObjectsByPlanet((prev) => ({
        ...prev,
        [planetId]: prev[planetId].map((o) =>
          o.id === objectId
            ? { ...o, discovered: true, downloadProgress: 1 }
            : o
        ),
      }));

      const now = new Date();
      const timestamp = now.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const newEntry: LogEntry = {
        id: `log-${objectId}-${now.getTime()}`,
        objectId: targetObj.id,
        planet: planetId,
        planetName: PLANETS[planetId].name,
        objectName: targetObj.name,
        sector: targetObj.sector,
        coordinates: `X:${Math.round(targetObj.x)} Y:${Math.round(targetObj.y)}`,
        frequency: targetObj.frequency,
        transmissionTitle: targetObj.transmissionTitle,
        transmissionSummary: targetObj.transmissionSummary,
        telemetryReading: targetObj.telemetryReading,
        pointsEarned: targetObj.points,
        timestamp,
      };

      setLogEntries((prev) => [newEntry, ...prev]);

      const repaired = Math.min(100, shipRef.current.hull + 25);
      shipRef.current.hull = repaired;
      setHull(repaired);

      setToast({
        id: newEntry.id,
        title: `${targetObj.name} · Información recibida`,
        subtitle: targetObj.transmissionTitle,
        reading: targetObj.telemetryReading,
        points: targetObj.points,
        planet: planetId,
      });
    },
    [objectsByPlanet, planetId]
  );

  const handleShipDamaged = useCallback((remainingHull: number) => {
    setHull(remainingHull);
    if (remainingHull <= 0) {
      setPhase('SHIP_DESTROYED');
    }
  }, []);

  const handleShipTelemetryUpdate = useCallback(
    (coords: { x: number; y: number }, energy: number, shipHull: number) => {
      setShipCoords(coords);
      setBoostEnergy(energy);
      setHull(shipHull);
    },
    []
  );

  const handleLaunchToTargetPlanet = () => {
    if (!currentMissionComplete || phase !== 'PLAYING') return;
    const destination = activePlanet.targetPlanetId;
    soundEngine.playLaunchSequence();
    setToast(null);
    setTransitionState({
      fromPlanet: planetId,
      toPlanet: destination,
      progress: 0,
      stageLabel: `Despegando de ${activePlanet.name}`,
    });
    setPhase('TAKEOFF_TRANSITION');
  };

  const handleTransitionProgress = useCallback(
    (progress: number, stageLabel: string) => {
      setTransitionState((prev) =>
        prev ? { ...prev, progress, stageLabel } : null
      );
    },
    []
  );

  const handleTransitionComplete = useCallback(() => {
    const nextPlanet = PLANETS[planetId].targetPlanetId;
    setTransitionState(null);
    setPlanetId(nextPlanet);
    shipRef.current = {
      x: WORLD_WIDTH / 2,
      y: WORLD_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      thrusting: false,
      boosting: false,
      boostEnergy: 100,
      hull: 100,
      invulnTimer: 1.0,
    };
    setShipCoords({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 });
    setBoostEnergy(100);
    setHull(100);
    soundEngine.playArrivalChime();
    setPhase('PLAYING');
  }, [planetId]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#07090E] text-slate-100">
      {/* Top Bar Contract: 3 zones */}
      <header className="h-14 shrink-0 border-b border-slate-800/90 bg-[#0B0F17] px-4 lg:px-6 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Title */}
        <div className="font-display text-lg font-bold tracking-wide text-slate-50 whitespace-nowrap shrink-0">
          Horizonte Orbital
        </div>

        {/* Zone 2: Clean Unboxed Live Mission Metrics */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400 whitespace-nowrap overflow-hidden">
          <span
            className={`font-semibold ${
              planetId === 'moon' ? 'text-cyan-400' : 'text-amber-400'
            }`}
          >
            {activePlanet.name}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular text-slate-200">
            Puntos: {score.toLocaleString('es-MX')}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular text-slate-200">
            Rescatados: {rescuedCountCurrent}/4
          </span>
          <span aria-hidden="true" className="hidden md:inline">
            ·
          </span>
          <span className="hidden md:inline font-mono-tabular text-slate-400">
            Bitácora: {totalRescued}/8
          </span>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/horizonte-orbital.html"
            download="horizonte-orbital.html"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Descargar HTML</span>
          </a>

          <button
            type="button"
            onClick={handleToggleMute}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            aria-label={muted ? 'Activar audio' : 'Silenciar audio'}
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {muted ? 'Silenciado' : 'Audio'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetMission}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </header>

      {/* Main Split Workspace */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Left/Center Flight Viewport */}
        <section className="relative flex-1 min-h-[360px] min-w-0 bg-[#05070B]">
          <GameCanvas
            planet={activePlanet}
            phase={phase}
            shipRef={shipRef}
            objects={currentObjects}
            crystals={currentCrystals}
            transitionState={transitionState}
            onCrystalCollect={handleCrystalCollect}
            onObjectRescued={handleObjectRescued}
            onShipDamaged={handleShipDamaged}
            onShipTelemetryUpdate={handleShipTelemetryUpdate}
            onTransitionProgress={handleTransitionProgress}
            onTransitionComplete={handleTransitionComplete}
          />

          {/* Top-Left Sector, Hull & Thruster Boost Telemetry */}
          {phase === 'PLAYING' && (
            <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-2">
              <div className="bg-[#0B0F17]/90 border border-slate-800/90 rounded-lg px-3 py-2 backdrop-blur-xs">
                <div className="text-xs font-semibold text-slate-100">
                  {activePlanet.name} · {activePlanet.sectorName}
                </div>
                <div className="font-mono-tabular text-[11px] text-slate-400 mt-0.5">
                  Gravedad {activePlanet.gravityLabel} · Temp{' '}
                  {activePlanet.surfaceTemp}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Shield
                    className={`w-3.5 h-3.5 shrink-0 ${
                      hull > 50
                        ? 'text-emerald-400'
                        : hull > 25
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  />
                  <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 ${
                        hull > 50
                          ? 'bg-emerald-400'
                          : hull > 25
                          ? 'bg-amber-400'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.round(hull)}%` }}
                    />
                  </div>
                  <span
                    className={`font-mono-tabular text-[11px] ${
                      hull <= 25 ? 'text-red-400 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    {Math.round(hull)}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        planetId === 'moon' ? 'bg-cyan-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.round(boostEnergy)}%` }}
                    />
                  </div>
                  <span className="font-mono-tabular text-[11px] text-slate-300">
                    {Math.round(boostEnergy)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Incoming Telemetry Data Toast */}
          {toast && phase === 'PLAYING' && (
            <div className="absolute top-3 right-3 max-w-sm bg-[#0E131D]/95 border border-emerald-500/40 rounded-lg p-3.5 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{toast.title}</span>
                </div>
                <span className="font-mono-tabular text-xs font-semibold text-emerald-300 shrink-0">
                  +{toast.points} pts
                </span>
              </div>
              <div className="text-xs font-medium text-slate-100 mt-1">
                {toast.subtitle}
              </div>
              <div className="font-mono-tabular text-[11px] text-slate-400 mt-1">
                {toast.reading}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSidebarTab('logbook');
                  setToast(null);
                }}
                className="mt-2 text-xs font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-2 cursor-pointer"
              >
                Ver registro en Bitácora
              </button>
            </div>
          )}

          {/* Bottom-Left Controls Hint */}
          {phase === 'PLAYING' && !currentMissionComplete && (
            <div className="pointer-events-none hidden sm:block absolute bottom-3 left-3 bg-[#0B0F17]/85 border border-slate-800/80 rounded-md px-3 py-1.5 text-[11px] text-slate-300">
              WASD o Flechas para volar · Mantén clic para dirigir · Espacio para turbo
            </div>
          )}

          {/* Floating In-Viewport Probe Radar Minimap */}
          {phase === 'PLAYING' && (
            <ProbeMinimap
              planet={activePlanet}
              shipRef={shipRef}
              objects={currentObjects}
              crystals={currentCrystals}
            />
          )}

          {/* Mission Complete -> Planetary Propulsion Launch CTA (kept clear of bottom-right minimap) */}
          {phase === 'PLAYING' && currentMissionComplete && (
            <div className="absolute bottom-3 left-3 w-[calc(100%-224px)] max-w-md bg-[#0E131D]/95 border border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
              <div className="min-w-0 text-center sm:text-left">
                <div className="text-xs font-semibold text-emerald-400">
                  Misión en {activePlanet.name} completada (4/4 objetos)
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  Propulsores listos para despegar hacia{' '}
                  {activePlanet.targetPlanetName}.
                </div>
              </div>
              <button
                type="button"
                onClick={handleLaunchToTargetPlanet}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activePlanet.targetPlanetId === 'mars'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                }`}
              >
                <Rocket className="w-4 h-4" />
                <span>Despegar hacia {activePlanet.targetPlanetName}</span>
              </button>
            </div>
          )}

          {/* Takeoff Transition Telemetry Overlay */}
          {phase === 'TAKEOFF_TRANSITION' && transitionState && (
            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
              <div className="w-full max-w-md bg-[#0B0F17]/90 border border-slate-700/80 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-display font-semibold text-slate-100">
                    {transitionState.stageLabel}
                  </span>
                  <span className="font-mono-tabular text-amber-400">
                    {Math.round(transitionState.progress * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-75"
                    style={{
                      width: `${Math.round(transitionState.progress * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono-tabular">
                  <span>Origen: {PLANETS[transitionState.fromPlanet].name}</span>
                  <span>Destino: {PLANETS[transitionState.toPlanet].name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Title / Mission Start Overlay */}
          {phase === 'MENU' && (
            <div className="absolute inset-0 bg-[#07090E]/85 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-[#0E131D] border border-slate-800 rounded-xl p-6 flex flex-col gap-5">
                <div>
                  <div className="text-xs font-medium text-cyan-400">
                    Exploración y Rescate de Datos
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-50 mt-1 text-balance">
                    Horizonte Orbital
                  </h1>
                  <p className="text-sm text-slate-300 leading-relaxed mt-2">
                    Pilota tu nave espacial sobre la superficie planetaria, recolecta cristales de energía y utiliza el radar táctico para localizar 4 objetos científicos que transmitirán su información hacia tu bitácora.
                  </p>
                </div>

                {/* Starting Planet Selector */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-medium text-slate-400">
                    Elige tu destino inicial
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedStartPlanet('moon')}
                      className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedStartPlanet === 'moon'
                          ? 'bg-cyan-950/40 border-cyan-500 text-slate-100'
                          : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-display text-sm font-semibold text-slate-100">
                        La Luna
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Mare Tranquillitatis · 4 objetos
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedStartPlanet('mars')}
                      className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        selectedStartPlanet === 'mars'
                          ? 'bg-amber-950/40 border-amber-500 text-slate-100'
                          : 'bg-[#0B0F17] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-display text-sm font-semibold text-slate-100">
                        Marte
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Cráter Jezero · 4 objetos
                      </div>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-400 border-t border-slate-800/80 pt-3 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Controles: WASD / Flechas</span>
                  <span aria-hidden="true">·</span>
                  <span>Clic sostenido para volar</span>
                  <span aria-hidden="true">·</span>
                  <span>Espacio: Propulsor</span>
                </div>

                <button
                  type="button"
                  onClick={handleStartMission}
                  className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                >
                  Comenzar Misión
                </button>
              </div>
            </div>
          )}

          {/* Hull Critical / Emergency Repair Modal */}
          {phase === 'SHIP_DESTROYED' && (
            <div className="absolute inset-0 bg-[#07090E]/85 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0E131D] border border-red-500/45 rounded-xl p-6 flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Impacto de Asteroide · Casco Crítico</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-50 mt-1">
                    Nave Averiada
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed mt-2">
                    Los asteroides de alta velocidad superaron la integridad del casco. Tus datos rescatados en la bitácora siguen a salvo.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleRepairAndRespawn}
                    className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Reparar y Relanzar
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMission}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Reiniciar Misión
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All 8 Objects Rescued Celebration Modal */}
          {phase === 'ALL_COMPLETED' && (
            <div className="absolute inset-0 bg-[#07090E]/85 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0E131D] border border-emerald-500/40 rounded-xl p-6 flex flex-col gap-4">
                <div>
                  <div className="text-xs font-semibold text-emerald-400">
                    Misión Interplanetaria Completada
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-50 mt-1">
                    Todos los datos rescatados
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed mt-2">
                    Has recuperado exitosamente la información de los 4 objetos de La Luna y los 4 objetos de Marte. Todos los reportes científicos están archivados en tu bitácora.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-[#0B0F17] border border-slate-800 rounded-lg p-3.5">
                  <div>
                    <div className="text-xs text-slate-400">Puntuación Final</div>
                    <div className="font-mono-tabular text-xl font-bold text-slate-50 mt-0.5">
                      {score.toLocaleString('es-MX')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Bitácora</div>
                    <div className="font-mono-tabular text-xl font-bold text-emerald-400 mt-0.5">
                      {totalRescued}/8
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setPhase('PLAYING')}
                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Seguir Explorando
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMission}
                    className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Nueva Misión
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Tactical Console: Radar & Mission Logbook */}
        <aside className="w-full lg:w-[390px] xl:w-[410px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800/90 bg-[#0E131D] flex flex-col max-h-[44vh] lg:max-h-none min-h-0">
          {/* Console Segmented Tabs */}
          <div className="p-3 border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-[#080C14] border border-slate-800/80 rounded-lg">
              <button
                type="button"
                onClick={() => setSidebarTab('radar')}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  sidebarTab === 'radar'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Radar ({rescuedCountCurrent}/4)</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('logbook')}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  sidebarTab === 'logbook'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Bitácora ({logEntries.length})</span>
              </button>
            </div>
          </div>

          {/* Active Console Body */}
          <div className="flex-1 min-h-0 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {sidebarTab === 'radar' ? (
              <>
                <RadarPanel
                  planet={activePlanet}
                  shipRef={shipRef}
                  objects={currentObjects}
                  crystals={currentCrystals}
                  shipCoords={shipCoords}
                />

                {/* Interplanetary Launch Module inside console */}
                <div className="border border-slate-800/90 rounded-lg bg-[#0B0F18] p-3.5 flex flex-col gap-2.5 mt-auto">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      Propulsión Interplanetaria
                    </span>
                    <span
                      className={`font-mono-tabular text-[11px] ${
                        currentMissionComplete
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {currentMissionComplete ? 'Desbloqueado' : 'Bloqueado'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {currentMissionComplete
                      ? `Todos los objetos de ${activePlanet.name} fueron rescatados. Puedes despegar hacia ${activePlanet.targetPlanetName}.`
                      : `Rescata los 4 objetos de ${activePlanet.name} para habilitar el despegue hacia ${activePlanet.targetPlanetName}.`}
                  </p>

                  <button
                    type="button"
                    disabled={!currentMissionComplete || phase !== 'PLAYING'}
                    onClick={handleLaunchToTargetPlanet}
                    className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      currentMissionComplete && phase === 'PLAYING'
                        ? activePlanet.targetPlanetId === 'mars'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer'
                        : 'bg-slate-800/70 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Despegar hacia {activePlanet.targetPlanetName}</span>
                  </button>
                </div>
              </>
            ) : (
              <LogbookPanel entries={logEntries} />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
