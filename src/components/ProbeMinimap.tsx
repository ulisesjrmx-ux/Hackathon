import React, { useEffect, useRef } from 'react';
import { CrystalNode, PlanetConfig, RescueObject, ShipState } from '../types/game';

interface ProbeMinimapProps {
  planet: PlanetConfig;
  shipRef: React.MutableRefObject<ShipState>;
  objects: RescueObject[];
  crystals: CrystalNode[];
}

export const ProbeMinimap: React.FC<ProbeMinimapProps> = ({
  planet,
  shipRef,
  objects,
  crystals,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const planetRef = useRef(planet);
  const objectsRef = useRef(objects);
  const crystalsRef = useRef(crystals);

  planetRef.current = planet;
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

      const pad = 6;
      const mapW = w - pad * 2;
      const mapH = h - pad * 2;
      const toX = (wx: number) => pad + (wx / activePlanet.worldWidth) * mapW;
      const toY = (wy: number) => pad + (wy / activePlanet.worldHeight) * mapH;
      const scaleAvg = mapW / activePlanet.worldWidth;

      ctx.clearRect(0, 0, w, h);

      // Deep space minimap backing
      ctx.fillStyle = '#060910';
      ctx.fillRect(0, 0, w, h);

      // Outer navigable sector rectangle
      ctx.strokeStyle =
        activePlanet.id === 'moon'
          ? 'rgba(56, 189, 248, 0.25)'
          : 'rgba(251, 146, 60, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pad, pad, mapW, mapH);

      const cx = toX(activePlanet.worldWidth / 2);
      const cy = toY(activePlanet.worldHeight / 2);
      const planetR = (activePlanet.mapRadius ?? 640) * scaleAvg;

      // Planet silhouette on minimap
      ctx.fillStyle =
        activePlanet.id === 'moon'
          ? 'rgba(148, 163, 184, 0.18)'
          : 'rgba(234, 88, 12, 0.2)';
      ctx.strokeStyle =
        activePlanet.id === 'moon'
          ? 'rgba(203, 213, 225, 0.35)'
          : 'rgba(251, 146, 60, 0.42)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, planetR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Orbital ring outside planet
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.beginPath();
      ctx.arc(cx, cy, ((activePlanet.mapRadius ?? 640) + 240) * scaleAvg, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Active sequential target (appears one by one)
      const activeObj = objs.find((o) => !o.discovered) ?? null;

      // Faint orbital trajectory for active sequential probe
      if (activeObj) {
        ctx.save();
        ctx.strokeStyle =
          activePlanet.id === 'moon'
            ? 'rgba(34, 211, 238, 0.14)'
            : 'rgba(251, 191, 36, 0.16)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(
          toX(activeObj.orbitCenterX),
          toY(activeObj.orbitCenterY),
          activeObj.orbitRadiusX * scaleAvg,
          activeObj.orbitRadiusY * (mapH / activePlanet.worldHeight),
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }

      // Radar sweep centered on ship
      sweepAngle = (sweepAngle + 0.045) % (Math.PI * 2);
      const shipMx = toX(ship.x);
      const shipMy = toY(ship.y);
      const sweepR = 54;

      ctx.save();
      ctx.beginPath();
      ctx.rect(pad, pad, mapW, mapH);
      ctx.clip();

      const rgb =
        activePlanet.id === 'moon' ? 'rgba(34, 211, 238,' : 'rgba(251, 191, 36,';
      for (let i = 0; i < 10; i++) {
        const a0 = sweepAngle - (i / 10) * 0.65;
        const a1 = sweepAngle - ((i + 1) / 10) * 0.65;
        ctx.fillStyle = `${rgb} ${((1 - i / 10) * 0.16).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(shipMx, shipMy);
        ctx.arc(shipMx, shipMy, sweepR, a1, a0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = `${rgb} 0.65)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(shipMx, shipMy);
      ctx.lineTo(
        shipMx + Math.cos(sweepAngle) * sweepR,
        shipMy + Math.sin(sweepAngle) * sweepR
      );
      ctx.stroke();
      ctx.restore();

      // Uncollected crystals
      crystalsRef.current.forEach((c) => {
        if (c.collected) return;
        ctx.fillStyle =
          activePlanet.id === 'moon'
            ? 'rgba(56, 189, 248, 0.45)'
            : 'rgba(251, 191, 36, 0.45)';
        ctx.fillRect(toX(c.x) - 1, toY(c.y) - 1, 2, 2);
      });

      // Vector line to current active probe
      const activeDist = activeObj
        ? Math.hypot(activeObj.x - ship.x, activeObj.y - ship.y)
        : 0;

      if (activeObj) {
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle =
          activePlanet.id === 'moon'
            ? 'rgba(34, 211, 238, 0.4)'
            : 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(shipMx, shipMy);
        ctx.lineTo(toX(activeObj.x), toY(activeObj.y));
        ctx.stroke();
        ctx.restore();
      }

      // Draw discovered probes and ONLY the current active sequential probe
      const now = performance.now();
      objs.forEach((obj) => {
        if (!obj.discovered && obj.id !== activeObj?.id) return;
        const ox = toX(obj.x);
        const oy = toY(obj.y);

        if (obj.discovered) {
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(ox, oy, 2.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
          ctx.strokeStyle =
            activePlanet.id === 'moon'
              ? `rgba(34, 211, 238, ${0.35 + pulse * 0.5})`
              : `rgba(251, 191, 36, ${0.35 + pulse * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(ox, oy, 4 + pulse * 3, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = activePlanet.id === 'moon' ? '#22D3EE' : '#FBBF24';
          ctx.save();
          ctx.translate(ox, oy);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-2.5, -2.5, 5, 5);
          ctx.restore();
        }
      });

      // Player ship chevron on minimap
      ctx.save();
      ctx.translate(shipMx, shipMy);
      ctx.rotate(ship.angle);
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(5.5, 0);
      ctx.lineTo(-4, -3.5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Update compact readout line without triggering React renders
      if (infoRef.current) {
        if (activeObj) {
          infoRef.current.textContent = `Objetivo actual: ${Math.round(activeDist)} m`;
          infoRef.current.style.color =
            activePlanet.id === 'moon' ? '#67E8F9' : '#FCD34D';
        } else {
          infoRef.current.textContent = '4/4 sondas escaneadas';
          infoRef.current.style.color = '#34D399';
        }
      }

      animId = requestAnimationFrame(renderMinimap);
    };

    animId = requestAnimationFrame(renderMinimap);
    return () => cancelAnimationFrame(animId);
  }, [shipRef]);

  const rescued = objects.filter((o) => o.discovered).length;

  return (
    <div className="pointer-events-none absolute bottom-3 right-3 bg-[#0B0F17]/92 border border-slate-800/90 rounded-lg p-2.5 shadow-xl backdrop-blur-xs">
      <div className="flex items-center justify-between gap-3 mb-1.5 px-0.5">
        <span className="font-display text-[11px] font-semibold tracking-wide text-slate-200">
          Radar de Sondas
        </span>
        <span className="font-mono-tabular text-[11px] text-slate-400">
          {rescued}/4
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={182}
        height={154}
        className="block rounded border border-slate-800/80"
        aria-label="Minimapa radar de sondas en movimiento"
      />

      <div
        ref={infoRef}
        className="font-mono-tabular text-[10px] text-slate-400 mt-1.5 px-0.5 truncate max-w-[182px]"
      >
        Escaneando sector...
      </div>
    </div>
  );
};
