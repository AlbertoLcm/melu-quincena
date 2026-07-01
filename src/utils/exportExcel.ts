import * as XLSX from 'xlsx';
import type { Period } from '../hooks/useFinanceData';

const BUCKET_LABELS: Record<string, string> = {
  needs: 'Necesidades',
  wants: 'Deseos',
  savings: 'Ahorros',
};

/** Apply column widths to a worksheet */
function setColWidths(ws: XLSX.WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map((w) => ({ wch: w }));
}

// ─── Tidy sheet builders ─────────────────────────────────────────────────────

type TidyRow = (string | number)[];

const TIDY_HEADER: string[] = [
  'ID Quincena',        // period.id
  'Período',            // "2026-06-01 – 2026-06-15"
  'Fecha inicio',       // ISO date of period start
  'Fecha fin',          // ISO date of period end
  'Ingreso',            // period income (number)
  'Bucket',             // "Necesidades" | "Deseos" | "Ahorros"
  'Presupuesto bucket', // income * allocation (number)
  'ID Gasto',           // expense.id
  'Fecha gasto',        // ISO date of expense
  'Categoría',
  'Descripción',
  'Monto',              // expense amount (number)
];

function periodLabel(p: Period) {
  return `${p.dateStart} – ${p.dateEnd}`;
}

/** Convert a single period into tidy rows (one per expense) */
function periodToTidyRows(p: Period): TidyRow[] {
  const rows: TidyRow[] = [];
  const buckets = ['needs', 'wants', 'savings'] as const;

  for (const b of buckets) {
    const budget = p.income * p.buckets[b].allocation;
    const label = BUCKET_LABELS[b];

    for (const e of p.buckets[b].expenses) {
      rows.push([
        p.id,
        periodLabel(p),
        p.dateStart,
        p.dateEnd,
        p.income,
        label,
        budget,
        e.id,
        e.date,
        e.category,
        e.name,
        e.amount,
      ]);
    }
  }

  // Sort within the period: by bucket order then expense date
  rows.sort((a, b) => {
    const bOrder = ['Necesidades', 'Deseos', 'Ahorros'];
    const bi = bOrder.indexOf(a[4] as string);
    const bj = bOrder.indexOf(b[4] as string);
    if (bi !== bj) return bi - bj;
    return (a[6] as string) < (b[6] as string) ? -1 : 1;
  });

  return rows;
}

/** Build the tidy expenses worksheet */
function buildTidySheet(periods: Period[]): XLSX.WorkSheet {
  const sorted = [...periods].sort((a, b) => (a.dateStart < b.dateStart ? -1 : 1));
  const rows: TidyRow[] = [];

  for (const p of sorted) {
    rows.push(...periodToTidyRows(p));
  }

  const ws = XLSX.utils.aoa_to_sheet([TIDY_HEADER, ...rows]);
  setColWidths(ws, [20, 24, 13, 13, 12, 14, 18, 20, 13, 18, 32, 12]);
  return ws;
}

// ─── Period summary sheet ────────────────────────────────────────────────────

const SUMMARY_HEADER: string[] = [
  'ID Quincena',
  'Período',
  'Fecha inicio',
  'Fecha fin',
  'Ingreso',
  'Presup. Necesidades',
  'Presup. Deseos',
  'Presup. Ahorros',
  'Gastado Necesidades',
  'Gastado Deseos',
  'Gastado Ahorros',
  'Total gastado',
  'Libre',
  '% Gastado',
];

function buildSummarySheet(periods: Period[]): XLSX.WorkSheet {
  const sorted = [...periods].sort((a, b) => (a.dateStart < b.dateStart ? -1 : 1));

  const rows: (string | number)[][] = sorted.map((p) => {
    const needsSpent = p.buckets.needs.expenses.reduce((s, e) => s + e.amount, 0);
    const wantsSpent = p.buckets.wants.expenses.reduce((s, e) => s + e.amount, 0);
    const savingsSpent = p.buckets.savings.expenses.reduce((s, e) => s + e.amount, 0);
    const totalSpent = needsSpent + wantsSpent + savingsSpent;

    return [
      p.id,
      periodLabel(p),
      p.dateStart,
      p.dateEnd,
      p.income,
      p.income * p.buckets.needs.allocation,
      p.income * p.buckets.wants.allocation,
      p.income * p.buckets.savings.allocation,
      needsSpent,
      wantsSpent,
      savingsSpent,
      totalSpent,
      p.income - totalSpent,
      p.income > 0 ? +((totalSpent / p.income) * 100).toFixed(1) : 0,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([SUMMARY_HEADER, ...rows]);
  setColWidths(ws, [20, 24, 13, 13, 12, 20, 16, 16, 20, 16, 16, 14, 12, 12]);
  return ws;
}

// ─── Public exports ──────────────────────────────────────────────────────────

/** Export a single period — tidy sheet + summary row */
export function exportPeriodToExcel(period: Period) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildTidySheet([period]), 'Gastos');
  XLSX.utils.book_append_sheet(wb, buildSummarySheet([period]), 'Resumen');

  const safeName = `${period.dateStart}_${period.dateEnd}`.replace(/[^0-9-]/g, '');
  XLSX.writeFile(wb, `quincena_${safeName}.xlsx`);
}

/** Export all periods — one tidy sheet with every expense + one summary sheet */
export function exportAllPeriodsToExcel(periods: Period[]) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildTidySheet(periods), 'Gastos');
  XLSX.utils.book_append_sheet(wb, buildSummarySheet(periods), 'Resumen');

  XLSX.writeFile(wb, `melu_quincenas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}


