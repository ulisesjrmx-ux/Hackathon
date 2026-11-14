import React, { useEffect, useRef } from 'react';
import {
  CrystalNode,
  GamePhase,
  PlanetConfig,
  PlanetId,
  RescueObject,
  ShipState,
  TransitionState,
} from '../types/game';
import {
  ASTEROID_IMAGE_URL,
  PLANETS,
  SHIP_IDLE_IMAGE_URL,
  SHIP_THRUST_IMAGE_URL,
} from '../data/planets';
import { soundEngine } from '../utils/audio';

interface GameCanvasProps {
  planet: PlanetConfig;
  phase: GamePhase;
  shipRef: React.MutableRefObject<ShipState>;
  objects: RescueObject[];
  crystals: CrystalNode[];
  transitionState: TransitionState | null;
  onCrystalCollect: (crystalId: string, value: number) => void;
  onObjectRescued: (objectId: string) => void;
  onShipDamaged: (remainingHull: number) => void;
  onShipTelemetryUpdate: (
    coords: { x: number; y: number },
    boostEnergy: number,
    hull: number
  ) => void;
  onTransitionProgress: (progress: number, stageLabel: string) => void;
  onTransitionComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface DataPacket {
  fromX: number;
  fromY: number;
  progress: number;
  speed: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speedFactor: number;
}

interface AsteroidHazard {
  phase: 'WARNING' | 'FLYING';
  warningTimer: number;
  warningDuration: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  ux: number;
  uy: number;
  vx: number;
  vy: number;
  speed: number;
  radius: number;
  rotation: number;
  spinSpeed: number;
  traveled: number;
}

const RESCUE_RANGE = 165;
const CRYSTAL_MAGNET_RANGE = 110;
const CRYSTAL_COLLECT_RANGE = 32;

export const GameCanvas: React.FC<GameCanvasProps> = ({
  planet,
  phase,
  shipRef,
  objects,
  crystals,
  transitionState,
  onCrystalCollect,
  onObjectRescued,
  onShipDamaged,
  onShipTelemetryUpdate,
  onTransitionProgress,
  onTransitionComplete,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Latest props in refs for 60fps loop without recreating loop
  const planetRef = useRef(planet);
  const phaseRef = useRef(phase);
  const objectsRef = useRef(objects);
  const crystalsRef = useRef(crystals);
  const transitionRef = useRef(transitionState);

  const callbacksRef = useRef({
    onCrystalCollect,
    onObjectRescued,
    onShipDamaged,
    onShipTelemetryUpdate,
    onTransitionProgress,
    onTransitionComplete,
  });

  planetRef.current = planet;
  phaseRef.current = phase;
  objectsRef.current = objects;
  crystalsRef.current = crystals;
  transitionRef.current = transitionState;
  callbacksRef.current = {
    onCrystalCollect,
    onObjectRescued,
    onShipDamaged,
    onShipTelemetryUpdate,
    onTransitionProgress,
    onTransitionComplete,
  };

  // Input state
  const keysRef = useRef<Record<string, boolean>>({});
  const pointerSteerRef = useRef<{ active: boolean; screenX: number; screenY: number }>({
    active: false,
    screenX: 0,
    screenY: 0,
  });

  // Visual particles & packets
  const particlesRef = useRef<Particle[]>([]);
  const packetsRef = useRef<DataPacket[]>([]);
  const starsRef = useRef<Star[]>([]);
  const cameraRef = useRef({ x: planet.worldWidth / 2, y: planet.worldHeight / 2 });
  const downloadTickSoundCooldownRef = useRef(0);
  const transitionClockRef = useRef<{ startTime: number; active: boolean }>({
    startTime: 0,
    active: false,
  });
  const asteroidsRef = useRef<AsteroidHazard[]>([]);
  const asteroidSpawnTimerRef = useRef(2.4);
  const screenShakeRef = useRef(0);
  const asteroidSpriteRef = useRef<HTMLCanvasElement | null>(null);
  const planetSpritesRef = useRef<Record<PlanetId, HTMLCanvasElement | null>>({
    moon: null,
    mars: null,
  });
  const shipSpritesRef = useRef<{
    idle: HTMLCanvasElement | null;
    moving: HTMLCanvasElement | null;
  }>({
    idle: null,
    moving: null,
  });

  // Load and crop uploaded asteroid artwork (remove black outer background cleanly)
  useEffect(() => {
    const img = new Image();
    img.src = ASTEROID_IMAGE_URL;
    img.onload = () => {
      const maxDim = 420;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const work = document.createElement('canvas');
      work.width = w;
      work.height = h;
      const wCtx = work.getContext('2d');
      if (!wCtx) return;
      wCtx.drawImage(img, 0, 0, w, h);

      try {
        const imgData = wCtx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const isNearBlack = (idx: number) => {
          const p = idx * 4;
          return data[p] < 36 && data[p + 1] < 36 && data[p + 2] < 36;
        };

        const enqueue = (x: number, y: number) => {
          if (x < 0 || x >= w || y < 0 || y >= h) return;
          const idx = y * w + x;
          if (visited[idx] || !isNearBlack(idx)) return;
          visited[idx] = 1;
          queue[tail++] = idx;
        };

        for (let x = 0; x < w; x++) {
          enqueue(x, 0);
          enqueue(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          enqueue(0, y);
          enqueue(w - 1, y);
        }

        while (head < tail) {
          const idx = queue[head++];
          data[idx * 4 + 3] = 0;
          const x = idx % w;
          const y = (idx - x) / w;
          enqueue(x + 1, y);
          enqueue(x - 1, y);
          enqueue(x, y + 1);
          enqueue(x, y - 1);
        }

        // Crop strictly around rock pixels (ignoring stray faint speed lines outside)
        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const p = (y * w + x) * 4;
            if (data[p + 3] > 20 && Math.max(data[p], data[p + 1], data[p + 2]) > 55) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        wCtx.putImageData(imgData, 0, 0);
        const bw = Math.max(1, maxX - minX + 1);
        const bh = Math.max(1, maxY - minY + 1);
        const side = Math.max(bw, bh);
        const cropped = document.createElement('canvas');
        cropped.width = side;
        cropped.height = side;
        const cCtx = cropped.getContext('2d');
        if (cCtx) {
          cCtx.drawImage(
            work,
            minX,
            minY,
            bw,
            bh,
            (side - bw) / 2,
            (side - bh) / 2,
            bw,
            bh
          );
          asteroidSpriteRef.current = cropped;
        }
      } catch {
        asteroidSpriteRef.current = work;
      }
    };
  }, []);

  // Load and normalize the two user-uploaded rocket sprites (idle vs moving with flame)
  useEffect(() => {
    const loadShipSprite = (key: 'idle' | 'moving', url: string) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const maxDim = 640;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const work = document.createElement('canvas');
        work.width = w;
        work.height = h;
        const wCtx = work.getContext('2d');
        if (!wCtx) return;
        wCtx.drawImage(img, 0, 0, w, h);

        let axisAngle = (78 * Math.PI) / 180;
        let anchorX = w * 0.54;
        let anchorY = h * 0.72;
        let hullLen = h * 0.34;

        try {
          const imgData = wCtx.getImageData(0, 0, w, h);
          const data = imgData.data;
          const visited = new Uint8Array(w * h);
          const queue = new Int32Array(w * h);
          let head = 0;
          let tail = 0;

          const isNearWhite = (idx: number) => {
            const p = idx * 4;
            return data[p] > 234 && data[p + 1] > 234 && data[p + 2] > 234;
          };

          const enqueue = (x: number, y: number) => {
            if (x < 0 || x >= w || y < 0 || y >= h) return;
            const idx = y * w + x;
            if (visited[idx] || !isNearWhite(idx)) return;
            visited[idx] = 1;
            queue[tail++] = idx;
          };

          for (let x = 0; x < w; x++) {
            enqueue(x, 0);
            enqueue(x, h - 1);
          }
          for (let y = 0; y < h; y++) {
            enqueue(0, y);
            enqueue(w - 1, y);
          }

          while (head < tail) {
            const idx = queue[head++];
            data[idx * 4 + 3] = 0;
            const x = idx % w;
            const y = (idx - x) / w;
            enqueue(x + 1, y);
            enqueue(x - 1, y);
            enqueue(x, y + 1);
            enqueue(x, y - 1);
          }

          wCtx.putImageData(imgData, 0, 0);

          // Detect gray nozzle, dark-blue porthole, and red nose cone to lock exact alignment & fuselage scale
          let portX = 0, portY = 0, portN = 0;
          let nozX = 0, nozY = 0, nozN = 0;
          const redPts: Array<{ x: number; y: number }> = [];
          const hullPts: Array<{ x: number; y: number }> = [];

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const p = (y * w + x) * 4;
              if (data[p + 3] < 40) continue;
              const r = data[p];
              const g = data[p + 1];
              const b = data[p + 2];

              const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
              if (maxDiff < 26 && r >= 120 && r <= 220) {
                nozX += x;
                nozY += y;
                nozN++;
                hullPts.push({ x, y });
              } else if (b >= 135 && b - r >= 55 && b - g >= 35) {
                portX += x;
                portY += y;
                portN++;
                hullPts.push({ x, y });
              } else if (r >= 165 && r - g >= 55 && r - b >= 55) {
                redPts.push({ x, y });
                hullPts.push({ x, y });
              } else if (b > 175 && g > 175 && r < 225) {
                // Light-cyan rocket body
                hullPts.push({ x, y });
              }
            }
          }

          if (portN > 10 && nozN > 10 && redPts.length > 10) {
            const pCx = portX / portN;
            const pCy = portY / portN;
            const nCx = nozX / nozN;
            const nCy = nozY / nozN;

            const vx = pCx - nCx;
            const vy = pCy - nCy;
            const vLen = Math.hypot(vx, vy) || 1;
            const ux = vx / vLen;
            const uy = vy / vLen;

            // Isolate red nose cone pixels strictly ahead of porthole & near centerline
            let noseSumX = 0, noseSumY = 0, noseCount = 0;
            for (const pt of redPts) {
              const dx = pt.x - pCx;
              const dy = pt.y - pCy;
              const proj = dx * ux + dy * uy;
              const perp = Math.abs(dx * -uy + dy * ux);
              if (proj > vLen * 0.25 && perp < vLen * 0.85) {
                noseSumX += pt.x;
                noseSumY += pt.y;
                noseCount++;
              }
            }

            if (noseCount > 5) {
              const noseCx = noseSumX / noseCount;
              const noseCy = noseSumY / noseCount;
              axisAngle = Math.atan2(noseCy - nCy, noseCx - nCx);

              const ax = Math.cos(axisAngle);
              const ay = Math.sin(axisAngle);

              let minProj = Infinity;
              let maxProj = -Infinity;
              for (const pt of hullPts) {
                const proj = (pt.x - pCx) * ax + (pt.y - pCy) * ay;
                if (proj < minProj) minProj = proj;
                if (proj > maxProj) maxProj = proj;
              }

              if (maxProj > minProj + 20) {
                hullLen = maxProj - minProj;
                const midProj = (minProj + maxProj) * 0.5;
                anchorX = pCx + ax * midProj;
                anchorY = pCy + ay * midProj;
              }
            }
          }
        } catch {
          // Keep clean fallback center & angle if pixel access is blocked
        }

        // Normalize into a 220x140 canvas facing straight right (+X), hull centered at (132, 70), length = 78px
        const outW = 220;
        const outH = 140;
        const out = document.createElement('canvas');
        out.width = outW;
        out.height = outH;
        const oCtx = out.getContext('2d');
        if (oCtx) {
          const normScale = 78 / Math.max(24, hullLen);
          oCtx.translate(132, 70);
          oCtx.rotate(-axisAngle);
          oCtx.scale(normScale, normScale);
          oCtx.drawImage(work, -anchorX, -anchorY);
          shipSpritesRef.current[key] = out;
        }
      };
    };

    loadShipSprite('idle', SHIP_IDLE_IMAGE_URL);
    loadShipSprite('moving', SHIP_THRUST_IMAGE_URL);
  }, []);

  // Load and process uploaded Moon and Mars artwork (remove exterior white background while preserving interior details)
  useEffect(() => {
    const loadPlanetSprite = (id: PlanetId, url?: string) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const work = document.createElement('canvas');
        work.width = w;
        work.height = h;
        const wCtx = work.getContext('2d');
        if (!wCtx) return;
        wCtx.drawImage(img, 0, 0, w, h);

        try {
          const imgData = wCtx.getImageData(0, 0, w, h);
          const data = imgData.data;
          const visited = new Uint8Array(w * h);
          const queue = new Int32Array(w * h);
          let head = 0;
          let tail = 0;

          const isNearWhite = (idx: number) => {
            const p = idx * 4;
            return data[p] > 236 && data[p + 1] > 236 && data[p + 2] > 236;
          };

          const enqueue = (x: number, y: number) => {
            if (x < 0 || x >= w || y < 0 || y >= h) return;
            const idx = y * w + x;
            if (visited[idx]) return;
            if (!isNearWhite(idx)) return;
            visited[idx] = 1;
            queue[tail++] = idx;
          };

          for (let x = 0; x < w; x++) {
            enqueue(x, 0);
            enqueue(x, h - 1);
          }
          for (let y = 0; y < h; y++) {
            enqueue(0, y);
            enqueue(w - 1, y);
          }

          while (head < tail) {
            const idx = queue[head++];
            data[idx * 4 + 3] = 0;
            const x = idx % w;
            const y = (idx - x) / w;
            enqueue(x + 1, y);
            enqueue(x - 1, y);
            enqueue(x, y + 1);
            enqueue(x, y - 1);
          }

          let minX = w;
          let minY = h;
          let maxX = 0;
          let maxY = 0;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const a = data[(y * w + x) * 4 + 3];
              if (a > 10) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          wCtx.putImageData(imgData, 0, 0);

          const bw = Math.max(1, maxX - minX + 1);
          const bh = Math.max(1, maxY - minY + 1);
          const side = Math.max(bw, bh);
          const cropped = document.createElement('canvas');
          cropped.width = side;
          cropped.height = side;
          const cCtx = cropped.getContext('2d');
          if (cCtx) {
            cCtx.drawImage(
              work,
              minX,
              minY,
              bw,
              bh,
              (side - bw) / 2,
              (side - bh) / 2,
              bw,
              bh
            );
            planetSpritesRef.current[id] = cropped;
          }
        } catch {
          const cropped = document.createElement('canvas');
          const side = Math.min(w, h);
          cropped.width = side;
          cropped.height = side;
          const cCtx = cropped.getContext('2d');
          if (cCtx) {
            cCtx.beginPath();
            cCtx.arc(side / 2, side / 2, side * 0.44, 0, Math.PI * 2);
            cCtx.clip();
            cCtx.drawImage(work, 0, 0, side, side);
            planetSpritesRef.current[id] = cropped;
          }
        }
      };
    };

    loadPlanetSprite('moon', PLANETS.moon.surfaceImageUrl);
    loadPlanetSprite('mars', PLANETS.mars.surfaceImageUrl);
  }, []);

  // Initialize background stars once
  useEffect(() => {
    const stars: Star[] = [];
    for (let i = 0; i < 190; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.7 + Math.random() * 1.9,
        alpha: 0.25 + Math.random() * 0.75,
        speedFactor: 0.4 + Math.random() * 1.4,
      });
    }
    starsRef.current = stars;
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Space',
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
        ].includes(code)
      ) {
        if (phaseRef.current === 'PLAYING') {
          e.preventDefault();
        }
        keysRef.current[code] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const handleBlur = () => {
      keysRef.current = {};
      pointerSteerRef.current.active = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Snap camera and reset hazards when switching planets
  useEffect(() => {
    cameraRef.current = {
      x: planet.worldWidth / 2,
      y: planet.worldHeight / 2,
    };
    particlesRef.current = [];
    packetsRef.current = [];
    asteroidsRef.current = [];
    asteroidSpawnTimerRef.current = 2.4;
    screenShakeRef.current = 0;
  }, [planet.id, planet.worldWidth, planet.worldHeight]);

  // Reset transition clock & hazards when phase changes
  useEffect(() => {
    if (phase === 'TAKEOFF_TRANSITION') {
      transitionClockRef.current = {
        startTime: performance.now(),
        active: true,
      };
      particlesRef.current = [];
      packetsRef.current = [];
      asteroidsRef.current = [];
    } else {
      transitionClockRef.current.active = false;
      if (phase !== 'PLAYING') {
        asteroidsRef.current = [];
      }
    }
  }, [phase]);

  // Main 60fps canvas loop & ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = container.clientWidth;
    let height = container.clientHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const updateSize = () => {
      width = Math.max(320, container.clientWidth);
      height = Math.max(300, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    let lastTime = performance.now();
    let telemetryTimer = 0;
    let animId = 0;

    const drawShip = (
      x: number,
      y: number,
      angle: number,
      thrusting: boolean,
      boosting: boolean,
      scale = 1,
      accent = '#06B6D4'
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      const activeShipSprite =
        thrusting || boosting
          ? shipSpritesRef.current.moving
          : shipSpritesRef.current.idle;

      if (activeShipSprite) {
        if (boosting) {
          // Subtle blue-white turbo plasma aura behind thruster during boost
          const pulse = 0.75 + Math.random() * 0.35;
          const halo = ctx.createRadialGradient(-26, 0, 2, -28, 0, 26 * pulse);
          halo.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
          halo.addColorStop(0.5, 'rgba(251, 191, 36, 0.35)');
          halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(-28, 0, 26 * pulse, 0, Math.PI * 2);
          ctx.fill();
        }
        const drawScale = 0.76;
        ctx.drawImage(
          activeShipSprite,
          -132 * drawScale,
          -70 * drawScale,
          220 * drawScale,
          140 * drawScale
        );
        ctx.restore();
        return;
      }

      // Procedural fallback if sprite hasn't finished decoding yet
      // Engine glow & flame cone
      if (thrusting || boosting) {
        const flicker = 0.85 + Math.random() * 0.35;
        const flameLen = (boosting ? 34 : 20) * flicker;
        const flameColor = boosting ? '#38BDF8' : '#F59E0B';

        const grad = ctx.createLinearGradient(-14, 0, -14 - flameLen, 0);
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.35, flameColor);
        grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-13, -5.5);
        ctx.lineTo(-14 - flameLen, 0);
        ctx.lineTo(-13, 5.5);
        ctx.closePath();
        ctx.fill();
      }

      // Outer Wings
      ctx.fillStyle = '#CBD5E1';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, -15);
      ctx.lineTo(-15, -11);
      ctx.lineTo(-11, 0);
      ctx.lineTo(-15, 11);
      ctx.lineTo(-10, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Main Fuselage
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(2, -7);
      ctx.lineTo(-13, -6);
      ctx.lineTo(-15, 0);
      ctx.lineTo(-13, 6);
      ctx.lineTo(2, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Accent wing stripes
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(-2, -7);
      ctx.lineTo(-10, -12);
      ctx.lineTo(-12, -9);
      ctx.lineTo(-5, -5);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-2, 7);
      ctx.lineTo(-10, 12);
      ctx.lineTo(-12, 9);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();

      // Cockpit glass
      ctx.fillStyle = '#0EA5E9';
      ctx.beginPath();
      ctx.ellipse(6, 0, 6.5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    };

    const drawRescueObject = (obj: RescueObject, now: number, accentColor: string) => {
      ctx.save();
      ctx.translate(obj.x, obj.y);

      const pulse = (now * 0.0015 + (obj.x % 7)) % 1;

      if (!obj.discovered) {
        // Expanding radio signal rings
        for (let r = 0; r < 2; r++) {
          const ringPhase = (pulse + r * 0.5) % 1;
          const radius = 24 + ringPhase * 95;
          const alpha = (1 - ringPhase) * 0.38;
          ctx.strokeStyle =
            obj.planet === 'moon'
              ? `rgba(34, 211, 238, ${alpha.toFixed(3)})`
              : `rgba(251, 191, 36, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Landing pad / base ring
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = obj.discovered ? '#10B981' : accentColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Distinct silhouette by object shape
      ctx.strokeStyle = '#E2E8F0';
      ctx.fillStyle = obj.discovered ? '#34D399' : '#F8FAFC';
      ctx.lineWidth = 1.5;

      if (obj.shape === 'rover') {
        // Rover chassis + wheels + mast
        ctx.fillStyle = '#475569';
        ctx.fillRect(-13, -10, 5, 5);
        ctx.fillRect(8, -10, 5, 5);
        ctx.fillRect(-13, 5, 5, 5);
        ctx.fillRect(8, 5, 5, 5);
        ctx.fillStyle = obj.discovered ? '#10B981' : '#E2E8F0';
        ctx.fillRect(-10, -7, 20, 14);
        ctx.fillStyle = accentColor;
        ctx.fillRect(-4, -4, 8, 8);
      } else if (obj.shape === 'beacon') {
        // Dish + tripod antenna
        ctx.beginPath();
        ctx.arc(0, 0, 11, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(0, 8);
        ctx.stroke();
        ctx.fillStyle = obj.discovered ? '#10B981' : accentColor;
        ctx.beginPath();
        ctx.arc(0, -12, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.shape === 'seismic') {
        // Hexagonal sensor pod
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const px = Math.cos(a) * 12;
          const py = Math.sin(a) * 12;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = '#1E293B';
        ctx.fill();
        ctx.strokeStyle = obj.discovered ? '#10B981' : accentColor;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = obj.discovered ? '#10B981' : accentColor;
        ctx.fill();
      } else {
        // Capsule / Probe with solar wings
        ctx.fillStyle = '#1D4ED8';
        ctx.fillRect(-16, -4, 8, 8);
        ctx.fillRect(8, -4, 8, 8);
        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = obj.discovered ? '#10B981' : accentColor;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Download progress arc if actively downloading
      if (!obj.discovered && obj.downloadProgress > 0) {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          29,
          -Math.PI / 2,
          -Math.PI / 2 + obj.downloadProgress * Math.PI * 2
        );
        ctx.stroke();
      }

      // Crisp world label beneath object
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = obj.discovered ? '#6EE7B7' : '#F1F5F9';
      ctx.fillText(obj.name, 0, 40);

      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = obj.discovered ? '#10B981' : '#94A3B8';
      ctx.fillText(
        obj.discovered
          ? 'DATOS EN BITÁCORA'
          : obj.downloadProgress > 0
          ? `TRANSMITIENDO ${Math.round(obj.downloadProgress * 100)}%`
          : obj.frequency,
        0,
        54
      );

      ctx.restore();
    };

    const renderPlanetaryWorld = (
      activePlanet: PlanetConfig,
      camX: number,
      camY: number,
      now: number,
      dt: number
    ) => {
      // Deep space background outside world bounds
      ctx.fillStyle = '#05070B';
      ctx.fillRect(0, 0, width, height);

      // Subtle parallax starfield in outer void
      starsRef.current.forEach((star) => {
        const sx =
          (((star.x * 2000 - camX * 0.15) % width) + width) % width;
        const sy =
          (((star.y * 1500 - camY * 0.15) % height) + height) % height;
        ctx.fillStyle = `rgba(226, 232, 240, ${star.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size * 0.75, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.save();
      ctx.translate(width / 2 - camX, height / 2 - camY);

      const cxWorld = activePlanet.worldWidth / 2;
      const cyWorld = activePlanet.worldHeight / 2;

      // Full orbital space sector coordinate grid & outer flight boundary
      ctx.strokeStyle = activePlanet.gridColor;
      ctx.lineWidth = 1;
      const gridStep = 180;
      for (let gx = gridStep; gx < activePlanet.worldWidth; gx += gridStep) {
        ctx.beginPath();
        ctx.moveTo(gx, 24);
        ctx.lineTo(gx, activePlanet.worldHeight - 24);
        ctx.stroke();
      }
      for (let gy = gridStep; gy < activePlanet.worldHeight; gy += gridStep) {
        ctx.beginPath();
        ctx.moveTo(24, gy);
        ctx.lineTo(activePlanet.worldWidth - 24, gy);
        ctx.stroke();
      }

      // Outer navigable sector border (gives clear visual cue at the far space limits)
      ctx.save();
      ctx.strokeStyle =
        activePlanet.id === 'moon'
          ? 'rgba(56, 189, 248, 0.25)'
          : 'rgba(251, 146, 60, 0.28)';
      ctx.lineWidth = 2;
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.roundRect(24, 24, activePlanet.worldWidth - 48, activePlanet.worldHeight - 48, 36);
      ctx.stroke();
      ctx.restore();

      const radius = activePlanet.mapRadius ?? 640;

      // Subtle orbital ring outside the planet to highlight outer-space exploration zone
      ctx.save();
      ctx.strokeStyle =
        activePlanet.id === 'moon'
          ? 'rgba(148, 163, 184, 0.14)'
          : 'rgba(251, 146, 60, 0.16)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(cxWorld, cyWorld, radius + 240, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Soft planetary atmosphere/glow behind the custom sprite
      const aura = ctx.createRadialGradient(
        cxWorld,
        cyWorld,
        radius * 0.65,
        cxWorld,
        cyWorld,
        radius * 1.18
      );
      aura.addColorStop(0, activePlanet.atmosphereGlow);
      aura.addColorStop(1, 'rgba(5, 7, 11, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cxWorld, cyWorld, radius * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // Draw Planet Sprite (Moon or Mars uploaded illustration)
      const sprite = planetSpritesRef.current[activePlanet.id];
      if (sprite) {
        ctx.drawImage(
          sprite,
          cxWorld - radius,
          cyWorld - radius,
          radius * 2,
          radius * 2
        );
      } else {
        ctx.fillStyle = activePlanet.surfaceBaseColor;
        ctx.beginPath();
        ctx.arc(cxWorld, cyWorld, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Spawn Landing Pad marker at world center
      const spawnX = activePlanet.worldWidth / 2;
      const spawnY = activePlanet.worldHeight / 2;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(spawnX, spawnY, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Collectible Crystals
      crystalsRef.current.forEach((crystal) => {
        if (crystal.collected) return;
        const bob = Math.sin(now * 0.004 + crystal.pulseOffset) * 2.5;
        ctx.save();
        ctx.translate(crystal.x, crystal.y + bob);

        // Glow aura
        ctx.fillStyle =
          activePlanet.id === 'moon'
            ? 'rgba(56, 189, 248, 0.16)'
            : 'rgba(251, 191, 36, 0.18)';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();

        // Faceted crystal diamond
        ctx.fillStyle = activePlanet.crystalColor;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(-6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });

      // Determine current sequential active object (appears one-by-one after previous is rescued)
      const activeObj = objectsRef.current.find((o) => !o.discovered) ?? null;

      // Faint orbital trajectory for active sequential satellite/probe
      objectsRef.current.forEach((obj) => {
        if (!obj.discovered && obj.id !== activeObj?.id) return;
        if (obj.discovered) return;
        ctx.save();
        ctx.strokeStyle =
          activePlanet.id === 'moon'
            ? 'rgba(34, 211, 238, 0.16)'
            : 'rgba(251, 191, 36, 0.17)';
        ctx.lineWidth = 1.25;
        ctx.setLineDash([7, 9]);
        ctx.beginPath();
        ctx.ellipse(
          obj.orbitCenterX,
          obj.orbitCenterY,
          obj.orbitRadiusX,
          obj.orbitRadiusY,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      });

      // Draw discovered objects and ONLY the current sequential active object
      objectsRef.current.forEach((obj) => {
        if (!obj.discovered && obj.id !== activeObj?.id) return;
        drawRescueObject(obj, now, activePlanet.accentColor);
      });

      // Draw Data Transfer Beams & Packets from active object to ship
      const ship = shipRef.current;
      if (activeObj && !activeObj.discovered && activeObj.downloadProgress > 0) {
        ctx.save();
        ctx.strokeStyle =
          activePlanet.id === 'moon'
            ? 'rgba(34, 211, 238, 0.55)'
            : 'rgba(251, 191, 36, 0.55)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -(now * 0.06);
        ctx.beginPath();
        ctx.moveTo(activeObj.x, activeObj.y);
        ctx.lineTo(ship.x, ship.y);
        ctx.stroke();
        ctx.restore();
      }

      // Update & draw flying data packets
      packetsRef.current = packetsRef.current.filter((pkt) => {
        pkt.progress += dt * pkt.speed;
        if (pkt.progress >= 1) return false;
        const px = pkt.fromX + (ship.x - pkt.fromX) * pkt.progress;
        const py = pkt.fromY + (ship.y - pkt.fromY) * pkt.progress;
        ctx.fillStyle = pkt.color;
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      // Update & draw exhaust/spark particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= dt;
        if (p.life <= 0) return false;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.4 + alpha * 0.6), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return true;
      });

      // Draw Undertale-style proximity warning lanes & fast incoming asteroids
      asteroidsRef.current.forEach((ast) => {
        if (ast.phase === 'WARNING') {
          const urgent = ast.warningTimer < 0.32;
          const blink = urgent
            ? Math.floor(now / 65) % 2 === 0
              ? 1
              : 0.35
            : 0.45 + 0.35 * Math.sin(now * 0.02);

          const endX = ast.startX + ast.ux * 2100;
          const endY = ast.startY + ast.uy * 2100;

          // Translucent corridor band showing exact asteroid width
          ctx.save();
          ctx.strokeStyle = urgent
            ? `rgba(251, 191, 36, ${(0.22 * blink).toFixed(3)})`
            : `rgba(239, 68, 68, ${(0.16 * blink).toFixed(3)})`;
          ctx.lineWidth = ast.radius * 2;
          ctx.beginPath();
          ctx.moveTo(ast.startX, ast.startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Sharp center danger laser line
          ctx.strokeStyle = urgent
            ? `rgba(251, 191, 36, ${(0.9 * blink).toFixed(3)})`
            : `rgba(248, 113, 113, ${(0.72 * blink).toFixed(3)})`;
          ctx.lineWidth = urgent ? 2.5 : 1.75;
          ctx.setLineDash([16, 12]);
          ctx.lineDashOffset = -(now * 0.14);
          ctx.beginPath();
          ctx.moveTo(ast.startX, ast.startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.restore();
        } else {
          // Draw flying high-speed asteroid
          ctx.save();
          ctx.translate(ast.x, ast.y);

          // Red-amber danger halo behind rock
          const glow = ctx.createRadialGradient(0, 0, ast.radius * 0.4, 0, 0, ast.radius * 1.45);
          glow.addColorStop(0, 'rgba(239, 68, 68, 0.36)');
          glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(0, 0, ast.radius * 1.45, 0, Math.PI * 2);
          ctx.fill();

          ctx.rotate(ast.rotation);
          const aSprite = asteroidSpriteRef.current;
          if (aSprite) {
            const drawDim = ast.radius * 2.25;
            ctx.drawImage(aSprite, -drawDim / 2, -drawDim / 2, drawDim, drawDim);
          } else {
            ctx.fillStyle = '#9CA3AF';
            ctx.strokeStyle = '#EF4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }
      });

      // Draw Spacecraft (blinks softly during brief post-hit invulnerability)
      const invulnBlink =
        ship.invulnTimer > 0 && Math.floor(now / 85) % 2 === 0;
      if (!invulnBlink) {
        drawShip(
          ship.x,
          ship.y,
          ship.angle,
          ship.thrusting,
          ship.boosting,
          1,
          activePlanet.accentColor
        );
      }

      // Draw directional pointer around ship toward current active sequential object
      if (activeObj && !activeObj.discovered) {
        const minDist = Math.hypot(activeObj.x - ship.x, activeObj.y - ship.y);
        if (minDist > 180) {
          const dirAngle = Math.atan2(activeObj.y - ship.y, activeObj.x - ship.x);
          const orbitRadius = 46;
          const ax = ship.x + Math.cos(dirAngle) * orbitRadius;
          const ay = ship.y + Math.sin(dirAngle) * orbitRadius;

          ctx.save();
          ctx.translate(ax, ay);
          ctx.rotate(dirAngle);
          ctx.fillStyle = activePlanet.accentColor;
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(-4, -4);
          ctx.lineTo(-4, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore(); // end camera transform

      // Screen-space Undertale-style "!" proximity alert indicators anchored cleanly at viewport entry edge
      asteroidsRef.current.forEach((ast) => {
        if (ast.phase !== 'WARNING') return;
        const urgent = ast.warningTimer < 0.32;
        const flashOn = urgent ? Math.floor(now / 65) % 2 === 0 : Math.floor(now / 130) % 2 === 0;

        // Compute intersection of incoming ray (from trajectory line) with viewport bounds
        const sx0 = ast.startX - camX + width / 2;
        const sy0 = ast.startY - camY + height / 2;
        const pad = 34;

        // Parametric search along ray to find point just entering viewport [pad..width-pad] x [pad..height-pad]
        let entryT = -1;
        for (let t = 0; t <= 2200; t += 16) {
          const px = sx0 + ast.ux * t;
          const py = sy0 + ast.uy * t;
          if (px >= pad && px <= width - pad && py >= pad && py <= height - pad) {
            entryT = t;
            break;
          }
        }
        if (entryT < 0) return;

        const ix = Math.max(pad, Math.min(width - pad, sx0 + ast.ux * entryT));
        const iy = Math.max(pad, Math.min(height - pad, sy0 + ast.uy * entryT));

        ctx.save();
        ctx.translate(ix, iy);

        // Pulsing danger ring
        const pulse = 1 - ast.warningTimer / ast.warningDuration;
        ctx.strokeStyle = urgent ? '#FBBF24' : '#EF4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 17 + (1 - pulse) * 10, 0, Math.PI * 2);
        ctx.stroke();

        // Crisp square/diamond Undertale alert box
        ctx.fillStyle = flashOn ? (urgent ? '#FBBF24' : '#EF4444') : '#1E293B';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-13, -13, 26, 26, 5);
        ctx.fill();
        ctx.stroke();

        // Exclamation mark "!"
        ctx.fillStyle = flashOn ? '#090D16' : '#F87171';
        ctx.font = '800 17px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 1);

        // Directional arrow pointing along asteroid travel direction
        const arrowAngle = Math.atan2(ast.uy, ast.ux);
        ctx.rotate(arrowAngle);
        ctx.fillStyle = urgent ? '#FBBF24' : '#F87171';
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(16, -5);
        ctx.lineTo(16, 5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });
    };

    const renderTakeoffTransition = (now: number) => {
      const tState = transitionRef.current;
      if (!tState) return;

      const fromPlanet = PLANETS[tState.fromPlanet];
      const toPlanet = PLANETS[tState.toPlanet];

      const elapsed = (now - transitionClockRef.current.startTime) / 1000;
      const totalDuration = 3.8; // seconds
      const p = Math.min(1, elapsed / totalDuration);

      let stageLabel = 'Ignición de Propulsores';
      if (p < 0.25) {
        stageLabel = `Despegando de ${fromPlanet.name}`;
      } else if (p < 0.68) {
        stageLabel = `Tránsito propulsado hacia ${toPlanet.name}`;
      } else if (p < 0.92) {
        stageLabel = `Descenso orbital en ${toPlanet.name}`;
      } else {
        stageLabel = `Aterrizaje en ${toPlanet.sectorName}`;
      }

      callbacksRef.current.onTransitionProgress(p, stageLabel);

      // Clear deep space canvas
      ctx.fillStyle = '#04060A';
      ctx.fillRect(0, 0, width, height);

      // Star warp effect peaks during mid-flight (0.25 -> 0.72)
      const warpIntensity =
        p < 0.2
          ? p / 0.2
          : p < 0.72
          ? 1
          : Math.max(0, 1 - (p - 0.72) / 0.28);

      starsRef.current.forEach((star) => {
        const speed = (18 + warpIntensity * 580) * star.speedFactor;
        const sy = ((star.y * height + elapsed * speed) % height + height) % height;
        const sx = star.x * width;
        const streakLen = 1 + warpIntensity * 38 * star.speedFactor;

        ctx.strokeStyle = `rgba(226, 232, 240, ${Math.min(1, star.alpha * (0.5 + warpIntensity * 0.5))})`;
        ctx.lineWidth = star.size;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx, sy - streakLen);
        ctx.stroke();
      });

      // Phase 1: Origin planet surface / sphere receding downward (0.0 -> 0.48)
      if (p < 0.48) {
        const recede = p / 0.48;
        const eased = recede * recede;
        const sphereRadius = Math.max(85, width * 0.65 * (1 - eased * 0.85));
        const sphereY = height * 0.78 + eased * (height * 0.65);

        ctx.save();
        ctx.shadowColor = fromPlanet.atmosphereGlow;
        ctx.shadowBlur = 35;
        const fromSprite = planetSpritesRef.current[fromPlanet.id];
        if (fromSprite) {
          ctx.drawImage(
            fromSprite,
            width / 2 - sphereRadius,
            sphereY - sphereRadius,
            sphereRadius * 2,
            sphereRadius * 2
          );
        } else {
          const grad = ctx.createRadialGradient(
            width / 2 - sphereRadius * 0.25,
            sphereY - sphereRadius * 0.3,
            sphereRadius * 0.1,
            width / 2,
            sphereY,
            sphereRadius
          );
          grad.addColorStop(0, fromPlanet.planetSphereColors[0]);
          grad.addColorStop(0.55, fromPlanet.planetSphereColors[1]);
          grad.addColorStop(1, fromPlanet.planetSphereColors[2]);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(width / 2, sphereY, sphereRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Phase 2 & 3: Target planet emerging from above and expanding into landing terrain (0.38 -> 1.0)
      if (p > 0.38) {
        const approach = (p - 0.38) / 0.62;
        const eased = approach * approach * (3 - 2 * approach);
        const targetRadius = 32 + eased * (Math.max(width, height) * 0.68);
        const targetY = -40 + eased * (height * 0.56);

        ctx.save();
        ctx.shadowColor = toPlanet.atmosphereGlow;
        ctx.shadowBlur = 45;
        const toSprite = planetSpritesRef.current[toPlanet.id];
        if (toSprite) {
          ctx.drawImage(
            toSprite,
            width / 2 - targetRadius,
            targetY - targetRadius,
            targetRadius * 2,
            targetRadius * 2
          );
        } else {
          const grad = ctx.createRadialGradient(
            width / 2 - targetRadius * 0.2,
            targetY - targetRadius * 0.25,
            targetRadius * 0.08,
            width / 2,
            targetY,
            targetRadius
          );
          grad.addColorStop(0, toPlanet.planetSphereColors[0]);
          grad.addColorStop(0.55, toPlanet.planetSphereColors[1]);
          grad.addColorStop(1, toPlanet.planetSphereColors[2]);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(width / 2, targetY, targetRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Spacecraft climbing smoothly in center with dynamic camera shake on ignition
      const shakeX = p < 0.28 ? (Math.random() - 0.5) * 4 * (1 - p / 0.28) : 0;
      const shakeY = p < 0.28 ? (Math.random() - 0.5) * 4 * (1 - p / 0.28) : 0;
      const shipY =
        p < 0.25
          ? height * 0.62 - (p / 0.25) * (height * 0.14)
          : p < 0.75
          ? height * 0.48
          : height * 0.48 + ((p - 0.75) / 0.25) * (height * 0.04);

      const shipScale = p < 0.8 ? 1.25 : 1.25 - ((p - 0.8) / 0.2) * 0.25;

      // Giant plasma shockwave ring at liftoff
      if (p < 0.22) {
        const ringAlpha = 1 - p / 0.22;
        ctx.strokeStyle = `rgba(251, 191, 36, ${ringAlpha * 0.65})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(
          width / 2,
          height * 0.66,
          25 + p * 750,
          10 + p * 260,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      // Extended propulsion warp trail below the thruster flame
      const trailStartY = shipSpritesRef.current.moving
        ? shipY + 52 * shipScale
        : shipY + 14;
      const exhaustLen = 50 + warpIntensity * 110;
      const exhaustGrad = ctx.createLinearGradient(
        width / 2,
        trailStartY,
        width / 2,
        trailStartY + exhaustLen
      );
      exhaustGrad.addColorStop(0, shipSpritesRef.current.moving ? 'rgba(251, 191, 36, 0.75)' : '#FFFFFF');
      exhaustGrad.addColorStop(0.28, '#38BDF8');
      exhaustGrad.addColorStop(0.65, '#F59E0B');
      exhaustGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = exhaustGrad;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 10, trailStartY);
      ctx.lineTo(width / 2 + 10, trailStartY);
      ctx.lineTo(width / 2, trailStartY + exhaustLen);
      ctx.closePath();
      ctx.fill();

      drawShip(
        width / 2 + shakeX,
        shipY + shakeY,
        -Math.PI / 2,
        true,
        true,
        shipScale,
        toPlanet.accentColor
      );

      if (p >= 1 && transitionClockRef.current.active) {
        transitionClockRef.current.active = false;
        callbacksRef.current.onTransitionComplete();
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      ctx.save();
      ctx.scale(dpr, dpr);

      if (phaseRef.current === 'TAKEOFF_TRANSITION') {
        renderTakeoffTransition(now);
        ctx.restore();
        animId = requestAnimationFrame(tick);
        return;
      }

      const activePlanet = planetRef.current;
      const ship = shipRef.current;

      if (phaseRef.current === 'PLAYING') {
        const keys = keysRef.current;
        let ax = 0;
        let ay = 0;

        if (keys['ArrowUp'] || keys['KeyW']) ay -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) ay += 1;
        if (keys['ArrowLeft'] || keys['KeyA']) ax -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) ax += 1;

        // Pointer steering fallback when mouse/touch held on canvas
        if (ax === 0 && ay === 0 && pointerSteerRef.current.active) {
          const worldMouseX =
            pointerSteerRef.current.screenX - width / 2 + cameraRef.current.x;
          const worldMouseY =
            pointerSteerRef.current.screenY - height / 2 + cameraRef.current.y;
          const dx = worldMouseX - ship.x;
          const dy = worldMouseY - ship.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 18) {
            ax = dx / dist;
            ay = dy / dist;
          }
        }

        const inputMag = Math.hypot(ax, ay);
        ship.thrusting = inputMag > 0.05;

        const wantBoost = Boolean(keys['Space']) && ship.thrusting && ship.boostEnergy > 4;
        ship.boosting = wantBoost;

        if (wantBoost) {
          ship.boostEnergy = Math.max(0, ship.boostEnergy - dt * 36);
        } else {
          ship.boostEnergy = Math.min(100, ship.boostEnergy + dt * 18);
        }

        if (ship.thrusting) {
          const nx = ax / inputMag;
          const ny = ay / inputMag;
          const accel = wantBoost ? 920 : 540;
          ship.vx += nx * accel * dt;
          ship.vy += ny * accel * dt;

          const targetAngle = Math.atan2(ny, nx);
          let diff = targetAngle - ship.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          ship.angle += diff * Math.min(1, dt * 12);

          // Spawn thruster dust/exhaust particles
          if (Math.random() < (wantBoost ? 0.9 : 0.55)) {
            const backX = ship.x - Math.cos(ship.angle) * 16;
            const backY = ship.y - Math.sin(ship.angle) * 16;
            particlesRef.current.push({
              x: backX + (Math.random() - 0.5) * 6,
              y: backY + (Math.random() - 0.5) * 6,
              vx: -Math.cos(ship.angle) * (80 + Math.random() * 60),
              vy: -Math.sin(ship.angle) * (80 + Math.random() * 60),
              life: 0.35 + Math.random() * 0.25,
              maxLife: 0.6,
              size: wantBoost ? 4.5 : 3,
              color: wantBoost ? '#38BDF8' : activePlanet.dustColor,
            });
          }
        }

        // Smooth space-surface drag
        const drag = Math.pow(0.08, dt);
        ship.vx *= drag;
        ship.vy *= drag;

        const maxSpeed = wantBoost ? 470 : 300;
        const speed = Math.hypot(ship.vx, ship.vy);
        if (speed > maxSpeed) {
          ship.vx = (ship.vx / speed) * maxSpeed;
          ship.vy = (ship.vy / speed) * maxSpeed;
        }

        ship.x += ship.vx * dt;
        ship.y += ship.vy * dt;

        // World bounds clamping with soft bounce (larger outer space exploration zone around each planet)
        const margin = 48;
        if (ship.x < margin) {
          ship.x = margin;
          ship.vx = Math.abs(ship.vx) * 0.35;
        } else if (ship.x > activePlanet.worldWidth - margin) {
          ship.x = activePlanet.worldWidth - margin;
          ship.vx = -Math.abs(ship.vx) * 0.35;
        }
        if (ship.y < margin) {
          ship.y = margin;
          ship.vy = Math.abs(ship.vy) * 0.35;
        } else if (ship.y > activePlanet.worldHeight - margin) {
          ship.y = activePlanet.worldHeight - margin;
          ship.vy = -Math.abs(ship.vy) * 0.35;
        }

        // Crystal magnetic attraction & collection
        crystalsRef.current.forEach((crystal) => {
          if (crystal.collected) return;
          const dx = ship.x - crystal.x;
          const dy = ship.y - crystal.y;
          const dist = Math.hypot(dx, dy);

          if (dist < CRYSTAL_COLLECT_RANGE) {
            crystal.collected = true;
            soundEngine.playCrystalPickup();
            for (let i = 0; i < 10; i++) {
              const a = (Math.PI * 2 * i) / 10;
              particlesRef.current.push({
                x: crystal.x,
                y: crystal.y,
                vx: Math.cos(a) * (45 + Math.random() * 55),
                vy: Math.sin(a) * (45 + Math.random() * 55),
                life: 0.45,
                maxLife: 0.45,
                size: 3,
                color: activePlanet.crystalColor,
              });
            }
            callbacksRef.current.onCrystalCollect(crystal.id, crystal.value);
          } else if (dist < CRYSTAL_MAGNET_RANGE) {
            const pull = (1 - dist / CRYSTAL_MAGNET_RANGE) * 260;
            crystal.x += (dx / dist) * pull * dt;
            crystal.y += (dy / dist) * pull * dt;
          }
        });

        // Advance moving satellites / rescue objects along their orbital paths
        objectsRef.current.forEach((obj) => {
          const prevX = obj.x;
          const prevY = obj.y;
          obj.orbitAngle += obj.orbitSpeed * dt;
          obj.x = obj.orbitCenterX + Math.cos(obj.orbitAngle) * obj.orbitRadiusX;
          obj.y = obj.orbitCenterY + Math.sin(obj.orbitAngle) * obj.orbitRadiusY;
          if (dt > 0.0001) {
            obj.vx = (obj.x - prevX) / dt;
            obj.vy = (obj.y - prevY) / dt;
          }
        });

        // Sequential Rescue Object proximity & data transmission download (1 by 1)
        downloadTickSoundCooldownRef.current = Math.max(
          0,
          downloadTickSoundCooldownRef.current - dt
        );

        const activeIdx = objectsRef.current.findIndex((o) => !o.discovered);
        const activeObj = activeIdx >= 0 ? objectsRef.current[activeIdx] : null;
        if (activeObj && !activeObj.discovered) {
          const dist = Math.hypot(ship.x - activeObj.x, ship.y - activeObj.y);

          if (dist <= RESCUE_RANGE) {
            const nextProgress = Math.min(1, activeObj.downloadProgress + dt * 0.30);
            activeObj.downloadProgress = nextProgress;

            if (Math.random() < 0.25) {
              packetsRef.current.push({
                fromX: activeObj.x,
                fromY: activeObj.y,
                progress: 0,
                speed: 2.4,
                color: activePlanet.accentColor,
              });
            }

            if (downloadTickSoundCooldownRef.current <= 0) {
              soundEngine.playDownloadTick(nextProgress);
              downloadTickSoundCooldownRef.current = 0.16;
            }

            if (nextProgress >= 1) {
              activeObj.discovered = true;
              soundEngine.playObjectRescued();
              for (let i = 0; i < 18; i++) {
                const a = (Math.PI * 2 * i) / 18;
                particlesRef.current.push({
                  x: activeObj.x,
                  y: activeObj.y,
                  vx: Math.cos(a) * (70 + Math.random() * 80),
                  vy: Math.sin(a) * (70 + Math.random() * 80),
                  life: 0.7,
                  maxLife: 0.7,
                  size: 4,
                  color: '#10B981',
                });
              }

              // Materialize the next sequential object cleanly with a brief asteroid breather
              const nextObj = objectsRef.current[activeIdx + 1];
              if (nextObj) {
                for (let i = 0; i < 14; i++) {
                  const a = (Math.PI * 2 * i) / 14;
                  particlesRef.current.push({
                    x: nextObj.x,
                    y: nextObj.y,
                    vx: Math.cos(a) * 95,
                    vy: Math.sin(a) * 95,
                    life: 0.6,
                    maxLife: 0.6,
                    size: 3.5,
                    color: activePlanet.accentColor,
                  });
                }
              }
              asteroidSpawnTimerRef.current = Math.max(asteroidSpawnTimerRef.current, 1.35);

              callbacksRef.current.onObjectRescued(activeObj.id);
            }
          } else if (activeObj.downloadProgress > 0) {
            activeObj.downloadProgress = Math.max(0, activeObj.downloadProgress - dt * 0.16);
          }
        }

        // Undertale-style high-speed asteroid/meteor spawning:
        // Rolls a random number from 1 to 3 each cycle until 3 comes up, then spawns a meteor
        ship.invulnTimer = Math.max(0, ship.invulnTimer - dt);
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt);

        asteroidSpawnTimerRef.current -= dt;
        if (asteroidSpawnTimerRef.current <= 0) {
          const isMars = activePlanet.id === 'mars';
          const maxConcurrent = isMars ? 3 : 2;

          if (asteroidsRef.current.length >= maxConcurrent) {
            asteroidSpawnTimerRef.current = 0.8;
          } else {
            const numeroAleatorio = Math.floor(Math.random() * 3) + 1;

            if (numeroAleatorio === 3) {
              asteroidSpawnTimerRef.current = isMars ? 1.6 : 2.0;

              const aimX = ship.x + ship.vx * 0.24 + (Math.random() - 0.5) * 85;
              const aimY = ship.y + ship.vy * 0.24 + (Math.random() - 0.5) * 85;

              // Pick a launch angle cleanly separated from any active warning corridor
              let angle = Math.random() * Math.PI * 2;
              const warningAngles = asteroidsRef.current
                .filter((a) => a.phase === 'WARNING')
                .map((a) => Math.atan2(a.uy, a.ux));
              for (let attempt = 0; attempt < 5; attempt++) {
                const cand = Math.random() * Math.PI * 2;
                const tooClose = warningAngles.some((wa) => {
                  let d = Math.abs(cand - wa);
                  if (d > Math.PI) d = Math.PI * 2 - d;
                  return d < 0.65;
                });
                if (!tooClose) {
                  angle = cand;
                  break;
                }
              }

              const ux = Math.cos(angle);
              const uy = Math.sin(angle);
              const startX = aimX - ux * 880;
              const startY = aimY - uy * 880;
              const speed = (isMars ? 940 : 880) + Math.random() * 200;
              const warnDur = isMars ? 0.82 : 0.90;

              asteroidsRef.current.push({
                phase: 'WARNING',
                warningTimer: warnDur,
                warningDuration: warnDur,
                startX,
                startY,
                x: startX,
                y: startY,
                ux,
                uy,
                vx: ux * speed,
                vy: uy * speed,
                speed,
                radius: 26 + Math.random() * 10,
                rotation: Math.random() * Math.PI * 2,
                spinSpeed: (Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 3.5),
                traveled: 0,
              });
              soundEngine.playProximityAlert();
            } else {
              // Keeps rolling 1..3 each cycle until 3 appears
              asteroidSpawnTimerRef.current = isMars ? 1.35 : 1.6;
            }
          }
        }

        asteroidsRef.current = asteroidsRef.current.filter((ast) => {
          if (ast.phase === 'WARNING') {
            ast.warningTimer -= dt;
            if (ast.warningTimer <= 0) {
              ast.phase = 'FLYING';
            }
            return true;
          }

          const step = ast.speed * dt;
          ast.x += ast.vx * dt;
          ast.y += ast.vy * dt;
          ast.rotation += ast.spinSpeed * dt;
          ast.traveled += step;

          // Rocky/fiery wake particles behind speeding asteroid
          if (Math.random() < 0.65) {
            particlesRef.current.push({
              x: ast.x - ast.ux * ast.radius * 0.7 + (Math.random() - 0.5) * 14,
              y: ast.y - ast.uy * ast.radius * 0.7 + (Math.random() - 0.5) * 14,
              vx: -ast.vx * 0.12 + (Math.random() - 0.5) * 45,
              vy: -ast.vy * 0.12 + (Math.random() - 0.5) * 45,
              life: 0.35,
              maxLife: 0.35,
              size: 3.5,
              color: Math.random() < 0.45 ? '#F87171' : '#9CA3AF',
            });
          }

          // Check collision with player spacecraft
          if (ship.invulnTimer <= 0) {
            const distToShip = Math.hypot(ship.x - ast.x, ship.y - ast.y);
            if (distToShip < ast.radius + 17) {
              ship.invulnTimer = 1.4;
              ship.hull = Math.max(0, ship.hull - 25);
              screenShakeRef.current = 0.36;

              const nx = (ship.x - ast.x) / Math.max(1, distToShip);
              const ny = (ship.y - ast.y) / Math.max(1, distToShip);
              ship.vx += ast.vx * 0.28 + nx * 240;
              ship.vy += ast.vy * 0.28 + ny * 240;

              soundEngine.playAsteroidImpact();
              for (let i = 0; i < 20; i++) {
                const a = (Math.PI * 2 * i) / 20;
                particlesRef.current.push({
                  x: ship.x,
                  y: ship.y,
                  vx: Math.cos(a) * (80 + Math.random() * 110),
                  vy: Math.sin(a) * (80 + Math.random() * 110),
                  life: 0.55,
                  maxLife: 0.55,
                  size: 4,
                  color: i % 2 === 0 ? '#EF4444' : '#FBBF24',
                });
              }

              callbacksRef.current.onShipDamaged(ship.hull);
              return false;
            }
          }

          return ast.traveled < 2100;
        });
      }

      // Smooth camera follow + brief impact camera shake
      cameraRef.current.x += (ship.x - cameraRef.current.x) * Math.min(1, dt * 7);
      cameraRef.current.y += (ship.y - cameraRef.current.y) * Math.min(1, dt * 7);
      const shakeOffset =
        screenShakeRef.current > 0 ? screenShakeRef.current * 24 : 0;
      const renderCamX =
        cameraRef.current.x + (Math.random() - 0.5) * shakeOffset;
      const renderCamY =
        cameraRef.current.y + (Math.random() - 0.5) * shakeOffset;

      // Throttled React HUD state sync (~12Hz for smooth numbers without re-render spam)
      telemetryTimer += dt;
      if (telemetryTimer > 0.08) {
        telemetryTimer = 0;
        callbacksRef.current.onShipTelemetryUpdate(
          { x: ship.x, y: ship.y },
          ship.boostEnergy,
          ship.hull
        );
      }

      renderPlanetaryWorld(
        activePlanet,
        renderCamX,
        renderCamY,
        now,
        dt
      );

      ctx.restore();
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  // Pointer handlers for mouse/touch piloting
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'PLAYING') return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerSteerRef.current = {
      active: true,
      screenX: e.clientX - rect.left,
      screenY: e.clientY - rect.top,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!pointerSteerRef.current.active) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerSteerRef.current.screenX = e.clientX - rect.left;
    pointerSteerRef.current.screenY = e.clientY - rect.top;
  };

  const handlePointerUp = () => {
    pointerSteerRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#05070B] select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="block w-full h-full cursor-crosshair touch-none"
      />
    </div>
  );
};
