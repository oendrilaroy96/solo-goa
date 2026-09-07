import { useState, useEffect } from 'react';
import { days } from '../data/itinerary';
import DayPanel from '../components/DayPanel';

function getStoredDay(): string {
  try { return localStorage.getItem('goaSelectedDay') || '14'; } catch { return '14'; }
}

export default function ItineraryPage() {
  const [selectedDay, setSelectedDay] = useState(getStoredDay);

  const activeDay = days.find(d => d.day === selectedDay) || days[0];
  const todayDate = new Date();
  const isTrip = todayDate.getFullYear() === 2026 && todayDate.getMonth() === 8;
  const todayStr = isTrip ? String(todayDate.getDate()) : null;

  useEffect(() => {
    try { localStorage.setItem('goaSelectedDay', selectedDay); } catch { /* */ }
  }, [selectedDay]);

  return (
    <div>
      {/* Day selector tabs */}
      <div
        className="flex gap-0 mb-8 overflow-x-auto pb-0"
        style={{ scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,.07)' }}
        role="tablist"
        aria-label="Select a day"
      >
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
              className="relative shrink-0 cursor-pointer text-center transition-all focus-visible:outline-none"
              style={{
                padding: '10px 16px 12px',
                background: 'transparent',
                border: 0,
                borderBottom: isActive ? '2px solid #c9a84c' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <span
                className="block font-mono text-[14px] font-semibold tabular-nums"
                style={{ color: isActive ? '#c9a84c' : '#8a8070' }}
              >
                {d.day}
              </span>
              <span
                className="block font-mono text-[9px] uppercase tracking-[.06em] mt-0.5"
                style={{ color: isActive ? 'rgba(201,168,76,.7)' : 'rgba(138,128,112,.6)' }}
              >
                {d.weekday.slice(0, 3)}
              </span>
              {isToday && (
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: '#c9a84c' }}
                  title="Today"
                />
              )}
            </button>
          );
        })}
      </div>

      <DayPanel day={activeDay} onlyOpen={false} />
    </div>
  );
}
