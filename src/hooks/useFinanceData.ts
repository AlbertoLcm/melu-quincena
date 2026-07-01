import { useState, useEffect, useRef } from 'react';
import {
  getAllPeriods,
  savePeriod,
  deletePeriodFromDB,
  getCurrentPeriodId,
  setCurrentPeriodId,
} from './useIndexedDB';

export type Expense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
};

export type BucketData = {
  allocation: number; // e.g. 0.5 for 50%
  expenses: Expense[];
};

export type Period = {
  id: string;
  income: number;
  dateStart: string;
  dateEnd: string;
  createdAt: string;
  closedAt?: string;
  buckets: {
    needs: BucketData;
    wants: BucketData;
    savings: BucketData;
  };
};

/** Legacy shape used only for migration type reference in useIndexedDB */
export type FinanceState = {
  currentPeriod: Period | null;
  history: Period[];
};

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useFinanceData() {
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [history, setHistory] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const isFirstRender = useRef(true);

  // ── Load from IndexedDB on mount ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [allPeriods, currentId] = await Promise.all([
        getAllPeriods(),
        getCurrentPeriodId(),
      ]);

      const active = currentId ? allPeriods.find((p) => p.id === currentId) ?? null : null;
      const hist = allPeriods
        .filter((p) => p.id !== currentId)
        .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

      setCurrentPeriod(active);
      setHistory(hist);
      setLoading(false);
      isFirstRender.current = false;
    })();
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  const startPeriod = async (income: number, dateStart: string, dateEnd: string) => {
    const todayISO = new Date().toISOString().slice(0, 10);

    // Close the current period and push to history
    if (currentPeriod) {
      const closed = { ...currentPeriod, closedAt: todayISO };
      await savePeriod(closed);
      setHistory((prev) => [closed, ...prev]);
    }

    const newPeriod: Period = {
      id: genId(),
      income,
      dateStart,
      dateEnd,
      createdAt: todayISO,
      buckets: {
        needs: { allocation: 0.5, expenses: [] },
        wants: { allocation: 0.3, expenses: [] },
        savings: { allocation: 0.2, expenses: [] },
      },
    };

    await savePeriod(newPeriod);
    await setCurrentPeriodId(newPeriod.id);
    setCurrentPeriod(newPeriod);
  };

  const addExpense = async (
    bucket: 'needs' | 'wants' | 'savings',
    expense: Omit<Expense, 'id' | 'date'>
  ) => {
    if (!currentPeriod) return;

    const newExpense: Expense = {
      ...expense,
      id: genId(),
      date: new Date().toISOString().slice(0, 10),
    };

    const updated: Period = {
      ...currentPeriod,
      buckets: {
        ...currentPeriod.buckets,
        [bucket]: {
          ...currentPeriod.buckets[bucket],
          expenses: [newExpense, ...currentPeriod.buckets[bucket].expenses],
        },
      },
    };

    await savePeriod(updated);
    setCurrentPeriod(updated);
  };

  const deleteExpense = async (
    bucket: 'needs' | 'wants' | 'savings',
    expenseId: string
  ) => {
    if (!currentPeriod) return;

    const updated: Period = {
      ...currentPeriod,
      buckets: {
        ...currentPeriod.buckets,
        [bucket]: {
          ...currentPeriod.buckets[bucket],
          expenses: currentPeriod.buckets[bucket].expenses.filter((e) => e.id !== expenseId),
        },
      },
    };

    await savePeriod(updated);
    setCurrentPeriod(updated);
  };

  /** Update income / dates of ANY period (current or history) */
  const updatePeriod = async (
    id: string,
    patch: Partial<Pick<Period, 'income' | 'dateStart' | 'dateEnd'>>
  ) => {
    if (currentPeriod && currentPeriod.id === id) {
      const updated = { ...currentPeriod, ...patch };
      await savePeriod(updated);
      setCurrentPeriod(updated);
    } else {
      setHistory((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const updated = { ...p, ...patch };
          savePeriod(updated);
          return updated;
        })
      );
    }
  };

  /** Delete any period (history only — cannot delete the active one directly) */
  const deletePeriod = async (id: string) => {
    await deletePeriodFromDB(id);
    if (currentPeriod && currentPeriod.id === id) {
      await setCurrentPeriodId(null);
      setCurrentPeriod(null);
    } else {
      setHistory((prev) => prev.filter((p) => p.id !== id));
    }
  };

  /** Promote a historical period to become the active current period */
  const setActivePeriod = async (id: string) => {
    const target = history.find((p) => p.id === id);
    if (!target) return;

    // Archive the current period if there is one
    if (currentPeriod) {
      const closed = { ...currentPeriod, closedAt: new Date().toISOString().slice(0, 10) };
      await savePeriod(closed);
      setHistory((prev) => [closed, ...prev.filter((p) => p.id !== id)]);
    } else {
      setHistory((prev) => prev.filter((p) => p.id !== id));
    }

    // Remove closedAt from the promoted period
    const activated = { ...target, closedAt: undefined };
    await savePeriod(activated);
    await setCurrentPeriodId(id);
    setCurrentPeriod(activated);
  };

  return {
    state: { currentPeriod, history },
    loading,
    startPeriod,
    addExpense,
    deleteExpense,
    updatePeriod,
    deletePeriod,
    setActivePeriod,
  };
}
