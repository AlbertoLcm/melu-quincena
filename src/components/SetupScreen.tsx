import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

type SetupScreenProps = {
  onStart: (income: number, start: string, end: string) => void;
};

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
  const [income, setIncome] = useState<string>('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    const day = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth();

    let startDay, endDay;
    if (day <= 15) {
      startDay = 1;
      endDay = 15;
    } else {
      startDay = 16;
      endDay = new Date(year, month + 1, 0).getDate();
    }

    const pad = (n: number) => String(n).padStart(2, '0');
    setDateStart(`${year}-${pad(month + 1)}-${pad(startDay)}`);
    setDateEnd(`${year}-${pad(month + 1)}-${pad(endDay)}`);
  }, []);

  const handleStart = () => {
    const incomeVal = parseFloat(income);
    if (isNaN(incomeVal) || incomeVal <= 0) {
      setError('Ingresa un monto válido para tu quincena');
      return;
    }
    if (!dateStart || !dateEnd) {
      setError('Selecciona las fechas de tu quincena');
      return;
    }
    if (dateStart > dateEnd) {
      setError('La fecha de inicio debe ser antes de la fecha fin');
      return;
    }
    setError('');
    onStart(incomeVal, dateStart, dateEnd);
  };

  const RULES = [
    { pct: '50%', label: 'Necesidades', desc: 'Renta, alimentación, servicios', color: 'text-needs', border: 'border-t-needs', bg: 'bg-needs/10' },
    { pct: '30%', label: 'Deseos', desc: 'Entretenimiento, moda, salidas', color: 'text-wants', border: 'border-t-wants', bg: 'bg-wants/10' },
    { pct: '20%', label: 'Ahorros', desc: 'Fondo emergencia, inversiones', color: 'text-savings', border: 'border-t-savings', bg: 'bg-savings/10' },
  ];

  return (
    <section className="flex-1 flex flex-col items-center justify-start px-4 pt-8 pb-6 text-center z-10 gap-6 max-w-lg mx-auto w-full">

      {/* Badge */}
      <div className="inline-flex items-center gap-2 bg-[var(--border-color)]/50 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-semibold border border-[var(--border-color)]">
        <Briefcase size={14} /> Gestión Financiera
      </div>

      {/* Headline */}
      <div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-3">
          Toma el control de<br />
          <span className="bg-gradient-to-r from-brand-primary to-wants text-transparent bg-clip-text">
            tu quincena
          </span>
        </h1>
        <p className="text-[var(--text-muted)] text-sm md:text-base max-w-sm mx-auto">
          Distribuye tu ingreso con la regla 50/30/20 y alcanza tus metas financieras.
        </p>
      </div>

      {/* Form card */}
      <div className="glass-card p-5 w-full text-left">
        {error && (
          <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-xl text-sm mb-4 flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Income */}
        <label className="block text-sm font-bold mb-2">¿Cuánto recibes esta quincena?</label>
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-[var(--text-muted)]">$</span>
          <input
            type="number"
            inputMode="decimal"
            className="input-field pl-8 pr-16 font-bold text-xl"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--text-muted)]">MXN</span>
        </div>

        {/* Dates */}
        <label className="block text-sm font-bold mb-2">Período de la quincena</label>
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1">
            <label className="block text-[10px] font-semibold mb-1 text-[var(--text-muted)] uppercase tracking-wider">
              <ChevronLeft size={10} className="inline" /> Inicio
            </label>
            <input
              type="date"
              className="input-field text-sm py-2.5"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div className="text-[var(--text-muted)] pt-5 flex-shrink-0">
            <ArrowRight size={14} />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-semibold mb-1 text-[var(--text-muted)] uppercase tracking-wider">
              Fin <ChevronRight size={10} className="inline" />
            </label>
            <input
              type="date"
              className="input-field text-sm py-2.5"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
        </div>

        <button onClick={handleStart} className="btn-primary w-full py-4 text-base">
          Comenzar distribución
          <ArrowRight size={18} />
        </button>
      </div>

      {/* 50/30/20 explainer chips */}
      <div className="grid grid-cols-3 gap-2.5 w-full">
        {RULES.map(r => (
          <div key={r.label} className={`glass-card flex flex-col items-center p-3 border-t-2 ${r.border} gap-1`}>
            <div className={`text-xl font-black ${r.color}`}>{r.pct}</div>
            <div className="font-bold text-xs">{r.label}</div>
            <div className="text-[var(--text-muted)] text-[10px] text-center leading-tight">{r.desc}</div>
          </div>
        ))}
      </div>

    </section>
  );
};
