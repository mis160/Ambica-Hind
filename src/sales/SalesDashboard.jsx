import React, { useMemo, useState } from 'react';
import './SalesDashboard.css';
import {
  prepRows, sumRows, groupRows, num, pctChange, downloadCsv,
  fyOf, fyLabel, fyMonths, prevMonth, monthLong, monthShort
} from './salesUtils.js';

const VIEWS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'customers', label: '🏆 Customers' },
  { id: 'breakdown', label: '🧪 Breakdown' },
  { id: 'matrix', label: '🗓 Month Matrix' },
  { id: 'records', label: '📋 Records' }
];

const Bar = ({ pct, color }) => {
  const p = Math.max(0, Math.min(100, pct));
  const label = (p >= 1 ? p.toFixed(0) : p > 0 ? '<1' : '0') + '%';
  // inline styles + divs so global app CSS (span/td rules) cannot distort the bar
  return (
    <div style={{ position: 'relative', height: 22, minWidth: 110, background: '#e2e8f0', borderRadius: 11, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: p + '%', background: color, opacity: 0.85, borderRadius: 11 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: 0, fontSize: 11, fontWeight: 800, lineHeight: '22px', color: '#0f172a', textShadow: '0 0 3px #fff' }}>
        {label}
      </div>
    </div>
  );
};

const Kpi = ({ icon, label, value, sub, tone }) => (
  <div className="sd-kpi" style={{ '--tone': tone }}>
    <div className="sd-kpi-l">{icon} {label}</div>
    <div className="sd-kpi-v">{value}</div>
    <div className="sd-kpi-s">{sub}</div>
  </div>
);

const Delta = ({ pct, label, unit = '%', abs }) => {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return <span className="sd-flat">– no data for {label}</span>;
  const up = pct >= 0;
  return (
    <span className={up ? 'sd-up' : 'sd-down'}>
      {up ? '▲ +' : '▼ -'}{abs ? num(Math.abs(pct), 2) : Math.abs(pct).toFixed(1)}{unit} vs {label}
    </span>
  );
};

function BreakTable({ title, rows, color }) {
  const tq = rows.reduce((a, r) => a + r.qty, 0);
  const tv = rows.reduce((a, r) => a + r.value, 0);
  const te = rows.reduce((a, r) => a + r.entries, 0);
  return (
    <div className="sd-card">
      <h4 className="sd-h4">{title}</h4>
      <div className="sd-scroll">
        <table className="sd-t">
          <thead>
            <tr><th>Name</th><th className="r">Qty (MT)</th><th className="r">Value (₹ L)</th><th className="r">Rate</th><th className="r">Entries</th><th>Share</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="6" className="sd-empty">No data for this period.</td></tr>}
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="b">{r.name}</td>
                <td className="r">{num(r.qty)}</td>
                <td className="r">{num(r.value)}</td>
                <td className="r">{num(r.rate)}</td>
                <td className="r">{r.entries}</td>
                <td><Bar pct={tq ? (r.qty / tq) * 100 : 0} color={color} /></td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr className="sd-tot">
                <td>TOTAL</td><td className="r">{num(tq)}</td><td className="r">{num(tv)}</td>
                <td className="r">{tq ? num((tv * 100000) / (tq * 1000)) : '0.00'}</td><td className="r">{te}</td><td>100%</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopTable({ title, rows, color, limit = 10 }) {
  const top = rows.slice(0, limit);
  const total = rows.reduce((a, r) => a + r.qty, 0);
  return (
    <div className="sd-card">
      <h4 className="sd-h4">{title}</h4>
      <div className="sd-scroll">
        <table className="sd-t">
          <thead><tr><th>Customer</th><th className="r">Qty (MT)</th><th className="r">Value (₹ L)</th><th>Share</th></tr></thead>
          <tbody>
            {top.length === 0 && <tr><td colSpan="4" className="sd-empty">No customer data for this period.</td></tr>}
            {top.map((r, i) => (
              <tr key={r.name}>
                <td className="b sd-wrap">{i + 1}. {r.name}</td>
                <td className="r">{num(r.qty)}</td>
                <td className="r">{num(r.value)}</td>
                <td><Bar pct={total ? (r.qty / total) * 100 : 0} color={color} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SalesDashboard({ title, subtitle, accent = '#16a34a', streams, recordCols, loaded, error }) {
  const [view, setView] = useState('overview');
  const [periodSel, setPeriodSel] = useState('');
  const [streamSel, setStreamSel] = useState('all');
  const [search, setSearch] = useState('');
  const [metric, setMetric] = useState('qty');
  const [matrixDim, setMatrixDim] = useState('customer');
  const [showAll, setShowAll] = useState(false);

  const multi = streams.length > 1;

  const all = useMemo(() => streams.flatMap((s) => prepRows(s.rows, s.id)), [streams]);

  const monthKeys = useMemo(() => [...new Set(all.map((r) => r._mk))].sort(), [all]);
  const fys = useMemo(() => [...new Set(all.map((r) => r._fy))].sort((a, b) => b - a), [all]);
  const latest = monthKeys[monthKeys.length - 1];

  if (all.length === 0) {
    return (
      <section className="sd-card sd-wide" style={{ '--ac': accent }}>
        <h3 className="sd-title">{title}</h3>
        <p className="sd-empty" style={{ color: error ? '#dc2626' : '#64748b' }}>
          {error || (loaded ? 'No sales records found.' : 'Loading sales data...')}
        </p>
      </section>
    );
  }

  const period = periodSel && (periodSel.startsWith('FY:') || monthKeys.includes(periodSel.slice(2)))
    ? periodSel
    : `M:${latest}`;
  const isFY = period.startsWith('FY:');
  const mk = isFY ? null : period.slice(2);
  const selFy = isFY ? Number(period.slice(3)) : fyOf(Number(mk.slice(0, 4)), Number(mk.slice(5)));
  const pKey = mk ? prevMonth(mk) : null;

  const inStream = (r) => streamSel === 'all' || r._s === streamSel;
  const fyRowsAll = all.filter((r) => r._fy === selFy);
  const periodRowsAll = isFY ? fyRowsAll : all.filter((r) => r._mk === mk);
  const prevRowsAll = pKey ? all.filter((r) => r._mk === pKey) : [];

  const periodRows = periodRowsAll.filter(inStream);
  const fyRows = fyRowsAll.filter(inStream);
  const periodLabel = isFY ? `${fyLabel(selFy)} — TILL DATE` : monthLong(mk);

  // number of months elapsed in the FY (Apr -> last month that has data)
  const fyMonthList = fyMonths(selFy);
  let lastIdx = -1;
  fyMonthList.forEach((k, i) => { if (fyRowsAll.some((r) => r._mk === k)) lastIdx = i; });
  const elapsed = Math.max(1, lastIdx + 1);
  const lastFyMonth = lastIdx >= 0 ? fyMonthList[lastIdx] : fyMonthList[0];

  const streamColor = (id) => (streams.find((s) => s.id === id) || {}).color || accent;
  const visibleStreams = streams.filter((s) => streamSel === 'all' || s.id === streamSel);

  const periodOptions = [
    ...fys.map((fy) => ({ v: `FY:${fy}`, t: `📆 ${fyLabel(fy)} — full year till date` })),
    ...[...monthKeys].reverse().map((k) => ({ v: `M:${k}`, t: monthLong(k) }))
  ];

  const stepMonth = (dir) => {
    if (isFY) return;
    const i = monthKeys.indexOf(mk);
    const nxt = monthKeys[i + dir];
    if (nxt) setPeriodSel(`M:${nxt}`);
  };

  const switchView = (v) => { setView(v); setSearch(''); setShowAll(false); };

  const q = search.toLowerCase().trim();

  /* ---------------------------- OVERVIEW ---------------------------- */
  const renderSnapshot = () => (
    <>
      <div className="sd-sec">📌 {periodLabel.toUpperCase()} — {isFY ? 'FY SNAPSHOT' : 'MONTH SNAPSHOT'}</div>
      {streams.map((s) => {
        const cur = sumRows(periodRowsAll.filter((r) => r._s === s.id));
        const prev = sumRows(prevRowsAll.filter((r) => r._s === s.id));
        const pl = pKey ? monthShort(pKey) : '';
        return (
          <div key={s.id} className="sd-kpi-row">
            {multi && <div className="sd-stream-tag" style={{ background: s.color }}>{s.label}</div>}
            <Kpi icon="📦" label={`${s.short ? s.short + ' ' : ''}DESPATCH QTY (MT)`} value={num(cur.qty)} tone={s.color}
              sub={isFY ? `${cur.entries} entries` : <Delta pct={pctChange(cur.qty, prev.qty)} label={pl} />} />
            <Kpi icon="💰" label={`${s.short ? s.short + ' ' : ''}SALES VALUE (₹ LAKH)`} value={num(cur.value)} tone={s.color}
              sub={isFY ? `= ₹ ${num(cur.value / 100)} Crore` : <Delta pct={pctChange(cur.value, prev.value)} label={pl} />} />
            <Kpi icon="🏷" label={`${s.short ? s.short + ' ' : ''}AVG RATE (₹ / KG)`} value={num(cur.rate)} tone={s.color}
              sub={isFY || !prev.rate ? 'Weighted avg (value ÷ qty)' : <Delta pct={cur.rate - prev.rate} abs unit=" ₹/KG" label={pl} />} />
            <Kpi icon="🤝" label={`${s.short ? s.short + ' ' : ''}ACTIVE CUSTOMERS`} value={cur.customers} tone={s.color}
              sub={`${cur.entries} entries ${isFY ? 'in FY' : 'this month'}`} />
          </div>
        );
      })}

      {!isFY && (
        <>
          <div className="sd-sec">📈 {fyLabel(selFy)} TILL DATE (Apr → {monthShort(lastFyMonth)})</div>
          {streams.map((s) => {
            const f = sumRows(fyRowsAll.filter((r) => r._s === s.id));
            return (
              <div key={s.id} className="sd-kpi-row">
                {multi && <div className="sd-stream-tag" style={{ background: s.color }}>{s.label}</div>}
                <Kpi icon="📦" label={`${s.short ? s.short + ' ' : ''}FY QTY (MT)`} value={num(f.qty)} tone={s.color} sub={`Avg ${num(f.qty / elapsed, 1)} MT per month`} />
                <Kpi icon="💰" label={`${s.short ? s.short + ' ' : ''}FY VALUE (₹ LAKH)`} value={num(f.value)} tone={s.color} sub={`= ₹ ${num(f.value / 100)} Crore`} />
                <Kpi icon="🏷" label={`${s.short ? s.short + ' ' : ''}FY AVG RATE (₹ / KG)`} value={num(f.rate)} tone={s.color} sub="Weighted avg (value ÷ qty)" />
                <Kpi icon="🧾" label={`${s.short ? s.short + ' ' : ''}FY ENTRIES`} value={f.entries} tone={s.color} sub={`${f.customers} customers served in FY`} />
              </div>
            );
          })}
        </>
      )}
    </>
  );

  const trend = fyMonthList.map((k) => {
    const rs = fyRowsAll.filter((r) => r._mk === k);
    return { k, per: streams.map((s) => sumRows(rs.filter((r) => r._s === s.id))), tot: sumRows(rs) };
  });
  const maxQty = Math.max(1, ...trend.map((t) => t.tot.qty));
  const fyTot = sumRows(fyRowsAll);

  const renderTrend = () => (
    <>
      <div className="sd-sec">📊 MONTH-WISE TREND — {fyLabel(selFy)} <small>(click a month to open it)</small></div>
      <div className="sd-card">
        <div className="sd-chart">
          {trend.map((t) => (
            <button key={t.k} className={'sd-col' + (t.k === mk ? ' on' : '')} onClick={() => setPeriodSel(`M:${t.k}`)}
              title={`${monthLong(t.k)}: ${num(t.tot.qty)} MT • ₹${num(t.tot.value)} L`}>
              <span className="sd-col-v">{t.tot.qty ? num(t.tot.qty, 0) : ''}</span>
              <span className="sd-col-bars">
                {t.per.map((p, i) => (
                  <i key={streams[i].id} style={{ height: (p.qty / maxQty) * 100 + '%', background: streams[i].color }} />
                ))}
              </span>
              <span className="sd-col-m">{monthShort(t.k).slice(0, 3)}</span>
            </button>
          ))}
        </div>
        {multi && (
          <div className="sd-legend">{streams.map((s) => <span key={s.id}><i style={{ background: s.color }} /> {s.label} qty (MT)</span>)}</div>
        )}
        <div className="sd-scroll">
          <table className="sd-t">
            <thead>
              <tr>
                <th>Month</th>
                {multi && streams.map((s) => <th key={s.id} className="r">{s.short} Qty (MT)</th>)}
                <th className="r">{multi ? 'Total Qty (MT)' : 'Qty (MT)'}</th>
                <th className="r">Value (₹ L)</th><th className="r">Avg Rate</th><th className="r">Entries</th><th className="r">Qty vs Prev</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((t, i) => {
                const prevQty = i > 0 ? trend[i - 1].tot.qty : 0;
                const ch = pctChange(t.tot.qty, prevQty);
                return (
                  <tr key={t.k} className={'sd-click' + (t.k === mk ? ' sd-sel' : '')} onClick={() => setPeriodSel(`M:${t.k}`)}>
                    <td className="b">{monthShort(t.k)}</td>
                    {multi && t.per.map((p, j) => <td key={j} className="r">{p.qty ? num(p.qty) : '–'}</td>)}
                    <td className="r">{t.tot.qty ? num(t.tot.qty) : '–'}</td>
                    <td className="r">{t.tot.value ? num(t.tot.value) : '–'}</td>
                    <td className="r">{t.tot.rate ? num(t.tot.rate) : '–'}</td>
                    <td className="r">{t.tot.entries || '–'}</td>
                    <td className={'r ' + (ch === null ? '' : ch >= 0 ? 'sd-up' : 'sd-down')}>{ch === null ? '–' : (ch >= 0 ? '▲ +' : '▼ ') + ch.toFixed(1) + '%'}</td>
                  </tr>
                );
              })}
              <tr className="sd-tot">
                <td>FY TOTAL</td>
                {multi && streams.map((s, j) => <td key={s.id} className="r">{num(sumRows(fyRowsAll.filter((r) => r._s === s.id)).qty)}</td>)}
                <td className="r">{num(fyTot.qty)}</td><td className="r">{num(fyTot.value)}</td><td className="r">{num(fyTot.rate)}</td><td className="r">{fyTot.entries}</td><td />
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  /* ---------------------------- CUSTOMERS ---------------------------- */
  const custPeriod = groupRows(periodRows, (r) => r.customer || 'Unknown');
  const custFy = groupRows(fyRows, (r) => r.customer || 'Unknown');
  const custList = custPeriod.filter((c) => !q || c.name.toLowerCase().includes(q));
  const custTotalQty = custPeriod.reduce((a, c) => a + c.qty, 0);

  const renderCustomers = () => (
    <>
      <div className="sd-grid2">
        <TopTable title={`🏆 TOP 10 — ${isFY ? fyLabel(selFy) : monthShort(mk)}`} rows={custPeriod} color={accent} />
        <TopTable title={`🏆 TOP 10 — ${fyLabel(selFy)} TILL DATE`} rows={custFy} color="#7c3aed" />
      </div>
      <div className="sd-card">
        <div className="sd-bar-head">
          <h4 className="sd-h4" style={{ margin: 0 }}>🤝 CUSTOMER WISE — {periodLabel} ({custPeriod.length} customers)</h4>
          <input className="sd-input" placeholder="Search customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="sd-scroll sd-tall">
          <table className="sd-t">
            <thead><tr><th>#</th><th>Customer</th><th className="r">Entries</th><th className="r">Qty (MT)</th><th className="r">Value (₹ L)</th><th className="r">Avg Rate</th><th>Share</th></tr></thead>
            <tbody>
              {custList.length === 0 && <tr><td colSpan="7" className="sd-empty">No customers found.</td></tr>}
              {custList.map((c, i) => (
                <tr key={c.name}>
                  <td>{i + 1}</td><td className="b sd-wrap">{c.name}</td><td className="r">{c.entries}</td>
                  <td className="r">{num(c.qty)}</td><td className="r">{num(c.value)}</td><td className="r">{num(c.rate)}</td>
                  <td><Bar pct={custTotalQty ? (c.qty / custTotalQty) * 100 : 0} color={accent} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  /* ---------------------------- BREAKDOWN ---------------------------- */
  const renderBreakdown = () => (
    <>
      <div className="sd-sec">🧪 BREAKDOWN — {periodLabel}</div>
      <div className="sd-grid2">
        {visibleStreams.flatMap((s) => {
          const rs = periodRowsAll.filter((r) => r._s === s.id);
          return s.dims.map((d) => (
            <BreakTable key={s.id + d.field} color={s.color}
              title={`${d.icon} ${multi ? s.short + ' ' : ''}${d.label.toUpperCase()}`}
              rows={groupRows(rs, (r) => String(r[d.field] || d.fallback || 'UNKNOWN').trim() || 'UNKNOWN')} />
          ));
        })}
        {multi && streamSel === 'all' && (
          <BreakTable color={accent} title="🏭 DEPARTMENT WISE" rows={groupRows(periodRowsAll, (r) => (streams.find((s) => s.id === r._s) || {}).label)} />
        )}
        {multi && streamSel === 'all' && !isFY && (
          <BreakTable color="#7c3aed" title={`🏭 DEPARTMENT WISE — ${fyLabel(selFy)} TILL DATE`} rows={groupRows(fyRowsAll, (r) => (streams.find((s) => s.id === r._s) || {}).label)} />
        )}
      </div>
    </>
  );

  /* ---------------------------- MATRIX ---------------------------- */
  const dimOptions = [{ short: 'Customer', field: 'customer', fallback: 'Unknown' }];
  streams.forEach((s) => s.dims.forEach((d) => {
    if (!dimOptions.some((o) => o.short === d.short)) dimOptions.push({ short: d.short, field: d.field, fallback: d.fallback });
  }));
  const dimSel = dimOptions.find((o) => o.field === matrixDim) || dimOptions[0];

  const renderMatrix = () => {
    const metricKey = metric === 'qty' ? '_kg' : '_val';
    const div = metric === 'qty' ? 1000 : 100000;
    const map = new Map();
    fyRows.forEach((r) => {
      const name = String(r[dimSel.field] || dimSel.fallback || 'UNKNOWN').trim() || 'UNKNOWN';
      const o = map.get(name) || { name, m: {}, total: 0 };
      o.m[r._mk] = (o.m[r._mk] || 0) + r[metricKey] / div;
      o.total += r[metricKey] / div;
      map.set(name, o);
    });
    const rows = [...map.values()].sort((a, b) => b.total - a.total).filter((o) => !q || o.name.toLowerCase().includes(q));
    const colTot = fyMonthList.map((k) => rows.reduce((a, o) => a + (o.m[k] || 0), 0));
    const grand = colTot.reduce((a, b) => a + b, 0);
    return (
      <div className="sd-card">
        <div className="sd-bar-head">
          <h4 className="sd-h4" style={{ margin: 0 }}>🗓 {dimSel.short.toUpperCase()} × MONTH — {fyLabel(selFy)} ({metric === 'qty' ? 'Qty in MT' : 'Value in ₹ Lakh'})</h4>
          <div className="sd-ctrls">
            <select className="sd-select sm" value={dimSel.field} onChange={(e) => setMatrixDim(e.target.value)}>
              {dimOptions.map((o) => <option key={o.field} value={o.field}>By {o.short}</option>)}
            </select>
            <div className="sd-seg">
              <button className={metric === 'qty' ? 'on' : ''} onClick={() => setMetric('qty')}>Qty (MT)</button>
              <button className={metric === 'value' ? 'on' : ''} onClick={() => setMetric('value')}>Value (₹ L)</button>
            </div>
            <input className="sd-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="sd-scroll sd-tall">
          <table className="sd-t sd-matrix">
            <thead>
              <tr>
                <th className="sd-stick">{dimSel.short}</th>
                {fyMonthList.map((k) => <th key={k} className={'r' + (k === mk ? ' sd-hl' : '')}>{monthShort(k).slice(0, 3)}</th>)}
                <th className="r">FY Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan="14" className="sd-empty">No data.</td></tr>}
              {rows.map((o) => (
                <tr key={o.name}>
                  <td className="b sd-stick">{o.name}</td>
                  {fyMonthList.map((k) => <td key={k} className={'r' + (k === mk ? ' sd-hl' : '')}>{o.m[k] ? num(o.m[k], metric === 'qty' ? 2 : 2) : '–'}</td>)}
                  <td className="r b">{num(o.total)}</td>
                </tr>
              ))}
              {rows.length > 0 && (
                <tr className="sd-tot">
                  <td className="sd-stick">TOTAL</td>
                  {colTot.map((v, i) => <td key={i} className="r">{v ? num(v) : '–'}</td>)}
                  <td className="r">{num(grand)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ---------------------------- RECORDS ---------------------------- */
  const renderRecords = () => {
    const cols = recordCols.filter((c) => !c.multiOnly || multi);
    const sorted = periodRows.slice().sort((a, b) => b._ds - a._ds);
    const filtered = sorted.filter((r) => !q || cols.some((c) => String(c.get(r)).toLowerCase().includes(q)));
    const shown = showAll ? filtered : filtered.slice(0, 200);
    const t = sumRows(filtered);
    const exportCsv = () =>
      downloadCsv(`${title.replace(/\W+/g, '_')}_${isFY ? fyLabel(selFy).replace(/\s/g, '') : mk}.csv`,
        cols.map((c) => c.h), filtered.map((r) => cols.map((c) => c.raw ? c.raw(r) : c.get(r))));
    return (
      <div className="sd-card">
        <div className="sd-bar-head">
          <h4 className="sd-h4" style={{ margin: 0 }}>📋 DESPATCH RECORDS — {periodLabel} (newest first • {filtered.length} entries)</h4>
          <div className="sd-ctrls">
            <input className="sd-input" placeholder="Search customer / material..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="sd-btn" onClick={exportCsv}>⬇ CSV</button>
          </div>
        </div>
        <div className="sd-sumline">
          <b>{num(t.qty)} MT</b> • <b>₹{num(t.value)} Lakh</b> • avg <b>₹{num(t.rate)}/KG</b> • <b>{t.customers}</b> customers
        </div>
        <div className="sd-scroll sd-tall">
          <table className="sd-t" style={{ minWidth: 760 }}>
            <thead><tr>{cols.map((c) => <th key={c.h} className={c.num ? 'r' : ''}>{c.h}</th>)}</tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={cols.length} className="sd-empty">No records for this period.</td></tr>}
              {shown.map((r, i) => (
                <tr key={i}>{cols.map((c) => <td key={c.h} className={(c.num ? 'r ' : '') + (c.bold ? (c.num ? 'b' : 'b sd-wrap') : '')}>{c.get(r)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        {!showAll && filtered.length > 200 && (
          <button className="sd-btn" style={{ marginTop: 10 }} onClick={() => setShowAll(true)}>Show all {filtered.length} records</button>
        )}
      </div>
    );
  };

  return (
    <div className="sd-root" style={{ '--ac': accent }}>
      {/* ---------- control bar ---------- */}
      <section className="sd-card sd-controls">
        <div className="sd-ctitle">
          <h3 className="sd-title">{title}</h3>
          <div className="sd-sub">{subtitle} • {all.length} entries loaded • Qty in MT, Value in ₹ Lakh</div>
        </div>
        <div className="sd-ctrls">
          <label className="sd-lbl">🔍 Select Month</label>
          <button className="sd-step" onClick={() => stepMonth(-1)} disabled={isFY || monthKeys.indexOf(mk) <= 0} title="Previous month">◀</button>
          <select className="sd-select" value={period} onChange={(e) => setPeriodSel(e.target.value)}>
            {periodOptions.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
          </select>
          <button className="sd-step" onClick={() => stepMonth(1)} disabled={isFY || monthKeys.indexOf(mk) >= monthKeys.length - 1} title="Next month">▶</button>
        </div>
        <div className="sd-tabs">
          {VIEWS.map((v) => (
            <button key={v.id} className={view === v.id ? 'on' : ''} onClick={() => switchView(v.id)}>{v.label}</button>
          ))}
        </div>
        {multi && view !== 'overview' && (
          <div className="sd-seg">
            <button className={streamSel === 'all' ? 'on' : ''} onClick={() => setStreamSel('all')}>All</button>
            {streams.map((s) => (
              <button key={s.id} className={streamSel === s.id ? 'on' : ''} onClick={() => setStreamSel(s.id)}>{s.label}</button>
            ))}
          </div>
        )}
        {error && <div className="sd-warn">⚠ {error}</div>}
      </section>

      {view === 'overview' && (<>{renderSnapshot()}{renderTrend()}</>)}
      {view === 'customers' && renderCustomers()}
      {view === 'breakdown' && renderBreakdown()}
      {view === 'matrix' && renderMatrix()}
      {view === 'records' && renderRecords()}
    </div>
  );
}
