/* =============================================
   QuincenaFlow — App Logic
   ============================================= */

'use strict';

// ─── State ───────────────────────────────────────────
const state = {
  currentPeriod: null,
  history: [],
};

// ─── Helpers ─────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(n || 0);

const fmtDate = (isoDate) => {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${+d} ${months[+m - 1]} ${y}`;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const daysRemaining = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diff = Math.ceil((end - today) / 86400000);
  return diff;
};

const uuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── Local Storage ───────────────────────────────────
function saveState() {
  localStorage.setItem('qf_state', JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem('qf_state');
    if (raw) {
      const parsed = JSON.parse(raw);
      state.currentPeriod = parsed.currentPeriod || null;
      state.history = parsed.history || [];
    }
  } catch (e) {
    console.warn('Failed to load state', e);
  }
}

// ─── Toast ───────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
  }, 3000);
}

// ─── Screen navigation ───────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ─── Setup screen ────────────────────────────────────
function initSetupScreen() {
  const today = todayISO();
  const dateStart = document.getElementById('date-start');
  const dateEnd = document.getElementById('date-end');

  // Default: current half-month period
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

  dateStart.value = `${year}-${String(month + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  dateEnd.value = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  document.getElementById('btn-start').addEventListener('click', startPeriod);

  // Allow Enter key on income input
  document.getElementById('income-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startPeriod();
  });
}

function startPeriod() {
  const incomeVal = parseFloat(document.getElementById('income-input').value);
  const dateStart = document.getElementById('date-start').value;
  const dateEnd = document.getElementById('date-end').value;

  if (!incomeVal || incomeVal <= 0) {
    showToast('Ingresa un monto válido para tu quincena', 'error');
    document.getElementById('income-input').focus();
    return;
  }

  if (!dateStart || !dateEnd) {
    showToast('Selecciona las fechas de tu quincena', 'error');
    return;
  }

  if (dateStart > dateEnd) {
    showToast('La fecha de inicio debe ser antes de la fecha fin', 'error');
    return;
  }

  // Save current period to history if exists
  if (state.currentPeriod) {
    state.history.unshift({ ...state.currentPeriod, closedAt: todayISO() });
    if (state.history.length > 12) state.history = state.history.slice(0, 12);
  }

  // Create new period
  state.currentPeriod = {
    id: uuid(),
    income: incomeVal,
    dateStart,
    dateEnd,
    createdAt: todayISO(),
    buckets: {
      needs: {
        allocation: 0.5,
        expenses: [],
      },
      wants: {
        allocation: 0.3,
        expenses: [],
      },
      savings: {
        allocation: 0.2,
        expenses: [],
      },
    },
  };

  saveState();
  showDashboard();
  showToast(`¡Quincena de ${fmt(incomeVal)} registrada! 🎉`, 'success');
}

// ─── Dashboard ───────────────────────────────────────
function showDashboard() {
  showScreen('screen-dashboard');
  updateDashboard();
}

function updateDashboard() {
  const p = state.currentPeriod;
  if (!p) return;

  const income = p.income;

  // Period bar
  document.getElementById('period-dates').textContent =
    `${fmtDate(p.dateStart)} → ${fmtDate(p.dateEnd)}`;
  document.getElementById('period-amount').textContent = fmt(income);

  // Bucket calculations
  const buckets = ['needs', 'wants', 'savings'];
  const totals = {};
  let totalSpent = 0;

  buckets.forEach((b) => {
    const budget = income * p.buckets[b].allocation;
    const spent = p.buckets[b].expenses.reduce((sum, e) => sum + e.amount, 0);
    totals[b] = { budget, spent, remaining: budget - spent };
    totalSpent += spent;
  });

  const totalRemaining = income - totalSpent;
  const spentPct = Math.min(100, (totalSpent / income) * 100);

  // Progress bar
  document.getElementById('period-progress-fill').style.width = `${spentPct}%`;
  document.getElementById('period-spent-pct').textContent = `${Math.round(spentPct)}% gastado`;

  // Stats
  document.getElementById('stat-available').textContent = fmt(income);
  document.getElementById('stat-spent').textContent = fmt(totalSpent);
  document.getElementById('stat-remaining').textContent = fmt(totalRemaining);

  const daysLeft = daysRemaining(p.dateEnd);
  const daysEl = document.getElementById('stat-days');
  if (daysLeft === null) {
    daysEl.textContent = '—';
  } else if (daysLeft < 0) {
    daysEl.textContent = 'Vencida';
    daysEl.style.color = 'var(--danger)';
  } else if (daysLeft === 0) {
    daysEl.textContent = 'Hoy';
    daysEl.style.color = 'var(--wants)';
  } else {
    daysEl.textContent = `${daysLeft} días`;
    daysEl.style.color = '';
  }

  // Donut chart
  updateDonut(totals, income);

  // Legend & budget info
  updateBucketInfo('needs', totals.needs);
  updateBucketInfo('wants', totals.wants);
  updateBucketInfo('savings', totals.savings);

  // Expenses lists
  renderExpenses('needs');
  renderExpenses('wants');
  renderExpenses('savings');
}

function updateDonut(totals, income) {
  const circumference = 2 * Math.PI * 80; // r=80
  const gap = 6;

  const needsSpent = Math.min(totals.needs.spent, totals.needs.budget);
  const wantsSpent = Math.min(totals.wants.spent, totals.wants.budget);
  const savingsSpent = Math.min(totals.savings.spent, totals.savings.budget);

  const needsArc = (needsSpent / income) * circumference;
  const wantsArc = (wantsSpent / income) * circumference;
  const savingsArc = (savingsSpent / income) * circumference;

  const needsOffset = 0;
  const wantsOffset = -(needsArc + gap);
  const savingsOffset = -(needsArc + gap + wantsArc + gap);

  const needs = document.getElementById('donut-needs');
  const wants = document.getElementById('donut-wants');
  const savings = document.getElementById('donut-savings');

  needs.style.strokeDasharray = `${Math.max(0, needsArc - gap)} ${circumference}`;
  needs.style.strokeDashoffset = `${needsOffset}`;

  wants.style.strokeDasharray = `${Math.max(0, wantsArc - gap)} ${circumference}`;
  wants.style.strokeDashoffset = `${wantsOffset}`;

  savings.style.strokeDasharray = `${Math.max(0, savingsArc - gap)} ${circumference}`;
  savings.style.strokeDashoffset = `${savingsOffset}`;

  // Center value
  const totalSpent = totals.needs.spent + totals.wants.spent + totals.savings.spent;
  document.getElementById('donut-center-value').textContent = fmt(income - totalSpent).replace('MX$', '$');

  // Legend values
  document.getElementById('legend-needs-val').textContent = `${fmt(totals.needs.spent)} de ${fmt(totals.needs.budget)}`;
  document.getElementById('legend-wants-val').textContent = `${fmt(totals.wants.spent)} de ${fmt(totals.wants.budget)}`;
  document.getElementById('legend-savings-val').textContent = `${fmt(totals.savings.spent)} de ${fmt(totals.savings.budget)}`;
}

function updateBucketInfo(bucket, data) {
  const { budget, spent, remaining } = data;
  const usedPct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  document.getElementById(`${bucket}-budget`).textContent = fmt(budget);
  document.getElementById(`${bucket}-spent`).textContent = fmt(spent);
  document.getElementById(`${bucket}-remaining`).textContent = fmt(Math.max(0, remaining));
  document.getElementById(`${bucket}-used-pct`).textContent = `${Math.round(usedPct)}%`;

  // Ring
  const circumference = 2 * Math.PI * 25; // r=25
  const ringEl = document.getElementById(`${bucket}-ring`);
  const arc = (usedPct / 100) * circumference;
  ringEl.style.strokeDasharray = `${arc} ${circumference}`;

  // Color warning
  if (usedPct >= 100) {
    ringEl.style.stroke = 'var(--danger)';
    document.getElementById(`${bucket}-used-pct`).style.color = 'var(--danger)';
  } else {
    ringEl.style.stroke = '';
    document.getElementById(`${bucket}-used-pct`).style.color = '';
  }
}

// ─── Expense management ──────────────────────────────
function addExpense(bucket) {
  const nameEl = document.getElementById(`${bucket}-exp-name`);
  const amountEl = document.getElementById(`${bucket}-exp-amount`);
  const catEl = document.getElementById(`${bucket}-exp-cat`);

  const name = nameEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const category = catEl.value;

  if (!name) {
    showToast('Ingresa una descripción para el gasto', 'error');
    nameEl.focus();
    return;
  }

  if (!amount || amount <= 0) {
    showToast('Ingresa un monto válido', 'error');
    amountEl.focus();
    return;
  }

  const p = state.currentPeriod;
  const budget = p.income * p.buckets[bucket].allocation;
  const currentSpent = p.buckets[bucket].expenses.reduce((s, e) => s + e.amount, 0);

  if (currentSpent + amount > budget) {
    const excess = fmt(currentSpent + amount - budget);
    showToast(`⚠️ Excederás el presupuesto en ${excess}`, 'error');
  }

  const expense = {
    id: uuid(),
    name,
    amount,
    category,
    date: todayISO(),
  };

  state.currentPeriod.buckets[bucket].expenses.unshift(expense);
  saveState();
  updateDashboard();

  nameEl.value = '';
  amountEl.value = '';
  nameEl.focus();

  showToast(`${category} agregado: ${fmt(amount)}`, 'success');
}

// ─── Render expenses ─────────────────────────────────
function renderExpenses(bucket) {
  const container = document.getElementById(`${bucket}-expenses`);
  const expenses = state.currentPeriod?.buckets[bucket]?.expenses || [];

  if (expenses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${bucket === 'needs' ? '🏠' : bucket === 'wants' ? '✨' : '💎'}</div>
        <div class="empty-text">Aún no hay gastos registrados aquí</div>
      </div>`;
    return;
  }

  const colorVar = bucket === 'needs' ? 'var(--needs)' : bucket === 'wants' ? 'var(--wants)' : 'var(--savings)';

  container.innerHTML = expenses
    .map(
      (e) => `
      <div class="expense-item" id="exp-${e.id}">
        <span class="expense-cat-badge">${e.category}</span>
        <span class="expense-name">${escapeHtml(e.name)}</span>
        <span class="expense-date">${fmtDate(e.date)}</span>
        <span class="expense-amount" style="color:${colorVar}">${fmt(e.amount)}</span>
        <button class="expense-delete" onclick="confirmDelete('${bucket}', '${e.id}')" title="Eliminar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </div>`
    )
    .join('');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Delete confirm ──────────────────────────────────
let pendingDelete = null;

function confirmDelete(bucket, id) {
  pendingDelete = { bucket, id };
  const modal = document.getElementById('modal-confirm');
  modal.classList.add('visible');
}

document.getElementById('modal-cancel').addEventListener('click', () => {
  document.getElementById('modal-confirm').classList.remove('visible');
  pendingDelete = null;
});

document.getElementById('modal-confirm-btn').addEventListener('click', () => {
  if (pendingDelete) {
    const { bucket, id } = pendingDelete;
    const expenses = state.currentPeriod.buckets[bucket].expenses;
    const idx = expenses.findIndex((e) => e.id === id);
    if (idx !== -1) {
      expenses.splice(idx, 1);
      saveState();
      updateDashboard();
      showToast('Gasto eliminado', 'info');
    }
  }
  document.getElementById('modal-confirm').classList.remove('visible');
  pendingDelete = null;
});

// Close modal on overlay click
document.getElementById('modal-confirm').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById('modal-confirm').classList.remove('visible');
    pendingDelete = null;
  }
});

// ─── Tab switching ───────────────────────────────────
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.bucket-panel').forEach((p) => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(`panel-${tab}`).classList.add('active');
  });
});

// ─── Legend click → switch tab ───────────────────────
document.querySelectorAll('.legend-item').forEach((item) => {
  item.addEventListener('click', () => {
    const bucket = item.dataset.bucket;
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.bucket-panel').forEach((p) => p.classList.remove('active'));
    document.querySelector(`.tab-${bucket}`).classList.add('active');
    document.getElementById(`panel-${bucket}`).classList.add('active');
  });
});

// ─── History ─────────────────────────────────────────
function showHistory() {
  renderHistory();
  showScreen('screen-history');
}

function renderHistory() {
  const container = document.getElementById('history-list');
  const allPeriods = [];

  if (state.currentPeriod) allPeriods.push({ ...state.currentPeriod, isCurrent: true });
  allPeriods.push(...state.history.map((h) => ({ ...h, isCurrent: false })));

  if (allPeriods.length === 0) {
    container.innerHTML = `
      <div class="empty-history">
        <div class="empty-history-icon">📊</div>
        <div class="empty-history-text">Aún no tienes quincenas registradas</div>
      </div>`;
    return;
  }

  container.innerHTML = allPeriods
    .map((p) => {
      const income = p.income;
      const needsSpent = p.buckets.needs.expenses.reduce((s, e) => s + e.amount, 0);
      const wantsSpent = p.buckets.wants.expenses.reduce((s, e) => s + e.amount, 0);
      const savingsSpent = p.buckets.savings.expenses.reduce((s, e) => s + e.amount, 0);
      const totalSpent = needsSpent + wantsSpent + savingsSpent;

      const needsPct = (needsSpent / income) * 100;
      const wantsPct = (wantsSpent / income) * 100;
      const savingsPct = (savingsSpent / income) * 100;

      const totalExp = (p.buckets.needs.expenses.length + p.buckets.wants.expenses.length + p.buckets.savings.expenses.length);

      return `
        <div class="history-card" onclick="${p.isCurrent ? "showDashboard()" : ''}">
          <div class="history-card-top">
            <div>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
                <span style="font-weight:700;font-size:16px">${fmtDate(p.dateStart)} — ${fmtDate(p.dateEnd)}</span>
                ${p.isCurrent ? '<span style="background:var(--needs-muted);color:var(--needs);font-size:11px;font-weight:700;padding:2px 10px;border-radius:100px">ACTIVA</span>' : ''}
              </div>
              <div class="history-period">${totalExp} gastos registrados</div>
            </div>
            <div class="history-amount">${fmt(income)}</div>
          </div>
          <div class="history-bars">
            <div class="history-bar-needs" style="width:${needsPct}%"></div>
            <div class="history-bar-wants" style="width:${wantsPct}%"></div>
            <div class="history-bar-savings" style="width:${savingsPct}%"></div>
            <div class="history-bar-remaining"></div>
          </div>
          <div class="history-stats">
            <div class="history-stat">
              <span class="history-stat-label">Necesidades</span>
              <span class="history-stat-val" style="color:var(--needs)">${fmt(needsSpent)}</span>
            </div>
            <div class="history-stat">
              <span class="history-stat-label">Deseos</span>
              <span class="history-stat-val" style="color:var(--wants)">${fmt(wantsSpent)}</span>
            </div>
            <div class="history-stat">
              <span class="history-stat-label">Ahorros</span>
              <span class="history-stat-val" style="color:var(--savings)">${fmt(savingsSpent)}</span>
            </div>
            <div class="history-stat">
              <span class="history-stat-label">Saldo libre</span>
              <span class="history-stat-val">${fmt(income - totalSpent)}</span>
            </div>
          </div>
        </div>`;
    })
    .join('');
}

// ─── Header buttons ──────────────────────────────────
document.getElementById('btn-history').addEventListener('click', showHistory);
document.getElementById('btn-back-from-history').addEventListener('click', () => {
  if (state.currentPeriod) showDashboard();
  else showScreen('screen-setup');
});

document.getElementById('btn-new-period').addEventListener('click', () => {
  document.getElementById('income-input').value = '';
  showScreen('screen-setup');
  initSetupScreen();
});

// ─── Keyboard shortcuts ──────────────────────────────
document.addEventListener('keydown', (e) => {
  // Enter in expense inputs
  if (e.key === 'Enter' && e.target.classList.contains('exp-amount-input')) {
    const panel = e.target.closest('.bucket-panel');
    if (panel) {
      const bucket = panel.id.replace('panel-', '');
      addExpense(bucket);
    }
  }
  if (e.key === 'Escape') {
    document.getElementById('modal-confirm').classList.remove('visible');
    pendingDelete = null;
  }
});

// ─── Boot ────────────────────────────────────────────
function boot() {
  loadState();
  initSetupScreen();

  if (state.currentPeriod) {
    showDashboard();
  } else {
    showScreen('screen-setup');
  }
}

boot();
