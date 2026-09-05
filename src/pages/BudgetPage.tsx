import { useState, useEffect, useRef } from 'react';
import { budgetGroups, STORAGE_KEY } from '../data/budget';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

function loadSaved(count: number): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(raw) && raw.length === count) return raw.map(Number);
  } catch { /* */ }
  return [];
}

const allItems = budgetGroups.flatMap(g => g.items);

interface Props {
  onTotalChange: (total: number) => void;
}

export default function BudgetPage({ onTotalChange }: Props) {
  const defaults = allItems.map(i => i.defaultValue);
  const saved    = loadSaved(defaults.length);
  const initial  = saved.length ? saved : defaults;

  const [values, setValues] = useState<number[]>(initial);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const prevTotal = useRef<number>(0);

  const total = values.reduce((s, v) => s + (isNaN(v) ? 0 : v), 0);

  useEffect(() => {
    if (total !== prevTotal.current) {
      prevTotal.current = total;
      onTotalChange(total);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch { /* */ }
    }
  }, [total, values, onTotalChange]);

  function setValue(globalIdx: number, val: number) {
    setValues(prev => { const next = [...prev]; next[globalIdx] = val; return next; });
  }

  function toggleGroup(id: string) {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  }

  let globalIdx = 0;

  return (
    <section
      className="border-2 border-line rounded-[16px] overflow-hidden shadow-[3px_5px_0_rgba(100,70,20,.10),6px_10px_20px_rgba(60,30,10,.09)] sm:rounded-[22px]"
      style={{ background: 'linear-gradient(160deg, #fffef8 0%, #fdf8f0 100%)' }}
    >
      {/* Washi tape strip */}
      <div
        className="h-5 w-full"
        aria-hidden="true"
        style={{ background: 'rgba(255,240,160,.55)', borderBottom: '1px solid rgba(200,180,60,.2)' }}
      />

      <div className="p-4 sm:p-6">
        <h2 className="m-0 mb-0.5 font-serif font-semibold italic text-xl text-ink sm:text-[22px]">Cost tracker</h2>
        <p className="text-muted mt-0.5 mb-4 text-[12px] sm:text-[13px]">Tap a category to expand it. Edit any amount and every total updates live.</p>

        <div className="flex flex-col gap-2">
          {budgetGroups.map(group => {
            const groupStart = globalIdx;
            const groupValues = group.items.map((_, i) => values[groupStart + i] ?? 0);
            const groupSum = groupValues.reduce((s, v) => s + (isNaN(v) ? 0 : v), 0);
            globalIdx += group.items.length;
            const isOpen = !!openGroups[group.id];

            return (
              <div
                key={group.id}
                className="border-2 border-line rounded-[14px] overflow-hidden"
                style={{ background: 'var(--color-paper)' }}
              >
                {/* Accordion header — button for accessibility */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-3 cursor-pointer text-left sm:px-4 sm:py-3.5"
                >
                  <span
                    className="flex-none w-5 h-5 rounded-full text-sm font-bold leading-5 text-center select-none transition-transform"
                    style={{ background: 'var(--color-azulejo-soft)', color: 'var(--color-azulejo)', transform: isOpen ? 'rotate(45deg)' : 'none' }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                  <span className="flex-1 min-w-0 text-left">
                    <span className="font-semibold text-[13px] text-ink block sm:text-[13.5px]">{group.name}</span>
                    <span className="font-normal text-muted text-[11px] mt-px block sm:text-[11.5px]">{group.subtitle}</span>
                  </span>
                  <b className="font-mono font-semibold text-laterite tabular-nums text-[13px] sm:text-sm">{fmt(groupSum)}</b>
                </button>

                {isOpen && (
                  <div className="px-3.5 border-t-2 border-line sm:px-4" style={{ background: 'var(--color-ground)' }}>
                    {group.items.map((item, itemIdx) => {
                      const idx = groupStart + itemIdx;
                      const isLast = itemIdx === group.items.length - 1;
                      return (
                        <div
                          key={item.id}
                          className={`flex flex-col gap-2 py-3 ${isLast ? '' : 'border-b border-line'} sm:grid sm:grid-cols-[1fr_112px] sm:gap-3 sm:items-center sm:py-3`}
                        >
                          <label className="text-[12.5px] font-semibold text-ink sm:text-[13.5px]" htmlFor={`budget-${item.id}`}>
                            {item.label}
                            <small className="block font-normal text-muted mt-0.5 text-[11px] sm:text-xs">{item.sublabel}</small>
                          </label>
                          <div className="flex items-center border-2 border-line rounded-[9px] overflow-hidden" style={{ background: 'var(--color-paper)' }}>
                            <span className="text-muted pl-2.5 font-mono text-[13px]">₹</span>
                            <input
                              id={`budget-${item.id}`}
                              type="number"
                              inputMode="decimal"
                              min={0}
                              value={values[idx] ?? 0}
                              onChange={e => setValue(idx, parseFloat(e.target.value) || 0)}
                              aria-label={item.label}
                              className="w-full border-0 outline-0 px-2 py-2.5 text-right font-mono text-[14px] tabular-nums bg-transparent text-ink sm:text-[13.5px]"
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
          className="flex items-baseline justify-between mt-4 px-4 py-3.5 rounded-[14px] sm:px-[18px] sm:py-4"
          style={{ background: 'linear-gradient(135deg, #fde8e2, #fef3f0)', border: '2px dashed var(--color-laterite)' }}
        >
          <span className="font-semibold text-[13px] sm:text-[13.5px]" style={{ color: '#3a1806' }}>Planned total</span>
          <b className="font-mono text-[22px] tabular-nums sm:text-[26px]" style={{ color: '#3a1806' }}>{fmt(total)}</b>
        </div>

        <p className="mt-3 text-muted text-[11.5px] sm:text-xs">
          Most food costs are still unconfirmed placeholders (₹0). Lodging confirmed through 18 September. The Goa airport transfer was priced for the wrong airport (Mopa, not Dabolim) — needs a fresh quote.
        </p>
      </div>
    </section>
  );
}
