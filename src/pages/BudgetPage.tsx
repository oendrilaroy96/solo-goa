import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────
interface BudgetLine {
  id: string;
  name: string;
  notes: string;
  amount: number;
}
interface BudgetGroup {
  id: string;
  name: string;
  lines: BudgetLine[];
}

const SUPA_KEY = 'budget_v2';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

interface Props {
  tripId: string;
  onTotalChange: (total: number) => void;
}

export default function BudgetPage({ tripId, onTotalChange }: Props) {
  const [groups, setGroups]     = useState<BudgetGroup[]>([]);
  const [open, setOpen]         = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingLine,  setEditingLine]  = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSave  = useRef(true);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    skipSave.current = true;
    supabase
      .from('trip_kv')
      .select('value')
      .eq('itinerary_id', tripId)
      .eq('key', SUPA_KEY)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && Array.isArray(data.value)) {
          setGroups(data.value as BudgetGroup[]);
        }
        skipSave.current = false;
        setLoading(false);
      });
  }, [tripId]);

  // ── Auto-save (debounced 800 ms) ──────────────────────────────────────────
  const save = useCallback((g: BudgetGroup[]) => {
    if (skipSave.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase
        .from('trip_kv')
        .upsert({ itinerary_id: tripId, key: SUPA_KEY, value: g })
        .then(() => { /* fire-and-forget */ });
    }, 800);
  }, [tripId]);

  function update(next: BudgetGroup[]) {
    setGroups(next);
    save(next);
  }

  // ── Total ─────────────────────────────────────────────────────────────────
  const total = groups.reduce((s, g) => s + g.lines.reduce((ls, l) => ls + (isNaN(l.amount) ? 0 : l.amount), 0), 0);
  const prevTotal = useRef(0);
  useEffect(() => {
    if (total !== prevTotal.current) { prevTotal.current = total; onTotalChange(total); }
  }, [total, onTotalChange]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  function addGroup() {
    const g: BudgetGroup = { id: uid(), name: 'New category', lines: [] };
    const next = [...groups, g];
    update(next);
    setOpen(prev => new Set(prev).add(g.id));
    setEditingGroup(g.id);
  }

  function deleteGroup(gid: string) {
    update(groups.filter(g => g.id !== gid));
  }

  function renameGroup(gid: string, name: string) {
    update(groups.map(g => g.id === gid ? { ...g, name } : g));
  }

  function addLine(gid: string) {
    const line: BudgetLine = { id: uid(), name: 'New item', notes: '', amount: 0 };
    update(groups.map(g => g.id === gid ? { ...g, lines: [...g.lines, line] } : g));
    setEditingLine(line.id);
  }

  function deleteLine(gid: string, lid: string) {
    update(groups.map(g => g.id === gid ? { ...g, lines: g.lines.filter(l => l.id !== lid) } : g));
  }

  function updateLine(gid: string, lid: string, patch: Partial<BudgetLine>) {
    update(groups.map(g =>
      g.id === gid
        ? { ...g, lines: g.lines.map(l => l.id === lid ? { ...l, ...patch } : l) }
        : g
    ));
  }

  function toggleGroup(gid: string) {
    setOpen(prev => {
      const s = new Set(prev);
      s.has(gid) ? s.delete(gid) : s.add(gid);
      return s;
    });
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const monoLabel: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)',
    textTransform: 'uppercase', letterSpacing: '0.1em',
  };

  if (loading) {
    return (
      <section>
        <div className="gold-line mb-8" />
        <p style={{ ...monoLabel, padding: '40px 0' }}>Loading…</p>
      </section>
    );
  }

  return (
    <section>
      <div className="gold-line mb-8" />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
        <div>
          <h2 className="m-0 mb-1 text-[22px]" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--t-fg)' }}>
            Cost tracker
          </h2>
          <p className="m-0 text-[13px]" style={{ color: 'var(--t-muted)' }}>
            Add categories and line items. Amounts update the total live.
          </p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--t-gold)', background: 'var(--t-gold-08)', border: '1px solid var(--t-gold-25)',
            borderRadius: 3, padding: '7px 14px', cursor: 'pointer', flexShrink: 0,
          }}
        >
          + Category
        </button>
      </div>

      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--t-w10)', borderRadius: 4 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💸</div>
          <p style={{ fontSize: 14, color: 'var(--t-fg)', marginBottom: 6 }}>No budget yet</p>
          <p style={{ fontSize: 12, color: 'var(--t-muted)', lineHeight: 1.6 }}>
            Click <strong style={{ color: 'var(--t-gold)' }}>+ Category</strong> to add your first budget category.
          </p>
        </div>
      )}

      <div className="flex flex-col" style={{ gap: 1 }}>
        {groups.map(group => {
          const isOpen    = open.has(group.id);
          const groupSum  = group.lines.reduce((s, l) => s + (isNaN(l.amount) ? 0 : l.amount), 0);
          const isEditing = editingGroup === group.id;

          return (
            <div key={group.id} style={{ border: '1px solid var(--t-w07)' }}>
              {/* Group header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px',
                  background: isOpen ? 'var(--t-card)' : 'transparent',
                }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    flexShrink: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, lineHeight: 1,
                    color: 'var(--t-gold)', background: 'none', border: 'none', cursor: 'pointer',
                    transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s',
                  }}
                >+</button>

                {isEditing ? (
                  <input
                    autoFocus
                    type="text"
                    value={group.name}
                    onChange={e => renameGroup(group.id, e.target.value)}
                    onBlur={() => setEditingGroup(null)}
                    onKeyDown={e => { if (e.key === 'Enter') setEditingGroup(null); }}
                    style={{
                      flex: 1, background: 'var(--t-bg)', border: '1px solid var(--t-gold-30)', borderRadius: 2,
                      padding: '3px 8px', color: 'var(--t-fg)', fontSize: 13, fontWeight: 600, outline: 'none',
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => { toggleGroup(group.id); }}
                    onDoubleClick={() => setEditingGroup(group.id)}
                    style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    title="Double-click to rename"
                  >
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--t-fg)', display: 'block' }}>{group.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--t-muted)' }}>{group.lines.length} item{group.lines.length !== 1 ? 's' : ''}</span>
                  </button>
                )}

                <b style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t-gold)', flexShrink: 0 }}>{fmt(groupSum)}</b>

                <button
                  type="button"
                  onClick={() => deleteGroup(group.id)}
                  title="Delete category"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-muted)', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e07070')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-muted)')}
                >×</button>
              </div>

              {/* Lines */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--t-gold-12)', background: 'var(--t-bg)' }}>
                  {group.lines.map((line, idx) => {
                    const isEditingThis = editingLine === line.id;
                    const isLast = idx === group.lines.length - 1;
                    return (
                      <div
                        key={line.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr auto auto',
                          gap: 8, alignItems: 'center',
                          padding: '10px 14px',
                          borderBottom: isLast ? 'none' : '1px solid var(--t-w05)',
                        }}
                      >
                        {/* Name + notes */}
                        <div style={{ minWidth: 0 }}>
                          {isEditingThis ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <input
                                autoFocus
                                type="text"
                                value={line.name}
                                onChange={e => updateLine(group.id, line.id, { name: e.target.value })}
                                placeholder="Item name"
                                style={{ background: 'var(--t-bg)', border: '1px solid var(--t-gold-30)', borderRadius: 2, padding: '3px 8px', color: 'var(--t-fg)', fontSize: 13, fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                              />
                              <input
                                type="text"
                                value={line.notes}
                                onChange={e => updateLine(group.id, line.id, { notes: e.target.value })}
                                placeholder="Notes (optional)"
                                onBlur={() => setEditingLine(null)}
                                onKeyDown={e => { if (e.key === 'Enter') setEditingLine(null); }}
                                style={{ background: 'var(--t-bg)', border: '1px solid var(--t-w10)', borderRadius: 2, padding: '3px 8px', color: 'var(--t-muted)', fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                              />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onDoubleClick={() => setEditingLine(line.id)}
                              style={{ background: 'none', border: 'none', cursor: 'text', textAlign: 'left', padding: 0, width: '100%' }}
                              title="Double-click to edit"
                            >
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-fg)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.name}</span>
                              {line.notes && <span style={{ fontSize: 11, color: 'var(--t-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.notes}</span>}
                            </button>
                          )}
                        </div>

                        {/* Amount input */}
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--t-w10)', background: 'var(--t-bg)', borderRadius: 2, overflow: 'hidden' }}>
                          <span style={{ paddingLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t-muted)' }}>₹</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            value={line.amount || ''}
                            onChange={e => updateLine(group.id, line.id, { amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            aria-label={line.name}
                            style={{
                              width: 90, border: 0, outline: 0, padding: '6px 8px', textAlign: 'right',
                              fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t-fg)', background: 'transparent',
                            }}
                          />
                        </div>

                        {/* Delete line */}
                        <button
                          type="button"
                          onClick={() => deleteLine(group.id, line.id)}
                          title="Remove item"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-muted)', fontSize: 14, lineHeight: 1, padding: '0 2px' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#e07070')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-muted)')}
                        >×</button>
                      </div>
                    );
                  })}

                  {/* Add item button */}
                  <button
                    type="button"
                    onClick={() => addLine(group.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 14px',
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      color: 'var(--t-muted)', background: 'var(--t-w03)',
                      border: 'none', borderTop: '1px solid var(--t-w05)', cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--t-gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-muted)')}
                  >
                    + Add item
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      {groups.length > 0 && (
        <div
          style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginTop: 8, padding: '16px 20px',
            background: 'linear-gradient(135deg, var(--t-gold-08), rgba(201,168,76,.03))',
            border: '1px solid var(--t-gold-20)',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--t-fg)' }}>Planned total</span>
          <b style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--t-gold)' }}>{fmt(total)}</b>
        </div>
      )}

      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--t-muted)', lineHeight: 1.6 }}>
        Double-click any category or item name to rename it. Changes save automatically.
      </p>
    </section>
  );
}
