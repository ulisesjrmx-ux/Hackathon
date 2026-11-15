import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Compass, Radio } from 'lucide-react';
import { CrystalNode, Language, PlanetConfig, RescueObject, ShipState } from '../types/game';
import {
  drawCrayonCircle,
  drawCrayonDiamond,
  drawCrayonDot,
  drawCrayonLine,
  drawCrayonPaperBackdrop,
  drawCrayonShip,
  drawCrayonSweep,
} from '../utils/crayonCanvas';
import { getLocalizedObjectCopy, getPlanetDisplayName, UI_TEXT } from '../utils/i18n';

interface RadarPanelProps {
  planet: PlanetConfig;
  lang: Language;
  shipRef: React.MutableRefObject<ShipState>;
  objects: RescueObject[];
  crystals: CrystalNode[];
  shipCoords: { x: number; y: number };
}

function getCardinalBearing(dx: number, dy: number, lang: Language): string {
  const cardinals = UI_TEXT[lang].cardinals;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const normalized = (angle + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return cardinals[0];
  if (normalized < 67.5) return cardinals[1];
  if (normalized < 112.5) return cardinals[2];
  if (normalized < 157.5) return cardinals[3];
  if (normalized < 202.5) return cardinals[4];
  if (normalized < 247.5) return cardinals[5];
  if (normalized < 292.5) return cardinals[6];
  return cardinals[7];
}

export const RadarPanel: React.FC<RadarPanelProps> = ({
  planet,
  lang,
  shipRef,
  objects,
  crystals,
  shipCoords,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectsRef = useRef(objects);
  const crystalsRef = useRef(crystals);
  const planetRef = useRef(planet);
  const langRef = useRef(lang);

  objectsRef.current = objects;
  crystalsRef.current = crystals;
  planetRef.current = planet;
  langRef.current = lang;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let sweepAngle = 0;

    const renderRadar = () => {
      const size = canvas.width;
      const cx = size / 2;
      const cy = size / 2;
      const radius = size / 2 - 12;
      const activePlanet = planetRef.current;
      const ship = shipRef.current;
      const isMoon = activePlanet.id === 'moon';
      const primaryStroke = isMoon ? '#38BDF8' : '#FBBF24';
      const softStroke = isMoon ? 'rgba(56, 189, 248, 0.34)' : 'rgba(251, 191, 36, 0.36)';

      ctx.clearRect(0, 0, size, size);

      // Dark construction-paper circular radar base
      ctx.save();
      ctx.fillStyle = '#0D1322';
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.clip();

      drawCrayonPaperBackdrop(ctx, size, size, primaryStroke);

      // Hand-drawn concentric crayon range rings
      drawCrayonCircle(ctx, cx, cy, radius * 0.33, softStroke, 1.5, 1.4, 1.2, true);
      drawCrayonCircle(ctx, cx, cy, radius * 0.66, softStroke, 1.6, 2.8, 1.4, true);

      // Hand-drawn crayon crosshair axes
      drawCrayonLine(ctx, cx - radius, cy, cx + radius, cy, softStroke, 1.4, 3.1, 1.3);
      drawCrayonLine(ctx, cx, cy - radius, cx, cy + radius, softStroke, 1.4, 5.2, 1.3);

      // Hand-scribbled rotating crayon sweep cone
      sweepAngle = (sweepAngle + 0.032) % (Math.PI * 2);
      drawCrayonSweep(
        ctx,
        cx,
        cy,
        radius - 2,
        sweepAngle,
        0.65,
        isMoon ? 'rgba(56, 189, 248,' : 'rgba(251, 191, 36,',
        isMoon ? '#67E8F9' : '#FDE047'
      );

      // Radar scale: map world range relative to ship
      const radarRange = 1350;

      // Nearby uncollected gasoline canisters drawn as bright green crayon dots
      const lowFuel = ship.boostEnergy <= 25;
      const fuelPulse = lowFuel ? 0.55 + 0.45 * Math.sin(performance.now() * 0.01) : 1;
      crystalsRef.current.forEach((c, idx) => {
        if (c.collected) return;
        const dx = c.x - ship.x;
        const dy = c.y - ship.y;
        const dist = Math.hypot(dx, dy);
        if (dist > radarRange) return;

        const rx = cx + (dx / radarRange) * (radius - 8);
        const ry = cy + (dy / radarRange) * (radius - 8);

        drawCrayonDot(
          ctx,
          rx,
          ry,
          lowFuel ? 3 : 2.5,
          `rgba(74, 222, 128, ${(lowFuel ? 0.6 + fuelPulse * 0.4 : 0.88).toFixed(3)})`,
          '#DCFCE7',
          idx + 1
        );
      });

      // Rescued objects and current active sequential target drawn with crayon strokes
      const now = performance.now();
      const activeObj = objectsRef.current.find((o) => !o.discovered) ?? null;
      objectsRef.current.forEach((obj, idx) => {
        if (!obj.discovered && obj.id !== activeObj?.id) return;
        const dx = obj.x - ship.x;
        const dy = obj.y - ship.y;
        const dist = Math.hypot(dx, dy);
        const clampedRatio = Math.min(1, dist / radarRange);
        const angle = Math.atan2(dy, dx);
        const rx = cx + Math.cos(angle) * clampedRatio * (radius - 10);
        const ry = cy + Math.sin(angle) * clampedRatio * (radius - 10);

        if (obj.discovered) {
          drawCrayonDot(ctx, rx, ry, 4.2, '#34D399', '#ECFDF5', idx + 11);
        } else {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
          drawCrayonCircle(
            ctx,
            rx,
            ry,
            6.5 + pulse * 4,
            isMoon ? '#67E8F9' : '#FDE047',
            1.6,
            idx + 7,
            1.1,
            false,
            0.4 + pulse * 0.5
          );
          drawCrayonDiamond(
            ctx,
            rx,
            ry,
            5.2,
            primaryStroke,
            '#FFFBEB'
          );
        }
      });

      // Center Ship drawn as a chunky yellow/white crayon rocket
      drawCrayonShip(ctx, cx, cy, ship.angle, 1.05, '#FEF08A', '#0B101B');

      ctx.restore();

      // Double-pass hand-drawn outer crayon bezel ring
      drawCrayonCircle(ctx, cx, cy, radius, primaryStroke, 2.6, 9.1, 1.8);

      // Hand-lettered cardinal letters along outer crayon margin
      const cards = UI_TEXT[langRef.current].canvasCardinals;
      ctx.save();
      ctx.font = '700 11px "Patrick Hand", sans-serif';
      ctx.fillStyle = isMoon ? '#BAE6FD' : '#FEF08A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cards.n, cx, 6);
      ctx.fillText(cards.s, cx, size - 6);
      ctx.fillText(cards.w, 6, cy);
      ctx.fillText(cards.e, size - 6, cy);
      ctx.restore();

      animId = requestAnimationFrame(renderRadar);
    };

    animId = requestAnimationFrame(renderRadar);
    return () => cancelAnimationFrame(animId);
  }, [shipRef]);

  // Compute current active sequential object
  const activeIndex = objects.findIndex((o) => !o.discovered);
  const objectsWithDistance = objects.map((obj, idx) => {
    const dx = obj.x - shipCoords.x;
    const dy = obj.y - shipCoords.y;
    const dist = Math.round(Math.hypot(dx, dy));
    const localized = getLocalizedObjectCopy(obj, lang);
    return {
      ...obj,
      name: localized.name,
      sector: localized.sector,
      dist,
      bearing: getCardinalBearing(dx, dy, lang),
      isActive: idx === activeIndex,
      isQueued: !obj.discovered && activeIndex !== -1 && idx > activeIndex,
    };
  });

  const activeTarget = activeIndex >= 0 ? objectsWithDistance[activeIndex] : null;
  const boxTone = planet.id === 'moon' ? 'crayon-box-moon' : 'crayon-box-mars';
  const t = UI_TEXT[lang];
  const localizedPlanetName = getPlanetDisplayName(planet.id, lang);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio
            className={`w-4 h-4 ${
              planet.id === 'moon' ? 'text-sky-300' : 'text-amber-300'
            }`}
          />
          <h2 className="font-crayon text-lg font-bold tracking-wide text-slate-100">
            {t.radarTitle}
          </h2>
        </div>
        <span className="font-mono-tabular text-xs text-slate-300">
          {t.radarRescued(objects.filter((o) => o.discovered).length, objects.length)}
        </span>
      </div>

      {/* Hand-drawn Crayon Radar Card + Active Sequential Target Readout */}
      <div className={`crayon-box ${boxTone} flex items-center gap-4 p-3.5`}>
        <div className="relative shrink-0">
          <canvas
            ref={canvasRef}
            width={162}
            height={162}
            className="block rounded-full"
            aria-label={t.radarTitle}
          />
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <div>
            <div className="font-crayon text-xs text-slate-400">
              {t.currentPos}
            </div>
            <div className="font-mono-tabular text-xs text-slate-100 mt-0.5">
              X:{Math.round(shipCoords.x)} · Y:{Math.round(shipCoords.y)}
            </div>
          </div>

          <div className="border-t border-dashed border-slate-600/70" />

          {activeTarget ? (
            <div>
              <div className="font-crayon text-xs text-slate-400">
                {t.activeTarget(activeIndex + 1, objects.length)}
              </div>
              <div className="font-crayon text-sm font-bold text-slate-50 truncate mt-0.5">
                {activeTarget.name}
              </div>
              <div
                className={`font-mono-tabular text-xs mt-0.5 flex items-center gap-1.5 ${
                  planet.id === 'moon' ? 'text-sky-300' : 'text-amber-300'
                }`}
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {activeTarget.dist} m · {t.bearing} {activeTarget.bearing}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="font-crayon text-sm font-bold text-emerald-300">
                {t.sweepComplete}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {t.sweepCompleteDesc(localizedPlanetName)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Rescue Objects Sequential Checklist in Crayon Sketch Box */}
      <div className="crayon-box crayon-box-slate flex flex-col divide-y divide-dashed divide-slate-700/75 p-1">
        {objectsWithDistance.map((obj) => (
          <div
            key={obj.id}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 text-xs ${
              obj.isQueued ? 'opacity-55' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {obj.discovered ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : obj.isActive ? (
                  <span
                    className={`inline-block w-2.5 h-2.5 rotate-45 shrink-0 border border-slate-950 ${
                      planet.id === 'moon' ? 'bg-sky-400' : 'bg-amber-400'
                    }`}
                  />
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full border border-dashed border-slate-500 shrink-0" />
                )}
                <span
                  className={`font-crayon text-sm truncate ${
                    obj.discovered
                      ? 'text-slate-200'
                      : obj.isActive
                      ? 'text-slate-50 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {obj.isQueued ? t.unconfirmedSignal : obj.name}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate pl-5 mt-0.5">
                {obj.isQueued
                  ? t.appearsNextDesc
                  : `${obj.sector} · ${obj.frequency}`}
              </div>
            </div>

            <div className="shrink-0 text-right font-mono-tabular">
              {obj.discovered ? (
                <span className="font-crayon text-xs font-semibold text-emerald-300">
                  {t.rescuedBadge}
                </span>
              ) : obj.isActive ? (
                <span className="text-[11px] text-slate-100 font-semibold">
                  {obj.dist} m {obj.bearing}
                </span>
              ) : (
                <span className="font-crayon text-xs text-slate-500">{t.standbyBadge}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
