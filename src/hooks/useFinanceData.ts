import { useState, useEffect, useRef } from 'react';
import { loadState, saveState } from './useIndexedDB';

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

export type FinanceState = {
  currentPeriod: Period | null;
  history: Period[];
};

const EMPTY_STATE: FinanceState = { currentPeriod: null, history: [] };

export function useFinanceData() {
  const [state, setState] = useState<FinanceState>(EMPTY_STATE);
  // true while the initial IndexedDB read is in-flight
  const [loading, setLoading] = useState(true);
  // skip the first save-to-DB triggered by the initial load
  const isFirstRender = useRef(true);

  // ── Load from IndexedDB on mount ─────────────────────────────────────────
  useEffect(() => {
    loadState<FinanceState>().then((saved) => {
      if (saved) setState(saved);
      setLoading(false);
    });
  }, []);

  // ── Persist every state change to IndexedDB ──────────────────────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // don't overwrite DB with the empty initial state
    }
    saveState(state);
  }, [state]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const startPeriod = (income: number, dateStart: string, dateEnd: string) => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const uuid = Math.random().toString(36).slice(2) + Date.now().toString(36);

    setState((prev) => {
      const newHistory = [...prev.history];
      if (prev.currentPeriod) {
        newHistory.unshift({ ...prev.currentPeriod, closedAt: todayISO });
        if (newHistory.length > 12) newHistory.length = 12; // keep last 12
      }

      return {
        history: newHistory,
        currentPeriod: {
          id: uuid,
          income,
          dateStart,
          dateEnd,
          createdAt: todayISO,
          buckets: {
            needs: { allocation: 0.5, expenses: [] },
            wants: { allocation: 0.3, expenses: [] },
            savings: { allocation: 0.2, expenses: [] },
          },
        },
      };
    });
  };

  const addExpense = (
    bucket: 'needs' | 'wants' | 'savings',
    expense: Omit<Expense, 'id' | 'date'>
  ) => {
    setState((prev) => {
      if (!prev.currentPeriod) return prev;

      const newExpense: Expense = {
        ...expense,
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        date: new Date().toISOString().slice(0, 10),
      };

      const updatedBuckets = { ...prev.currentPeriod.buckets };
      updatedBuckets[bucket] = {
        ...updatedBuckets[bucket],
        expenses: [newExpense, ...updatedBuckets[bucket].expenses],
      };

      return {
        ...prev,
        currentPeriod: { ...prev.currentPeriod, buckets: updatedBuckets },
      };
    });
  };

  const deleteExpense = (
    bucket: 'needs' | 'wants' | 'savings',
    expenseId: string
  ) => {
    setState((prev) => {
      if (!prev.currentPeriod) return prev;
      const updatedBuckets = { ...prev.currentPeriod.buckets };
      updatedBuckets[bucket] = {
        ...updatedBuckets[bucket],
        expenses: updatedBuckets[bucket].expenses.filter((e) => e.id !== expenseId),
      };

      return {
        ...prev,
        currentPeriod: { ...prev.currentPeriod, buckets: updatedBuckets },
      };
    });
  };

  return { state, loading, startPeriod, addExpense, deleteExpense };
}

