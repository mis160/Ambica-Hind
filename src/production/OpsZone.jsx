import React, { useMemo, useState } from 'react';
import { Pills, MonthBar, Banner, Kpi, KpiGrid, Card, Strip, Bars, Table, Chip } from './prodShared.jsx';
import { buildOps, periodStats, NORMAL } from './opsMath.js';
import { n0, monthLabel } from './prodUtils.js';
import { OPS_SHEET_URL, OPS_FORM_URL } from './prodConfig.js';

const ACCENT = '#ea580c';
const LAB_COLS = [
  ['Zinc as ZnO (%)', 'ZnO %'], ['Matter insoluble in HCl (%)', 'HCl insol %'], ['Wet sieve residue > 45 micron (%)', 'Sieve %'],
  ['Moisture at 105 DegC (%)', 'Moist %'], ['Loss on ignition at 850 DegC (%)', 'LOI %'], ['Lead as Pb (ppm)', 'Pb ppm'],
];

export default function OpsZone({ data, loading, error, reload }) {
  const [tab, setTab] = useState('dash');
  const [month, setMonth] = useState('');
  const [q, setQ] = useState('');
  const [show, setShow] = useState('PASS');
  const [gradeF, setGradeF] = useState('ALL');

  const m = useMemo(() => (data ? buildOps(data) : null), [data]);

  if (error && !m) return <Banner>{error}</Banner>;
  if (!m) return <Banner>{loading ? 'Loading Production · Lab · Despatch data...' : 'No data yet.'}</Banner>;

  const pick = month || m.months[m.months.length - 1] || 'ALL';
  const ps = periodStats(m, pick);
  const stockQty = m.lots.reduce((a, x) => a + x.left, 0);
  const awaiting = m.lots.filter((x) => !x.tested);
  const awaitQty = awaiting.reduce((a, x) => a + x.left, 0);
  const noLabDesp = m.noLabDespatched.reduce((a, x) => a + x.qty, 0);
  const concernQty = m.concerns.reduce((a, x) => a + x.qty, 0);
  const oldest = m.lots.length ? Math.max(...m.lots.map((x) => x.age)) : 0;
  const ql = q.trim().toLowerCase();
  const has = (...v) => !ql || v.some((x) => String(x || '').toLowerCase().includes(ql));

  const monthly = m.months.slice(0, 12).map((k) => ({ k, ...periodStats(m, k) }));
  const ageBuckets = [['0 - 15 days', 0, 15], ['16 - 30 days', 16, 30], ['31 - 60 days', 31, 60], ['Over 60 days', 61, 1e9]].map(([l, a, b]) => {
    const L = m.lots.filter((x) => x.age >= a && x.age <= b);
    return { l, lots: L.length, qty: L.reduce((s, x) => s + x.left, 0) };
  });

  const toolbar = (
    <div className="pz-tools">
      <input placeholder="Search batch / serial..." value={q} onChange={(e) => setQ(e.target.value)} />
    </div>
  );

  return (
    <div className="pz-root" style={{ '--pz': ACCENT }}>
      <div className="pz-card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pills accent={ACCENT} value={tab} onChange={setTab} items={[
          ['dash', '📊 Dashboard'], ['lab', '🧪 Lab Report'], ['grade', '🏅 Grade Report'], ['stock', '📦 Actual Stock'],
          ['extra', '➕ Extra Qty'], ['book', '📚 Stock Book']]} />
        <div className="pz-tools">
          {OPS_FORM_URL && <a className="pz-btn" href={OPS_FORM_URL} target="_blank" rel="noreferrer">📝 Open Entry Portal</a>}
          {OPS_SHEET_URL && <a className="pz-btn ghost" href={OPS_SHEET_URL} target="_blank" rel="noreferrer">📄 Open Sheet</a>}
          <button type="button" className="pz-btn ghost" onClick={reload}>↻ Refresh</button>
        </div>
      </div>

      {/* ================= DASHBOARD ================= */}
      {tab === 'dash' && (
        <>
          <MonthBar months={m.months} value={pick} onChange={setMonth} accent={ACCENT} allowAll
            title="ZNO PRODUCTION SUITE ✦ EXECUTIVE DASHBOARD"
            sub={`Production · Lab · Despatch · Stock — figures follow the month picked (stock position is live). Data as of ${m.today}`} />
          <Strip>📅 SELECTED PERIOD: {monthLabel(pick).toUpperCase()}</Strip>
          <KpiGrid>
            <Kpi title="Produced qty" value={n0(ps.produced)} color="#16a34a" sub={`P5 ${n0(ps.p5)} • P7 ${n0(ps.p7)}`} />
            <Kpi title="Despatched qty" value={n0(ps.despatched)} color="#2563eb" />
            <Kpi title="Extra added at despatch" value={n0(ps.extra)} color="#ca8a04" />
            <Kpi title="Despatched before lab result" value={n0(ps.beforeLab)} color="#dc2626" />
            <Kpi title="Lab tests done" value={n0(ps.labTests)} color="#7c3aed" />
            <Kpi title="Net movement (prod − desp)" value={n0(ps.produced - ps.despatched)} color="#0d9488" />
          </KpiGrid>

          <Strip>📦 STOCK POSITION (live, as of now)</Strip>
          <KpiGrid>
            <Kpi title="Stock in hand (qty)" value={n0(stockQty)} color="#16a34a" />
            <Kpi title="Lots in stock" value={n0(m.lots.length)} color="#2563eb" />
            <Kpi title="Awaiting lab test (qty)" value={n0(awaitQty)} color="#ca8a04" sub={`${awaiting.length} lot(s)`} />
            <Kpi title="Despatched, result pending" value={n0(noLabDesp)} color="#ea580c" />
            <Kpi title="⚠ Lab concerns (qty)" value={n0(concernQty)} color="#dc2626" sub={`${m.concerns.length} despatch(es)`} />
            <Kpi title="Oldest lot (days)" value={n0(oldest)} color="#7c3aed" />
          </KpiGrid>

          <div className="pz-grid2">
            <Card title="📈 Monthly performance">
              <Table rows={monthly} rowClass={(r) => (r.k === pick ? 'ok' : '')} cols={[
                { h: 'Month', f: (r) => <b>{monthLabel(r.k)}</b> },
                { h: 'Produced', a: 'r', f: (r) => n0(r.produced) }, { h: 'P5', a: 'r', f: (r) => n0(r.p5) },
                { h: 'P7', a: 'r', f: (r) => n0(r.p7) }, { h: 'Despatched', a: 'r', f: (r) => n0(r.despatched) },
                { h: 'Lab tests', a: 'r', f: (r) => n0(r.labTests) }]} />
            </Card>
            <Card title="🏅 Stock by grade (open lots — do not add up)">
              <Table rows={m.byGrade} cols={[
                { h: 'Grade', f: (r) => <b>{r.grade}</b> }, { h: 'Stock qty', a: 'r', f: (r) => n0(r.qty) }, { h: 'Lots', a: 'r', f: (r) => r.lots }]} />
            </Card>
          </div>

          <div className="pz-grid2">
            <Card title={`🚚 Despatch by seller (${monthLabel(pick)})`}>
              <Bars color="#2563eb" fmt={n0} rows={ps.sellers.map((s) => ({ label: s.k, value: s.qty, sub: `(${s.n})` }))} />
            </Card>
            <Card title={`🏷 Despatch by grade (${monthLabel(pick)})`}>
              <Bars color="#16a34a" fmt={n0} rows={ps.grades.map((s) => ({ label: s.k, value: s.qty }))} />
            </Card>
          </div>

          <div className="pz-grid2">
            <Card title="⏳ Stock ageing (open lots)">
              <Table rows={ageBuckets} cols={[{ h: 'Age bucket', f: (r) => <b>{r.l}</b> }, { h: 'Lots', a: 'r', f: (r) => r.lots }, { h: 'Qty left', a: 'r', f: (r) => n0(r.qty) }]} />
            </Card>
            <Card title="🔬 Latest lab tests">
              <Table rows={m.latestLab} cols={[
                { h: 'Batch', f: (r) => r.batch }, { h: 'Serial', f: (r) => r.serial }, { h: 'Date', f: (r) => r.date },
                { h: 'Passes', f: (r) => (r.passes.length ? r.passes.length + ' grade(s)' : 'NORMAL ONLY') }]} />
            </Card>
          </div>

          <Card title={`🧪 Lots awaiting lab test (oldest first — ${awaiting.length} lot(s), qty ${n0(awaitQty)})`}>
            <Table rows={awaiting} empty="All stock lots are lab tested ✔" cols={[
              { h: 'Batch', f: (r) => <b>{r.batch}</b> }, { h: 'Prod. date', f: (r) => r.date }, { h: 'Qty left', a: 'r', f: (r) => n0(r.left) },
              { h: 'Age (days)', a: 'r', f: (r) => r.age }, { h: 'Unit', f: (r) => r.unit }]} />
          </Card>

          <Card title={`⚠ Lab concerns — despatched grade NOT passed by the lab result (${m.concerns.length} despatch(es), qty ${n0(concernQty)})`}>
            <Table rows={m.concerns} rowClass={() => 'warn'} empty="No concerns ✔" cols={[
              { h: 'Batch', f: (r) => <b>{r.batch}</b> }, { h: 'Desp. date', f: (r) => r.date }, { h: 'Grade sent', f: (r) => r.grade },
              { h: 'Qty', a: 'r', f: (r) => n0(r.qty) }, { h: 'Lab passes', f: (r) => `${r.shown.join(', ')} (${r.via})` }]} />
          </Card>

          <Card title={`➕ Extra qty added at despatch (${monthLabel(pick)})`}>
            <Table rows={ps.extras} empty="No extra qty this period" cols={[
              { h: 'Batch', f: (r) => <b>{r.batch}</b> }, { h: 'Date', f: (r) => r.date }, { h: 'Extra', a: 'r', f: (r) => n0(r.extra) }, { h: 'Reason', f: (r) => r.reason }]} />
          </Card>
        </>
      )}

      {/* ================= LAB REPORT ================= */}
      {tab === 'lab' && (
        <Card title="🧪 Lab Test Report — grade-wise Y / N for every production lot (latest lab test counts)" right={toolbar}>
          <Table maxRows={150} rows={m.labRows.filter((r) => has(r.batch, r.serial))} cols={[
            { h: 'Batch', f: (r) => <b>{r.batch}</b> }, { h: 'Serial', f: (r) => r.serial }, { h: 'Test date', f: (r) => r.date },
            { h: 'Unit', f: (r) => r.unit }, { h: 'Stock', a: 'r', f: (r) => n0(r.left) },
            ...LAB_COLS.map(([k, l]) => ({ h: l, a: 'r', f: (r) => (r.row[k] === '' || r.row[k] === undefined ? '' : r.row[k]) })),
            ...m.gradeNames.map((g) => ({ h: g.replace(' GRADE', '').replace('SPECIAL', 'SP.'), f: (r) => <Chip ok={r.passes.includes(g)}>{r.passes.includes(g) ? 'Y' : 'N'}</Chip> })),
          ]} />
        </Card>
      )}

      {/* ================= GRADE REPORT ================= */}
      {tab === 'grade' && (
        <Card title="🏅 Grade Report — grades passed by each Batch Number"
          right={<div className="pz-tools">{toolbar}<select value={show} onChange={(e) => setShow(e.target.value)}><option value="PASS">SHOW: PASS</option><option value="FAIL">SHOW: FAIL (reasons)</option></select></div>}>
          <Table maxRows={150} rows={m.labRows.filter((r) => has(r.batch, r.serial))} cols={[
            { h: 'Batch', f: (r) => <b>{r.batch}</b> }, { h: 'Serial', f: (r) => r.serial }, { h: 'Date', f: (r) => r.date },
            { h: 'Unit', f: (r) => r.unit }, { h: 'Stock', a: 'r', f: (r) => n0(r.left) },
            { h: show === 'PASS' ? 'Grades passed' : 'Why other grades failed', f: (r) => (show === 'PASS'
              ? <span className="pz-pass">{r.passes.length ? '✔ ' + r.passes.join('   ✔ ') : 'NORMAL GRADE ONLY'}</span>
              : <div className="pz-reason">{r.reasons.map((x) => (
                <div key={x.test}>✖ <b>{x.test} = {String(x.value)}</b> → fails: {x.grades.map((g) => `${g.grade} ${g.limit}`).join(' | ')}</div>))}</div>) },
          ]} />
        </Card>
      )}

      {/* ================= ACTUAL STOCK ================= */}
      {tab === 'stock' && (
        <>
          <KpiGrid>
            <Kpi title="Lots in stock" value={n0(m.lots.length)} color="#2563eb" />
            <Kpi title="Total stock qty" value={n0(stockQty)} color="#16a34a" />
            <Kpi title="P5 stock" value={n0(m.lots.filter((x) => /^P5/i.test(x.unit)).reduce((a, x) => a + x.left, 0))} color="#ea580c" />
            <Kpi title="P7 stock" value={n0(m.lots.filter((x) => /^P7/i.test(x.unit)).reduce((a, x) => a + x.left, 0))} color="#7c3aed" />
            <Kpi title="Awaiting lab (qty)" value={n0(awaitQty)} color="#ca8a04" />
            <Kpi title="Oldest lot (days)" value={n0(oldest)} color="#dc2626" />
          </KpiGrid>
          <Card title="Stock available by grade (a lot can count in several grades)">
            <Table rows={m.byGrade} cols={[{ h: 'Grade', f: (r) => <b>{r.grade}</b> }, { h: 'Stock qty', a: 'r', f: (r) => n0(r.qty) }, { h: 'Lots', a: 'r', f: (r) => r.lots }]} />
          </Card>
          <Card title="Lot-wise actual stock (oldest first — FIFO)" right={<div className="pz-tools">{toolbar}
            <select value={gradeF} onChange={(e) => setGradeF(e.target.value)}>
              <option value="ALL">All grades</option><option value="AWAIT">Awaiting lab</option>
              {[...m.gradeNames, NORMAL].map((g) => <option key={g} value={g}>{g}</option>)}</select></div>}>
            <Table maxRows={200} rows={m.lots.filter((r) => has(r.batch, r.serial) && (gradeF === 'ALL' || (gradeF === 'AWAIT' ? !r.tested : r.eligible.includes(gradeF))))} cols={[
              { h: 'Batch', f: (r) => <b>{r.batch}</b> }, { h: 'Unit', f: (r) => r.unit }, { h: 'Prod. date', f: (r) => r.date },
              { h: 'Age', a: 'r', f: (r) => r.age }, { h: 'Produced', a: 'r', f: (r) => n0(r.produced) }, { h: 'Despatched', a: 'r', f: (r) => n0(r.desp) },
              { h: 'Left', a: 'r', f: (r) => <b>{n0(r.left)}</b> }, { h: '% left', a: 'r', f: (r) => Math.round((r.left / (r.produced || 1)) * 100) + '%' },
              { h: 'Lab', f: (r) => (r.tested ? 'TESTED' : 'AWAITING LAB TEST') }, { h: 'Eligible grades', f: (r) => (r.tested ? r.eligible.join(', ') : '-') }]} />
          </Card>
        </>
      )}

      {/* ================= EXTRA QTY ================= */}
      {tab === 'extra' && (
        <Card title="➕ Extra Qty Report — declared at despatch, despatch-team test and ACTUAL GRADE"
          right={<span className="pz-sub">ACTUAL GRADE = grades passed by BOTH lab result and despatch test (none in common → NORMAL). Red = grade sold not in actual grade.</span>}>
          <Table maxRows={200} rows={m.extras} rowClass={(r) => (r.okSold ? 'ok' : 'warn')} cols={[
            { h: 'Desp. date', f: (r) => r.date }, { h: 'Batch', f: (r) => <b>{r.batch}</b> }, { h: 'Seller', f: (r) => r.seller },
            { h: 'Desp. qty', a: 'r', f: (r) => n0(r.qty) }, { h: 'Extra', a: 'r', f: (r) => n0(r.extra) },
            { h: 'ZnO', a: 'r', f: (r) => r.t[0] }, { h: 'Pb', a: 'r', f: (r) => r.t[1] }, { h: 'Moist', a: 'r', f: (r) => r.t[2] },
            { h: 'LOI', a: 'r', f: (r) => r.t[3] }, { h: 'HCl', a: 'r', f: (r) => r.t[4] }, { h: 'Sieve', a: 'r', f: (r) => r.t[5] },
            { h: 'Grade sold', f: (r) => r.grade }, { h: 'Despatch test passes', f: (r) => r.testGrades.join(', ') },
            { h: 'Actual grade', f: (r) => <b>{r.actual.join(', ')}</b> }, { h: 'Status', f: (r) => (r.final ? 'FINAL' : 'PROVISIONAL') },
            { h: 'Check', f: (r) => (r.okSold ? '✔ OK' : '⚠ GRADE SOLD NOT IN ACTUAL') }]} />
        </Card>
      )}

      {/* ================= STOCK BOOK ================= */}
      {tab === 'book' && (
        <Card title="📚 Stock Book — every Batch Number: produced, despatched, balance (sold-out lots in grey)" right={toolbar}>
          <Table maxRows={250} rows={m.book.filter((r) => has(r.batch, r.serial))} rowClass={(r) => (r.left <= 0 ? 'grey' : '')} cols={[
            { h: 'Batch', f: (r) => <b>{r.batch}</b> }, { h: 'Unit', f: (r) => r.unit }, { h: 'Prod. date', f: (r) => r.date },
            { h: 'Handover', a: 'r', f: (r) => n0(r.hand) }, { h: 'Extra at despatch', a: 'r', f: (r) => (r.extra ? n0(r.extra) : '') },
            { h: 'Total produced', a: 'r', f: (r) => n0(r.produced) }, { h: 'Despatched', a: 'r', f: (r) => n0(r.desp) },
            { h: 'Stock left', a: 'r', f: (r) => <b>{n0(r.left)}</b> }, { h: 'Lab', f: (r) => (r.tested ? 'TESTED' : 'AWAITING') },
            { h: 'Serial', f: (r) => r.serial }, { h: 'Eligible grades', f: (r) => (r.tested ? r.eligible.join(', ') : '-') }]} />
        </Card>
      )}
    </div>
  );
}
