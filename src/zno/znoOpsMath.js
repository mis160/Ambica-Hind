// Small calculation helpers for the ZNO operations screens (kept apart so they are easy to check).

export const sum = (list, key) => list.reduce((a, r) => a + (Number(r[key]) || 0), 0);

export const n0 = (n) => (Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—');
export const n1 = (n) => (Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : '—');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  return m ? `${m[3]}-${MONTHS[Number(m[2]) - 1]}-${m[1]}` : s || '—';
};

const inPeriod = (monthKey, key) => key === 'ALL' || monthKey === key;

// Production, despatch and lab tests for one month (or all months when key is 'ALL')
export function periodTotals(months, key) {
  const rows = months.filter((m) => inPeriod(m.monthKey, key));
  const produced = sum(rows, 'produced');
  const despatched = sum(rows, 'despatched');
  return {
    produced,
    p5: sum(rows, 'p5'),
    p7: sum(rows, 'p7'),
    despatched,
    net: produced - despatched,
    labTests: sum(rows, 'labTests')
  };
}

// Adds rows of the same name together (used for sellers / grades / units over one month or all months)
export function groupSum(list, key, nameKey, qtyKey = 'qty') {
  const map = {};
  list.forEach((r) => {
    if (!inPeriod(r.monthKey, key)) return;
    const name = r[nameKey];
    if (!map[name]) map[name] = { name, qty: 0, count: 0 };
    map[name].qty += Number(r[qtyKey]) || 0;
    map[name].count += Number(r.count) || 0;
  });
  return Object.values(map).sort((a, b) => b.qty - a.qty);
}

// "1000 GRADE, 500 GRADE"  ->  ['1000 GRADE', '500 GRADE'];   "-" -> []
export function gradeList(text) {
  const t = String(text || '').trim();
  if (!t || t === '-') return [];
  return t.split(',').map((x) => x.trim()).filter(Boolean);
}

// What a lab status means for colouring: awaiting / normal / passed / other
export function statusKind(status) {
  const s = String(status || '').toUpperCase();
  if (s.indexOf('AWAITING') >= 0) return 'awaiting';
  if (s.indexOf('NORMAL') >= 0) return 'normal';
  if (s.indexOf('PASSED') >= 0) return 'passed';
  return 'other';
}

const unitFamily = (unit) => String(unit || '').trim().toUpperCase().slice(0, 2);

export function matchesUnit(unit, filter) {
  return filter === 'ALL' || unitFamily(unit) === filter;
}

export function matchesSearch(text, search) {
  const q = String(search || '').trim().toUpperCase();
  return !q || String(text || '').toUpperCase().indexOf(q) >= 0;
}

const PALETTE = ['#2563eb', '#0d9488', '#16a34a', '#65a30d', '#ca8a04', '#ea580c', '#9333ea', '#64748b', '#b45309'];
export function gradeColor(name, allGrades) {
  if (String(name).toUpperCase() === 'NORMAL GRADE') return '#475569';
  const i = allGrades.indexOf(name);
  return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
}
