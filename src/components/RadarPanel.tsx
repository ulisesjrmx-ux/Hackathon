import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Compass, Radio } from 'lucide-react';
import { CrystalNode, PlanetConfig, RescueObject, ShipState } from '../types/game';

interface RadarPanelProps {
  planet: PlanetConfig;
  shipRef: React.MutableRefObject<ShipState>;
  objects: RescueObject[];
  crystals: CrystalNode[];
  shipCoords: { x: number; y: number };
}

function getCardinalBearing(dx: number, dy: number): string {
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const normalized = (angle + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'E';
  if (normalized < 67.5) return 'SE';
  if (normalized < 112.5) return 'S';
  if (normalized < 157.5) return 'SO';
  if (normalized < 202.5) return 'O';
  if (normalized < 247.5) return 'NO';
  if (normalized < 292.5) return 'N';
  return 'NE';
}

export const RadarPanel: React.FC<RadarPanelProps> = ({
  planet,
  shipRef,
  objects,
  crystals,
  shipCoords,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const objectsRef = useRef(objects);
  const crystalsRef = useRef(crystals);
  const planetRef = useRef(planet);

  objectsRef.current = objects;
  crystalsRef.current = crystals;
  planetRef.current = planet;

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
      const radius = size / 2 - 8;
      const activePlanet = planetRef.current;
      const ship = shipRef.current;

      ctx.clearRect(0, 0, size, size);

      // Deep radar background
      ctx.fillStyle = '#080C14';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Concentric range rings
      ctx.strokeStyle =
        activePlanet.id === 'moon'
          ? 'rgba(6, 182, 212, 0.16)'
          : 'rgba(245, 158, 11, 0.16)';
      ctx.lineWidth = 1;
      [0.33, 0.66, 1].forEach((ratio) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshair axes
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Rotating radar sweep cone
      sweepAngle = (sweepAngle + 0.032) % (Math.PI * 2);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      const sweepColor =
        activePlanet.id === 'moon' ? 'rgba(6, 182, 212,' : 'rgba(245, 158, 11,';
      const steps = 16;
      const arcSpan = 0.65;
      for (let i = 0; i < steps; i++) {
        const a0 = sweepAngle - (i / steps) * arcSpan;
        const a1 = sweepAngle - ((i + 1) / steps) * arcSpan;
        const alpha = (1 - i / steps) * 0.22;
        ctx.fillStyle = `${sweepColor} ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, a1, a0);
        ctx.closePath();
        ctx.fill();
      }

      // Leading edge beam
      ctx.strokeStyle =
        activePlanet.id === 'moon'
          ? 'rgba(34, 211, 238, 0.75)'
          : 'rgba(251, 191, 36, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * radius, cy + Math.sin(sweepAngle) * radius);
      ctx.stroke();
      ctx.restore();

      // Radar scale: map world range relative to ship (1300px radius covers whole map comfortably)
      const radarRange = 1350;

      // Draw nearby uncollected crystals
      crystalsRef.current.forEach((c) => {
        if (c.collected) return;
        const dx = c.x - ship.x;
        const dy = c.y - ship.y;
        const dist = Math.hypot(dx, dy);
        if (dist > radarRange) return;

        const rx = cx + (dx / radarRange) * (radius - 6);
        const ry = cy + (dy / radarRange) * (radius - 6);

        ctx.fillStyle =
          activePlanet.id === 'moon'
            ? 'rgba(56, 189, 248, 0.45)'
            : 'rgba(251, 191, 36, 0.45)';
        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw rescued objects and ONLY the current sequential active object
      const now = performance.now();
      const activeObj = objectsRef.current.find((o) => !o.discovered) ?? null;
      objectsRef.current.forEach((obj) => {
        if (!obj.discovered && obj.id !== activeObj?.id) return;
        const dx = obj.x - ship.x;
        const dy = obj.y - ship.y;
        const dist = Math.hypot(dx, dy);
        const clampedRatio = Math.min(1, dist / radarRange);
        const angle = Math.atan2(dy, dx);
        const rx = cx + Math.cos(angle) * clampedRatio * (radius - 8);
        const ry = cy + Math.sin(angle) * clampedRatio * (radius - 8);

        if (obj.discovered) {
          // Rescued marker: solid emerald dot
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(rx, ry, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Active sequential beacon: pulsing diamond + ring
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
          ctx.strokeStyle =
            activePlanet.id === 'moon'
              ? `rgba(34, 211, 238, ${0.35 + pulse * 0.55})`
              : `rgba(251, 191, 36, ${0.35 + pulse * 0.55})`;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.arc(rx, ry, 5 + pulse * 4, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = activePlanet.id === 'moon' ? '#22D3EE' : '#FBBF24';
          ctx.save();
          ctx.translate(rx, ry);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-3.5, -3.5, 7, 7);
          ctx.restore();
        }
      });

      // Center Ship Chevron
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ship.angle);
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-5, -4.5);
      ctx.lineTo(-2.5, 0);
      ctx.lineTo(-5, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Outer bezel ring
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

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
    return {
      ...obj,
      dist,
      bearing: getCardinalBearing(dx, dy),
      isActive: idx === activeIndex,
      isQueued: !obj.discovered && activeIndex !== -1 && idx > activeIndex,
    };
  });

  const activeTarget = activeIndex >= 0 ? objectsWithDistance[activeIndex] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio
            className={`w-4 h-4 ${
              planet.id === 'moon' ? 'text-cyan-400' : 'text-amber-400'
            }`}
          />
          <h2 className="font-display text-sm font-semibold tracking-wide text-slate-100">
            Radar de Rescate
          </h2>
        </div>
        <span className="font-mono-tabular text-xs text-slate-400">
          {objects.filter((o) => o.discovered).length}/4 rescatados
        </span>
      </div>

      {/* Circular Radar Canvas + Active Sequential Target Readout */}
      <div className="flex items-center gap-4 bg-[#0B0F18] border border-slate-800/90 rounded-lg p-3">
        <div className="relative shrink-0">
          <canvas
            ref={canvasRef}
            width={156}
            height={156}
            className="block rounded-full"
            aria-label="Radar táctico mostrando la posición de la nave y el objetivo activo"
          />
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <div>
            <div className="text-[11px] font-medium text-slate-400">
              Posición actual
            </div>
            <div className="font-mono-tabular text-xs text-slate-200 mt-0.5">
              X:{Math.round(shipCoords.x)} · Y:{Math.round(shipCoords.y)}
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {activeTarget ? (
            <div>
              <div className="text-[11px] font-medium text-slate-400">
                Objetivo activo ({activeIndex + 1}/4)
              </div>
              <div className="text-xs font-semibold text-slate-100 truncate mt-0.5">
                {activeTarget.name}
              </div>
              <div
                className={`font-mono-tabular text-xs mt-0.5 flex items-center gap-1.5 ${
                  planet.id === 'moon' ? 'text-cyan-400' : 'text-amber-400'
                }`}
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {activeTarget.dist} m · Rumbo {activeTarget.bearing}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[11px] font-medium text-emerald-400">
                Barrido completado
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Todas las señales de {planet.name} han sido recuperadas.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4 Rescue Objects Sequential Checklist */}
      <div className="flex flex-col divide-y divide-slate-800/70 border border-slate-800/80 rounded-lg bg-[#0B0F18]">
        {objectsWithDistance.map((obj) => (
          <div
            key={obj.id}
            className={`flex items-center justify-between gap-3 px-3 py-2.5 text-xs ${
              obj.isQueued ? 'opacity-50' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {obj.discovered ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : obj.isActive ? (
                  <span
                    className={`inline-block w-2 h-2 rotate-45 shrink-0 ${
                      planet.id === 'moon' ? 'bg-cyan-400' : 'bg-amber-400'
                    }`}
                  />
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full bg-slate-700 shrink-0" />
                )}
                <span
                  className={`font-medium truncate ${
                    obj.discovered
                      ? 'text-slate-300'
                      : obj.isActive
                      ? 'text-slate-100'
                      : 'text-slate-400'
                  }`}
                >
                  {obj.isQueued ? 'Señal por confirmar' : obj.name}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate pl-5 mt-0.5">
                {obj.isQueued
                  ? 'Aparecerá al recoger el objeto actual'
                  : `${obj.sector} · ${obj.frequency}`}
              </div>
            </div>

            <div className="shrink-0 text-right font-mono-tabular">
              {obj.discovered ? (
                <span className="text-[11px] font-medium text-emerald-400">
                  Rescatado
                </span>
              ) : obj.isActive ? (
                <span className="text-[11px] text-slate-200 font-semibold">
                  {obj.dist} m {obj.bearing}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">En espera</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
