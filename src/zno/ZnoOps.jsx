import { useState, useEffect, useCallback } from 'react';
import './ZnoOps.css';
import {
  n0,
  n1,
  fmtDate,
  periodTotals,
  groupSum,
  gradeList,
  statusKind,
  matchesUnit,
  matchesSearch,
  gradeColor
} from './znoOpsMath.js';

const ZNO_OPS_API_URL =
  'https://script.google.com/macros/s/AKfycbz81XhHd5H_-jusN1IC3f02KbGpv-H-QkC59kEmdTBFDTO8mjO-hN8vu0tEq7EG_elP/exec';

const connected = () =>
  typeof ZNO_OPS_API_URL === 'string' && ZNO_OPS_API_URL.startsWith('https://script.google.com/');

const TITLES = {
  opsDash: '📦 ZNO Production · Lab · Despatch Dashboard',
  labReport: '🧪 Lab Test Report — grade Y / N for every batch',
  gradeReport: '🏅 Grade Report — grades passed by each batch',
  stock: '📚 ZNO Stock — actual stock and stock book'
};
const ROW_LIMIT = 400;

function Kpi({ title, value, sub, color }) {
  return (
    <div className="sales-metric-card" style={{ borderLeftColor: color }}>
      <h4>{title}</h4>
      <div className="metric-val">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  );
}

function Chip({ name, all }) {
  return (
    <span className="zo-chip" style={{ '--c': gradeColor(name, all) }}>
      {name}
    </span>
  );
}

function Bar({ value, max, color, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="zo-bar" style={{ '--c': color }}>
      <span style={{ width: pct + '%' }} />
      <em>{label}</em>
    </div>
  );
}

// One column per month, P5 (teal) and P7 (purple) stacked
function MonthlyBars({ months }) {
  const rows = months.slice(-12);
  if (!rows.length) return <p className="zo-empty">No production entries yet.</p>;
  const max = Math.max(...rows.map((m) => m.produced), 1);
  const colW = 54;
  const bw = 30;
  const h = 110;
  const w = rows.length * colW;
  return (
    <>
      <svg viewBox={`0 0 ${w} ${h + 22}`} className="zo-chart" role="img" aria-label="Production by month">
        {rows.map((m, i) => {
          const x = i * colW + (colW - bw) / 2;
          const h5 = (m.p5 / max) * h;
          const h7 = (m.p7 / max) * h;
          return (
            <g key={m.monthKey}>
              <rect x={x} y={h - h5 - h7} width={bw} height={h7} rx="2" fill="#7c3aed">
                <title>{`${m.month}: P7 ${n0(m.p7)} KG`}</title>
              </rect>
              <rect x={x} y={h - h5} width={bw} height={h5} rx="2" fill="#0d9488">
                <title>{`${m.month}: P5 ${n0(m.p5)} KG`}</title>
              </rect>
              <text x={x + bw / 2} y={h + 14} textAnchor="middle" fontSize="11" fill="#64748b">
                {m.month.slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="zo-legend">
        <span>
          <i style={{ background: '#0d9488' }} />P5
        </span>
        <span>
          <i style={{ background: '#7c3aed' }} />P7
        </span>
        <span>Quantity in KG, last 12 months</span>
      </div>
    </>
  );
}

export default function ZnoOps({ view }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(connected());
  const [month, setMonth] = useState('');
  const [unit, setUnit] = useState('ALL');
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [showReadings, setShowReadings] = useState(false);
  const [gradeMode, setGradeMode] = useState('PASS');
  const [stockMode, setStockMode] = useState('actual');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = useCallback(async (silent) => {
    if (!connected()) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${ZNO_OPS_API_URL}?action=ops&_=${Date.now()}`);
      if (!res.ok) throw new Error('Server responded with status ' + res.status);
      const json = await res.json();
      if (json && json.error) throw new Error(json.error);
      setData(json);
      setError('');
    } catch (err) {
      setError('Could not load the ZNO sheet (' + (err && err.message ? err.message : err) + ').');
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

  // a fresh start for the filters when another view is picked
  useEffect(() => {
    setSearch('');
    setUnit('ALL');
    setGradeFilter('ALL');
    setStatusFilter('ALL');
  }, [view]);

  const title = TITLES[view] || TITLES.opsDash;

  if (!connected()) {
    return (
      <section className="zo-card">
        <h3 className="zo-title">{title}</h3>
        <p className="zo-empty">
          The ZNO dashboard is not connected yet. Set <code>ZNO_OPS_API_URL</code> in <code>src/zno/ZnoOps.jsx</code>.
        </p>
      </section>
    );
  }
  if (error && !data) {
    return (
      <section className="zo-card">
        <h3 className="zo-title">{title}</h3>
        <div className="zo-alert">{error}</div>
        <p className="zo-note">Check that the Apps Script was redeployed as a New version after the latest code was pasted.</p>
        <button type="button" className="zo-btn" onClick={() => load(false)}>
          Try again
        </button>
      </section>
    );
  }
  if (!data) {
    return (
      <section className="zo-card">
        <h3 className="zo-title">{title}</h3>
        <p className="zo-empty">{loading ? 'Loading the ZNO sheet…' : 'No data found.'}</p>
      </section>
    );
  }

  const months = data.months || [];
  const activeMonth =
    month && (month === 'ALL' || months.some((m) => m.monthKey === month))
      ? month
      : months.length
        ? months[months.length - 1].monthKey
        : 'ALL';
  const monthName = activeMonth === 'ALL' ? 'All time' : (months.find((m) => m.monthKey === activeMonth) || {}).month;
  const k = data.kpis || {};

  // ---------- page header (filters that belong to every view) ----------
  const header = (
    <section className="zo-card">
      <div className="zo-head">
        <h3 className="zo-title">{title}</h3>
        <button type="button" className="zo-btn" onClick={() => load(false)} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {view === 'opsDash' && (
        <div className="zo-filters">
          <label>
            Month
            <select value={activeMonth} onChange={(e) => setMonth(e.target.value)}>
              {months
                .slice()
                .reverse()
                .map((m) => (
                  <option key={m.monthKey} value={m.monthKey}>
                    {m.month}
                  </option>
                ))}
              <option value="ALL">All time</option>
            </select>
          </label>
        </div>
      )}

      <p className="zo-note">
        {data.sheetRefreshed ? `Sheet reports last refreshed: ${data.sheetRefreshed}` : 'Live from the Production · Lab · Despatch sheet'}
        {data.updatedAt ? ` · read at ${data.updatedAt.slice(11, 16)}` : ''}
      </p>
      {error && <div className="zo-alert">{error} Showing the last data received.</div>}
      {data.warnings && data.warnings.length > 0 && (
        <div className="zo-warn">
          <b>The sheet layout changed, so some numbers may be wrong:</b>
          <ul>
            {data.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );

  // =====================================================================
  //  VIEW 1 : EXECUTIVE DASHBOARD
  // =====================================================================
  if (view === 'opsDash') {
    const t = periodTotals(months, activeMonth);
    const sellers = groupSum(data.sellers || [], activeMonth, 'seller');
    const dGrades = groupSum(data.despatchGrades || [], activeMonth, 'grade');
    const unitsP = groupSum(data.units || [], activeMonth, 'unit');
    const gradeNames = (data.grades || []).map((g) => g.grade);
    const despByGrade = {};
    dGrades.forEach((g) => {
      despByGrade[g.name] = g.qty;
    });
    const maxGradeStock = Math.max(...(data.grades || []).map((g) => g.stockQty), 1);
    const maxAge = Math.max(...(data.ageing || []).map((a) => a.qty), 1);
    const awaitingQty = (data.awaiting || []).reduce((a, r) => a + r.qty, 0);

    return (
      <div className="zo-root" style={{ '--zo': '#7c3aed' }}>
        {header}

        <div>
          <p className="zo-sub" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>
            📅 Selected period: <b>{monthName}</b>
          </p>
          <div className="sales-metric-grid">
            <Kpi title="Produced Qty" value={`${n0(t.produced)} KG`} sub={monthName} color="#2563eb" />
            <Kpi title="Despatched Qty" value={`${n0(t.despatched)} KG`} sub={monthName} color="#16a34a" />
            <Kpi title="Net Movement" value={`${n0(t.net)} KG`} sub="Produced − despatched" color="#ea580c" />
            <Kpi title="Lab Tests Done" value={n0(t.labTests)} sub={monthName} color="#7c3aed" />
            <Kpi title="P5 Produced" value={`${n0(t.p5)} KG`} sub={monthName} color="#0d9488" />
            <Kpi title="P7 Produced" value={`${n0(t.p7)} KG`} sub={monthName} color="#db2777" />
          </div>
        </div>

        <div>
          <p className="zo-sub" style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>
            📦 Stock position <small>(live — not affected by the month picked)</small>
          </p>
          <div className="sales-metric-grid">
            <Kpi title="Stock in Hand" value={`${n0(k.stockQty)} KG`} sub={`${n0(k.lotsInStock)} lots`} color="#2563eb" />
            <Kpi title="P5 Stock" value={`${n0(k.p5Stock)} KG`} sub="Open lots" color="#0d9488" />
            <Kpi title="P7 Stock" value={`${n0(k.p7Stock)} KG`} sub="Open lots" color="#db2777" />
            <Kpi title="Awaiting Lab Test" value={`${n0(k.awaitingLabQty)} KG`} sub={`${n0((data.awaiting || []).length)} lots`} color="#ca8a04" />
            <Kpi title="Oldest Lot" value={`${n0(k.oldestDays)} days`} sub="First in, first out" color="#ea580c" />
            <Kpi title="Lifetime Despatched" value={`${n0(k.lifetimeDespatched)} KG`} sub="All time" color="#16a34a" />
          </div>
        </div>

        <div className="zo-grid2">
          <section className="zo-card">
            <h3 className="zo-sub">📈 Production by month</h3>
            <MonthlyBars months={months} />
          </section>

          <section className="zo-card">
            <h3 className="zo-sub">📈 Monthly performance (last 12 months)</h3>
            <div className="zo-wrap">
              <table className="zo-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="r">Produced</th>
                    <th className="r">P5</th>
                    <th className="r">P7</th>
                    <th className="r">Despatched</th>
                    <th className="r">Lab tests</th>
                  </tr>
                </thead>
                <tbody>
                  {months
                    .slice(-12)
                    .reverse()
                    .map((m) => (
                      <tr key={m.monthKey} style={m.monthKey === activeMonth ? { background: '#f5f3ff' } : undefined}>
                        <td className="b">{m.month}</td>
                        <td className="r">{n0(m.produced)}</td>
                        <td className="r">{n0(m.p5)}</td>
                        <td className="r">{n0(m.p7)}</td>
                        <td className="r">{n0(m.despatched)}</td>
                        <td className="r">{n0(m.labTests)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="zo-card">
          <h3 className="zo-sub">🏅 Stock by grade (open lots)</h3>
          <div className="zo-wrap">
            <table className="zo-table">
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Stock qty (KG)</th>
                  <th className="r">Lots</th>
                  <th className="r">Despatched ({monthName})</th>
                </tr>
              </thead>
              <tbody>
                {(data.grades || []).map((g) => (
                  <tr key={g.grade}>
                    <td>
                      <Chip name={g.grade} all={gradeNames} />
                    </td>
                    <td style={{ minWidth: 220 }}>
                      <Bar value={g.stockQty} max={maxGradeStock} color={gradeColor(g.grade, gradeNames)} label={n0(g.stockQty)} />
                    </td>
                    <td className="r">{n0(g.lots)}</td>
                    <td className="r">{n0(despByGrade[g.grade] || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="zo-note">
            One lot can pass several grades, so the grade quantities do not add up to the total stock. NORMAL GRADE means lots that pass no specific grade.
          </p>
        </section>

        <div className="zo-grid2">
          <section className="zo-card">
            <h3 className="zo-sub">🚚 Despatch by seller ({monthName})</h3>
            {sellers.length ? (
              <div className="zo-wrap">
                <table className="zo-table">
                  <thead>
                    <tr>
                      <th>Seller</th>
                      <th className="r">Qty (KG)</th>
                      <th className="r">Despatches</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellers.map((s) => (
                      <tr key={s.name}>
                        <td className="b">{s.name}</td>
                        <td className="r green">{n0(s.qty)}</td>
                        <td className="r">{n0(s.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="zo-empty">No despatch in this period.</p>
            )}
          </section>

          <section className="zo-card">
            <h3 className="zo-sub">🏷 Despatch by grade ({monthName})</h3>
            {dGrades.length ? (
              <div className="zo-wrap">
                <table className="zo-table">
                  <thead>
                    <tr>
                      <th>Grade</th>
                      <th className="r">Qty (KG)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dGrades.map((g) => (
                      <tr key={g.name}>
                        <td>
                          <Chip name={g.name} all={gradeNames} />
                        </td>
                        <td className="r green">{n0(g.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="zo-empty">No despatch in this period.</p>
            )}
          </section>
        </div>

        <div className="zo-grid2">
          <section className="zo-card">
            <h3 className="zo-sub">⏳ Stock ageing (open lots)</h3>
            <div className="zo-wrap">
              <table className="zo-table">
                <thead>
                  <tr>
                    <th>Age</th>
                    <th className="r">Lots</th>
                    <th>Qty left (KG)</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.ageing || []).map((a, i) => (
                    <tr key={a.bucket}>
                      <td className="b">{a.bucket}</td>
                      <td className="r">{n0(a.lots)}</td>
                      <td style={{ minWidth: 200 }}>
                        <Bar value={a.qty} max={maxAge} color={['#16a34a', '#ca8a04', '#ea580c', '#dc2626'][i]} label={n0(a.qty)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="zo-card">
            <h3 className="zo-sub">🏭 Production by unit ({monthName})</h3>
            {unitsP.length ? (
              <div className="zo-wrap">
                <table className="zo-table">
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th className="r">Produced (KG)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitsP.map((u) => (
                      <tr key={u.name}>
                        <td className="b">{u.name}</td>
                        <td className="r">{n0(u.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="zo-empty">No production in this period.</p>
            )}
          </section>
        </div>

        <div className="zo-grid2">
          <section className="zo-card" style={{ '--zo': '#ca8a04' }}>
            <h3 className="zo-sub">
              🧪 Batches awaiting lab test <small>(oldest first — {n0((data.awaiting || []).length)} lot(s), {n0(awaitingQty)} KG)</small>
            </h3>
            {(data.awaiting || []).length ? (
              <div className="zo-wrap is-tall">
                <table className="zo-table">
                  <thead>
                    <tr>
                      <th>Batch number</th>
                      <th>Prod. date</th>
                      <th className="r">Qty left</th>
                      <th className="r">Age (days)</th>
                      <th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.awaiting.map((a) => (
                      <tr key={a.id}>
                        <td className="b">{a.id}</td>
                        <td>{fmtDate(a.date)}</td>
                        <td className="r">{n0(a.qty)}</td>
                        <td className="r">{n0(a.age)}</td>
                        <td>{String(a.unit).slice(0, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="zo-empty">Every lot in stock has been lab tested.</p>
            )}
          </section>

          <section className="zo-card" style={{ '--zo': '#0d9488' }}>
            <h3 className="zo-sub">🔬 Latest lab tests</h3>
            {(data.latestLabs || []).length ? (
              <div className="zo-wrap is-tall">
                <table className="zo-table">
                  <thead>
                    <tr>
                      <th>Batch number</th>
                      <th>Serial</th>
                      <th>Test date</th>
                      <th>Tester</th>
                      <th>Passes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.latestLabs.map((l) => (
                      <tr key={l.serial + l.batch}>
                        <td className="b">{l.batch}</td>
                        <td>{l.serial}</td>
                        <td>{fmtDate(l.date)}</td>
                        <td>{l.tester}</td>
                        <td>
                          <span className={'zo-badge ' + (l.passes === 'NORMAL ONLY' ? 'normal' : 'passed')}>{l.passes}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="zo-empty">No lab tests yet.</p>
            )}
          </section>
        </div>
      </div>
    );
  }

  // =====================================================================
  //  VIEW 2 : LAB TEST REPORT (Y / N matrix)
  // =====================================================================
  if (view === 'labReport') {
    const lr = data.labReport || { tests: [], grades: [], rows: [], yLots: [], yQty: [] };
    const allRows = lr.rows.filter((r) => {
      if (!matchesUnit(r.unit, unit) || !matchesSearch(r.id, search)) return false;
      if (gradeFilter === 'ALL') return true;
      if (gradeFilter === 'NORMAL') return String(r.eligible).toUpperCase().indexOf('NORMAL') >= 0;
      const idx = lr.grades.indexOf(gradeFilter);
      return idx >= 0 && r.approvals[idx] === 'Y';
    });
    const rows = allRows.slice(0, ROW_LIMIT);

    return (
      <div className="zo-root" style={{ '--zo': '#0d9488' }}>
        {header}

        <section className="zo-card">
          <div className="zo-strip">
            {lr.grades.map((g, i) => (
              <div key={g} style={{ '--c': gradeColor(g, lr.grades) }}>
                <b>{n0(lr.yQty[i])} KG</b>
                <small>
                  {g} · {n0(lr.yLots[i])} lot(s) with Y
                </small>
              </div>
            ))}
          </div>

          <div className="zo-filters">
            <label>
              Unit
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="ALL">All units</option>
                <option value="P5">P5</option>
                <option value="P7">P7</option>
              </select>
            </label>
            <label>
              Only batches that passed
              <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                <option value="ALL">Any (show all)</option>
                {lr.grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
                <option value="NORMAL">Normal grade only</option>
              </select>
            </label>
            <label>
              Search batch number
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. 171026" />
            </label>
            <label className="zo-check">
              <input type="checkbox" checked={showReadings} onChange={(e) => setShowReadings(e.target.checked)} />
              Show lab readings
            </label>
          </div>
        </section>

        <section className="zo-card">
          <h3 className="zo-sub">
            {n0(allRows.length)} batch(es) shown <small>(latest lab test of each batch counts)</small>
          </h3>
          {rows.length ? (
            <div className="zo-wrap is-tall" style={{ maxHeight: 560 }}>
              <table className="zo-table">
                <thead>
                  <tr>
                    <th>Batch number</th>
                    <th>Serial</th>
                    <th>Test date</th>
                    <th>Unit</th>
                    <th className="r">Produced</th>
                    <th className="r">Stock left</th>
                    {showReadings && lr.tests.map((t) => <th key={t} className="gh">{t}</th>)}
                    {lr.grades.map((g) => (
                      <th key={g} className="gh" style={{ color: gradeColor(g, lr.grades) }}>
                        {g}
                      </th>
                    ))}
                    <th>Eligible grades</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id + r.labId}>
                      <td className="b">{r.id}</td>
                      <td>{r.labId}</td>
                      <td>{fmtDate(r.date)}</td>
                      <td>{String(r.unit).slice(0, 2)}</td>
                      <td className="r">{n0(r.produced)}</td>
                      <td className="r">{n0(r.left)}</td>
                      {showReadings && r.results.map((x, i) => <td key={i} className="gc">{x === '' ? '' : String(x)}</td>)}
                      {r.approvals.map((a, i) => (
                        <td key={i} className="gc">
                          <span className={'zo-yn ' + (a === 'Y' ? 'y' : 'n')}>{a === 'Y' ? 'Y' : 'N'}</span>
                        </td>
                      ))}
                      <td className="wrap">{r.eligible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="zo-empty">No batches match these filters.</p>
          )}
          {allRows.length > ROW_LIMIT && <p className="zo-note">Showing the first {ROW_LIMIT}. Use the filters to narrow down.</p>}
          <p className="zo-note">Y = every required test passed for that grade. A required test that was not done counts as N.</p>
        </section>
      </div>
    );
  }

  // =====================================================================
  //  VIEW 3 : GRADE REPORT (pass / fail reasons)
  // =====================================================================
  if (view === 'gradeReport') {
    const gradeNames = (data.labReport && data.labReport.grades) || [];
    const all = data.gradeReport || [];
    const filtered = all.filter((r) => {
      if (!matchesUnit(r.unit, unit) || !matchesSearch(r.id, search)) return false;
      if (gradeMode === 'PASS' && gradeFilter !== 'ALL') {
        if (gradeFilter === 'NORMAL') return r.normalOnly;
        return r.pass.indexOf(gradeFilter) >= 0;
      }
      return true;
    });
    const rows = filtered.slice(0, ROW_LIMIT);

    return (
      <div className="zo-root" style={{ '--zo': '#ea580c' }}>
        {header}

        <section className="zo-card">
          <div className="zo-filters">
            <label>
              Show
              <span className="zo-seg">
                <button type="button" className={gradeMode === 'PASS' ? 'is-on' : ''} onClick={() => setGradeMode('PASS')}>
                  ✔ PASS
                </button>
                <button type="button" className={gradeMode === 'FAIL' ? 'is-on' : ''} onClick={() => setGradeMode('FAIL')}>
                  ✖ FAIL (why)
                </button>
              </span>
            </label>
            <label>
              Unit
              <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="ALL">All units</option>
                <option value="P5">P5</option>
                <option value="P7">P7</option>
              </select>
            </label>
            {gradeMode === 'PASS' && (
              <label>
                Only batches that passed
                <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                  <option value="ALL">Any (show all)</option>
                  {gradeNames.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                  <option value="NORMAL">Normal grade only</option>
                </select>
              </label>
            )}
            <label>
              Search batch number
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. 171026" />
            </label>
          </div>
        </section>

        <section className="zo-card">
          <h3 className="zo-sub">
            {n0(filtered.length)} batch(es) shown — {gradeMode === 'PASS' ? 'grades passed' : 'why other grades failed'}
          </h3>
          {rows.length ? (
            <div className="zo-wrap is-tall" style={{ maxHeight: 600 }}>
              <table className="zo-table">
                <thead>
                  <tr>
                    <th>Batch number</th>
                    <th>Serial</th>
                    <th>Test date</th>
                    <th>Unit</th>
                    <th className="r">Stock left</th>
                    <th>{gradeMode === 'PASS' ? 'Grades passed' : 'Reasons'}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id + r.labId}>
                      <td className="b">{r.id}</td>
                      <td>{r.labId}</td>
                      <td>{fmtDate(r.date)}</td>
                      <td>{String(r.unit).slice(0, 2)}</td>
                      <td className="r">{n0(r.left)}</td>
                      <td className="wrap" style={{ minWidth: 320 }}>
                        {gradeMode === 'PASS' ? (
                          <>
                            {r.normalOnly ? (
                              <span className="zo-badge normal">NORMAL GRADE ONLY — passes no specific grade</span>
                            ) : (
                              r.pass.map((g) => <Chip key={g} name={g} all={gradeNames} />)
                            )}
                            {r.note && <div className="zo-note">{r.note}</div>}
                          </>
                        ) : r.fails.length ? (
                          r.fails.map((f, i) => (
                            <p key={i} className="zo-test">
                              <b>✖ {f.test}</b>
                              {f.fails.length > 0 && ' → fails: '}
                              {f.fails.map((x) => (
                                <span key={x} className="zo-chip is-fail">
                                  {x}
                                </span>
                              ))}
                            </p>
                          ))
                        ) : (
                          <span className="zo-badge passed">Passed every grade it was checked against</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="zo-empty">No batches match these filters.</p>
          )}
          {filtered.length > ROW_LIMIT && <p className="zo-note">Showing the first {ROW_LIMIT}. Use the filters to narrow down.</p>}
        </section>
      </div>
    );
  }

  // =====================================================================
  //  VIEW 4 : STOCK (actual stock / stock book)
  // =====================================================================
  const isActual = stockMode === 'actual';
  const gradeNames = (data.grades || []).map((g) => g.grade);
  const source = isActual ? data.lots || [] : data.book || [];
  const filtered = source.filter((r) => {
    if (!matchesUnit(r.unit, unit) || !matchesSearch(r.id, search)) return false;
    return statusFilter === 'ALL' || statusKind(r.labStatus) === statusFilter;
  });
  const rows = filtered.slice(0, ROW_LIMIT);
  const sumKey = (key) => filtered.reduce((a, r) => a + (Number(r[key]) || 0), 0);

  return (
    <div className="zo-root" style={{ '--zo': '#2563eb' }}>
      {header}

      <section className="zo-card">
        <div className="zo-filters">
          <label>
            Show
            <span className="zo-seg">
              <button type="button" className={isActual ? 'is-on' : ''} onClick={() => setStockMode('actual')}>
                📦 Actual stock
              </button>
              <button type="button" className={!isActual ? 'is-on' : ''} onClick={() => setStockMode('book')}>
                📚 Stock book
              </button>
            </span>
          </label>
          <label>
            Unit
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="ALL">All units</option>
              <option value="P5">P5</option>
              <option value="P7">P7</option>
            </select>
          </label>
          <label>
            Lab status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All</option>
              <option value="awaiting">Awaiting lab test</option>
              <option value="normal">Tested – normal grade only</option>
              <option value="passed">Tested – passed grade(s)</option>
            </select>
          </label>
          <label>
            Search batch number
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. 171026" />
          </label>
        </div>

        {isActual && (
          <div className="zo-strip" style={{ marginTop: 14, marginBottom: 0 }}>
            {(data.grades || []).map((g) => (
              <div key={g.grade} style={{ '--c': gradeColor(g.grade, gradeNames) }}>
                <b>{n0(g.stockQty)} KG</b>
                <small>
                  {g.grade} · {n0(g.lots)} lot(s)
                </small>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="sales-metric-grid">
        <Kpi title="Batches shown" value={n0(filtered.length)} sub={isActual ? 'Lots with stock' : 'Every batch ever made'} color="#2563eb" />
        {!isActual && <Kpi title="Produced" value={`${n0(sumKey('produced'))} KG`} sub="Shown batches" color="#0d9488" />}
        {!isActual && <Kpi title="Despatched" value={`${n0(sumKey('despatched'))} KG`} sub="Shown batches" color="#ea580c" />}
        <Kpi title="Stock left" value={`${n0(sumKey('left'))} KG`} sub="Shown batches" color="#16a34a" />
        {isActual && <Kpi title="Oldest lot" value={`${n0(data.kpis ? data.kpis.oldestDays : 0)} days`} sub="First in, first out" color="#ca8a04" />}
      </div>

      <section className="zo-card">
        <h3 className="zo-sub">{isActual ? 'Lot-wise actual stock (oldest first)' : 'Stock book — every batch number'}</h3>
        {rows.length ? (
          <div className="zo-wrap is-tall" style={{ maxHeight: 600 }}>
            <table className="zo-table">
              <thead>
                <tr>
                  <th>Batch number</th>
                  <th>Unit</th>
                  <th>Prod. date</th>
                  {isActual && <th className="r">Age (days)</th>}
                  <th className="r">Produced</th>
                  <th className="r">Despatched</th>
                  <th className="r">Stock left</th>
                  {isActual && <th>% left</th>}
                  <th>Lab status</th>
                  <th>Serial</th>
                  <th>Eligible grades</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={r.left <= 0 ? 'is-sold' : ''}>
                    <td className="b">{r.id}</td>
                    <td>{String(r.unit).slice(0, 2)}</td>
                    <td>{fmtDate(r.date)}</td>
                    {isActual && <td className="r">{n0(r.age)}</td>}
                    <td className="r">{n0(r.produced)}</td>
                    <td className="r">{n0(r.despatched)}</td>
                    <td className="r b">{n0(r.left)}</td>
                    {isActual && (
                      <td style={{ minWidth: 110 }}>
                        <Bar value={r.pctLeft * 100} max={100} color="#16a34a" label={n1(r.pctLeft * 100) + '%'} />
                      </td>
                    )}
                    <td>
                      <span className={'zo-badge ' + statusKind(r.labStatus)}>{r.labStatus}</span>
                    </td>
                    <td>{r.labId && r.labId !== '-' ? r.labId : ''}</td>
                    <td className="wrap">
                      {gradeList(r.grades).map((g) => (
                        <Chip key={g} name={g} all={gradeNames} />
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="zo-empty">No batches match these filters.</p>
        )}
        {filtered.length > ROW_LIMIT && <p className="zo-note">Showing the first {ROW_LIMIT}. Use the filters to narrow down.</p>}
      </section>
    </div>
  );
}
