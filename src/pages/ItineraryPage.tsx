import { useState, useEffect } from 'react';
import { days } from '../data/itinerary';
import DayPanel from '../components/DayPanel';

function getStoredDay(): string {
  try { return localStorage.getItem('goaSelectedDay') || '14'; } catch { return '14'; }
}
function getStoredOpenOnly(): boolean {
  try { return localStorage.getItem('goaOpenOnly') === '1'; } catch { return false; }
}

export default function ItineraryPage() {
  const [selectedDay, setSelectedDay] = useState(getStoredDay);
  const [onlyOpen, setOnlyOpen] = useState(getStoredOpenOnly);

  const activeDay = days.find(d => d.day === selectedDay) || days[0];
  const todayDate = new Date();
  const isTrip = todayDate.getFullYear() === 2026 && todayDate.getMonth() === 8;
  const todayStr = isTrip ? String(todayDate.getDate()) : null;

  useEffect(() => {
    try { localStorage.setItem('goaSelectedDay', selectedDay); } catch { /* */ }
  }, [selectedDay]);

  function handleOpenOnly(checked: boolean) {
    setOnlyOpen(checked);
    try { localStorage.setItem('goaOpenOnly', checked ? '1' : '0'); } catch { /* */ }
  }

  return (
    <div>
      <p className="text-muted text-[12px] mb-4 mt-0 leading-relaxed sm:text-xs">
        Weather checked 5 September 2026 (9–13 days out) — treat as indicative and recheck closer to travel. September is Goa's monsoon-withdrawal period: historically ~25.6°C average, 89% humidity, rain on most days.
      </p>

      {/* Toggle */}
      <div className="flex items-center justify-end mb-3 sm:mb-4">
        <label className="inline-flex items-center gap-2 cursor-pointer text-[12px] text-muted select-none sm:text-[12.5px]">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={onlyOpen}
            onChange={e => handleOpenOnly(e.target.checked)}
          />
          <span className="relative w-8 h-[18px] rounded-full bg-line flex-none transition-colors peer-checked:bg-azulejo after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-[14px] after:h-[14px] after:rounded-full after:bg-paper after:shadow-sm after:transition-transform peer-checked:after:translate-x-[14px] sm:w-[34px] sm:h-5 sm:after:w-4 sm:after:h-4 sm:peer-checked:after:translate-x-[14px]" />
          Show only open items
        </label>
      </div>

      {/* Day tabs — horizontally scrollable on mobile */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0 sm:mb-5" style={{ scrollbarWidth: 'none' }} role="tablist" aria-label="Select a day">
        {days.map(d => {
          const isActive = d.day === selectedDay;
          const isToday = d.day === todayStr;
          return (
            <button
              key={d.day}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedDay(d.day)}
              className={`relative shrink-0 cursor-pointer border-2 rounded-[10px] px-3 py-2 text-center font-mono transition-all focus-visible:outline-2 focus-visible:outline-azulejo focus-visible:outline-offset-2 sm:rounded-[12px] sm:px-4 sm:py-2.5 sm:min-w-[54px]
                ${isActive
                  ? 'bg-azulejo-soft border-azulejo text-azulejo shadow-[0_3px_10px_rgba(94,168,200,.25)]'
                  : 'bg-paper border-line text-ink hover:border-azulejo'}`}
            >
              <span className="block text-sm font-semibold tabular-nums sm:text-base">{d.day}</span>
              <span className={`block text-[9px] uppercase tracking-[.05em] mt-0.5 sm:text-[10px] ${isActive ? 'text-azulejo opacity-80' : 'text-muted'}`}>
                {d.weekday.slice(0, 3)}
              </span>
              {isToday && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-laterite" title="Today" />
              )}
            </button>
          );
        })}
      </div>

      <DayPanel day={activeDay} onlyOpen={onlyOpen} />
    </div>
  );
}
