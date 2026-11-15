import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Fuel,
  Pause,
  Play,
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
import { StoryPopupModal } from './components/StoryPopupModal';
import {
  FUEL_NODE_COUNT,
  generatePlanetCrystals,
  INITIAL_RESCUE_OBJECTS,
  pickFuelRespawnCoords,
  PLANETS,
  STORY_POPUP_BY_OBJECT_ID,
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

const STORAGE_KEY = 'horizonte_orbital_save_v6';

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

    // Ensure saved fuel nodes match scarce count & keep orbital radii updated
    if (parsed.crystalsByPlanet?.moon?.length !== FUEL_NODE_COUNT) {
      parsed.crystalsByPlanet = {
        moon: generatePlanetCrystals('moon'),
        mars: generatePlanetCrystals('mars'),
      };
    }
    (['moon', 'mars'] as PlanetId[]).forEach((pid) => {
      parsed.objectsByPlanet[pid] = parsed.objectsByPlanet[pid].map((obj, idx) => {
        const template = INITIAL_RESCUE_OBJECTS[pid][idx];
        if (!template || obj.discovered) return obj;
        return {
          ...obj,
          orbitRadiusX: template.orbitRadiusX,
          orbitRadiusY: template.orbitRadiusY,
          orbitSpeed: template.orbitSpeed,
        };
      });
    });

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
  const [storyPopup, setStoryPopup] = useState<{
    kicker: string;
    title: string;
    imageUrl: string;
  } | null>(null);
  const returnPhaseRef = useRef<GamePhase>('PLAYING');
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

  // Replenish one sparse fuel canister far from player when active canisters drop below 4
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const activeFuelCount = currentCrystals.filter((c) => !c.collected).length;
    if (activeFuelCount >= 4) return;

    const timer = window.setTimeout(() => {
      setCrystalsByPlanet((prev) => {
        const list = prev[planetId];
        const idx = list.findIndex((c) => c.collected);
        if (idx === -1) return prev;
        const coords = pickFuelRespawnCoords(shipRef.current.x, shipRef.current.y);
        const updated = list.map((c, i) =>
          i === idx ? { ...c, x: coords.x, y: coords.y, collected: false } : c
        );
        return { ...prev, [planetId]: updated };
      });
    }, 6500);

    return () => window.clearTimeout(timer);
  }, [phase, planetId, currentCrystals]);

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

  // Start looping background soundtrack upon first user interaction (respecting browser autoplay rules)
  useEffect(() => {
    const unlockMusic = () => {
      soundEngine.ensureMusicPlaying();
    };
    window.addEventListener('pointerdown', unlockMusic, { passive: true });
    window.addEventListener('keydown', unlockMusic, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockMusic);
      window.removeEventListener('keydown', unlockMusic);
    };
  }, []);

  // Gently duck music while paused or reading archival story pages
  useEffect(() => {
    soundEngine.setMusicDucked(phase === 'PAUSED' || phase === 'STORY_POPUP');
  }, [phase]);

  const handleToggleMute = () => {
    const next = !muted;
    soundEngine.muted = next;
    if (!next) {
      soundEngine.ensureMusicPlaying();
    }
    setMuted(next);
  };

  const handleStartMission = () => {
    soundEngine.ensureMusicPlaying();
    const fresh = createFreshState(selectedStartPlanet);
    setPlanetId(selectedStartPlanet);
    setScore(0);
    setObjectsByPlanet(fresh.objectsByPlanet);
    setCrystalsByPlanet(fresh.crystalsByPlanet);
    setLogEntries([]);
    setAllCompletedShown(false);
    setToast(null);
    setStoryPopup(null);
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
    setStoryPopup(null);
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
    // Also guarantee at least 5 active fuel canisters on respawn so player is never stranded
    setCrystalsByPlanet((prev) => {
      const list = prev[planetId];
      let activeCount = list.filter((c) => !c.collected).length;
      if (activeCount >= 5) return prev;
      const updated = list.map((c) => {
        if (!c.collected || activeCount >= 5) return c;
        activeCount += 1;
        const coords = pickFuelRespawnCoords(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        return { ...c, x: coords.x, y: coords.y, collected: false };
      });
      return { ...prev, [planetId]: updated };
    });

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

  const handleTogglePause = useCallback(() => {
    setPhase((current) => {
      if (current === 'PLAYING') {
        shipRef.current.thrusting = false;
        shipRef.current.boosting = false;
        return 'PAUSED';
      }
      if (current === 'PAUSED') {
        shipRef.current.vx = 0;
        shipRef.current.vy = 0;
        shipRef.current.thrusting = false;
        shipRef.current.boosting = false;
        shipRef.current.invulnTimer = Math.max(shipRef.current.invulnTimer, 0.8);
        setSidebarTab((tab) => (tab === 'logbook' ? 'radar' : tab));
        return 'PLAYING';
      }
      return current;
    });
  }, []);

  const handleSelectSidebarTab = useCallback(
    (tab: 'radar' | 'logbook') => {
      setSidebarTab(tab);
      if (tab === 'logbook' && phase === 'PLAYING') {
        shipRef.current.thrusting = false;
        shipRef.current.boosting = false;
        setPhase('PAUSED');
      }
    },
    [phase]
  );

  // Allow keyboard P / Escape to pause or resume during active mission
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (phase === 'PLAYING' || phase === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, handleTogglePause]);

  const handleContinueFromStory = () => {
    shipRef.current.vx = 0;
    shipRef.current.vy = 0;
    shipRef.current.thrusting = false;
    shipRef.current.boosting = false;
    shipRef.current.invulnTimer = 1.6;
    setStoryPopup(null);
    setPhase(returnPhaseRef.current);
  };

  const handleOpenStoryFromLogbook = useCallback(
    (objectId: string) => {
      const story = STORY_POPUP_BY_OBJECT_ID[objectId];
      if (!story) return;
      if (phase !== 'STORY_POPUP') {
        returnPhaseRef.current = phase;
      }
      shipRef.current.vx = 0;
      shipRef.current.vy = 0;
      shipRef.current.thrusting = false;
      shipRef.current.boosting = false;
      setStoryPopup(story);
      setPhase('STORY_POPUP');
    },
    [phase]
  );

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
    (
      objectId: string,
      nextObjectPlacement?: { id: string; orbitAngle: number; x: number; y: number }
    ) => {
      const targetObj = objectsByPlanet[planetId].find((o) => o.id === objectId);
      if (!targetObj || targetObj.discovered) return;

      setScore((prev) => prev + targetObj.points);
      setObjectsByPlanet((prev) => ({
        ...prev,
        [planetId]: prev[planetId].map((o) => {
          if (o.id === objectId) {
            return { ...o, discovered: true, downloadProgress: 1 };
          }
          if (nextObjectPlacement && o.id === nextObjectPlacement.id) {
            return {
              ...o,
              orbitAngle: nextObjectPlacement.orbitAngle,
              x: nextObjectPlacement.x,
              y: nextObjectPlacement.y,
              downloadProgress: 0,
            };
          }
          return o;
        }),
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

      const story = STORY_POPUP_BY_OBJECT_ID[targetObj.id];
      if (story) {
        returnPhaseRef.current = 'PLAYING';
        shipRef.current.vx = 0;
        shipRef.current.vy = 0;
        shipRef.current.thrusting = false;
        shipRef.current.boosting = false;
        setStoryPopup(story);
        setPhase('STORY_POPUP');
      }
    },
    [objectsByPlanet, planetId]
  );

  const handleShipDamaged = useCallback((remainingHull: number) => {
    setHull(remainingHull);
    if (remainingHull <= 0) {
      setPhase('SHIP_DESTROYED');
    }
  }, []);

  const handleOutOfFuel = useCallback(() => {
    setPhase((current) => (current === 'PLAYING' ? 'OUT_OF_FUEL' : current));
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
        <div className="flex items-center gap-2.5 shrink-0">
          {(phase === 'PLAYING' || phase === 'PAUSED') && (
            <button
              type="button"
              onClick={handleTogglePause}
              className={`crayon-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                phase === 'PAUSED' ? 'crayon-btn-emerald' : 'crayon-btn-cyan'
              }`}
              aria-label={phase === 'PAUSED' ? 'Reanudar misión' : 'Pausar misión'}
            >
              {phase === 'PAUSED' ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
              <span>{phase === 'PAUSED' ? 'Reanudar' : 'Pausa'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleMute}
            className="crayon-btn crayon-btn-dark inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
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
            className="crayon-btn crayon-btn-amber inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
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
            onOutOfFuel={handleOutOfFuel}
            onShipTelemetryUpdate={handleShipTelemetryUpdate}
            onTransitionProgress={handleTransitionProgress}
            onTransitionComplete={handleTransitionComplete}
          />

          {/* Top-Left Sector, Hull & Gasoline Telemetry */}
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
                  <Fuel
                    className={`w-3.5 h-3.5 shrink-0 ${
                      boostEnergy > 50
                        ? 'text-emerald-400'
                        : boostEnergy > 25
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  />
                  <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        boostEnergy > 50
                          ? 'bg-emerald-400'
                          : boostEnergy > 25
                          ? 'bg-amber-400'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.round(boostEnergy)}%` }}
                    />
                  </div>
                  <span
                    className={`font-mono-tabular text-[11px] ${
                      boostEnergy <= 25
                        ? 'text-red-400 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    {Math.round(boostEnergy)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Low Gasoline Warning Banner */}
          {phase === 'PLAYING' && boostEnergy <= 25 && (
            <div
              role="status"
              className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#1A0B0E]/95 border border-red-500/80 text-red-200 px-3.5 py-2 rounded-lg shadow-xl whitespace-nowrap"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <Fuel className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-mono-tabular text-xs font-semibold tracking-wide">
                {boostEnergy <= 0
                  ? '¡Sin gasolina! Motores apagados'
                  : `¡Gasolina baja (${Math.round(boostEnergy)}%)! Recoge los tanques verdes`}
              </span>
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
                  handleSelectSidebarTab('logbook');
                  setToast(null);
                }}
                className="crayon-btn crayon-btn-cyan mt-2.5 inline-flex items-center px-3.5 py-1 text-sm font-bold whitespace-nowrap cursor-pointer"
              >
                Ver registro en Bitácora
              </button>
            </div>
          )}

          {/* Bottom-Left Controls Hint */}
          {phase === 'PLAYING' && !currentMissionComplete && (
            <div className="pointer-events-none hidden sm:block absolute bottom-3 left-3 bg-[#0B0F17]/85 border border-slate-800/80 rounded-md px-3 py-1.5 text-[11px] text-slate-300">
              WASD o Flechas para volar · Espacio para turbo · Recoge tanques verdes de gasolina
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
            <div className="crayon-box crayon-box-slate absolute bottom-3 left-3 w-[calc(100%-224px)] max-w-md p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
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
                className={`crayon-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  activePlanet.targetPlanetId === 'mars'
                    ? 'crayon-btn-amber'
                    : 'crayon-btn-cyan'
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
                    Pilota tu nave espacial sobre la superficie planetaria, vigila tu nivel de gasolina recogiendo tanques verdes en el mapa y localiza los 4 objetos científicos en orden para transmitir su información hacia tu bitácora.
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
                      className={`crayon-btn p-3.5 text-left cursor-pointer ${
                        selectedStartPlanet === 'moon'
                          ? 'crayon-btn-cyan'
                          : 'crayon-btn-dark'
                      }`}
                    >
                      <div className="font-crayon text-lg font-bold">
                        La Luna
                      </div>
                      <div
                        className={`font-sans text-xs mt-0.5 ${
                          selectedStartPlanet === 'moon'
                            ? 'text-slate-900 font-medium'
                            : 'text-slate-300'
                        }`}
                      >
                        Mare Tranquillitatis · 4 objetos
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedStartPlanet('mars')}
                      className={`crayon-btn p-3.5 text-left cursor-pointer ${
                        selectedStartPlanet === 'mars'
                          ? 'crayon-btn-amber'
                          : 'crayon-btn-dark'
                      }`}
                    >
                      <div className="font-crayon text-lg font-bold">
                        Marte
                      </div>
                      <div
                        className={`font-sans text-xs mt-0.5 ${
                          selectedStartPlanet === 'mars'
                            ? 'text-slate-900 font-medium'
                            : 'text-slate-300'
                        }`}
                      >
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
                  className="crayon-btn crayon-btn-cyan w-full py-3 px-4 font-bold text-base cursor-pointer"
                >
                  Comenzar Misión
                </button>
              </div>
            </div>
          )}

          {/* Story / Archival Discovery Popup (pure transparent image + Salir button) */}
          {phase === 'STORY_POPUP' && storyPopup && (
            <StoryPopupModal
              imageUrl={storyPopup.imageUrl}
              alt={storyPopup.title}
              onExit={handleContinueFromStory}
            />
          )}

          {/* Crayon Pause Overlay (manual pause or auto-pause when reading Bitácora) */}
          {phase === 'PAUSED' && (
            <div className="absolute inset-0 bg-[#07090E]/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="crayon-box crayon-box-slate w-full max-w-md p-6 flex flex-col gap-4 shadow-2xl">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                    <Pause className="w-4 h-4 shrink-0" />
                    <span>
                      {sidebarTab === 'logbook'
                        ? 'Bitácora Abierta · Juego en Pausa'
                        : 'Nave Detenida · Pausa Activa'}
                    </span>
                  </div>
                  <h2 className="font-crayon text-3xl font-bold text-slate-50 mt-1">
                    Misión en Pausa
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed mt-1.5">
                    {sidebarTab === 'logbook'
                      ? 'El vuelo, los meteoritos y el consumo de gasolina se pausaron automáticamente mientras revisas la bitácora.'
                      : 'Los motores, los asteroides y el consumo de gasolina están detenidos hasta que reanudes la misión.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="crayon-btn crayon-btn-emerald flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>Reanudar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMission}
                    className="crayon-btn crayon-btn-dark py-2.5 px-4 text-sm font-bold cursor-pointer"
                  >
                    Reiniciar Misión
                  </button>
                </div>
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
                    className="crayon-btn crayon-btn-cyan flex-1 py-2.5 px-4 text-sm font-bold cursor-pointer"
                  >
                    Reparar y Relanzar
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMission}
                    className="crayon-btn crayon-btn-dark py-2.5 px-4 text-sm font-bold cursor-pointer"
                  >
                    Reiniciar Misión
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Out of Fuel Emergency Modal */}
          {phase === 'OUT_OF_FUEL' && (
            <div className="absolute inset-0 bg-[#07090E]/85 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-[#0E131D] border border-amber-500/45 rounded-xl p-6 flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                    <Fuel className="w-4 h-4 shrink-0" />
                    <span>Tanque Vacío · Propulsión Detenida</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-50 mt-1">
                    Sin Gasolina
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed mt-2">
                    El movimiento de la nave consumió toda la gasolina disponible. Recoge los tanques verdes dispersos antes de que el medidor llegue a cero. Tus objetos rescatados siguen en la bitácora.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleRepairAndRespawn}
                    className="crayon-btn crayon-btn-emerald flex-1 py-2.5 px-4 text-sm font-bold cursor-pointer"
                  >
                    Reabastecer y Relanzar
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMission}
                    className="crayon-btn crayon-btn-dark py-2.5 px-4 text-sm font-bold cursor-pointer"
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
                    className="crayon-btn crayon-btn-dark flex-1 py-2.5 px-4 text-sm font-bold cursor-pointer"
                  >
                    Seguir Explorando
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMission}
                    className="crayon-btn crayon-btn-cyan flex-1 py-2.5 px-4 text-sm font-bold cursor-pointer"
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
            <div className="crayon-box crayon-box-slate flex items-center gap-2 p-1.5">
              <button
                type="button"
                onClick={() => handleSelectSidebarTab('radar')}
                className={`crayon-btn flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  sidebarTab === 'radar'
                    ? planetId === 'moon'
                      ? 'crayon-btn-cyan'
                      : 'crayon-btn-amber'
                    : 'crayon-btn-ghost'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Radar ({rescuedCountCurrent}/4)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectSidebarTab('logbook')}
                className={`crayon-btn flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                  sidebarTab === 'logbook'
                    ? 'crayon-btn-emerald'
                    : 'crayon-btn-ghost'
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
                <div className="crayon-box crayon-box-slate p-3.5 flex flex-col gap-2.5 mt-auto">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-crayon text-base font-bold text-slate-100">
                      Propulsión Interplanetaria
                    </span>
                    <span
                      className={`font-crayon text-xs font-bold ${
                        currentMissionComplete
                          ? 'text-emerald-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {currentMissionComplete ? 'Desbloqueado' : 'Bloqueado'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentMissionComplete
                      ? `Todos los objetos de ${activePlanet.name} fueron rescatados. Puedes despegar hacia ${activePlanet.targetPlanetName}.`
                      : `Rescata los 4 objetos de ${activePlanet.name} para habilitar el despegue hacia ${activePlanet.targetPlanetName}.`}
                  </p>

                  <button
                    type="button"
                    disabled={!currentMissionComplete || phase !== 'PLAYING'}
                    onClick={handleLaunchToTargetPlanet}
                    className={`crayon-btn w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-bold whitespace-nowrap ${
                      currentMissionComplete && phase === 'PLAYING'
                        ? activePlanet.targetPlanetId === 'mars'
                          ? 'crayon-btn-amber cursor-pointer'
                          : 'crayon-btn-cyan cursor-pointer'
                        : 'crayon-btn-disabled cursor-not-allowed'
                    }`}
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Despegar hacia {activePlanet.targetPlanetName}</span>
                  </button>
                </div>
              </>
            ) : (
              <LogbookPanel
                activePlanetId={planetId}
                objectsByPlanet={objectsByPlanet}
                entries={logEntries}
                onOpenStoryImage={handleOpenStoryFromLogbook}
              />
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
