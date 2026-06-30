import React from 'react';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import type { Period } from '../hooks/useFinanceData';

type HistoryScreenProps = {
  history: Period[];
  currentPeriod: Period | null;
  onBack: () => void;
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(n || 0);


const fmtDate = (isoDate: string) => {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${+d} ${months[+m - 1]} ${y}`;
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, currentPeriod, onBack }) => {
  const allPeriods: (Period & { isCurrent: boolean })[] = [];
  if (currentPeriod) allPeriods.push({ ...currentPeriod, isCurrent: true });
  allPeriods.push(...history.map(h => ({ ...h, isCurrent: false })));

  return (
    <section className="flex-1 flex flex-col w-full max-w-4xl mx-auto px-3 py-4 md:px-6 md:py-6 z-10 gap-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost p-2.5">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-xl font-bold">Historial de Quincenas</h2>
        {allPeriods.length > 0 && (
          <span className="ml-auto text-xs font-semibold text-[var(--text-muted)] bg-[var(--border-color)]/50 px-2.5 py-1 rounded-full">
            {allPeriods.length} período{allPeriods.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {allPeriods.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)] flex flex-col items-center gap-4">
            <BarChart2 size={48} className="opacity-30" />
            <div>
              <p className="font-semibold mb-1">Sin quincenas registradas</p>
              <p className="text-sm">Crea tu primera quincena para ver el historial aquí.</p>
            </div>
          </div>
        ) : (
          allPeriods.map(p => {
            const income = p.income;
            const needsSpent = p.buckets.needs.expenses.reduce((s, e) => s + e.amount, 0);
            const wantsSpent = p.buckets.wants.expenses.reduce((s, e) => s + e.amount, 0);
            const savingsSpent = p.buckets.savings.expenses.reduce((s, e) => s + e.amount, 0);
            const totalSpent = needsSpent + wantsSpent + savingsSpent;

            const needsPct = income > 0 ? (needsSpent / income) * 100 : 0;
            const wantsPct = income > 0 ? (wantsSpent / income) * 100 : 0;
            const savingsPct = income > 0 ? (savingsSpent / income) * 100 : 0;
            const totalExpCount =
              p.buckets.needs.expenses.length +
              p.buckets.wants.expenses.length +
              p.buckets.savings.expenses.length;
            const spentPct = Math.min(100, income > 0 ? (totalSpent / income) * 100 : 0);

            return (
              <div key={p.id} className="glass-card p-4 hover:border-[var(--text-muted)] transition-colors">
                {/* Period header */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm">
                        {fmtDate(p.dateStart)} — {fmtDate(p.dateEnd)}
                      </span>
                      {p.isCurrent && (
                        <span className="bg-needs/10 text-needs text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider">
                          ACTIVA
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">{totalExpCount} gastos · {Math.round(spentPct)}% gastado</div>
                  </div>
                  <div className="font-black text-lg text-[var(--text-primary)] flex-shrink-0">{fmt(income)}</div>
                </div>

                {/* Stacked bar */}
                <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-[var(--border-color)] mb-3">
                  <div className="bg-needs transition-all" style={{ width: `${needsPct}%` }} />
                  <div className="bg-wants transition-all" style={{ width: `${wantsPct}%` }} />
                  <div className="bg-savings transition-all" style={{ width: `${savingsPct}%` }} />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Necesidades', val: needsSpent, color: 'text-needs' },
                    { label: 'Deseos', val: wantsSpent, color: 'text-wants' },
                    { label: 'Ahorros', val: savingsSpent, color: 'text-savings' },
                    { label: 'Libre', val: income - totalSpent, color: income - totalSpent < 0 ? 'text-danger' : '' },
                  ].map(item => (
                    <div key={item.label} className="bg-[var(--border-color)]/20 rounded-xl p-2.5">
                      <div className="text-[10px] text-[var(--text-muted)] font-semibold mb-0.5">{item.label}</div>
                      <div className={`font-bold text-xs ${item.color}`}>{fmt(Math.abs(item.val))}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
