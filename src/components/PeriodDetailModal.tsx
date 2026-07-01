import React, { useState } from 'react';
import { X, Home, Sparkles, Diamond, Wallet, TrendingDown, TrendingUp, Calendar, FileSpreadsheet } from 'lucide-react';
import type { Period } from '../hooks/useFinanceData';
import { exportPeriodToExcel } from '../utils/exportExcel';

type PeriodDetailModalProps = {
  period: Period;
  onClose: () => void;
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

const BUCKET_CFG = {
  needs: { label: 'Necesidades', icon: Home, color: 'text-needs', bg: 'bg-needs/10', dot: 'bg-needs', border: 'border-l-needs' },
  wants: { label: 'Deseos', icon: Sparkles, color: 'text-wants', bg: 'bg-wants/10', dot: 'bg-wants', border: 'border-l-wants' },
  savings: { label: 'Ahorros', icon: Diamond, color: 'text-savings', bg: 'bg-savings/10', dot: 'bg-savings', border: 'border-l-savings' },
} as const;

export const PeriodDetailModal: React.FC<PeriodDetailModalProps> = ({ period, onClose }) => {
  const [activeTab, setActiveTab] = useState<'needs' | 'wants' | 'savings'>('needs');

  const income = period.income;
  const totals = {
    needs: { budget: income * period.buckets.needs.allocation, spent: period.buckets.needs.expenses.reduce((s, e) => s + e.amount, 0) },
    wants: { budget: income * period.buckets.wants.allocation, spent: period.buckets.wants.expenses.reduce((s, e) => s + e.amount, 0) },
    savings: { budget: income * period.buckets.savings.allocation, spent: period.buckets.savings.expenses.reduce((s, e) => s + e.amount, 0) },
  };
  const totalSpent = totals.needs.spent + totals.wants.spent + totals.savings.spent;
  const totalFree = income - totalSpent;

  const cfg = BUCKET_CFG[activeTab];
  const Icon = cfg.icon;
  const expenses = period.buckets[activeTab].expenses;
  const bucketBudget = totals[activeTab].budget;
  const bucketSpent = totals[activeTab].spent;
  const usedPct = bucketBudget > 0 ? Math.min(100, (bucketSpent / bucketBudget) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal panel */}
      <div
        className="relative z-10 w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col bg-[var(--surface-color)] border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] flex-shrink-0">
          <div>
            <h2 className="font-bold text-base leading-tight">
              {fmtDate(period.dateStart)} → {fmtDate(period.dateEnd)}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Vista detallada · solo lectura</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportPeriodToExcel(period)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[var(--border-color)]/50 hover:bg-[var(--border-color)] transition-colors text-[var(--text-primary)]"
              title="Exportar a Excel"
            >
              <FileSpreadsheet size={14} className="text-savings" />
              <span className="hidden xs:inline">Exportar Excel</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Ingreso', val: income, icon: Wallet, color: 'text-brand-primary' },
              { label: 'Gastado', val: totalSpent, icon: TrendingDown, color: 'text-danger' },
              { label: 'Libre', val: totalFree, icon: TrendingUp, color: totalFree < 0 ? 'text-danger' : 'text-savings' },
              { label: 'Gastos', val: null, raw: `${period.buckets.needs.expenses.length + period.buckets.wants.expenses.length + period.buckets.savings.expenses.length} registros`, icon: Calendar, color: 'text-[var(--text-muted)]' },
            ].map((s) => (
              <div key={s.label} className="glass-card p-3">
                <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-1">{s.label}</div>
                <div className={`font-bold text-sm ${s.color}`}>
                  {s.raw ?? fmt(s.val!)}
                </div>
              </div>
            ))}
          </div>

          {/* Stacked bar */}
          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-[var(--border-color)]">
            <div className="bg-needs transition-all" style={{ width: `${income > 0 ? (totals.needs.spent / income) * 100 : 0}%` }} />
            <div className="bg-wants transition-all" style={{ width: `${income > 0 ? (totals.wants.spent / income) * 100 : 0}%` }} />
            <div className="bg-savings transition-all" style={{ width: `${income > 0 ? (totals.savings.spent / income) * 100 : 0}%` }} />
          </div>

          {/* Bucket tabs */}
          <div className="flex gap-1 bg-[var(--border-color)]/30 p-1 rounded-2xl">
            {(['needs', 'wants', 'savings'] as const).map((b) => {
              const c = BUCKET_CFG[b];
              const BIcon = c.icon;
              return (
                <button
                  key={b}
                  onClick={() => setActiveTab(b)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-xs transition-all ${
                    activeTab === b
                      ? `${c.bg} ${c.color} shadow-sm ring-1 ring-inset ring-current/20`
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <BIcon size={13} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bucket detail */}
          <div className={`glass-card p-4 border-l-4 ${cfg.border}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center`}>
                  <Icon size={16} className={cfg.color} />
                </div>
                <div>
                  <div className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{fmt(bucketSpent)} / {fmt(bucketBudget)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--text-muted)]">Usado</div>
                <div className={`font-black text-base ${usedPct >= 100 ? 'text-danger' : cfg.color}`}>{Math.round(usedPct)}%</div>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--border-color)] overflow-hidden">
              <div
                className={`h-full rounded-full ${usedPct >= 100 ? 'bg-danger' : cfg.dot}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>

          {/* Expense list */}
          <div className="flex flex-col gap-2">
            {expenses.length === 0 ? (
              <div className="py-8 text-center text-[var(--text-muted)] text-sm flex flex-col items-center gap-2">
                <Icon size={32} className="opacity-20" />
                <span>Sin gastos en este bucket</span>
              </div>
            ) : (
              expenses.map((e) => (
                <div key={e.id} className="glass-card flex items-center justify-between p-3 gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                      {e.category}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{e.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{fmtDate(e.date)}</div>
                    </div>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${cfg.color}`}>{fmt(e.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
