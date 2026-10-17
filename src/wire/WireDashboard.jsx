import { useState, useEffect, useMemo, useCallback } from 'react';
import './WireDashboard.css';
import { WIRE_API_URL } from './wireConfig.js';

const connected = () => typeof WIRE_API_URL === 'string' && WIRE_API_URL.startsWith('https://script.google.com/');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const WD_VIEWS = [
  { id: 'dash', label: '📊 Executive Dashboard' },
  { id: 'blocks', label: '🧱 Block-wise Breakdown' },
  { id: 'daily', label: '📅 Daily Cost Details' }
];
const GI_VIEWS = [
  { id: 'dash', label: '📊 Executive Dashboard' },
  { id: 'daily', label: '📅 Daily Cost Details' }
];

// ---------- small helpers ----------
const n0 = (n) => (Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—');
const n2 = (n) => (Number.isFinite(n) ? n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—');
const lakh = (n) => (Number.isFinite(n) ? '₹' + (n / 100000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' L' : '—');
const fmtDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  return m ? `${m[3]}-${MONTHS[Number(m[2]) - 1]}-${m[1]}` : s || '—';
};
const sum = (list, key) => list.reduce((a, r) => a + (Number(r[key]) || 0), 0);

// Totals for one month (or all months when key is 'ALL')
function totals(monthly, key) {
  const rows = key === 'ALL' ? monthly : monthly.filter((m) => m.monthKey === key);
  const prodMT = sum(rows, 'prodMT');
  const totalCost = sum(rows, 'totalCost');
  return { prodMT, totalCost, avgPerMT: prodMT > 0 ? totalCost / prodMT : 0, entries: sum(rows, 'entries') };
}

// Bars: one bar for every day (grand total cost per MT)
function DailyBars({ rows, color }) {
  if (!rows.length) return null;
  const values = rows.map((r) => r.grandTotal);
  const max = Math.max(...values) || 1;
  const min = Math.min(...values);
  const bw = 14;
  const gap = 4;
  const h = 100;
  const w = rows.length * (bw + gap);
  return (
    <div className="wd-bars-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="wd-bars" role="img" aria-label="Daily grand total cost per MT">
        {rows.map((r, i) => {
          const bh = Math.max(3, (r.grandTotal / max) * h);
          return (
            <rect key={r.date} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx="2" fill={color}>
              <title>{`${fmtDate(r.date)}: ₹${n2(r.grandTotal)} per MT`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="wd-bars-legend">
        <span>{fmtDate(rows[0].date)}</span>
        <span>
          Lowest ₹{n0(min)} · Highest ₹{n0(max)} per MT
        </span>
        <span>{fmtDate(rows[rows.length - 1].date)}</span>
      </div>
    </div>
  );
}

function Kpi({ title, value, sub, color }) {
  return (
    <div className="sales-metric-card" style={{ borderLeftColor: color }}>
      <h4>{title}</h4>
      <div className="metric-val">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  );
}

function DailyTable({ rows }) {
  const list = rows.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="wd-table-wrap">
      <table className="wd-table">
        <thead>
          <tr>
            <th>Date</th>
            <th className="r">Prod (MT)</th>
            <th className="r">Electricity</th>
            <th className="r">Consumables</th>
            <th className="r">Manpower</th>
            <th className="r">Maint.</th>
            <th className="r">Waste</th>
            <th className="r">Admin</th>
            <th className="r">Total / MT</th>
            <th className="r">Interest</th>
            <th className="r">Grand Total / MT</th>
          </tr>
        </thead>
        <tbody>
          {list.length ? (
            list.map((r) => (
              <tr key={r.date}>
                <td className="b">{fmtDate(r.date)}</td>
                <td className="r">{n2(r.prodMT)}</td>
                <td className="r">{n0(r.elec)}</td>
                <td className="r">{n0(r.consumable)}</td>
                <td className="r">{n0(r.manpower)}</td>
                <td className="r">{n0(r.maint)}</td>
                <td className="r">{n0(r.waste)}</td>
                <td className="r">{n0(r.admin)}</td>
                <td className="r b">{n0(r.totalCost)}</td>
                <td className="r">{n0(r.interest)}</td>
                <td className="r b blue">₹{n0(r.grandTotal)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" className="empty">
                No production days in this period.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p className="wd-note">All cost columns are ₹ per MT of wire produced that day.</p>
    </div>
  );
}

// ---------- the dashboard ----------
export default function WireDashboard({ unit }) {
  const isGI = unit.indexOf('(GI)') >= 0;
  const color = isGI ? '#0d9488' : '#ea580c';
  const views = isGI ? GI_VIEWS : WD_VIEWS;

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(connected());
  const [view, setView] = useState('dash');
  const [month, setMonth] = useState('');

  const load = useCallback(async (silent) => {
    if (!connected()) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${WIRE_API_URL}?action=data&_=${Date.now()}`);
      if (!res.ok) throw new Error('Server responded with status ' + res.status);
      const json = await res.json();
      if (json && json.error) throw new Error(json.error);
      setData(json);
      setError('');
    } catch (err) {
      setError('Could not load live data from the Wire Costing sheet (' + (err && err.message ? err.message : err) + ').');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!connected()) return undefined;
    load(false);
    const timer = setInterval(() => {
      if (!document.hidden) load(true);
    }, 120000);
    return () => clearInterval(timer);
  }, [load]);

  // Back to the first view when switching between Wire and GI
  useEffect(() => {
    setView('dash');
  }, [isGI]);

  const area = data ? (isGI ? data.gi : data.wd) : null;
  const umbrella = data ? data.umbrella : null;

  const monthKeys = useMemo(() => {
    if (!area) return [];
    const keys = new Set(area.monthly.map((m) => m.monthKey));
    if (!isGI && umbrella) umbrella.monthly.forEach((m) => keys.add(m.monthKey));
    return Array.from(keys).sort();
  }, [area, umbrella, isGI]);

  const labelOf = (key) => {
    const all = [...(area ? area.monthly : []), ...(umbrella ? umbrella.monthly : [])];
    const hit = all.find((m) => m.monthKey === key);
    return hit ? hit.month : key;
  };

  const activeMonth = month && (month === 'ALL' || monthKeys.includes(month)) ? month : monthKeys[monthKeys.length - 1] || 'ALL';
  const monthName = activeMonth === 'ALL' ? 'All months' : labelOf(activeMonth);
  const inMonth = (dateStr) => activeMonth === 'ALL' || (dateStr || '').slice(0, 7) === activeMonth;

  // ----- not connected / loading / error -----
  if (!connected()) {
    return (
      <section className="wd-card">
        <h3 className="wd-title">{isGI ? '⚗️ Galvanizing (GI)' : '🔩 Wire Plant (WD)'}</h3>
        <p className="wd-empty">
          The wire dashboard is not connected yet. Your administrator needs to paste the Wire API URL into{' '}
          <code>src/wire/wireConfig.js</code>.
        </p>
      </section>
    );
  }
  if (error && !data) {
    return (
      <section className="wd-card">
        <h3 className="wd-title">{isGI ? '⚗️ Galvanizing (GI)' : '🔩 Wire Plant (WD)'}</h3>
        <div className="wd-alert">{error}</div>
        <button type="button" className="wd-btn" onClick={() => load(false)}>
          Try again
        </button>
      </section>
    );
  }
  if (!data || !area) {
    return (
      <section className="wd-card">
        <h3 className="wd-title">{isGI ? '⚗️ Galvanizing (GI)' : '🔩 Wire Plant (WD)'}</h3>
        <p className="wd-empty">{loading ? 'Loading live data from the Wire Costing sheet…' : 'No data found.'}</p>
      </section>
    );
  }

  const t = totals(area.monthly, activeMonth);
  const u = umbrella ? totals(umbrella.monthly, activeMonth) : null;
  const daily = area.daily.filter((r) => inMonth(r.date));
  const blocks = !isGI ? data.wd.blocks.filter((b) => activeMonth === 'ALL' || b.monthKey === activeMonth) : [];

  // Block table: when "All months" is chosen, add the months together
  const blockRows = (() => {
    if (activeMonth !== 'ALL') return blocks;
    const map = {};
    blocks.forEach((b) => {
      if (!map[b.block]) map[b.block] = { block: b.block, prodMT: 0, totalCost: 0 };
      map[b.block].prodMT += b.prodMT;
      map[b.block].totalCost += b.totalCost;
    });
    return Object.values(map)
      .map((b) => ({ ...b, avgPerMT: b.prodMT > 0 ? b.totalCost / b.prodMT : 0 }))
      .sort((a, b) => b.prodMT - a.prodMT);
  })();
  const blockTotalProd = sum(blockRows, 'prodMT');

  return (
    <div className="wd-root" style={{ '--unit': color }}>
      {/* ---------- filters ---------- */}
      <section className="wd-card">
        <div className="wd-head">
          <h3 className="wd-title">{isGI ? '⚗️ Galvanizing (GI) — Live from Wire Costing Sheet' : '🔩 Wire Plant (WD) — Live from Wire Costing Sheet'}</h3>
          <button type="button" className="wd-btn secondary" onClick={() => load(false)} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div className="wd-filters">
          <label>
            Module View
            <select value={view} onChange={(e) => setView(e.target.value)} className="wd-select-yellow">
              {views.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Month
            <select value={activeMonth} onChange={(e) => setMonth(e.target.value)}>
              {monthKeys
                .slice()
                .reverse()
                .map((k) => (
                  <option key={k} value={k}>
                    {labelOf(k)}
                  </option>
                ))}
              <option value="ALL">All months</option>
            </select>
          </label>
        </div>
        <p className="wd-note">
          Last entry: <b>{fmtDate(area.lastEntry)}</b>
          {data.updatedAt ? ` · Sheet read at ${data.updatedAt.slice(11, 16)}` : ''}
        </p>
        {error && <div className="wd-alert">{error} Showing the last data received.</div>}
        {data.warnings && data.warnings.length > 0 && (
          <div className="wd-warn">
            <b>The sheet layout changed, so some numbers may be wrong:</b>
            <ul>
              {data.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ---------- Executive dashboard ---------- */}
      {view === 'dash' && (
        <>
          <div className="sales-metric-grid">
            <Kpi title={isGI ? 'GI Production' : 'WD Production'} value={`${n2(t.prodMT)} MT`} sub={monthName} color="#2563eb" />
            <Kpi title="Average Cost" value={`₹${n0(t.avgPerMT)} / MT`} sub="Total cost ÷ production" color="#16a34a" />
            <Kpi title="Total Cost Value" value={lakh(t.totalCost)} sub={`${n0(t.entries)} entries`} color={color} />
            {!isGI && u && <Kpi title="Umbrella Production" value={`${n2(u.prodMT)} MT`} sub={monthName} color="#7c3aed" />}
            {!isGI && u && <Kpi title="Umbrella Avg Cost" value={`₹${n0(u.avgPerMT)} / MT`} sub="Total cost ÷ production" color="#db2777" />}
          </div>

          <section className="wd-card">
            <h3 className="wd-subtitle">📈 Daily grand total cost per MT — {monthName}</h3>
            {daily.length ? <DailyBars rows={daily} color={color} /> : <p className="wd-empty">No production days in this period.</p>}
          </section>

          <section className="wd-card">
            <h3 className="wd-subtitle">📊 {isGI ? 'GI' : 'WD & Umbrella'} — Month-wise Summary</h3>
            <div className="wd-table-wrap">
              <table className="wd-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="r">{isGI ? 'GI' : 'WD'} Prod (MT)</th>
                    <th className="r">{isGI ? 'GI' : 'WD'} Avg ₹/MT</th>
                    <th className="r">{isGI ? 'GI' : 'WD'} Total Cost (₹)</th>
                    {!isGI && <th className="r">Umbrella Prod (MT)</th>}
                    {!isGI && <th className="r">Umbrella Avg ₹/MT</th>}
                  </tr>
                </thead>
                <tbody>
                  {monthKeys
                    .slice()
                    .reverse()
                    .map((k) => {
                      const a = totals(area.monthly, k);
                      const b = umbrella ? totals(umbrella.monthly, k) : null;
                      return (
                        <tr key={k} className={k === activeMonth ? 'is-picked' : ''}>
                          <td className="b">{labelOf(k)}</td>
                          <td className="r">{n2(a.prodMT)}</td>
                          <td className="r b blue">₹{n0(a.avgPerMT)}</td>
                          <td className="r green">₹{n0(a.totalCost)}</td>
                          {!isGI && <td className="r">{b ? n2(b.prodMT) : '—'}</td>}
                          {!isGI && <td className="r b blue">{b ? '₹' + n0(b.avgPerMT) : '—'}</td>}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ---------- Block-wise (WD only) ---------- */}
      {view === 'blocks' && !isGI && (
        <section className="wd-card">
          <h3 className="wd-subtitle">🧱 WD Block-wise Breakdown — {monthName}</h3>
          <div className="wd-table-wrap">
            <table className="wd-table">
              <thead>
                <tr>
                  <th>Block</th>
                  <th className="r">Prod (MT)</th>
                  <th>Share of production</th>
                  <th className="r">Avg ₹/MT</th>
                  <th className="r">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {blockRows.length ? (
                  blockRows.map((b) => {
                    const share = blockTotalProd > 0 ? (b.prodMT / blockTotalProd) * 100 : 0;
                    return (
                      <tr key={b.block}>
                        <td className="b">{b.block}</td>
                        <td className="r">{n2(b.prodMT)}</td>
                        <td>
                          <div className="wd-share">
                            <span style={{ width: share + '%' }} />
                            <em>{share.toFixed(1)}%</em>
                          </div>
                        </td>
                        <td className="r b blue">₹{n0(b.avgPerMT)}</td>
                        <td className="r green">₹{n0(b.totalCost)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="empty">
                      No block data in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ---------- Daily details ---------- */}
      {view === 'daily' && (
        <section className="wd-card">
          <h3 className="wd-subtitle">📅 {isGI ? 'GI' : 'WD'} Daily Cost Details — {monthName} (newest first)</h3>
          <DailyTable rows={daily} />
        </section>
      )}
    </div>
  );
}
