import { useState, useEffect } from 'react';

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

const STORAGE_KEY = 'qf_state';

export function useFinanceData() {
  const [state, setState] = useState<FinanceState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as FinanceState;
      }
    } catch (e) {
      console.warn('Failed to load state', e);
    }
    return { currentPeriod: null, history: [] };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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

  const addExpense = (bucket: 'needs' | 'wants' | 'savings', expense: Omit<Expense, 'id' | 'date'>) => {
    setState((prev) => {
      if (!prev.currentPeriod) return prev;
      
      const newExpense: Expense = {
        ...expense,
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        date: new Date().toISOString().slice(0, 10),
      };

      const updatedBuckets = { ...prev.currentPeriod.buckets };
      updatedBuckets[bucket].expenses = [newExpense, ...updatedBuckets[bucket].expenses];

      return {
        ...prev,
        currentPeriod: {
          ...prev.currentPeriod,
          buckets: updatedBuckets,
        },
      };
    });
  };

  const deleteExpense = (bucket: 'needs' | 'wants' | 'savings', expenseId: string) => {
    setState((prev) => {
      if (!prev.currentPeriod) return prev;
      const updatedBuckets = { ...prev.currentPeriod.buckets };
      updatedBuckets[bucket].expenses = updatedBuckets[bucket].expenses.filter((e) => e.id !== expenseId);

      return {
        ...prev,
        currentPeriod: {
          ...prev.currentPeriod,
          buckets: updatedBuckets,
        },
      };
    });
  };

  return {
    state,
    startPeriod,
    addExpense,
    deleteExpense,
  };
}
