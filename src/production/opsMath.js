import { toYMD, num, monthOf, addMonths, todayIST, daysBetween } from './prodUtils.js';

const S = (v) => String(v === null || v === undefined ? '' : v).trim();
const U = (v) => S(v).toUpperCase();
export const NORMAL = 'NORMAL GRADE';

/* ---------- grade specification ---------- */
export function parseLimit(raw) {
  const s = U(raw);
  if (!s || s === '-') return null;
  let m = s.match(/^MIN\s*([\d.]+)$/); if (m) return { min: +m[1] };
  m = s.match(/^MAX\s*([\d.]+)$/); if (m) return { max: +m[1] };
  m = s.match(/^([\d.]+)\s*-\s*([\d.]+)$/); if (m) return { min: +m[1], max: +m[2] };
  m = s.match(/^(?:<=?|≤)\s*([\d.]+)$/); if (m) return { max: +m[1] };
  m = s.match(/^(?:>=?|≥)\s*([\d.]+)$/); if (m) return { min: +m[1] };
  return { text: s };
}
function passTest(val, lim) {
  if (lim.text !== undefined) return U(val) === lim.text;
  const x = num(val);
  if (x === null) return false;
  if (lim.min !== undefined && x < lim.min - 1e-9) return false;
  if (lim.max !== undefined && x > lim.max + 1e-9) return false;
  return true;
}
export function buildSpec(specRows) {
  const grades = (specRows || []).filter((r) => S(r.GRADE)).map((r) => {
    const limits = {};
    Object.keys(r).forEach((t) => {
      if (t === 'GRADE') return;
      const lim = parseLimit(r[t]);
      if (lim) limits[t] = { raw: S(r[t]), lim };
    });
    return { name: U(r.GRADE), limits };
  });
  return { grades };
}
// optional (not compulsory) tests that were not done are not counted
export function evalLot(row, spec, compulsory) {
  const passes = [];
  const reasons = {};
  const add = (t, v, g, raw) => {
    if (!reasons[t]) reasons[t] = { test: t, value: v, grades: [] };
    reasons[t].grades.push({ grade: g, limit: raw });
  };
  spec.grades.forEach((g) => {
    let ok = true;
    Object.keys(g.limits).forEach((t) => {
      const { raw, lim } = g.limits[t];
      const v = row[t];
      if (S(v) === '') {
        if (compulsory[t]) { ok = false; add(t, 'not done', g.name, raw); }
        return;
      }
      if (!passTest(v, lim)) { ok = false; add(t, v, g.name, raw); }
    });
    if (ok) passes.push(g.name);
  });
  return { passes, reasons: Object.values(reasons) };
}

/* ---------- whole model ---------- */
export function buildOps(d) {
  const spec = buildSpec(d.spec);
  const compulsory = {};
  (d.params || []).forEach((p) => { compulsory[S(p.name)] = U(p.compulsory) === 'YES'; });
  const today = todayIST();
  const gradeNames = spec.grades.map((g) => g.name);

  // production
  const prodRows = [];
  const batches = {};
  (d.production || []).forEach((r) => {
    const b = S(r.Batch_Number);
    if (!b) return;
    const q = num(r.Produced_Qty) || 0;
    const date = toYMD(r.Date);
    const isExtra = /EXTRA AT DESPATCH/i.test(S(r.Remarks));
    prodRows.push({ batch: b, date, qty: q, unit: S(r.Unit) });
    const x = batches[b] || (batches[b] = { batch: b, unit: S(r.Unit), date, hand: 0, extra: 0, desp: 0 });
    if (date && (!x.date || date < x.date)) x.date = date;
    if (isExtra) x.extra += q; else x.hand += q;
  });

  // despatch
  const desp = (d.despatch || []).map((r) => ({
    batch: S(r.Batch_Number), date: toYMD(r.Date), qty: num(r.Despatched_Qty) || 0, seller: S(r.Seller_Name),
    grade: U(r.Grade) || 'UNGRADED', extra: num(r.Extra_Qty_Added) || 0, reason: S(r.Extra_Reason),
    labStatus: U(r.Lab_Status_At_Despatch),
    t: [r['Desp_Test ZnO %'], r['Desp_Test Pb %'], r['Desp_Test Moisture %'], r['Desp_Test Calcination loss %'], r['Desp_Test HCl insoluble %'], r['Desp_Test Sieve %']],
    testGrades: S(r.Desp_Test_Grades_Passed).split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
  })).filter((x) => x.batch);
  desp.forEach((x) => { if (batches[x.batch]) batches[x.batch].desp += x.qty; });

  // latest lab test per batch
  const labBy = {};
  (d.lab || []).forEach((r) => {
    const b = S(r.Batch_Number);
    if (!b) return;
    const sl = num(r.Sl_No) || 0;
    if (!labBy[b] || sl >= labBy[b].sl) labBy[b] = { sl, row: r };
  });
  Object.values(labBy).forEach((x) => { x.ev = evalLot(x.row, spec, compulsory); });

  // stock book
  const book = Object.values(batches).map((b) => {
    const produced = b.hand + b.extra;
    const left = Math.round((produced - b.desp) * 1000) / 1000;
    const lab = labBy[b.batch];
    const passes = lab ? lab.ev.passes : [];
    return {
      ...b, produced, left, age: daysBetween(b.date, today), tested: !!lab,
      serial: lab ? S(lab.row.Serial_Number) : '-',
      passes, eligible: lab ? (passes.length ? passes : [NORMAL]) : [],
    };
  }).sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.batch.localeCompare(a.batch));

  const lots = book.filter((b) => b.left > 0).sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.batch.localeCompare(b.batch));
  const bookBy = {};
  book.forEach((b) => { bookBy[b.batch] = b; });

  // extra qty + concerns
  const extras = [];
  const concerns = [];
  desp.forEach((x) => {
    const lab = labBy[x.batch];
    const labPasses = lab ? (lab.ev.passes.length ? lab.ev.passes : [NORMAL]) : null;
    if (x.extra > 0) {
      let actual;
      if (labPasses) {
        const both = labPasses.filter((g) => x.testGrades.includes(g));
        actual = both.length ? both : [NORMAL];
      } else actual = x.testGrades.length ? x.testGrades : [NORMAL];
      const okSold = x.grade === NORMAL || actual.includes(x.grade);
      extras.push({ ...x, labPasses, actual, final: !!labPasses, okSold });
      if (labPasses && !okSold) concerns.push({ ...x, shown: actual, via: 'lab + despatch test' });
    } else if (labPasses && x.grade !== NORMAL && x.grade !== 'UNGRADED' && !labPasses.includes(x.grade)) {
      concerns.push({ ...x, shown: labPasses, via: 'lab' });
    }
  });

  // lab report rows (latest per batch)
  const labRows = Object.keys(labBy).map((b) => {
    const l = labBy[b];
    const bk = bookBy[b] || {};
    return {
      batch: b, serial: S(l.row.Serial_Number), sl: l.sl, date: toYMD(l.row.Date), unit: S(l.row.Unit_Type) || bk.unit || '',
      produced: bk.produced || 0, left: bk.left || 0, row: l.row, passes: l.ev.passes, reasons: l.ev.reasons,
    };
  }).sort((a, b) => b.sl - a.sl);

  // stock by grade (open lots)
  const byGrade = gradeNames.map((g) => {
    const L = lots.filter((x) => x.tested && x.passes.includes(g));
    return { grade: g, qty: L.reduce((a, x) => a + x.left, 0), lots: L.length };
  });
  const nl = lots.filter((x) => x.tested && !x.passes.length);
  byGrade.push({ grade: NORMAL, qty: nl.reduce((a, x) => a + x.left, 0), lots: nl.length });

  // months
  const allDates = [...prodRows.map((r) => r.date), ...desp.map((r) => r.date)].filter(Boolean).sort();
  const first = allDates.length ? allDates[0].slice(0, 7) : todayIST().slice(0, 7);
  const lastD = allDates.length ? allDates[allDates.length - 1].slice(0, 7) : first;
  const months = [];
  for (let m = first; m <= lastD || months.length < 1; m = addMonths(m, 1)) months.push(m);

  const labRowsAll = (d.lab || []).map((r) => ({ date: toYMD(r.Date) }));
  return {
    today, spec, gradeNames, prodRows, desp, book, lots, extras, concerns, labRows, byGrade, months, labAll: labRowsAll,
    noLabDespatched: desp.filter((x) => !labBy[x.batch]),
    latestLab: Object.values(labBy).sort((a, b) => b.sl - a.sl).slice(0, 10).map((l) => ({
      batch: S(l.row.Batch_Number), serial: S(l.row.Serial_Number), date: toYMD(l.row.Date), passes: l.ev.passes,
    })),
  };
}

export function periodStats(m, key) {
  const inP = (date) => key === 'ALL' || monthOf(date) === key;
  const pr = m.prodRows.filter((r) => inP(r.date));
  const ds = m.desp.filter((r) => inP(r.date));
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const by = (arr, kf, vf) => {
    const o = {};
    arr.forEach((x) => { const k = kf(x); o[k] = o[k] || { k, qty: 0, n: 0 }; o[k].qty += vf(x); o[k].n += 1; });
    return Object.values(o).sort((a, b) => b.qty - a.qty);
  };
  return {
    produced: sum(pr, (r) => r.qty),
    p5: sum(pr.filter((r) => /^P5/i.test(r.unit)), (r) => r.qty),
    p7: sum(pr.filter((r) => /^P7/i.test(r.unit)), (r) => r.qty),
    despatched: sum(ds, (r) => r.qty),
    extra: sum(ds, (r) => r.extra),
    beforeLab: sum(ds.filter((r) => r.labStatus.indexOf('BEFORE') === 0), (r) => r.qty),
    labTests: m.labAll.filter((r) => inP(r.date)).length,
    sellers: by(ds, (r) => r.seller || 'Unknown', (r) => r.qty),
    grades: by(ds, (r) => r.grade, (r) => r.qty),
    extras: m.extras.filter((r) => inP(r.date)),
  };
}
