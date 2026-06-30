import React, { useState } from 'react';
import { Plus, Home, Sparkles, Diamond, Trash2, ChevronDown } from 'lucide-react';
import type { Expense, BucketData } from '../hooks/useFinanceData';

type BucketPanelProps = {
  bucket: 'needs' | 'wants' | 'savings';
  data: BucketData;
  income: number;
  onAddExpense: (bucket: 'needs' | 'wants' | 'savings', expense: Omit<Expense, 'id' | 'date'>) => void;
  onDeleteExpense: (bucket: 'needs' | 'wants' | 'savings', id: string) => void;
};

const BUCKET_INFO = {
  needs: {
    title: 'Necesidades',
    subtitle: 'Gastos esenciales para vivir',
    icon: Home,
    colorClass: 'text-needs',
    borderClass: 'border-needs',
    bgFillClass: 'stroke-needs',
    categories: ['Renta', 'Comida', 'Servicios', 'Transporte', 'Salud', 'Educación', 'Teléfono', 'Internet', 'Limpieza', 'Otro'],
  },
  wants: {
    title: 'Deseos',
    subtitle: 'Lo que disfrutas y te hace feliz',
    icon: Sparkles,
    colorClass: 'text-wants',
    borderClass: 'border-wants',
    bgFillClass: 'stroke-wants',
    categories: ['Entretenimiento', 'Restaurantes', 'Ropa', 'Videojuegos', 'Viajes', 'Regalos', 'Belleza', 'Gym', 'Suscripciones', 'Otro'],
  },
  savings: {
    title: 'Ahorros',
    subtitle: 'Tu futuro y seguridad financiera',
    icon: Diamond,
    colorClass: 'text-savings',
    borderClass: 'border-savings',
    bgFillClass: 'stroke-savings',
    categories: ['Fondo Emergencia', 'Inversión', 'Casa propia', 'Vehículo', 'Vacaciones', 'Educación', 'Negocio', 'Regalo especial', 'Otro'],
  },
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

export const BucketPanel: React.FC<BucketPanelProps> = ({ bucket, data, income, onAddExpense, onDeleteExpense }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(BUCKET_INFO[bucket].categories[0]);
  const [formOpen, setFormOpen] = useState(false);

  const budget = income * data.allocation;
  const spent = data.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const remaining = budget - spent;
  const usedPct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  const info = BUCKET_INFO[bucket];
  const Icon = info.icon;

  const handleAdd = () => {
    const val = parseFloat(amount);
    if (!name.trim() || isNaN(val) || val <= 0) return;
    onAddExpense(bucket, { name, amount: val, category });
    setName('');
    setAmount('');
    setFormOpen(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col gap-4">

      {/* Budget overview card */}
      <div className={`glass-card p-4 border-l-4 ${info.borderClass}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-full ${
              bucket === 'needs' ? 'bg-needs/10' :
              bucket === 'wants' ? 'bg-wants/10' : 'bg-savings/10'
            } flex items-center justify-center flex-shrink-0`}>
              <Icon className={info.colorClass} size={18} />
            </div>
            <div className="min-w-0">
              <h2 className={`text-base font-bold ${info.colorClass} leading-tight`}>{info.title}</h2>
              <p className="text-[var(--text-muted)] text-xs">{info.subtitle}</p>
            </div>
          </div>

          {/* Mini donut */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg viewBox="0 0 60 60" className="w-full h-full -rotate-90">
              <circle cx="30" cy="30" r="25" className="fill-none stroke-[var(--border-color)] stroke-[5]" />
              <circle
                cx="30"
                cy="30"
                r="25"
                className={`fill-none stroke-[5] ${usedPct >= 100 ? 'stroke-danger' : info.bgFillClass}`}
                strokeDasharray="157"
                strokeDashoffset={157 - (usedPct / 100) * 157}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${usedPct >= 100 ? 'text-danger' : ''}`}>
              {Math.round(usedPct)}%
            </span>
          </div>
        </div>

        {/* Three stat pills */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-[var(--border-color)]/30 rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-0.5">Presupuesto</div>
            <div className={`font-bold text-sm ${info.colorClass}`}>{fmt(budget)}</div>
          </div>
          <div className="bg-[var(--border-color)]/30 rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-0.5">Gastado</div>
            <div className="font-bold text-sm">{fmt(spent)}</div>
          </div>
          <div className="bg-[var(--border-color)]/30 rounded-xl p-2.5 text-center">
            <div className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider mb-0.5">Libre</div>
            <div className={`font-bold text-sm ${remaining < 0 ? 'text-danger' : info.colorClass}`}>
              {fmt(Math.abs(remaining))}
            </div>
          </div>
        </div>
      </div>

      {/* Add expense: collapsed button on mobile, opens form */}
      <div className="glass-card overflow-hidden">
        {/* Toggle header */}
        <button
          className="w-full flex items-center justify-between px-4 py-3.5 font-semibold text-sm"
          onClick={() => setFormOpen(v => !v)}
        >
          <div className="flex items-center gap-2">
            <Plus size={16} className={info.colorClass} />
            <span>Agregar gasto</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-[var(--text-muted)] transition-transform duration-200 ${formOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Expandable form */}
        <div className={`overflow-hidden transition-all duration-300 ${formOpen ? 'max-h-64' : 'max-h-0'}`}>
          <div className="px-4 pb-4 flex flex-col gap-2.5 border-t border-[var(--border-color)]">
            <div className="pt-3 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Descripción del gasto..."
                className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/40 outline-none transition-shadow"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="$0.00"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="flex-1 bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/40 outline-none transition-shadow"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <select
                  className="flex-1 bg-[var(--bg-color)] border border-[var(--border-color)] text-[var(--text-primary)] px-3 py-3 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/40 outline-none cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {info.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className={`w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:scale-95 ${
                bucket === 'needs' ? 'bg-needs' :
                bucket === 'wants' ? 'bg-wants' : 'bg-savings'
              }`}
            >
              <Plus size={16} />
              Agregar gasto
            </button>
          </div>
        </div>
      </div>

      {/* Expense list */}
      <div className="flex flex-col gap-2">
        {data.expenses.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-3">
            <Icon size={44} className="opacity-20" />
            <p className="text-sm">Aún no hay gastos aquí</p>
            <button
              onClick={() => setFormOpen(true)}
              className={`text-sm font-semibold ${info.colorClass} underline underline-offset-2`}
            >
              Agregar primero
            </button>
          </div>
        ) : (
          data.expenses.map((e) => (
            <div key={e.id} className="glass-card flex items-center justify-between p-3.5 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${
                  bucket === 'needs' ? 'bg-needs/15 text-needs' :
                  bucket === 'wants' ? 'bg-wants/15 text-wants' : 'bg-savings/15 text-savings'
                }`}>{e.category}</span>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{e.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{fmtDate(e.date)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`font-bold text-sm ${info.colorClass}`}>{fmt(e.amount)}</span>
                {/* Always visible delete button (touch-friendly) */}
                <button
                  onClick={() => onDeleteExpense(bucket, e.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Eliminar"
                  aria-label="Eliminar gasto"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
