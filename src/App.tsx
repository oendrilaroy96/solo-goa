import { useState, useCallback } from 'react';
import { budgetGroups, STORAGE_KEY } from './data/budget';
import ItineraryPage from './pages/ItineraryPage';
import BudgetPage from './pages/BudgetPage';
import StaysPage from './pages/StaysPage';
import FoodPage from './pages/FoodPage';
import ShoppingPage from './pages/ShoppingPage';
import PackingPage from './pages/PackingPage';
import ChecklistPage from './pages/ChecklistPage';
import DocsPage from './pages/DocsPage';

type PageId = 'itinerary' | 'stays' | 'budget' | 'food-reference' | 'shopping-reference' | 'packing' | 'checklist' | 'docs';

const PAGES: { id: PageId; label: string; short: string; icon: string }[] = [
  { id: 'itinerary',          label: 'Itinerary',    short: 'Itin',   icon: '🗓' },
  { id: 'stays',              label: 'Stays',        short: 'Stays',  icon: '🏡' },
  { id: 'budget',             label: 'Budget',       short: 'Budget', icon: '💸' },
  { id: 'food-reference',     label: 'Food & drink', short: 'Food',   icon: '🦞' },
  { id: 'shopping-reference', label: 'Shopping',     short: 'Shop',   icon: '🛍' },
  { id: 'packing',            label: 'Packing',      short: 'Pack',   icon: '🎒' },
  { id: 'checklist',          label: 'Checklist',    short: 'List',   icon: '✅' },
  { id: 'docs',               label: 'Documents',    short: 'Docs',   icon: '📁' },
];

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

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function App() {
  const [page, setPage] = useState<PageId>(getStoredPage);
  const [total, setTotal] = useState<number>(initTotal);
  const [autoOpenDoc, setAutoOpenDoc] = useState<string | null>(null);
  const handleTotalChange = useCallback((t: number) => setTotal(t), []);

  const openDoc = useCallback((label: string) => {
    setAutoOpenDoc(label);
    setPage('docs');
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    try { localStorage.setItem('goaSelectedPage', 'docs'); } catch { /* */ }
  }, []);

  function selectPage(id: PageId) {
    setPage(id);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    try { localStorage.setItem('goaSelectedPage', id); } catch { /* */ }
  }

  return (
    <>
      {/* Skip link — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="fixed left-3 -top-20 z-[100] px-4 py-2.5 text-[13px] font-semibold no-underline focus-visible:top-0"
        style={{ background: '#c9a84c', color: '#0d0d0d', borderRadius: 2 }}
      >
        Skip to main content
      </a>

      {/* ── LEFT SIDEBAR — desktop only ── */}
      <aside
        className="hidden sm:flex flex-col fixed left-0 top-0 bottom-0 z-40"
        style={{
          width: 220,
          background: '#0d0d0d',
          borderRight: '1px solid rgba(255,255,255,.07)',
        }}
      >
        {/* Logo area */}
        <div style={{ padding: '28px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <img src="/favicon.png" width={32} height={32} alt="" style={{ display: 'block' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              Solo Goa
            </span>
          </div>
          <div className="gold-line" />
        </div>

        {/* Nav */}
        <nav role="tablist" aria-label="Page sections" style={{ flex: 1, paddingTop: 4 }}>
          {PAGES.map(p => {
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 20px',
                  paddingLeft: isActive ? 18 : 20,
                  borderLeft: isActive ? '2px solid #c9a84c' : '2px solid transparent',
                  background: isActive ? 'rgba(201,168,76,.08)' : 'transparent',
                  color: isActive ? '#c9a84c' : '#8a8070',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left' as const,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.03)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: 16 }} aria-hidden="true">{p.icon}</span>
                {p.label}
              </button>
            );
          })}
        </nav>

        {/* Total at bottom */}
        <div style={{ padding: '16px 20px 28px' }}>
          <div className="gold-line" style={{ marginBottom: 16 }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#8a8070', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Estimated total
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: '#c9a84c', fontWeight: 600 }}>
            {fmt(total)}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main
        id="main-content"
        className="sm:ml-[220px]"
        style={{ minHeight: '100vh', maxWidth: 860 + 220, paddingBottom: 96 }}
      >
        <div style={{ maxWidth: 860, padding: '40px 24px 56px', paddingBottom: 96 }} className="sm:px-12 sm:py-14 sm:pb-14">
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
                  {p.id === 'itinerary'          && <ItineraryPage onOpenDoc={openDoc} />}
                  {p.id === 'stays'              && <StaysPage />}
                  {p.id === 'budget'             && <BudgetPage onTotalChange={handleTotalChange} />}
                  {p.id === 'food-reference'     && <FoodPage />}
                  {p.id === 'shopping-reference' && <ShoppingPage />}
                  {p.id === 'packing'            && <PackingPage />}
                  {p.id === 'checklist'          && <ChecklistPage />}
                  {p.id === 'docs'               && <DocsPage autoOpenLabel={autoOpenDoc} onAutoOpenHandled={() => setAutoOpenDoc(null)} />}
                </>
              )}
            </div>
          ))}

          {/* Footer */}
          <footer
            style={{
              marginTop: 64,
              paddingTop: 24,
              borderTop: '1px solid rgba(255,255,255,.07)',
              fontSize: 12,
              color: '#8a8070',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            Working estimates, not confirmed bookings — reconfirm hours, cabs &amp; prices close to the date.
          </footer>
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 flex overflow-x-auto"
        style={{
          background: '#0d0d0d',
          borderTop: '1px solid rgba(255,255,255,.07)',
          scrollbarWidth: 'none',
        } as React.CSSProperties}
        role="tablist"
        aria-label="Page sections"
      >
        {PAGES.map(p => {
          const isActive = page === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => selectPage(p.id)}
              className="flex-1 min-w-[50px] flex flex-col items-center justify-center gap-0.5 py-2.5 cursor-pointer shrink-0 border-0 transition-all"
              style={{
                background: 'transparent',
                borderTop: isActive ? '2px solid #c9a84c' : '2px solid transparent',
              }}
            >
              <span className="text-[15px] leading-none">{p.icon}</span>
              <span
                className="text-[8px] font-bold uppercase tracking-wide"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: isActive ? '#c9a84c' : '#8a8070',
                }}
              >
                {p.short}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
