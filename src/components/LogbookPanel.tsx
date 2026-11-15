import React, { useEffect, useState } from 'react';
import { BookOpen, CheckCircle2, Image as ImageIcon, Lock } from 'lucide-react';
import { STORY_POPUP_BY_OBJECT_ID } from '../data/planets';
import { Language, LogEntry, PlanetId, RescueObject } from '../types/game';
import { getLocalizedObjectCopy, getPlanetDisplayName, UI_TEXT } from '../utils/i18n';

interface LogbookPanelProps {
  activePlanetId: PlanetId;
  lang: Language;
  objectsByPlanet: Record<PlanetId, RescueObject[]>;
  entries: LogEntry[];
  onOpenStoryImage: (objectId: string) => void;
}

export const LogbookPanel: React.FC<LogbookPanelProps> = ({
  activePlanetId,
  lang,
  objectsByPlanet,
  onOpenStoryImage,
}) => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId>(activePlanetId);
  const [expandedObjectId, setExpandedObjectId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedPlanet(activePlanetId);
  }, [activePlanetId]);

  const planetObjects = objectsByPlanet[selectedPlanet];
  const moonTotal = objectsByPlanet.moon.length;
  const marsTotal = objectsByPlanet.mars.length;
  const moonUnlocked = objectsByPlanet.moon.filter((o) => o.discovered).length;
  const marsUnlocked = objectsByPlanet.mars.filter((o) => o.discovered).length;
  const totalUnlocked = moonUnlocked + marsUnlocked;
  const totalObjects = moonTotal + marsTotal;
  const t = UI_TEXT[lang];

  const handleSelectItem = (obj: RescueObject) => {
    if (!obj.discovered) return;
    if (STORY_POPUP_BY_OBJECT_ID[obj.id]) {
      onOpenStoryImage(obj.id);
      return;
    }
    setExpandedObjectId((prev) => (prev === obj.id ? null : obj.id));
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-3">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-300" />
          <h2 className="font-crayon text-lg font-bold tracking-wide text-slate-100">
            {t.logbookTitle}
          </h2>
        </div>
        <span className="font-mono-tabular text-xs text-slate-400">
          {t.unlockedCount(totalUnlocked, totalObjects)}
        </span>
      </div>

      {/* Planet selector for the logbook menu */}
      <div className="crayon-box crayon-box-slate flex items-center gap-2 p-1.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            setSelectedPlanet('moon');
            setExpandedObjectId(null);
          }}
          className={`crayon-btn flex-1 px-3 py-1.5 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer ${
            selectedPlanet === 'moon' ? 'crayon-btn-cyan' : 'crayon-btn-ghost'
          }`}
        >
          {getPlanetDisplayName('moon', lang)} ({moonUnlocked}/{moonTotal})
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedPlanet('mars');
            setExpandedObjectId(null);
          }}
          className={`crayon-btn flex-1 px-3 py-1.5 text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer ${
            selectedPlanet === 'mars' ? 'crayon-btn-amber' : 'crayon-btn-ghost'
          }`}
        >
          {getPlanetDisplayName('mars', lang)} ({marsUnlocked}/{marsTotal})
        </button>
      </div>

      {/* 4 named menu entries that unlock progressively */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3">
        {planetObjects.map((obj, index) => {
          const unlocked = obj.discovered;
          const hasImage = Boolean(STORY_POPUP_BY_OBJECT_ID[obj.id]);
          const isExpanded = expandedObjectId === obj.id;
          const localized = getLocalizedObjectCopy(obj, lang);

          return (
            <div
              key={obj.id}
              className={`crayon-box transition-opacity ${
                unlocked
                  ? selectedPlanet === 'moon'
                    ? 'crayon-box-moon'
                    : 'crayon-box-mars'
                  : 'crayon-box-slate opacity-65'
              }`}
            >
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => handleSelectItem(obj)}
                className={`crayon-btn w-full text-left p-3.5 flex items-center justify-between gap-3 ${
                  unlocked
                    ? 'crayon-btn-dark cursor-pointer'
                    : 'crayon-btn-disabled cursor-not-allowed'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular text-[11px] text-slate-400 shrink-0">
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <span
                      className={`font-crayon text-base font-bold truncate ${
                        unlocked ? 'text-slate-100' : 'text-slate-400'
                      }`}
                    >
                      {localized.name}
                    </span>
                  </div>
                  <div className="font-sans text-[11px] text-slate-300/85 mt-1">
                    {unlocked
                      ? hasImage
                        ? t.tapToOpenImage
                        : t.tapToViewLog
                      : t.lockedCollect}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {unlocked ? (
                    hasImage ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-300">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{t.viewImage}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.open}</span>
                      </span>
                    )
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
              </button>

              {unlocked && !hasImage && isExpanded && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                  <div className="text-xs font-medium text-slate-200">
                    {localized.transmissionTitle}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {localized.transmissionSummary}
                  </p>
                  <div className="text-[11px] font-mono-tabular text-slate-300 pt-1">
                    {localized.telemetryReading}
                  </div>
                  <div className="text-[11px] text-amber-300/90 pt-0.5">
                    {t.pendingImage}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
