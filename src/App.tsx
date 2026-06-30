import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, History, Plus } from 'lucide-react';
import { useFinanceData } from './hooks/useFinanceData';
import { SetupScreen } from './components/SetupScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { Logo } from './components/Logo';

/** Apply / remove the `dark` class on <html> and remember no preference here —
 *  the OS is the single source of truth. */
function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function App() {
  const { state, loading, startPeriod, addExpense, deleteExpense } = useFinanceData();
  const [currentScreen, setCurrentScreen] = useState<'setup' | 'dashboard' | 'history'>('setup');

  // ── System dark-mode — real-time reactive ────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mq.matches);

    const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // ── Auto-redirect once IndexedDB data is loaded ──────────────────────────
  const didInitialRedirect = useRef(false);
  useEffect(() => {
    if (!loading && !didInitialRedirect.current && state.currentPeriod && currentScreen === 'setup') {
      didInitialRedirect.current = true;
      setCurrentScreen('dashboard');
    }
  }, [loading, state.currentPeriod, currentScreen]);

  const hasPeriod = !!state.currentPeriod;

  // ── Loading splash ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <Logo className="animate-pulse" size={48} />
          <p className="text-[var(--text-muted)] text-sm tracking-widest uppercase">Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      {/* Background orbs */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* Header */}
      <header className="w-full border-b border-[var(--border-color)] bg-[var(--surface-color)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div
            className="flex items-center gap-2 font-black text-xl tracking-tight cursor-pointer"
            onClick={() => {
              if (state.currentPeriod) setCurrentScreen('dashboard');
              else setCurrentScreen('setup');
            }}
          >
            <Logo size={24} />
            <span>Melu Quincena</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop nav buttons only */}
            <button
              onClick={() => setCurrentScreen('history')}
              className="btn-ghost hidden md:flex"
              title="Historial"
            >
              <History size={18} />
              <span>Historial</span>
            </button>
            <button
              onClick={() => setCurrentScreen('setup')}
              className="btn-primary hidden md:flex"
            >
              <Plus size={18} />
              <span>Nueva Quincena</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full relative z-10 pb-24 md:pb-6">
        {currentScreen === 'setup' && (
          <SetupScreen onStart={(income, start, end) => {
            startPeriod(income, start, end);
            setCurrentScreen('dashboard');
          }} />
        )}

        {currentScreen === 'dashboard' && state.currentPeriod && (
          <DashboardScreen
            period={state.currentPeriod}
            onAddExpense={addExpense}
            onDeleteExpense={deleteExpense}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            history={state.history}
            currentPeriod={state.currentPeriod}
            onBack={() => {
              if (state.currentPeriod) setCurrentScreen('dashboard');
              else setCurrentScreen('setup');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav md:hidden">
        <button
          className={`mobile-nav-item ${currentScreen === 'setup' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('setup')}
          aria-label="Nueva Quincena"
        >
          <div className={`mobile-nav-icon-wrap ${currentScreen === 'setup' ? 'active' : ''}`}>
            <Plus size={20} />
          </div>
          <span>Nueva</span>
        </button>

        <button
          className={`mobile-nav-item ${currentScreen === 'dashboard' ? 'active' : ''}`}
          onClick={() => hasPeriod && setCurrentScreen('dashboard')}
          aria-label="Dashboard"
          disabled={!hasPeriod}
        >
          <div className={`mobile-nav-icon-wrap ${currentScreen === 'dashboard' ? 'active' : ''} ${!hasPeriod ? 'opacity-40' : ''}`}>
            <LayoutDashboard size={20} />
          </div>
          <span className={!hasPeriod ? 'opacity-40' : ''}>Dashboard</span>
        </button>

        <button
          className={`mobile-nav-item ${currentScreen === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('history')}
          aria-label="Historial"
        >
          <div className={`mobile-nav-icon-wrap ${currentScreen === 'history' ? 'active' : ''}`}>
            <History size={20} />
          </div>
          <span>Historial</span>
        </button>
      </nav>
    </div>
  );
}

export default App;

