import React, { useState } from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { LogEntry, PlanetId } from '../types/game';

interface LogbookPanelProps {
  entries: LogEntry[];
}

export const LogbookPanel: React.FC<LogbookPanelProps> = ({ entries }) => {
  const [filter, setFilter] = useState<'all' | PlanetId>('all');

  const filteredEntries =
    filter === 'all'
      ? entries
      : entries.filter((entry) => entry.planet === filter);

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-300" />
          <h2 className="font-display text-sm font-semibold tracking-wide text-slate-100">
            Bitácora de Misión
          </h2>
        </div>
        <span className="font-mono-tabular text-xs text-slate-400">
          {entries.length}/8 registros
        </span>
      </div>

      {/* Segmented planet filter */}
      <div className="flex items-center gap-1 p-1 bg-[#080C14] border border-slate-800/80 rounded-lg shrink-0">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'all'
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Todos ({entries.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('moon')}
          className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'moon'
              ? 'bg-cyan-950/70 text-cyan-200'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          La Luna ({entries.filter((e) => e.planet === 'moon').length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('mars')}
          className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            filter === 'mars'
              ? 'bg-amber-950/70 text-amber-200'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Marte ({entries.filter((e) => e.planet === 'mars').length})
        </button>
      </div>

      {/* Log entries list */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3">
        {filteredEntries.length === 0 ? (
          <div className="border border-slate-800/80 rounded-lg bg-[#0B0F18] p-5 text-center flex flex-col items-center gap-2">
            <p className="text-xs font-medium text-slate-300">
              Sin transmisiones registradas
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[260px]">
              Acércate a los objetos señalados en el radar para recibir su información científica y guardarla automáticamente aquí.
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="border border-slate-800/80 rounded-lg bg-[#0B0F18] p-3.5 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-semibold text-slate-100 leading-snug">
                  {entry.objectName}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Guardado
                </span>
              </div>

              <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span
                  className={
                    entry.planet === 'moon' ? 'text-cyan-400' : 'text-amber-400'
                  }
                >
                  {entry.planetName}
                </span>
                <span aria-hidden="true">·</span>
                <span>{entry.sector}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">{entry.timestamp}</span>
              </div>

              <div className="pt-1">
                <div className="text-xs font-medium text-slate-200">
                  {entry.transmissionTitle}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  {entry.transmissionSummary}
                </p>
              </div>

              <div className="pt-1.5 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px] font-mono-tabular">
                <span className="text-slate-300 truncate">
                  {entry.telemetryReading}
                </span>
                <span className="text-emerald-400 shrink-0">
                  +{entry.pointsEarned} pts
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};
