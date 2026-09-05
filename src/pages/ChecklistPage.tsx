import { useState, useEffect } from 'react';
import { beforeBookingItems } from '../data/checklists';

const STORAGE_KEY = 'goaChecklist';

function loadSaved(): boolean[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(raw) && raw.length === beforeBookingItems.length) return raw;
  } catch { /* */ }
  return beforeBookingItems.map(() => false);
}

export default function ChecklistPage() {
  const [checked, setChecked] = useState<boolean[]>(loadSaved);

  const done  = checked.filter(Boolean).length;
  const total = beforeBookingItems.length;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(checked)); } catch { /* */ }
  }, [checked]);

  function toggle(idx: number) {
    setChecked(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  }

  return (
    <section
      className="border-2 border-line rounded-[16px] overflow-hidden shadow-[3px_5px_0_rgba(100,70,20,.10),6px_10px_20px_rgba(60,30,10,.09)] sm:rounded-[22px]"
      style={{ background: 'linear-gradient(160deg, #fffef8 0%, #f2fdf5 100%)' }}
    >
      {/* Washi tape strip */}
      <div
        className="h-5 w-full"
        aria-hidden="true"
        style={{ background: 'rgba(106,200,144,.35)', borderBottom: '1px solid rgba(42,122,80,.2)' }}
      />

      <div className="p-4 sm:p-6">
        <div className="flex items-baseline justify-between gap-2.5 mb-0.5">
          <h2 className="m-0 font-serif font-semibold italic text-xl text-ink sm:text-[22px]">Before you go</h2>
          <span className="font-mono text-[11px] text-muted whitespace-nowrap sm:text-[12.5px]" aria-live="polite">
            {done} / {total}
          </span>
        </div>
        <p className="text-muted mt-0.5 mb-3 text-[12px] leading-relaxed sm:text-[13px]">
          A short safety and logistics check — ticks are saved on this device.
        </p>

        {/* Progress bar */}
        <div className="h-[6px] rounded-full bg-ground overflow-hidden mb-4 border border-line">
          <div
            className="h-full bg-monsoon rounded-full transition-[width_.25s_ease]"
            style={{ width: total ? `${(done / total) * 100}%` : '0%' }}
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={total}
          />
        </div>

        <div className="flex flex-col gap-1">
          {beforeBookingItems.map((item, idx) => {
            const isDone = checked[idx];
            return (
              <label
                key={item.id}
                className={`flex gap-2.5 items-start px-3 py-2.5 rounded-[10px] text-[13px] cursor-pointer mb-1 transition-opacity border border-transparent hover:border-line hover:bg-paper ${isDone ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(idx)}
                  className="mt-0.5 w-[18px] h-[18px] sm:w-auto sm:h-auto"
                />
                <span className={isDone ? 'line-through' : ''}>{item.label}</span>
              </label>
            );
          })}
        </div>

        <div
          className="mt-5 p-3.5 rounded-[4px_12px_12px_4px] text-[12px] text-ink sm:text-[12.5px]"
          style={{ borderLeft: '3px solid var(--color-mustard)', background: 'var(--color-mustard-soft)' }}
        >
          <strong>September note:</strong> Build in rain buffers and keep an umbrella or light raincoat accessible rather than packed inside.
        </div>
      </div>
    </section>
  );
}
