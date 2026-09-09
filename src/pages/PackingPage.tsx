import { useState, useEffect, useRef } from 'react';
import { packingSections } from '../data/checklists';
import { supabase } from '../lib/supabase';

const LOCAL_KEY  = 'goaPacking';
const SUPA_KEY   = 'packing';
const allItems   = packingSections.flatMap(s => s.items);

const TRIP_DAYS = [
  { day: '12', weekday: 'Sat', label: '12 Sep — Balurghat → train' },
  { day: '13', weekday: 'Sun', label: '13 Sep — Kolkata' },
  { day: '14', weekday: 'Mon', label: '14 Sep — Fly to Goa' },
  { day: '15', weekday: 'Tue', label: '15 Sep — Taj → Panjim' },
  { day: '16', weekday: 'Wed', label: '16 Sep — Panjim' },
  { day: '17', weekday: 'Thu', label: '17 Sep — Panjim' },
  { day: '18', weekday: 'Fri', label: '18 Sep — Fly home' },
];

function loadLocal(): boolean[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
    if (Array.isArray(raw) && raw.length === allItems.length) return raw;
  } catch { /* */ }
  return allItems.map(() => false);
}

// ── Outfits tab ─────────────────────────────────────────────────────────────

function OutfitsTab() {
  // outfits: { [day]: filename in storage }
  const [outfits, setOutfits] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null); // day being uploaded
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    supabase.from('kv').select('value').eq('key', 'outfits').maybeSingle().then(({ data }) => {
      if (data?.value && typeof data.value === 'object') {
        setOutfits(data.value as Record<string, string>);
      }
    });
  }, []);

  async function handleUpload(day: string) {
    const file = fileRefs.current[day]?.files?.[0];
    if (!file) return;
    setUploading(day);

    const ext      = file.name.split('.').pop() ?? 'jpg';
    const filename = `outfits/day-${day}-${Date.now()}.${ext}`;

    // Remove old image if exists
    if (outfits[day]) {
      await supabase.storage.from('docs').remove([outfits[day]]);
    }

    const { error } = await supabase.storage.from('docs').upload(filename, file, { upsert: false });
    if (error) { setUploading(null); return; }

    const next = { ...outfits, [day]: filename };
    setOutfits(next);
    await supabase.from('kv').upsert({ key: 'outfits', value: next });
    setUploading(null);

    // Reset file input
    if (fileRefs.current[day]) fileRefs.current[day]!.value = '';
  }

  async function handleRemove(day: string) {
    if (!outfits[day]) return;
    await supabase.storage.from('docs').remove([outfits[day]]);
    const next = { ...outfits };
    delete next[day];
    setOutfits(next);
    await supabase.from('kv').upsert({ key: 'outfits', value: next });
  }

  function getPublicUrl(filename: string): string {
    const { data } = supabase.storage.from('docs').getPublicUrl(filename);
    return data.publicUrl;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p className="mt-0 mb-2 text-[13px] leading-relaxed" style={{ color: 'var(--t-muted)' }}>
        Upload one outfit photo per day — syncs across your devices.
      </p>
      {TRIP_DAYS.map(({ day, label }) => {
        const filename = outfits[day];
        const isUploading = uploading === day;

        return (
          <div
            key={day}
            className="luxury-card"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            {filename ? (
              /* Has image */
              <div style={{ position: 'relative' }}>
                <img
                  src={getPublicUrl(filename)}
                  alt={`Outfit for ${label}`}
                  style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  padding: '10px 14px',
                  background: 'linear-gradient(to bottom, rgba(0,0,0,.7), transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-gold)', fontWeight: 600 }}>
                    {label}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <label style={{ cursor: 'pointer' }}>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={el => { fileRefs.current[day] = el; }}
                        onChange={() => handleUpload(day)}
                      />
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                        color: 'var(--t-gold)', background: 'rgba(201,168,76,.15)',
                        border: '1px solid var(--t-gold-30)',
                        borderRadius: 3, padding: '4px 10px', cursor: 'pointer',
                      }}>
                        Change
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemove(day)}
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                        color: 'var(--t-muted)', background: 'rgba(0,0,0,.4)',
                        border: '1px solid var(--t-w15)',
                        borderRadius: 3, padding: '4px 10px', cursor: 'pointer',
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty slot */
              <label style={{ cursor: 'pointer', display: 'block' }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={el => { fileRefs.current[day] = el; }}
                  onChange={() => handleUpload(day)}
                />
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  opacity: isUploading ? 0.5 : 1,
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-muted)', fontWeight: 600 }}>
                    {label}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                    color: 'var(--t-gold)', background: 'var(--t-gold-08)',
                    border: '1px solid var(--t-gold-25)',
                    borderRadius: 3, padding: '4px 12px',
                  }}>
                    {isUploading ? 'Uploading…' : '+ Photo'}
                  </span>
                </div>
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const TAB_STYLE = (active: boolean) => ({
  padding: '8px 18px 10px',
  background: 'transparent',
  border: 0,
  borderBottom: active ? '2px solid var(--t-gold)' : '2px solid transparent',
  marginBottom: -1,
  color: active ? 'var(--t-gold)' : 'var(--t-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  cursor: 'pointer',
  transition: 'all 0.15s',
});

export default function PackingPage() {
  const [tab, setTab]       = useState<'checklist' | 'outfits'>('checklist');
  const [checked, setChecked] = useState<boolean[]>(loadLocal);
  const skipSave = useRef(true);

  const done  = checked.filter(Boolean).length;
  const total = allItems.length;

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
      <h2
        className="m-0 mb-1 text-[22px]"
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--t-fg)' }}
      >
        Packing
      </h2>

      {/* Tabs */}
      <div
        style={{ display: 'flex', borderBottom: '1px solid var(--t-w07)', marginBottom: 32, marginTop: 16 }}
        role="tablist"
      >
        <button type="button" role="tab" aria-selected={tab === 'checklist'} onClick={() => setTab('checklist')} style={TAB_STYLE(tab === 'checklist')}>
          Checklist
        </button>
        <button type="button" role="tab" aria-selected={tab === 'outfits'} onClick={() => setTab('outfits')} style={TAB_STYLE(tab === 'outfits')}>
          Outfits
        </button>
      </div>

      {tab === 'outfits' ? (
        <OutfitsTab />
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2.5 mb-1">
            <span
              className="font-mono text-[11px] whitespace-nowrap"
              style={{ color: 'var(--t-muted)' }}
              aria-live="polite"
            >
              {done} / {total} packed
            </span>
          </div>
          <p className="mt-1 mb-6 text-[13px] leading-relaxed" style={{ color: 'var(--t-muted)' }}>
            Built around this trip — the pottery workshop, the churches, the solo travel. Ticks sync across your devices.
          </p>

          {/* Progress bar */}
          <div className="mb-8 overflow-hidden" style={{ height: 1, background: 'var(--t-w08)' }}>
            <div
              style={{
                height: '100%',
                background: 'var(--t-gold)',
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
                      style={{ color: 'var(--t-gold)' }}
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
                          borderBottom: '1px solid var(--t-w05)',
                          opacity: isDone ? 0.4 : 1,
                          color: 'var(--t-fg)',
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
              borderLeft: '2px solid var(--t-gold-30)',
              background: 'var(--t-gold-04)',
              color: 'var(--t-fg)',
            }}
          >
            <strong style={{ color: 'var(--t-gold)' }}>Weather note:</strong> Forecast shows rain most days — pack to keep electronics and documents dry rather than relying on the sun.
          </div>
        </>
      )}
    </section>
  );
}
