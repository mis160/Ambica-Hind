// Helpers for the month-wise sales dashboards (PAN India + Raipur)

const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON = MN.map((m) => m.slice(0, 3));

export const pad = (n) => String(n).padStart(2, '0');
export const mKey = (y, m) => `${y}-${pad(m)}`;
export const keyParts = (k) => {
  const [y, m] = k.split('-').map(Number);
  return { y, m };
};
export const fyOf = (y, m) => (m >= 4 ? y : y - 1);
export const fyLabel = (fy) => `FY ${fy}-${pad((fy + 1) % 100)}`;
export const monthLong = (k) => {
  const { y, m } = keyParts(k);
  return `${MN[m - 1]} ${y}`;
};
export const monthShort = (k) => {
  const { y, m } = keyParts(k);
  return `${MON[m - 1]}-${pad(y % 100)}`;
};
// Apr .. Mar for a financial year
export const fyMonths = (fy) =>
  Array.from({ length: 12 }, (_, i) => {
    const m = ((3 + i) % 12) + 1;
    return mKey(m >= 4 ? fy : fy + 1, m);
  });
export const prevMonth = (k) => {
  let { y, m } = keyParts(k);
  m -= 1;
  if (m < 1) { m = 12; y -= 1; }
  return mKey(y, m);
};

// Sheet dates may come as ISO strings (UTC), yyyy-mm-dd, dd/mm/yyyy or 31-Oct-2026.
// Apps Script serialises IST midnight as the previous day 18:30Z, so shift by +5:30.
const toIst = (dt) => {
  const t = new Date(dt.getTime() + 330 * 60000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
};
export function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v) ? null : toIst(v);
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return { y: +m[1], m: +m[2], d: +m[3] };
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const dt = new Date(s);
    return isNaN(dt) ? null : toIst(dt);
  }
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += 2000;
    return { y, m: +m[2], d: +m[1] };
  }
  m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3})[A-Za-z]*[\s,-]+(\d{2,4})$/);
  if (m) {
    const mi = MON.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
    if (mi >= 0) {
      let y = +m[3];
      if (y < 100) y += 2000;
      return { y, m: mi + 1, d: +m[1] };
    }
  }
  const dt = new Date(s);
  return isNaN(dt) ? null : toIst(dt);
}
export const dateText = (d) => (d ? `${pad(d.d)}-${MON[d.m - 1]}-${d.y}` : '');

// Attach parsed date / month / FY / stream to every row
export function prepRows(rows, streamId) {
  return (rows || [])
    .map((r) => {
      const d = parseDate(r.date);
      if (!d) return null;
      return {
        ...r,
        _s: streamId,
        _d: d,
        _ds: d.y * 10000 + d.m * 100 + d.d,
        _mk: mKey(d.y, d.m),
        _fy: fyOf(d.y, d.m),
        _kg: Number(r.qty) || 0,
        _val: Number(r.value) || 0
      };
    })
    .filter(Boolean);
}

// Totals: qty in MT, value in ₹ Lakh, rate in ₹/KG (value ÷ qty)
export function sumRows(rows) {
  let kg = 0, val = 0;
  const cust = new Set();
  rows.forEach((r) => { kg += r._kg; val += r._val; cust.add(r.customer || 'Unknown'); });
  return { qty: kg / 1000, value: val / 100000, rate: kg ? val / kg : 0, entries: rows.length, customers: cust.size };
}

export function groupRows(rows, keyFn) {
  const map = new Map();
  rows.forEach((r) => {
    const k = keyFn(r);
    const o = map.get(k) || { name: k, kg: 0, val: 0, entries: 0 };
    o.kg += r._kg; o.val += r._val; o.entries += 1;
    map.set(k, o);
  });
  return [...map.values()]
    .map((o) => ({ name: o.name, qty: o.kg / 1000, value: o.val / 100000, rate: o.kg ? o.val / o.kg : 0, entries: o.entries }))
    .sort((a, b) => b.qty - a.qty);
}

export const num = (v, d = 2) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pctChange = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);

export function downloadCsv(filename, header, lines) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [header, ...lines].map((row) => row.map(esc).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
