import React, { useEffect, useRef } from 'react';
import { CrystalNode, Language, PlanetConfig, RescueObject, ShipState } from '../types/game';
import {
  drawCrayonCircle,
  drawCrayonDiamond,
  drawCrayonDot,
  drawCrayonEllipse,
  drawCrayonLine,
  drawCrayonPaperBackdrop,
  drawCrayonRect,
  drawCrayonShip,
  drawCrayonSweep,
} from '../utils/crayonCanvas';
import { UI_TEXT } from '../utils/i18n';

interface ProbeMinimapProps {
  planet: PlanetConfig;
  lang: Language;
  shipRef: React.MutableRefObject<ShipState>;
  objects: RescueObject[];
  crystals: CrystalNode[];
}

export const ProbeMinimap: React.FC<ProbeMinimapProps> = ({
  planet,
  lang,
  shipRef,
  objects,
  crystals,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const planetRef = useRef(planet);
  const langRef = useRef(lang);
  const objectsRef = useRef(objects);
  const crystalsRef = useRef(crystals);

  planetRef.current = planet;
  langRef.current = lang;
  objectsRef.current = objects;
  crystalsRef.current = crystals;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let sweepAngle = 0;

    const renderMinimap = () => {
      const w = canvas.width;
      const h = canvas.height;
      const activePlanet = planetRef.current;
      const ship = shipRef.current;
      const objs = objectsRef.current;
      const isMoon = activePlanet.id === 'moon';
      const primaryColor = isMoon ? '#38BDF8' : '#FBBF24';

      const pad = 7;
      const mapW = w - pad * 2;
      const mapH = h - pad * 2;
      const toX = (wx: number) => pad + (wx / activePlanet.worldWidth) * mapW;
      const toY = (wy: number) => pad + (wy / activePlanet.worldHeight) * mapH;
      const scaleAvg = mapW / activePlanet.worldWidth;

      ctx.clearRect(0, 0, w, h);

      // Dark notebook paper minimap backdrop
      ctx.fillStyle = '#0B101C';
      ctx.fillRect(0, 0, w, h);
      drawCrayonPaperBackdrop(ctx, w, h, primaryColor);

      // Hand-drawn outer crayon border rectangle
      drawCrayonRect(
        ctx,
        pad,
        pad,
        mapW,
        mapH,
        isMoon ? 'rgba(56, 189, 248, 0.55)' : 'rgba(251, 191, 36, 0.55)',
        1.8,
        4.2,
        1.2
      );

      const cx = toX(activePlanet.worldWidth / 2);
      const cy = toY(activePlanet.worldHeight / 2);
      const planetR = (activePlanet.mapRadius ?? 640) * scaleAvg;

      // Planet silhouette with crayon-shaded interior & sketchy outline
      ctx.fillStyle = isMoon ? 'rgba(148, 163, 184, 0.16)' : 'rgba(234, 88, 12, 0.22)';
      ctx.beginPath();
      ctx.arc(cx, cy, planetR, 0, Math.PI * 2);
      ctx.fill();
      drawCrayonCircle(
        ctx,
        cx,
        cy,
        planetR,
        isMoon ? '#CBD5E1' : '#FB923C',
        1.7,
        2.3,
        1.3,
        false,
        0.65
      );

      // Outer orbital crayon dashed ring
      drawCrayonCircle(
        ctx,
        cx,
        cy,
        ((activePlanet.mapRadius ?? 640) + 240) * scaleAvg,
        'rgba(148, 163, 184, 0.35)',
        1.3,
        6.1,
        1.2,
        true
      );

      // Active sequential target
      const activeObj = objs.find((o) => !o.discovered) ?? null;

      // Faint hand-drawn orbital trajectory for active sequential probe
      if (activeObj) {
        drawCrayonEllipse(
          ctx,
          toX(activeObj.orbitCenterX),
          toY(activeObj.orbitCenterY),
          activeObj.orbitRadiusX * scaleAvg,
          activeObj.orbitRadiusY * (mapH / activePlanet.worldHeight),
          isMoon ? 'rgba(56, 189, 248, 0.28)' : 'rgba(251, 191, 36, 0.3)',
          1.2,
          7.4,
          1.1,
          true
        );
      }

      // Crayon radar sweep centered on ship
      sweepAngle = (sweepAngle + 0.045) % (Math.PI * 2);
      const shipMx = toX(ship.x);
      const shipMy = toY(ship.y);
      const sweepR = 52;

      ctx.save();
      ctx.beginPath();
      ctx.rect(pad, pad, mapW, mapH);
      ctx.clip();
      drawCrayonSweep(
        ctx,
        shipMx,
        shipMy,
        sweepR,
        sweepAngle,
        0.65,
        isMoon ? 'rgba(56, 189, 248,' : 'rgba(251, 191, 36,',
        isMoon ? '#67E8F9' : '#FDE047'
      );
      ctx.restore();

      // Uncollected gasoline canisters (vivid green crayon dots)
      const lowFuel = ship.boostEnergy <= 25;
      const fuelPulse = lowFuel ? 0.5 + 0.5 * Math.sin(performance.now() * 0.01) : 1;
      crystalsRef.current.forEach((c, idx) => {
        if (c.collected) return;
        drawCrayonDot(
          ctx,
          toX(c.x),
          toY(c.y),
          lowFuel ? 2.6 : 2.1,
          `rgba(74, 222, 128, ${(lowFuel ? 0.55 + fuelPulse * 0.45 : 0.88).toFixed(3)})`,
          '#ECFDF5',
          idx + 3
        );
      });

      // Crayon dashed vector line to current active probe
      const activeDist = activeObj
        ? Math.hypot(activeObj.x - ship.x, activeObj.y - ship.y)
        : 0;

      if (activeObj) {
        drawCrayonLine(
          ctx,
          shipMx,
          shipMy,
          toX(activeObj.x),
          toY(activeObj.y),
          isMoon ? 'rgba(103, 232, 249, 0.6)' : 'rgba(253, 224, 71, 0.65)',
          1.35,
          8.2,
          1.0,
          true
        );
      }

      // Draw discovered probes and ONLY the current active sequential probe
      const now = performance.now();
      objs.forEach((obj, idx) => {
        if (!obj.discovered && obj.id !== activeObj?.id) return;
        const ox = toX(obj.x);
        const oy = toY(obj.y);

        if (obj.discovered) {
          drawCrayonDot(ctx, ox, oy, 3, '#34D399', '#ECFDF5', idx + 19);
        } else {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
          drawCrayonCircle(
            ctx,
            ox,
            oy,
            4.8 + pulse * 3,
            isMoon ? '#67E8F9' : '#FDE047',
            1.35,
            idx + 9,
            0.9,
            false,
            0.4 + pulse * 0.5
          );
          drawCrayonDiamond(ctx, ox, oy, 3.8, primaryColor, '#FFFBEB');
        }
      });

      // Player ship chevron drawn in yellow crayon
      drawCrayonShip(ctx, shipMx, shipMy, ship.angle, 0.85, '#FEF08A', '#090D16');

      if (infoRef.current) {
        const text = UI_TEXT[langRef.current];
        if (activeObj) {
          infoRef.current.textContent = text.minimapTarget(Math.round(activeDist));
          infoRef.current.style.color = isMoon ? '#7DD3FC' : '#FDE047';
        } else {
          infoRef.current.textContent = text.minimapAllScanned(objs.length);
          infoRef.current.style.color = '#6EE7B7';
        }
      }

      animId = requestAnimationFrame(renderMinimap);
    };

    animId = requestAnimationFrame(renderMinimap);
    return () => cancelAnimationFrame(animId);
  }, [shipRef]);

  const rescued = objects.filter((o) => o.discovered).length;
  const boxTone = planet.id === 'moon' ? 'crayon-box-moon' : 'crayon-box-mars';
  const t = UI_TEXT[lang];

  return (
    <div
      className={`pointer-events-none absolute bottom-3 right-3 crayon-box ${boxTone} p-2.5 shadow-xl`}
    >
      <div className="flex items-center justify-between gap-3 mb-1 px-0.5">
        <span className="font-crayon text-sm font-bold tracking-wide text-slate-100">
          {t.minimapTitle}
        </span>
        <span className="font-mono-tabular text-[11px] text-slate-300">
          {rescued}/{objects.length}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={184}
        height={156}
        className="block rounded-lg"
        aria-label={t.minimapTitle}
      />

      <div
        ref={infoRef}
        className="font-crayon text-xs text-slate-300 mt-1 px-0.5 truncate max-w-[184px]"
      >
        {t.minimapScanning}
      </div>
    </div>
  );
};
