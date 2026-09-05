import { useState, useCallback } from 'react';
import { budgetGroups, STORAGE_KEY } from './data/budget';
import ItineraryPage from './pages/ItineraryPage';
import BudgetPage from './pages/BudgetPage';
import StaysPage from './pages/StaysPage';
import FoodPage from './pages/FoodPage';
import ShoppingPage from './pages/ShoppingPage';
import PackingPage from './pages/PackingPage';
import ChecklistPage from './pages/ChecklistPage';

type PageId = 'itinerary' | 'stays' | 'budget' | 'food-reference' | 'shopping-reference' | 'packing' | 'checklist';

const PAGES: { id: PageId; label: string; icon: string }[] = [
  { id: 'itinerary',          label: 'Itinerary',    icon: '🗓' },
  { id: 'stays',              label: 'Stays',        icon: '🏡' },
  { id: 'budget',             label: 'Budget',       icon: '💸' },
  { id: 'food-reference',     label: 'Food & drink', icon: '🦞' },
  { id: 'shopping-reference', label: 'Shopping',     icon: '🛍' },
  { id: 'packing',            label: 'Packing',      icon: '🎒' },
  { id: 'checklist',          label: 'Checklist',    icon: '✅' },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

function getStoredPage(): PageId {
  try { return (localStorage.getItem('goaSelectedPage') as PageId) || 'itinerary'; } catch { return 'itinerary'; }
}

function initTotal(): number {
  const allItems = budgetGroups.flatMap(g => g.items);
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(raw) && raw.length === allItems.length)
      return raw.reduce((s: number, v: unknown) => s + (Number(v) || 0), 0);
  } catch { /* */ }
  return allItems.reduce((s, i) => s + i.defaultValue, 0);
}

export default function App() {
  const [page, setPage] = useState<PageId>(getStoredPage);
  const [total, setTotal] = useState<number>(initTotal);
  const handleTotalChange = useCallback((t: number) => setTotal(t), []);

  function selectPage(id: PageId) {
    setPage(id);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    try { localStorage.setItem('goaSelectedPage', id); } catch { /* */ }
  }

  return (
    <div className="w-[calc(100%-20px)] mx-auto pt-4 pb-16 sm:w-[min(1140px,calc(100%-48px))] sm:pt-10 sm:pb-24">

      {/* Skip link — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="absolute left-3 -top-20 z-[100] bg-azulejo text-white px-4 py-2.5 rounded-b-[10px] text-[13px] font-semibold no-underline focus-visible:top-0"
      >
        Skip to main content
      </a>

      {/* ── POSTCARD HERO ─────────────────────────────────────────────── */}
      <header
        className="relative bg-paper border-[3px] border-line rounded-[16px] mb-5 overflow-hidden
                   shadow-[4px_6px_0_rgba(100,70,20,.12),8px_14px_28px_rgba(60,30,10,.12)]
                   sm:rounded-[24px] sm:mb-6"
        style={{ background: 'linear-gradient(160deg, #fff9f0 0%, #fffcf5 60%, #f7f0e8 100%)' }}
      >
        {/* Washi tape strip at top */}
        <div
          className="absolute top-0 left-1/4 w-32 h-6 opacity-70 -rotate-1 rounded-sm"
          aria-hidden="true"
          style={{
            background: 'rgba(142, 200, 220, 0.55)',
            borderTop: '1px solid rgba(80,160,200,.2)',
            borderBottom: '1px solid rgba(80,160,200,.2)',
          }}
        />

        {/* Stamp — corner decoration */}
        <div
          className="absolute top-3 right-3 w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed border-laterite rounded-[4px] sm:top-5 sm:right-5 sm:w-20 sm:h-20"
          aria-hidden="true"
          style={{ background: 'linear-gradient(135deg, #fde8e2, #fef3f0)' }}
        >
          <span className="text-[22px] sm:text-[28px] leading-none">🌊</span>
          <span className="font-mono text-[7px] tracking-widest text-laterite mt-0.5 font-bold uppercase sm:text-[8px]">Goa 2026</span>
        </div>

        {/* Mobile: 1 col · sm: 2 col */}
        <div className="grid grid-cols-1 gap-5 px-5 pt-10 pb-8 sm:grid-cols-[1.5fr_.9fr] sm:gap-8 sm:px-9 sm:pt-12 sm:pb-10">
          <div>
            {/* Eyebrow in script font */}
            <span
              className="block text-muted text-[15px] mb-1 sm:text-[17px]"
              style={{ fontFamily: 'var(--font-script)' }}
            >
              Solo Goa · working itinerary
            </span>
            <h1
              className="m-0 mb-3 font-serif italic font-medium leading-[.95] tracking-[-0.02em] text-ink text-balance"
              style={{ fontSize: 'clamp(30px, 7.5vw, 60px)' }}
            >
              Slow mornings,<br />
              <span className="text-azulejo">Goan stories.</span>
            </h1>
            <p className="text-muted text-[13px] leading-relaxed max-w-[520px] m-0 sm:text-[15px]">
              A flexible plan for Oendrila's Goa trip — timings are arranged around church and museum hours, and every cost can be edited right here.
            </p>

            {/* Estimate sticker */}
            <div
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full border-2 border-dashed border-laterite"
              style={{ background: '#fde8e2' }}
              aria-label={`Estimated total: ${fmt(total)}`}
            >
              <span aria-hidden="true">💰</span>
              <span className="font-mono font-bold text-laterite tabular-nums text-[14px] sm:text-[16px]" aria-live="polite">{fmt(total)}</span>
              <small className="text-muted font-sans text-[10px]">est.</small>
            </div>
          </div>

          {/* Date postcard */}
          <div
            className="p-4 rounded-[12px] border-2 border-line relative sm:p-5"
            style={{ background: '#fdf8f0' }}
          >
            {/* Postmark circle */}
            <div
              className="absolute -top-3 -right-3 w-14 h-14 rounded-full border-2 border-dashed border-mustard flex flex-col items-center justify-center sm:w-16 sm:h-16"
              aria-hidden="true"
              style={{ background: '#fef3d0' }}
            >
              <span className="font-mono text-mustard font-bold text-[9px] leading-none tracking-tighter">12–18</span>
              <span className="font-mono text-mustard font-bold text-[9px] leading-none">SEP 26</span>
            </div>
            <strong
              className="block text-ink font-serif font-semibold text-[18px] mb-2 sm:text-[21px]"
            >
              ✈️ 12–18 Sep 2026
            </strong>
            <ul className="m-0 p-0 list-none text-muted text-[12px] flex flex-col gap-1 sm:text-[13px]">
              <li>🚂 Balurghat → Sealdah overnight (12 Sep)</li>
              <li>🛏 Bhawanipur + TaajKutir, Kolkata (13 Sep)</li>
              <li>🌴 Taj Holiday Village → Relax Inn (14–18 Sep)</li>
              <li>🏺 Claykind pottery 4–6 PM (15–17 Sep)</li>
              <li>🛫 Flies home 1:05 PM GOI (18 Sep)</li>
            </ul>
          </div>
        </div>

        {/* Torn-edge effect at bottom */}
        <svg viewBox="0 0 1200 20" preserveAspectRatio="none" className="w-full h-5 block" aria-hidden="true">
          <path
            d="M0,0 L60,12 L120,4 L180,16 L240,6 L300,14 L360,2 L420,18 L480,8 L540,16 L600,4 L660,14 L720,2 L780,18 L840,6 L900,16 L960,4 L1020,14 L1080,2 L1140,18 L1200,8 L1200,20 L0,20 Z"
            fill="var(--color-ground)"
          />
        </svg>
      </header>

      {/* ── STICKY NOTE METRICS ──────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-2 mb-5 sm:gap-3 sm:mb-6" aria-label="Trip at a glance">
        {[
          { label: 'Estimate', value: fmt(total), bg: '#fde8e2', textColor: '#6a1808', live: true, emoji: '💰' },
          { label: 'Open items', value: '27', bg: '#fef3d0', textColor: '#4a3000', live: false, emoji: '📌' },
          { label: 'Stays', value: '3', bg: '#d4eed8', textColor: '#0e3a1c', live: false, emoji: '🏡' },
        ].map((card, i) => (
          <div
            key={card.label}
            className="rounded-[12px] p-3.5 border border-line sm:rounded-[18px] sm:p-5"
            style={{
              background: card.bg,
              boxShadow: '2px 4px 0 rgba(100,60,20,.10), 3px 6px 12px rgba(60,30,10,.08)',
              transform: i % 2 === 0 ? 'rotate(-0.4deg)' : 'rotate(0.3deg)',
            }}
          >
            <small className="block mb-1 text-[9.5px] tracking-[.05em] uppercase font-bold sm:text-[10.5px] sm:mb-1.5" style={{ color: card.textColor, opacity: 0.7 }}>
              {card.emoji} {card.label}
            </small>
            <b
              className="font-mono text-[14px] tabular-nums font-bold leading-tight block sm:text-[22px]"
              style={{ color: card.textColor }}
              aria-live={card.live ? 'polite' : undefined}
            >
              {card.value}
            </b>
          </div>
        ))}
      </section>

      {/* ── NOTEBOOK TAB NAV ─────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-20 -mx-2.5 px-2.5 sm:mx-0 sm:px-0"
        style={{ background: 'var(--color-ground)' }}
        aria-label="Page sections"
        role="tablist"
      >
        {/* Scrollable row on mobile, wraps on sm */}
        <div
          className="flex items-end gap-1.5 overflow-x-auto pb-0 sm:flex-wrap sm:overflow-visible sm:gap-2"
          style={{ scrollbarWidth: 'none' } as React.CSSProperties}
        >
          {PAGES.map((p, idx) => {
            const tabColors = [
              '#daeef8', '#d4eed8', '#fde8e2', '#fef3d0',
              '#daeef8', '#d4eed8', '#fde8e2',
            ];
            const tabBorderColors = [
              '#1a6e90', '#2a7a50', '#b84820', '#7a5800',
              '#1a6e90', '#2a7a50', '#b84820',
            ];
            const isActive = page === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                id={`tab-${p.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${p.id}`}
                onClick={() => selectPage(p.id)}
                className={`inline-flex shrink-0 items-center gap-1 rounded-t-[10px] px-2.5 py-2 text-[11px] font-semibold border-x border-t-2 cursor-pointer font-sans transition-all whitespace-nowrap sm:px-4 sm:py-2.5 sm:text-[12.5px] sm:rounded-t-[12px]
                  ${isActive ? 'border-b-0 z-10 -mb-[2px] pb-[10px] sm:pb-[12px]' : 'opacity-75 hover:opacity-100'}`}
                style={{
                  background: isActive ? tabColors[idx] : 'rgba(255,254,248,.6)',
                  borderColor: isActive ? tabBorderColors[idx] : 'var(--color-line)',
                  borderTopColor: tabBorderColors[idx],
                  color: isActive ? '#2c1810' : 'var(--color-muted)',
                  boxShadow: isActive ? '2px -2px 8px rgba(0,0,0,.06)' : 'none',
                }}
              >
                <span aria-hidden="true" className="text-[12px] leading-none sm:text-[14px]">{p.icon}</span>
                {p.label}
              </button>
            );
          })}
        </div>
        {/* Ruled border under tabs */}
        <div className="h-[2px] bg-line" />
      </nav>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main id="main-content" className="max-w-[780px] mx-auto pt-5 sm:pt-6">
        {PAGES.map(p => (
          <div
            key={p.id}
            id={`panel-${p.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${p.id}`}
            hidden={page !== p.id}
          >
            {page === p.id && (
              <>
                {p.id === 'itinerary'          && <ItineraryPage />}
                {p.id === 'stays'              && <StaysPage />}
                {p.id === 'budget'             && <BudgetPage onTotalChange={handleTotalChange} />}
                {p.id === 'food-reference'     && <FoodPage />}
                {p.id === 'shopping-reference' && <ShoppingPage />}
                {p.id === 'packing'            && <PackingPage />}
                {p.id === 'checklist'          && <ChecklistPage />}
              </>
            )}
          </div>
        ))}
      </main>

      <footer className="mt-10 text-muted text-[12px] text-center pb-2" style={{ fontFamily: 'var(--font-script)', fontSize: '15px' }}>
        🌴 Working estimates, not confirmed bookings — reconfirm hours, cabs &amp; prices close to the date.
      </footer>
    </div>
  );
}
