import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import type { Period } from '../hooks/useFinanceData';

type EditPeriodModalProps = {
  period: Period;
  onSave: (patch: Partial<Pick<Period, 'income' | 'dateStart' | 'dateEnd'>>) => void;
  onClose: () => void;
};

export const EditPeriodModal: React.FC<EditPeriodModalProps> = ({ period, onSave, onClose }) => {
  const [income, setIncome] = useState(String(period.income));
  const [dateStart, setDateStart] = useState(period.dateStart);
  const [dateEnd, setDateEnd] = useState(period.dateEnd);
  const [error, setError] = useState('');

  // Re-sync if period changes from outside
  useEffect(() => {
    setIncome(String(period.income));
    setDateStart(period.dateStart);
    setDateEnd(period.dateEnd);
  }, [period.id]);

  const handleSave = () => {
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
    onSave({ income: incomeVal, dateStart, dateEnd });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-md flex flex-col bg-[var(--surface-color)] border border-[var(--border-color)] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
          <h2 className="font-bold text-base">Editar Quincena</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 flex flex-col gap-5">
          {error && (
            <div className="bg-danger/10 text-danger border border-danger/20 p-3 rounded-xl text-sm flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Income */}
          <div>
            <label className="block text-sm font-bold mb-2">Ingreso de la quincena</label>
            <div className="relative">
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
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--text-muted)]">MXN</span>
            </div>
          </div>

          {/* Dates */}
          <div>
            <label className="block text-sm font-bold mb-2">Período</label>
            <div className="flex items-center gap-2">
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
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="btn-ghost flex-1 justify-center py-3"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex-1 justify-center py-3"
            >
              <Save size={16} />
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
