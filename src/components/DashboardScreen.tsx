import React, { useState } from 'react';
import { Wallet, TrendingDown, TrendingUp, Calendar, Home, Sparkles, Diamond, ChevronDown, ChevronUp } from 'lucide-react';
import type { Period, Expense } from '../hooks/useFinanceData';
import { BucketPanel } from './BucketPanel';

type DashboardScreenProps = {
  period: Period;
  onAddExpense: (bucket: 'needs' | 'wants' | 'savings', expense: Omit<Expense, 'id' | 'date'>) => void;
  onDeleteExpense: (bucket: 'needs' | 'wants' | 'savings', id: string) => void;
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

const daysRemaining = (endDate: string) => {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ period, onAddExpense, onDeleteExpense }) => {
  const [activeTab, setActiveTab] = useState<'needs' | 'wants' | 'savings'>('needs');
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  const income = period.income;
  const buckets = ['needs', 'wants', 'savings'] as const;

  let totalSpent = 0;
  const totals = {
    needs: { budget: 0, spent: 0 },
    wants: { budget: 0, spent: 0 },
    savings: { budget: 0, spent: 0 },
  };

  buckets.forEach((b) => {
    totals[b].budget = income * period.buckets[b].allocation;
    totals[b].spent = period.buckets[b].expenses.reduce((s, e) => s + e.amount, 0);
    totalSpent += totals[b].spent;
  });

  const totalRemaining = income - totalSpent;
  const spentPct = Math.min(100, (totalSpent / income) * 100);
  const daysLeft = daysRemaining(period.dateEnd);

  // SVG Donut Calculations
  const circumference = 2 * Math.PI * 80;
  const gap = 6;
  const getArc = (spent: number) => (Math.min(spent, income) / income) * circumference;

  const needsArc = getArc(totals.needs.spent);
  const wantsArc = getArc(totals.wants.spent);
  const savingsArc = getArc(totals.savings.spent);

  const needsOffset = 0;
  const wantsOffset = -(needsArc + gap);
  const savingsOffset = -(needsArc + gap + wantsArc + gap);

  const TABS = [
    { key: 'needs' as const, label: 'Necesidades', shortLabel: 'Necesidades', icon: Home, colorClass: 'text-needs', activeBg: 'bg-needs' },
    { key: 'wants' as const, label: 'Deseos', shortLabel: 'Deseos', icon: Sparkles, colorClass: 'text-wants', activeBg: 'bg-wants' },
    { key: 'savings' as const, label: 'Ahorros', shortLabel: 'Ahorros', icon: Diamond, colorClass: 'text-savings', activeBg: 'bg-savings' },
  ];

  return (
    <section className="flex-1 flex flex-col w-full max-w-5xl mx-auto px-3 py-4 md:px-6 md:py-6 z-10 gap-4 md:gap-6">

      {/* ── Period summary bar (mobile collapsible) ── */}
      <div className="glass-card overflow-hidden">
        {/* Always visible row */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer md:cursor-default"
          onClick={() => setSummaryExpanded(v => !v)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Calendar size={16} className="text-brand-primary flex-shrink-0" />
            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {fmtDate(period.dateStart)} → {fmtDate(period.dateEnd)}
            </span>
            {daysLeft !== null && (
              <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                daysLeft < 0 ? 'bg-danger/15 text-danger' :
                daysLeft === 0 ? 'bg-wants/15 text-wants' :
                'bg-[var(--border-color)] text-[var(--text-muted)]'
              }`}>
                {daysLeft < 0 ? 'Vencida' : daysLeft === 0 ? 'Hoy' : `${daysLeft}d`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-black text-lg text-[var(--text-primary)]">{fmt(income)}</span>
            <span className="md:hidden text-[var(--text-muted)]">
              {summaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>
        </div>

        {/* Progress bar – always visible */}
        <div className="px-4 pb-3">
          <div className="flex justify-between text-xs font-medium text-[var(--text-muted)] mb-1.5">
            <span>Gastado {fmt(totalSpent).replace('MX$', '$')}</span>
            <span>{Math.round(spentPct)}%</span>
          </div>
          <div className="h-2 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"
              style={{ width: `${spentPct}%`, transition: 'width 1s ease-out' }}
            />
          </div>
        </div>

        {/* Expandable stats – shown on mobile only when tapped, always on desktop */}
        <div className={`overflow-hidden transition-all duration-300 ${summaryExpanded ? 'max-h-40' : 'max-h-0 md:max-h-40'}`}>
          <div className="grid grid-cols-3 divide-x divide-[var(--border-color)] border-t border-[var(--border-color)]">
            <div className="p-3 text-center">
              <div className="text-xs text-[var(--text-muted)] mb-0.5">Disponible</div>
              <div className="font-bold text-sm">{fmt(income)}</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-xs text-[var(--text-muted)] mb-0.5">Gastado</div>
              <div className="font-bold text-sm text-danger">{fmt(totalSpent)}</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-xs text-[var(--text-muted)] mb-0.5">Saldo libre</div>
              <div className={`font-bold text-sm ${totalRemaining < 0 ? 'text-danger' : 'text-savings'}`}>
                {fmt(Math.abs(totalRemaining))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Overview: Donut + Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Donut Chart */}
        <div className="glass-card p-5 flex flex-row items-center gap-5 lg:col-span-2">
          {/* Donut */}
          <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <circle cx="100" cy="100" r="80" className="fill-none stroke-[var(--border-color)] stroke-[12]" />
              <circle
                cx="100" cy="100" r="80"
                className="fill-none stroke-needs stroke-[12] stroke-linecap-round"
                strokeDasharray={`${Math.max(0, needsArc - gap)} ${circumference}`}
                strokeDashoffset={needsOffset}
                style={{ transition: 'stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out' }}
              />
              <circle
                cx="100" cy="100" r="80"
                className="fill-none stroke-wants stroke-[12] stroke-linecap-round"
                strokeDasharray={`${Math.max(0, wantsArc - gap)} ${circumference}`}
                strokeDashoffset={wantsOffset}
                style={{ transition: 'stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out' }}
              />
              <circle
                cx="100" cy="100" r="80"
                className="fill-none stroke-savings stroke-[12] stroke-linecap-round"
                strokeDasharray={`${Math.max(0, savingsArc - gap)} ${circumference}`}
                strokeDashoffset={savingsOffset}
                style={{ transition: 'stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[var(--text-muted)] text-[10px] font-semibold uppercase tracking-wider">Libre</span>
              <span className="text-base font-black text-[var(--text-primary)] leading-tight">{fmt(totalRemaining)}</span>
            </div>
          </div>

          {/* Legend – clickable to switch tab */}
          <div className="flex-1 flex flex-col gap-2.5">
            {[
              { key: 'needs' as const, label: 'Necesidades', pct: '50%', colorDot: 'bg-needs', glow: 'shadow-[0_0_8px_var(--color-needs)]', spent: totals.needs.spent, budget: totals.needs.budget },
              { key: 'wants' as const, label: 'Deseos', pct: '30%', colorDot: 'bg-wants', glow: 'shadow-[0_0_8px_var(--color-wants)]', spent: totals.wants.spent, budget: totals.wants.budget },
              { key: 'savings' as const, label: 'Ahorros', pct: '20%', colorDot: 'bg-savings', glow: 'shadow-[0_0_8px_var(--color-savings)]', spent: totals.savings.spent, budget: totals.savings.budget },
            ].map(item => (
              <button
                key={item.key}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-colors text-left w-full ${activeTab === item.key ? 'bg-[var(--border-color)]/50' : 'hover:bg-[var(--border-color)]/30'}`}
                onClick={() => setActiveTab(item.key)}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.colorDot} ${item.glow}`} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm leading-tight">{item.label}</div>
                    <div className="text-[var(--text-muted)] text-xs truncate">
                      {fmt(item.spent)} / {fmt(item.budget)}
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-bold flex-shrink-0 ml-2 ${
                  item.key === 'needs' ? 'text-needs' :
                  item.key === 'wants' ? 'text-wants' : 'text-savings'
                }`}>{item.pct}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats – 2×2 grid */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="glass-card p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
              <Wallet size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Ingreso</div>
              <div className="font-bold text-sm truncate">{fmt(income)}</div>
            </div>
          </div>
          <div className="glass-card p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
              <TrendingDown size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Gastado</div>
              <div className="font-bold text-sm truncate">{fmt(totalSpent)}</div>
            </div>
          </div>
          <div className="glass-card p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-success/10 text-success flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Disponible</div>
              <div className={`font-bold text-sm truncate ${totalRemaining < 0 ? 'text-danger' : ''}`}>
                {fmt(totalRemaining)}
              </div>
            </div>
          </div>
          <div className="glass-card p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--border-color)] flex items-center justify-center flex-shrink-0">
              <Calendar size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Días</div>
              <div className={`font-bold text-sm ${daysLeft !== null && daysLeft < 0 ? 'text-danger' : daysLeft === 0 ? 'text-wants' : ''}`}>
                {daysLeft === null ? '—' : daysLeft < 0 ? 'Vencida' : daysLeft === 0 ? 'Hoy' : `${daysLeft}d`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex gap-1.5 bg-[var(--border-color)]/30 p-1.5 rounded-2xl">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                isActive
                  ? `${tab.activeBg} text-white shadow-md`
                  : `text-[var(--text-muted)] hover:${tab.colorClass}`
              }`}
            >
              <Icon size={16} />
              <span className="hidden xs:inline sm:inline">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* ── Panels ── */}
      {activeTab === 'needs' && (
        <BucketPanel bucket="needs" data={period.buckets.needs} income={income} onAddExpense={onAddExpense} onDeleteExpense={onDeleteExpense} />
      )}
      {activeTab === 'wants' && (
        <BucketPanel bucket="wants" data={period.buckets.wants} income={income} onAddExpense={onAddExpense} onDeleteExpense={onDeleteExpense} />
      )}
      {activeTab === 'savings' && (
        <BucketPanel bucket="savings" data={period.buckets.savings} income={income} onAddExpense={onAddExpense} onDeleteExpense={onDeleteExpense} />
      )}

    </section>
  );
};
