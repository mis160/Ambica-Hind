import React, { useEffect, useState } from 'react';
import { monthLabel, pctChange } from './prodUtils.js';
import './ProductionZone.css';

export function useJson(url, enabled = true) {
  const [st, setSt] = useState({ data: null, loading: false, error: '' });
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!enabled) return undefined;
    if (!url || url.startsWith('PASTE')) {
      setSt({ data: null, loading: false, error: 'Data URL not set yet - add it in src/production/prodConfig.js' });
      return undefined;
    }
    let off = false;
    setSt((s) => ({ ...s, loading: true, error: '' }));
    fetch(url)
      .then((r) => { if (!r.ok) throw new Error('Server responded with status ' + r.status); return r.json(); })
      .then((d) => { if (d && d.error) throw new Error(d.error); if (!off) setSt({ data: d, loading: false, error: '' }); })
      .catch((e) => { if (!off) setSt({ data: null, loading: false, error: String((e && e.message) || e) }); });
    return () => { off = true; };
  }, [url, enabled, k]);
  return { ...st, reload: () => setK((x) => x + 1) };
}

export function Pills({ items, value, onChange, accent }) {
  return (
    <div className="pz-pills" style={{ '--pz': accent }}>
      {items.map(([k, label]) => (
        <button key={k} type="button" className={'pz-pill' + (value === k ? ' on' : '')} onClick={() => onChange(k)}>{label}</button>
      ))}
    </div>
  );
}

export function MonthBar({ months, value, onChange, title, sub, accent, allowAll }) {
  const list = allowAll ? ['ALL', ...months] : months;
  const idx = list.indexOf(value);
  const step = (d) => { const n = idx + d; if (n >= 0 && n < list.length) onChange(list[n]); };
  return (
    <div className="pz-monthbar" style={{ '--pz': accent }}>
      <div>
        <h3>{title}</h3>
        {sub && <div className="pz-sub">{sub}</div>}
      </div>
      <div className="pz-picker">
        <span>🔍 Select Month</span>
        <button type="button" onClick={() => step(-1)} disabled={idx <= 0}>◀</button>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {list.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <button type="button" onClick={() => step(1)} disabled={idx < 0 || idx >= list.length - 1}>▶</button>
      </div>
    </div>
  );
}

export function Banner({ children }) {
  return <div className="pz-banner">{children}</div>;
}

export function Delta({ cur, prev, goodUp = true, label }) {
  const p = pctChange(cur, prev);
  if (p === null) return <div className="pz-delta muted">{label || 'no previous data'}</div>;
  const up = p >= 0;
  const good = up === goodUp;
  return (
    <div className={'pz-delta ' + (good ? 'good' : 'bad')}>
      {up ? '▲' : '▼'} {Math.abs(p).toFixed(1)}% {label || 'vs prev month'}
    </div>
  );
}

export function Kpi({ title, value, sub, color, children }) {
  return (
    <div className="pz-kpi" style={{ borderLeftColor: color || '#2563eb' }}>
      <h4>{title}</h4>
      <div className="pz-val">{value}</div>
      {sub && <div className="pz-ksub">{sub}</div>}
      {children}
    </div>
  );
}
export const KpiGrid = ({ children }) => <div className="pz-kpis">{children}</div>;

export function Card({ title, right, children, className = '' }) {
  return (
    <section className={'pz-card ' + className}>
      {(title || right) && (
        <div className="pz-card-head"><h3>{title}</h3>{right}</div>
      )}
      {children}
    </section>
  );
}

export function Strip({ children }) {
  return <div className="pz-strip">{children}</div>;
}

export function Bars({ rows, color = '#2563eb', fmt = (v) => v, empty = 'No data' }) {
  if (!rows || !rows.length) return <div className="pz-empty">{empty}</div>;
  const max = Math.max(...rows.map((r) => r.value), 0) || 1;
  return (
    <div className="pz-bars">
      {rows.map((r, i) => (
        <div className="pz-bar-row" key={i} title={r.title || ''}>
          <div className="pz-bar-label">{r.label}</div>
          <div className="pz-bar-track">
            <div className="pz-bar-fill" style={{ width: Math.max(2, (r.value / max) * 100) + '%', background: r.color || color }} />
          </div>
          <div className="pz-bar-val">{fmt(r.value)}{r.sub ? <small> {r.sub}</small> : null}</div>
        </div>
      ))}
    </div>
  );
}

export function Table({ cols, rows, empty = 'No records', maxRows = 300, rowClass }) {
  const shown = rows.slice(0, maxRows);
  return (
    <div className="pz-scroll">
      <table className="pz-table">
        <thead>
          <tr>{cols.map((c, i) => <th key={i} className={c.a === 'r' ? 'r' : ''}>{c.h}</th>)}</tr>
        </thead>
        <tbody>
          {shown.length ? shown.map((r, i) => (
            <tr key={i} className={rowClass ? rowClass(r) : ''}>
              {cols.map((c, j) => <td key={j} className={c.a === 'r' ? 'r' : ''}>{c.f(r)}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={cols.length} className="pz-empty">{empty}</td></tr>
          )}
        </tbody>
      </table>
      {rows.length > maxRows && <div className="pz-more">Showing first {maxRows} of {rows.length} rows - use search to narrow down</div>}
    </div>
  );
}

export const Chip = ({ ok, children }) => <span className={'pz-chip ' + (ok ? 'y' : 'n')}>{children}</span>;
