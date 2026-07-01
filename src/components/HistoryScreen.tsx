import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart2,
  Eye,
  Pencil,
  Trash2,
  FileSpreadsheet,
  MoreVertical,
  RotateCcw,
  Download,
} from 'lucide-react';
import type { Period } from '../hooks/useFinanceData';
import { PeriodDetailModal } from './PeriodDetailModal';
import { EditPeriodModal } from './EditPeriodModal';
import { exportAllPeriodsToExcel, exportPeriodToExcel } from '../utils/exportExcel';

type HistoryScreenProps = {
  history: Period[];
  currentPeriod: Period | null;
  onBack: () => void;
  onUpdatePeriod: (id: string, patch: Partial<Pick<Period, 'income' | 'dateStart' | 'dateEnd'>>) => void;
  onDeletePeriod: (id: string) => void;
  onSetActivePeriod: (id: string) => void;
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

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  currentPeriod,
  onBack,
  onUpdatePeriod,
  onDeletePeriod,
  onSetActivePeriod,
}) => {
  const [detailPeriod, setDetailPeriod] = useState<Period | null>(null);
  const [editPeriod, setEditPeriod] = useState<Period | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const allPeriods: (Period & { isCurrent: boolean })[] = [];
  if (currentPeriod) allPeriods.push({ ...currentPeriod, isCurrent: true });
  allPeriods.push(...history.map((h) => ({ ...h, isCurrent: false })));

  const allForExport = allPeriods.map(({ isCurrent: _, ...p }) => p);

  const toggleMenu = (id: string) =>
    setOpenMenuId((prev) => (prev === id ? null : id));

  const handleDelete = (id: string) => {
    setOpenMenuId(null);
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (confirmDeleteId) {
      onDeletePeriod(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  return (
    <>
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
          {allPeriods.length > 0 && (
            <button
              onClick={() => exportAllPeriodsToExcel(allForExport)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-[var(--border-color)]/50 hover:bg-[var(--border-color)] transition-colors text-[var(--text-primary)]"
              title="Exportar todo a Excel"
            >
              <Download size={14} className="text-savings" />
              <span className="hidden sm:inline">Exportar todo</span>
            </button>
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
            allPeriods.map((p) => {
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
              const isMenuOpen = openMenuId === p.id;

              return (
                <div
                  key={p.id}
                  className="glass-card p-4 hover:border-[var(--text-muted)]/30 transition-colors relative"
                >
                  {/* Period header */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="min-w-0 flex-1">
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
                      <div className="text-xs text-[var(--text-muted)]">
                        {totalExpCount} gastos · {Math.round(spentPct)}% gastado
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="font-black text-lg text-[var(--text-primary)]">{fmt(income)}</div>

                      {/* Context menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleMenu(p.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)] transition-colors"
                          aria-label="Opciones"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                          <>
                            {/* Backdrop to close menu */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-9 z-20 min-w-[180px] bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl shadow-xl overflow-hidden">
                              <button
                                onClick={() => { setDetailPeriod(p); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--border-color)]/50 transition-colors text-left"
                              >
                                <Eye size={14} className="text-brand-primary" />
                                Ver detalle
                              </button>
                              <button
                                onClick={() => { setEditPeriod(p); setOpenMenuId(null); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--border-color)]/50 transition-colors text-left"
                              >
                                <Pencil size={14} className="text-wants" />
                                Editar
                              </button>
                              {!p.isCurrent && (
                                <button
                                  onClick={() => { onSetActivePeriod(p.id); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--border-color)]/50 transition-colors text-left"
                                >
                                  <RotateCcw size={14} className="text-savings" />
                                  Activar
                                </button>
                              )}
                              <button
                                onClick={() => { setOpenMenuId(null); exportPeriodToExcel(p); }}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--border-color)]/50 transition-colors text-left"
                              >
                                <FileSpreadsheet size={14} className="text-savings" />
                                Exportar Excel
                              </button>
                              <div className="border-t border-[var(--border-color)]" />
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-danger/10 text-danger transition-colors text-left"
                              >
                                <Trash2 size={14} />
                                Eliminar
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stacked bar — also acts as click target to open detail */}
                  <button
                    className="w-full text-left"
                    onClick={() => setDetailPeriod(p)}
                    aria-label="Ver detalle de quincena"
                  >
                    <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-[var(--border-color)] mb-3 hover:opacity-80 transition-opacity cursor-pointer">
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
                      ].map((item) => (
                        <div key={item.label} className="bg-[var(--border-color)]/20 rounded-xl p-2.5">
                          <div className="text-[10px] text-[var(--text-muted)] font-semibold mb-0.5">{item.label}</div>
                          <div className={`font-bold text-xs ${item.color}`}>{fmt(Math.abs(item.val))}</div>
                        </div>
                      ))}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Confirm delete dialog */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm bg-[var(--surface-color)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mb-4 mx-auto">
              <Trash2 size={22} className="text-danger" />
            </div>
            <h3 className="font-bold text-base text-center mb-1">¿Eliminar quincena?</h3>
            <p className="text-sm text-[var(--text-muted)] text-center mb-6">
              Esta acción no se puede deshacer. Se eliminarán todos los gastos asociados.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="btn-ghost flex-1 justify-center py-3">
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-danger text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Trash2 size={15} />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detailPeriod && (
        <PeriodDetailModal
          period={detailPeriod}
          onClose={() => setDetailPeriod(null)}
        />
      )}

      {/* Edit modal */}
      {editPeriod && (
        <EditPeriodModal
          period={editPeriod}
          onSave={(patch) => onUpdatePeriod(editPeriod.id, patch)}
          onClose={() => setEditPeriod(null)}
        />
      )}
    </>
  );
};
