import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { loadItinerary } from '../lib/itinerary-store';
import type { DayData } from '../data/itinerary';

// ── Types ────────────────────────────────────────────────────────────────────
interface BudgetLine {
  id: string;
  name: string;
  notes: string;
  amount: number;
  status: 'paid' | 'estimate';
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

// Parse ₹ amount from a tag string like "₹1,487" or "~₹3,500, estimate"
function parseAmount(tag: string): number {
  const match = tag.match(/₹\s*([0-9,]+(?:\.[0-9]+)?)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(/,/g, ''));
}

interface ItinLine {
  day: string;
  weekday: string;
  title: string;
  amount: number;
  status: 'paid' | 'estimate';
}

function extractItinLines(days: DayData[]): ItinLine[] {
  const lines: ItinLine[] = [];
  for (const day of days) {
    for (const ev of day.events) {
      if (ev.tagVariant === 'free') continue;
      const amount = parseAmount(ev.tag ?? '');
      if (amount <= 0) continue;
      lines.push({
        day: day.day,
        weekday: day.weekday,
        title: ev.title,
        amount,
        status: ev.tagVariant === 'pending' ? 'estimate' : 'paid',
      });
    }
  }
  return lines;
}

interface Props {
  tripId: string;
  onTotalsChange: (paid: number, estimated: number) => void;
}

export default function BudgetPage({ tripId, onTotalsChange }: Props) {
  const [groups, setGroups]     = useState<BudgetGroup[]>([]);
  const [itinLines, setItinLines] = useState<ItinLine[]>([]);
  const [itinOpen, setItinOpen] = useState(true);
  const [open, setOpen]         = useState<Set<string>>(new Set());
  const [loading, setLoading]   = useState(true);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingLine,  setEditingLine]  = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSave  = useRef(true);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    skipSave.current = true;
    Promise.all([
      supabase
        .from('trip_kv')
        .select('value')
        .eq('itinerary_id', tripId)
        .eq('key', SUPA_KEY)
        .maybeSingle(),
      loadItinerary(tripId),
    ]).then(([{ data }, days]) => {
      if (data?.value && Array.isArray(data.value)) {
        // Migrate existing lines: add default status if missing
        const migrated = (data.value as BudgetGroup[]).map(g => ({
          ...g,
          lines: g.lines.map(l => ({ ...l, status: (l.status ?? 'paid') as 'paid' | 'estimate' })),
        }));
        setGroups(migrated);
      }
      setItinLines(extractItinLines(days));
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

  // ── Totals ────────────────────────────────────────────────────────────────
  const itinPaid = itinLines.filter(l => l.status === 'paid').reduce((s, l) => s + l.amount, 0);
  const itinEst  = itinLines.filter(l => l.status === 'estimate').reduce((s, l) => s + l.amount, 0);
  const manualPaid = groups.reduce((s, g) => s + g.lines.filter(l => l.status === 'paid').reduce((ls, l) => ls + (isNaN(l.amount) ? 0 : l.amount), 0), 0);
  const manualEst  = groups.reduce((s, g) => s + g.lines.filter(l => l.status === 'estimate').reduce((ls, l) => ls + (isNaN(l.amount) ? 0 : l.amount), 0), 0);

  const totalPaid = itinPaid + manualPaid;
  const totalEst  = itinEst  + manualEst;
  const grandTotal = totalPaid + totalEst;

  const prevTotals = useRef({ paid: 0, est: 0 });
  useEffect(() => {
    if (totalPaid !== prevTotals.current.paid || totalEst !== prevTotals.current.est) {
      prevTotals.current = { paid: totalPaid, est: totalEst };
      onTotalsChange(totalPaid, totalEst);
    }
  }, [totalPaid, totalEst, onTotalsChange]);

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
    const line: BudgetLine = { id: uid(), name: 'New item', notes: '', amount: 0, status: 'paid' };
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

  const statusChip = (status: 'paid' | 'estimate') => ({
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    padding: '2px 6px',
    borderRadius: 2,
    cursor: 'pointer',
    border: status === 'paid' ? '1px solid var(--t-gold-40)' : '1px dashed var(--t-w12)',
    background: status === 'paid' ? 'var(--t-gold-08)' : 'transparent',
    color: status === 'paid' ? 'var(--t-gold)' : 'var(--t-muted)',
    flexShrink: 0 as const,
  });

  if (loading) {
    return (
      <section>
        <div className="gold-line mb-8" />
        <p style={{ ...monoLabel, padding: '40px 0' }}>Loading…</p>
      </section>
    );
  }

  // Group itin lines by day for display
  const itinByDay = itinLines.reduce<Record<string, ItinLine[]>>((acc, l) => {
    const key = `${l.weekday} ${l.day}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  }, {});

  return (
    <section>
      <div className="gold-line mb-8" />
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
        <div>
          <h2 className="m-0 mb-1 text-[22px]" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--t-fg)' }}>
            Cost tracker
          </h2>
          <p className="m-0 text-[13px]" style={{ color: 'var(--t-muted)' }}>
            Itinerary amounts sync automatically. Add manual items below.
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

      {/* ── Itinerary section ─────────────────────────────────────────────── */}
      {itinLines.length > 0 && (
        <div style={{ marginBottom: 2, border: '1px solid var(--t-w07)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: itinOpen ? 'var(--t-card)' : 'transparent' }}>
            <button
              type="button"
              onClick={() => setItinOpen(v => !v)}
              style={{
                flexShrink: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, lineHeight: 1,
                color: 'var(--t-gold)', background: 'none', border: 'none', cursor: 'pointer',
                transform: itinOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s',
              }}
            >+</button>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--t-fg)', display: 'block' }}>From itinerary</span>
              <span style={{ fontSize: 11, color: 'var(--t-muted)' }}>{itinLines.length} item{itinLines.length !== 1 ? 's' : ''} · auto-synced</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              {itinPaid > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-gold)' }}>✓ {fmt(itinPaid)}</span>}
              {itinEst > 0  && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-muted)' }}>~ {fmt(itinEst)}</span>}
            </div>
          </div>

          {itinOpen && (
            <div style={{ borderTop: '1px solid var(--t-gold-12)', background: 'var(--t-bg)' }}>
              {Object.entries(itinByDay).map(([dayLabel, lines]) => (
                <div key={dayLabel}>
                  <div style={{ padding: '6px 14px 2px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--t-gold)', textTransform: 'uppercase', letterSpacing: '0.1em', borderTop: '1px solid var(--t-w05)' }}>
                    {dayLabel}
                  </div>
                  {lines.map((line, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr auto auto',
                        gap: 8, alignItems: 'center',
                        padding: '8px 14px',
                        borderBottom: idx < lines.length - 1 ? '1px solid var(--t-w04)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--t-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.title}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: line.status === 'paid' ? 'var(--t-gold)' : 'var(--t-muted)', flexShrink: 0 }}>
                        {fmt(line.amount)}
                      </span>
                      <span style={{
                        ...statusChip(line.status),
                        cursor: 'default',
                        pointerEvents: 'none',
                      }}>
                        {line.status === 'paid' ? '✓ Paid' : '~ Est.'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {itinLines.length === 0 && groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--t-w10)', borderRadius: 4 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💸</div>
          <p style={{ fontSize: 14, color: 'var(--t-fg)', marginBottom: 6 }}>No costs yet</p>
          <p style={{ fontSize: 12, color: 'var(--t-muted)', lineHeight: 1.6 }}>
            Add amounts to itinerary events and they'll appear here automatically.<br />
            Or click <strong style={{ color: 'var(--t-gold)' }}>+ Category</strong> to add manual items.
          </p>
        </div>
      )}

      {/* ── Manual groups ─────────────────────────────────────────────────── */}
      <div className="flex flex-col" style={{ gap: 1 }}>
        {groups.map(group => {
          const isOpen    = open.has(group.id);
          const groupPaid = group.lines.filter(l => l.status === 'paid').reduce((s, l) => s + (isNaN(l.amount) ? 0 : l.amount), 0);
          const groupEst  = group.lines.filter(l => l.status === 'estimate').reduce((s, l) => s + (isNaN(l.amount) ? 0 : l.amount), 0);
          const isEditing = editingGroup === group.id;

          return (
            <div key={group.id} style={{ border: '1px solid var(--t-w07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: isOpen ? 'var(--t-card)' : 'transparent' }}>
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
                    style={{ flex: 1, background: 'var(--t-bg)', border: '1px solid var(--t-gold-30)', borderRadius: 2, padding: '3px 8px', color: 'var(--t-fg)', fontSize: 13, fontWeight: 600, outline: 'none' }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    onDoubleClick={() => setEditingGroup(group.id)}
                    style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    title="Double-click to rename"
                  >
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--t-fg)', display: 'block' }}>{group.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--t-muted)' }}>{group.lines.length} item{group.lines.length !== 1 ? 's' : ''}</span>
                  </button>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  {groupPaid > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-gold)' }}>✓ {fmt(groupPaid)}</span>}
                  {groupEst  > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-muted)' }}>~ {fmt(groupEst)}</span>}
                  {groupPaid === 0 && groupEst === 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-muted)' }}>₹0</span>}
                </div>

                <button type="button" onClick={() => deleteGroup(group.id)} title="Delete category"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-muted)', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#e07070')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-muted)')}
                >×</button>
              </div>

              {isOpen && (
                <div style={{ borderTop: '1px solid var(--t-gold-12)', background: 'var(--t-bg)' }}>
                  {group.lines.map((line, idx) => {
                    const isEditingThis = editingLine === line.id;
                    const isLast = idx === group.lines.length - 1;
                    return (
                      <div
                        key={line.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr auto auto auto',
                          gap: 8, alignItems: 'center',
                          padding: '10px 14px',
                          borderBottom: isLast ? 'none' : '1px solid var(--t-w05)',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          {isEditingThis ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <input
                                autoFocus type="text" value={line.name}
                                onChange={e => updateLine(group.id, line.id, { name: e.target.value })}
                                placeholder="Item name"
                                style={{ background: 'var(--t-bg)', border: '1px solid var(--t-gold-30)', borderRadius: 2, padding: '3px 8px', color: 'var(--t-fg)', fontSize: 13, fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                              />
                              <input
                                type="text" value={line.notes}
                                onChange={e => updateLine(group.id, line.id, { notes: e.target.value })}
                                placeholder="Notes (optional)"
                                onBlur={() => setEditingLine(null)}
                                onKeyDown={e => { if (e.key === 'Enter') setEditingLine(null); }}
                                style={{ background: 'var(--t-bg)', border: '1px solid var(--t-w10)', borderRadius: 2, padding: '3px 8px', color: 'var(--t-muted)', fontSize: 11, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                              />
                            </div>
                          ) : (
                            <button type="button" onDoubleClick={() => setEditingLine(line.id)}
                              style={{ background: 'none', border: 'none', cursor: 'text', textAlign: 'left', padding: 0, width: '100%' }}
                              title="Double-click to edit"
                            >
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-fg)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.name}</span>
                              {line.notes && <span style={{ fontSize: 11, color: 'var(--t-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.notes}</span>}
                            </button>
                          )}
                        </div>

                        {/* Status toggle */}
                        <button
                          type="button"
                          title={line.status === 'paid' ? 'Mark as estimated' : 'Mark as paid'}
                          onClick={() => updateLine(group.id, line.id, { status: line.status === 'paid' ? 'estimate' : 'paid' })}
                          style={statusChip(line.status)}
                        >
                          {line.status === 'paid' ? '✓ Paid' : '~ Est.'}
                        </button>

                        {/* Amount */}
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--t-w10)', background: 'var(--t-bg)', borderRadius: 2, overflow: 'hidden' }}>
                          <span style={{ paddingLeft: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t-muted)' }}>₹</span>
                          <input
                            type="number" inputMode="decimal" min={0}
                            value={line.amount || ''}
                            onChange={e => updateLine(group.id, line.id, { amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            aria-label={line.name}
                            style={{ width: 90, border: 0, outline: 0, padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t-fg)', background: 'transparent' }}
                          />
                        </div>

                        {/* Delete */}
                        <button type="button" onClick={() => deleteLine(group.id, line.id)} title="Remove item"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t-muted)', fontSize: 14, lineHeight: 1, padding: '0 2px' }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#e07070')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-muted)')}
                        >×</button>
                      </div>
                    );
                  })}

                  <button type="button" onClick={() => addLine(group.id)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--t-muted)', background: 'var(--t-w03)', border: 'none', borderTop: '1px solid var(--t-w05)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--t-gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--t-muted)')}
                  >+ Add item</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Summary ───────────────────────────────────────────────────────── */}
      {(itinLines.length > 0 || groups.length > 0) && (
        <div style={{ marginTop: 8, border: '1px solid var(--t-gold-20)', background: 'linear-gradient(135deg, var(--t-gold-08), rgba(201,168,76,.03))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--t-gold-12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...statusChip('paid'), cursor: 'default', pointerEvents: 'none' }}>✓ Paid</span>
              <span style={{ fontSize: 13, color: 'var(--t-fg)' }}>Confirmed / paid</span>
            </div>
            <b style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--t-gold)' }}>{fmt(totalPaid)}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--t-gold-12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...statusChip('estimate'), cursor: 'default', pointerEvents: 'none' }}>~ Est.</span>
              <span style={{ fontSize: 13, color: 'var(--t-fg)' }}>Estimated / approx</span>
            </div>
            <b style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--t-muted)' }}>{fmt(totalEst)}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 20px' }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--t-fg)' }}>Grand total</span>
            <b style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--t-gold)' }}>{fmt(grandTotal)}</b>
          </div>
        </div>
      )}

      <p style={{ marginTop: 16, fontSize: 12, color: 'var(--t-muted)', lineHeight: 1.6 }}>
        Itinerary amounts sync automatically from event costs. Double-click any manual item to rename it. Toggle <strong style={{ color: 'var(--t-gold)' }}>✓ Paid</strong> / <strong>~ Est.</strong> on manual items to classify them.
      </p>
    </section>
  );
}
