const MON = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const x = parseFloat(String(v).replace(/,/g, ''));
  return Number.isNaN(x) ? null : x;
};
export const n0 = (v) => Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
export const n2 = (v) => Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const lakh = (v) => n2((v || 0) / 1e5);

// Any date-ish value -> 'YYYY-MM-DD' (IST aware for ISO strings with a zone)
export function toYMD(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date) v = v.toISOString();
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return s;
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ]\d{2}:\d{2}/);
  if (m) {
    if (/Z$|[+-]\d\d:?\d\d$/.test(s)) {
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) return new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);
    }
    return `${m[1]}-${m[2]}-${m[3]}`;
  }
  m = s.match(/^([A-Za-z]{3,9})[\s\-/,]+(\d{4})$/);
  if (m) {
    const i = MON.indexOf(m[1].slice(0, 3).toLowerCase());
    if (i >= 0) return `${m[2]}-${String(i + 1).padStart(2, '0')}-01`;
  }
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return '';
}
export const monthOf = (v) => toYMD(v).slice(0, 7);
export const monthLabel = (k) => {
  if (k === 'ALL') return 'All time';
  if (!k) return '';
  const [y, m] = k.split('-');
  return `${MN[+m - 1]} ${y}`;
};
export const shortDay = (ymd) => `${ymd.slice(8, 10)}-${MN[+ymd.slice(5, 7) - 1]}`;
export function prevMonth(k) {
  let [y, m] = k.split('-').map(Number);
  m -= 1;
  if (m === 0) { m = 12; y -= 1; }
  return `${y}-${String(m).padStart(2, '0')}`;
}
export function addMonths(k, n) {
  let [y, m] = k.split('-').map(Number);
  m += n;
  while (m > 12) { m -= 12; y += 1; }
  while (m < 1) { m += 12; y -= 1; }
  return `${y}-${String(m).padStart(2, '0')}`;
}
export const fyStart = (k) => {
  const [y, m] = k.split('-').map(Number);
  return `${m >= 4 ? y : y - 1}-04`;
};
export const pctChange = (a, b) => (b ? ((a - b) / b) * 100 : null);
export const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
export const daysBetween = (fromYmd, toYmd) => {
  if (!fromYmd) return 0;
  const a = Date.UTC(+fromYmd.slice(0, 4), +fromYmd.slice(5, 7) - 1, +fromYmd.slice(8, 10));
  const b = Date.UTC(+toYmd.slice(0, 4), +toYmd.slice(5, 7) - 1, +toYmd.slice(8, 10));
  return Math.round((b - a) / 86400000);
};
