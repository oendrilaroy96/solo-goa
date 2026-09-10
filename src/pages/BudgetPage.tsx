import { useState, useEffect, useRef } from 'react';
import { budgetGroups, STORAGE_KEY } from '../data/budget';
import { supabase } from '../lib/supabase';

const SUPA_KEY = 'budget';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

function loadLocal(count: number): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(raw) && raw.length === count) return raw.map(Number);
  } catch { /* */ }
  return [];
}

const allItems = budgetGroups.flatMap(g => g.items);

interface Props {
  tripId: string;
  onTotalChange: (total: number) => void;
}

export default function BudgetPage({ tripId, onTotalChange }: Props) {
  const defaults = allItems.map(i => i.defaultValue);
  const saved    = loadLocal(defaults.length);
  const initial  = saved.length ? saved : defaults;

  const [values, setValues] = useState<number[]>(initial);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const prevTotal = useRef<number>(0);
  const skipSave  = useRef(true); // skip first save while loading remote

  // Load from Supabase on mount; override local if found
  useEffect(() => {
    supabase.from('trip_kv').select('value').eq('itinerary_id', tripId).eq('key', SUPA_KEY).maybeSingle().then(({ data }) => {
      if (data?.value && Array.isArray(data.value) && data.value.length === defaults.length) {
        const remote = (data.value as unknown[]).map(Number);
        setValues(remote);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remote)); } catch { /* */ }
      }
      skipSave.current = false;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const total = values.reduce((s, v) => s + (isNaN(v) ? 0 : v), 0);

  useEffect(() => {
    if (total !== prevTotal.current) {
      prevTotal.current = total;
      onTotalChange(total);
    }
    if (skipSave.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch { /* */ }
    supabase.from('trip_kv').upsert({ itinerary_id: tripId, key: SUPA_KEY, value: values }).then(() => { /* fire-and-forget */ });
  }, [total, values, onTotalChange]);

  function setValue(globalIdx: number, val: number) {
    setValues(prev => { const next = [...prev]; next[globalIdx] = val; return next; });
  }

  function toggleGroup(id: string) {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  }

  let globalIdx = 0;

  return (
    <section>
      <div className="gold-line mb-8" />
      <h2
        className="m-0 mb-1 text-[22px]"
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--t-fg)' }}
      >
        Cost tracker
      </h2>
      <p className="mt-1 mb-8 text-[13px]" style={{ color: 'var(--t-muted)' }}>
        Tap a category to expand it. Edit any amount and every total updates live.
      </p>

      <div className="flex flex-col" style={{ gap: 1 }}>
        {budgetGroups.map(group => {
          const groupStart = globalIdx;
          const groupValues = group.items.map((_, i) => values[groupStart + i] ?? 0);
          const groupSum = groupValues.reduce((s, v) => s + (isNaN(v) ? 0 : v), 0);
          globalIdx += group.items.length;
          const isOpen = !!openGroups[group.id];

          return (
            <div
              key={group.id}
              style={{ border: '1px solid var(--t-w07)' }}
            >
              {/* Accordion header */}
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer text-left transition-colors"
                style={{ background: isOpen ? 'var(--t-card)' : 'transparent' }}
              >
                <span
                  className="flex-none font-mono text-[14px] font-bold leading-none select-none transition-transform"
                  style={{
                    color: 'var(--t-gold)',
                    transform: isOpen ? 'rotate(45deg)' : 'none',
                    display: 'inline-block',
                  }}
                  aria-hidden="true"
                >
                  +
                </span>
                <span className="flex-1 min-w-0 text-left">
                  <span className="font-semibold text-[13px] block" style={{ color: 'var(--t-fg)' }}>{group.name}</span>
                  <span className="font-normal text-[11px] mt-0.5 block" style={{ color: 'var(--t-muted)' }}>{group.subtitle}</span>
                </span>
                <b
                  className="font-mono font-semibold tabular-nums text-[13px]"
                  style={{ color: 'var(--t-gold)' }}
                >
                  {fmt(groupSum)}
                </b>
              </button>

              {isOpen && (
                <div
                  style={{
                    borderTop: '1px solid rgba(201,168,76,.15)',
                    background: 'var(--t-bg)',
                  }}
                >
                  {group.items.map((item, itemIdx) => {
                    const idx = groupStart + itemIdx;
                    const isLast = itemIdx === group.items.length - 1;
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-[1fr_112px] sm:gap-3 sm:items-center"
                        style={{ borderBottom: isLast ? 'none' : '1px solid var(--t-w05)' }}
                      >
                        <label
                          className="text-[12.5px] font-semibold sm:text-[13px]"
                          style={{ color: 'var(--t-fg)' }}
                          htmlFor={`budget-${item.id}`}
                        >
                          {item.label}
                          <small
                            className="block font-normal mt-0.5 text-[11px]"
                            style={{ color: 'var(--t-muted)' }}
                          >
                            {item.sublabel}
                          </small>
                        </label>
                        <div
                          className="flex items-center overflow-hidden"
                          style={{
                            background: 'var(--t-bg)',
                            border: '1px solid var(--t-w10)',
                          }}
                        >
                          <span className="pl-3 font-mono text-[13px]" style={{ color: 'var(--t-muted)' }}>₹</span>
                          <input
                            id={`budget-${item.id}`}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            value={values[idx] ?? 0}
                            onChange={e => setValue(idx, parseFloat(e.target.value) || 0)}
                            aria-label={item.label}
                            className="w-full border-0 outline-0 px-2 py-2.5 text-right font-mono text-[14px] tabular-nums bg-transparent"
                            style={{ color: 'var(--t-fg)' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div
        className="flex items-baseline justify-between mt-6 px-5 py-4"
        style={{
          background: 'linear-gradient(135deg, var(--t-gold-08), rgba(201,168,76,.03))',
          border: '1px solid var(--t-gold-20)',
        }}
      >
        <span className="font-semibold text-[13px]" style={{ color: 'var(--t-fg)' }}>Planned total</span>
        <b className="font-mono text-[24px] tabular-nums sm:text-[28px]" style={{ color: 'var(--t-gold)' }}>{fmt(total)}</b>
      </div>

      <p className="mt-4 text-[12px] sm:text-[12.5px]" style={{ color: 'var(--t-muted)' }}>
        Most food costs are still unconfirmed placeholders (₹0). Lodging confirmed through 18 September. The Goa airport transfer was priced for the wrong airport (Mopa, not Dabolim) — needs a fresh quote.
      </p>
    </section>
  );
}
