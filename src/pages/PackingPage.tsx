import { useState, useEffect, useRef } from 'react';
import { packingSections } from '../data/checklists';
import { supabase } from '../lib/supabase';

const LOCAL_KEY  = 'goaPacking';
const SUPA_KEY   = 'packing';
const allItems   = packingSections.flatMap(s => s.items);

function loadLocal(): boolean[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
    if (Array.isArray(raw) && raw.length === allItems.length) return raw;
  } catch { /* */ }
  return allItems.map(() => false);
}

export default function PackingPage() {
  const [checked, setChecked] = useState<boolean[]>(loadLocal);
  const skipSave = useRef(true);

  const done  = checked.filter(Boolean).length;
  const total = allItems.length;

  // Load from Supabase on mount
  useEffect(() => {
    supabase.from('kv').select('value').eq('key', SUPA_KEY).maybeSingle().then(({ data }) => {
      if (data?.value && Array.isArray(data.value) && data.value.length === allItems.length) {
        const remote = data.value as boolean[];
        setChecked(remote);
        try { localStorage.setItem(LOCAL_KEY, JSON.stringify(remote)); } catch { /* */ }
      }
      skipSave.current = false;
    });
  }, []);

  useEffect(() => {
    if (skipSave.current) return;
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(checked)); } catch { /* */ }
    supabase.from('kv').upsert({ key: SUPA_KEY, value: checked }).then(() => { /* fire-and-forget */ });
  }, [checked]);

  function toggle(globalIdx: number) {
    setChecked(prev => {
      const next = [...prev];
      next[globalIdx] = !next[globalIdx];
      return next;
    });
  }

  let globalIdx = 0;

  return (
    <section>
      <div className="gold-line mb-8" />
      <div className="flex items-baseline justify-between gap-2.5 mb-1">
        <h2
          className="m-0 text-[22px]"
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#f5f0e8' }}
        >
          Packing checklist
        </h2>
        <span
          className="font-mono text-[11px] whitespace-nowrap"
          style={{ color: '#8a8070' }}
          aria-live="polite"
        >
          {done} / {total}
        </span>
      </div>
      <p className="mt-1 mb-6 text-[13px] leading-relaxed" style={{ color: '#8a8070' }}>
        Built around this trip — the pottery workshop, the churches, the solo travel. Ticks sync across your devices.
      </p>

      {/* Progress bar */}
      <div
        className="mb-8 overflow-hidden"
        style={{ height: 1, background: 'rgba(255,255,255,.08)' }}
      >
        <div
          style={{
            height: '100%',
            background: '#c9a84c',
            width: total ? `${(done / total) * 100}%` : '0%',
            transition: 'width .25s ease',
          }}
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>

      <div>
        {packingSections.map(section => {
          const sectionStart = globalIdx;
          const sectionItems = section.items;
          globalIdx += sectionItems.length;

          return (
            <div key={section.title} className="mb-2">
              {section.title && (
                <h3
                  className="font-mono font-semibold uppercase tracking-[.1em] text-[10px] mt-8 mb-3 first:mt-0"
                  style={{ color: '#c9a84c' }}
                >
                  {section.title}
                </h3>
              )}
              {sectionItems.map((item, i) => {
                const idx = sectionStart + i;
                const isDone = checked[idx];
                return (
                  <label
                    key={item.id}
                    className="flex gap-3 items-start px-0 py-2.5 text-[13px] cursor-pointer transition-opacity"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,.05)',
                      opacity: isDone ? 0.4 : 1,
                      color: '#f5f0e8',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggle(idx)}
                      className="mt-0.5 w-[16px] h-[16px] flex-none"
                    />
                    <span className={isDone ? 'line-through' : ''}>{item.label}</span>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>

      <div
        className="mt-8 p-4 text-[12.5px]"
        style={{
          borderLeft: '2px solid rgba(201,168,76,.3)',
          background: 'rgba(201,168,76,.04)',
          color: '#f5f0e8',
        }}
      >
        <strong style={{ color: '#c9a84c' }}>Weather note:</strong> Forecast shows rain most days — pack to keep electronics and documents dry rather than relying on the sun.
      </div>
    </section>
  );
}
