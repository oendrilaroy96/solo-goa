import { useState, useCallback, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return (localStorage.getItem('goaTheme') as 'dark' | 'light') || 'dark'; } catch { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('goaTheme', theme); } catch { /* */ }
  }, [theme]);
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return { theme, toggle };
}

import { supabase } from './lib/supabase';
import { signOut } from './lib/auth';
import { budgetGroups, STORAGE_KEY } from './data/budget';
import ItineraryPage from './pages/ItineraryPage';
import BudgetPage from './pages/BudgetPage';
import StaysPage from './pages/StaysPage';
import FoodPage from './pages/FoodPage';
import ShoppingPage from './pages/ShoppingPage';
import PackingPage from './pages/PackingPage';
import ChecklistPage from './pages/ChecklistPage';
import DocsPage from './pages/DocsPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import type { Trip } from './lib/trips';

type PageId = 'itinerary' | 'stays' | 'budget' | 'food-reference' | 'shopping-reference' | 'packing' | 'checklist' | 'docs';

const PAGES: { id: PageId; label: string; short: string; icon: string }[] = [
  { id: 'itinerary',          label: 'Itinerary',    short: 'Itin',   icon: '🗓' },
  { id: 'budget',             label: 'Budget',       short: 'Budget', icon: '💸' },
  { id: 'packing',            label: 'Packing',      short: 'Pack',   icon: '🎒' },
  { id: 'checklist',          label: 'Checklist',    short: 'List',   icon: '✅' },
  { id: 'food-reference',     label: 'Food & drink', short: 'Food',   icon: '🦞' },
  { id: 'shopping-reference', label: 'Shopping',     short: 'Shop',   icon: '🛍' },
  { id: 'stays',              label: 'Stays',        short: 'Stays',  icon: '🏡' },
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
  const [session, setSession]     = useState<Session | null | undefined>(undefined); // undefined = loading
  const [trip, setTrip]           = useState<Trip | null>(null);
  const [page, setPage]           = useState<PageId>(getStoredPage);
  const [total, setTotal]         = useState<number>(initTotal);
  const [autoOpenDoc, setAutoOpenDoc] = useState<string | null>(null);
  const { theme, toggle } = useTheme();
  const handleTotalChange = useCallback((t: number) => setTotal(t), []);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) setTrip(null); // clear trip on sign out
    });
    return () => subscription.unsubscribe();
  }, []);

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

  function handleSelectTrip(t: Trip) {
    setTrip(t);
    setPage('itinerary');
  }

  function handleBackToDashboard() {
    setTrip(null);
  }

  async function handleSignOut() {
    await signOut();
  }

  // Loading state while checking auth
  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--t-bg)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Loading…
        </span>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return <AuthPage />;
  }

  // Logged in but no trip selected
  if (!trip) {
    return (
      <>
        <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 50, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'var(--t-card)',
              border: '1px solid var(--t-w12)',
              borderRadius: 20,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 14,
              lineHeight: 1,
              color: 'var(--t-muted)',
            }}
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--t-muted)',
              background: 'transparent',
              border: '1px solid var(--t-w10)',
              borderRadius: 3,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
        <DashboardPage onSelectTrip={handleSelectTrip} />
      </>
    );
  }

  // Trip view
  return (
    <>
      {/* Skip link — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="fixed left-3 -top-20 z-[100] px-4 py-2.5 text-[13px] font-semibold no-underline focus-visible:top-0"
        style={{ background: 'var(--t-gold)', color: 'var(--t-bg)', borderRadius: 2 }}
      >
        Skip to main content
      </a>

      {/* ── LEFT SIDEBAR — desktop only ── */}
      <aside
        className="hidden sm:flex flex-col fixed left-0 top-0 bottom-0 z-40"
        style={{
          width: 220,
          background: 'var(--t-bg)',
          borderRight: '1px solid var(--t-w07)',
        }}
      >
        {/* Logo area */}
        <div style={{ padding: '28px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{trip.cover_emoji || '✈'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t-gold)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {trip.name}
              </span>
            </div>
            <button
              type="button"
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                background: 'var(--t-w07)',
                border: '1px solid var(--t-w12)',
                borderRadius: 20,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
                color: 'var(--t-muted)',
              }}
            >
              {theme === 'dark' ? '☀' : '🌙'}
            </button>
          </div>

          {/* Back to dashboard */}
          <button
            type="button"
            onClick={handleBackToDashboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--t-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '4px 0',
              marginBottom: 8,
            }}
          >
            ← All trips
          </button>

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
                  borderLeft: isActive ? '2px solid var(--t-gold)' : '2px solid transparent',
                  background: isActive ? 'var(--t-gold-08)' : 'transparent',
                  color: isActive ? 'var(--t-gold)' : 'var(--t-muted)',
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
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--t-w03)';
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

        {/* Bottom: total + sign out */}
        <div style={{ padding: '16px 20px 28px' }}>
          <div className="gold-line" style={{ marginBottom: 16 }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Estimated total
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--t-gold)', fontWeight: 600, marginBottom: 14 }}>
            {fmt(total)}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--t-muted)',
              background: 'transparent',
              border: '1px solid var(--t-w10)',
              borderRadius: 3,
              padding: '6px 12px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Sign out
          </button>
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
                  {p.id === 'itinerary'          && <ItineraryPage tripId={trip.id} onOpenDoc={openDoc} />}
                  {p.id === 'stays'              && <StaysPage />}
                  {p.id === 'budget'             && <BudgetPage tripId={trip.id} onTotalChange={handleTotalChange} />}
                  {p.id === 'food-reference'     && <FoodPage />}
                  {p.id === 'shopping-reference' && <ShoppingPage />}
                  {p.id === 'packing'            && <PackingPage tripId={trip.id} />}
                  {p.id === 'checklist'          && <ChecklistPage tripId={trip.id} />}
                  {p.id === 'docs'               && <DocsPage tripId={trip.id} autoOpenLabel={autoOpenDoc} onAutoOpenHandled={() => setAutoOpenDoc(null)} />}
                </>
              )}
            </div>
          ))}

          {/* Footer */}
          <footer
            style={{
              marginTop: 64,
              paddingTop: 24,
              borderTop: '1px solid var(--t-w07)',
              fontSize: 12,
              color: 'var(--t-muted)',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            Working estimates, not confirmed bookings — reconfirm hours, cabs &amp; prices close to the date.
          </footer>
        </div>
      </main>

      {/* ── MOBILE THEME TOGGLE ── */}
      <button
        type="button"
        onClick={toggle}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="sm:hidden fixed z-40"
        style={{
          bottom: 68,
          right: 16,
          background: 'var(--t-card)',
          border: '1px solid var(--t-w12)',
          borderRadius: 20,
          padding: '6px 10px',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,.3)',
        }}
      >
        {theme === 'dark' ? '☀' : '🌙'}
      </button>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 flex overflow-x-auto"
        style={{
          background: 'var(--t-bg)',
          borderTop: '1px solid var(--t-w07)',
          scrollbarWidth: 'none',
        } as React.CSSProperties}
        role="tablist"
        aria-label="Page sections"
      >
        {/* Back button for mobile */}
        <button
          type="button"
          onClick={handleBackToDashboard}
          className="flex-none flex flex-col items-center justify-center gap-0.5 py-2.5 cursor-pointer border-0 transition-all"
          style={{
            background: 'transparent',
            borderTop: '2px solid transparent',
            minWidth: 44,
            padding: '10px 8px',
          }}
        >
          <span className="text-[15px] leading-none">←</span>
          <span
            className="text-[8px] font-bold uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--t-muted)' }}
          >
            Trips
          </span>
        </button>

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
                borderTop: isActive ? '2px solid var(--t-gold)' : '2px solid transparent',
              }}
            >
              <span className="text-[15px] leading-none">{p.icon}</span>
              <span
                className="text-[8px] font-bold uppercase tracking-wide"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: isActive ? 'var(--t-gold)' : 'var(--t-muted)',
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
