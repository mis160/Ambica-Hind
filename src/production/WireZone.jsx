import React, { useMemo, useState } from 'react';
import { Pills, MonthBar, Banner, Kpi, KpiGrid, Card, Strip, Bars, Table, Delta } from './prodShared.jsx';
import { num, n0, n2, lakh, toYMD, monthLabel, prevMonth, shortDay } from './prodUtils.js';
import { WIRE_FORM_URL } from './prodConfig.js';

const COMPS = [['⚡ Electricity', 'Elec Cost/MT'], ['🧪 Consumables', 'Consumable Cost/MT'], ['👷 Manpower', 'Manpower Cost/MT'],
  ['🔧 Maintenance', 'Maint Cost/MT'], ['♻ Waste', 'Waste Cost/MT'], ['🏢 Admin', 'Admin Cost/MT'], ['🏦 Interest', 'Interest/MT']];

// Weighted monthly stats - same logic as the sheet's WD Dashboard (Σ day cost / Σ MT)
function stats(rows, p) {
  const prod = rows.reduce((a, r) => a + (num(r[`${p} Total Production (MT)`]) || 0), 0);
  const cost = rows.reduce((a, r) => a + (num(r[`${p} Day Cost (₹)`]) || 0), 0);
  const per = prod ? cost / prod : 0;
  const comps = COMPS.map(([label, key]) => ({
    label, v: prod ? rows.reduce((a, r) => a + (num(r[`${p} Total Production (MT)`]) || 0) * (num(r[`${p} ${key}`]) || 0), 0) / prod : 0,
  }));
  const known = comps.reduce((a, c) => a + c.v, 0);
  comps.push({ label: '📦 Other / zero-production days', v: Math.max(0, per - known) });
  return { prod, cost, per, comps, days: rows.filter((r) => (num(r[`${p} Total Production (MT)`]) || 0) > 0).length };
}
const find = (r, start) => { const k = Object.keys(r).find((x) => x.startsWith(start)); return k ? num(r[k]) || 0 : 0; };

export default function WireZone({ unit, data, loading, error, reload }) {
  const isGI = /GI/.test(unit);
  const P = isGI ? 'GI' : 'WD';
  const accent = isGI ? '#0d9488' : '#2563eb';
  const [tab, setTab] = useState('overview');
  const [sel, setSel] = useState('');
  const [q, setQ] = useState('');

  const daily = useMemo(() => ((data && data.daily) || []).map((r) => ({ ...r, _d: toYMD(r.Date) })).filter((r) => r._d).sort((a, b) => a._d.localeCompare(b._d)), [data]);
  const months = useMemo(() => [...new Set(daily.map((r) => r._d.slice(0, 7)))], [daily]);

  if (error && !daily.length) return <Banner>{error}</Banner>;
  if (!daily.length) return <Banner>{loading ? 'Loading wire costing data...' : 'No daily cost pool rows found.'}</Banner>;

  const cur = months.includes(sel) ? sel : months[months.length - 1];
  const rowsOf = (k) => daily.filter((r) => r._d.startsWith(k));
  const mine = rowsOf(cur);
  const S = stats(mine, P);
  const Sp = stats(rowsOf(prevMonth(cur)), P);
  const hasPrev = rowsOf(prevMonth(cur)).length > 0;
  const lastDay = mine.length ? mine[mine.length - 1]._d : '';
  const matrix = months.map((k) => ({ k, wd: stats(rowsOf(k), 'WD'), gi: stats(rowsOf(k), 'GI') })).reverse();
  const prodDays = mine.filter((r) => (num(r[`${P} Total Production (MT)`]) || 0) > 0);

  // umbrella (WD only)
  const umbRows = ((data && data.umbrella) || []).filter((r) => toYMD(r.Date).startsWith(cur));
  const u11 = umbRows.reduce((a, r) => a + find(r, '11B Prod'), 0);
  const u61 = umbRows.reduce((a, r) => a + find(r, '6B1/8B Prod'), 0);
  const u62 = umbRows.reduce((a, r) => a + find(r, '6B2 Prod'), 0);
  const uTot = u11 + u61 + u62;
  const uCost = umbRows.reduce((a, r) => a + find(r, '11B Prod') * find(r, '11B Grand Total') + (find(r, '6B1/8B Prod') + find(r, '6B2 Prod')) * find(r, '6B Grand Total'), 0);

  const logRows = ((data && (isGI ? data.giLog : data.wdLog)) || []).filter((r) => toYMD(r.Date).startsWith(cur))
    .filter((r) => !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q.toLowerCase()))).reverse();
  const logCols = isGI
    ? [['Date'], ['Shift'], ['Pad / Comm'], ['Production (MT)', 'r'], ['Grand Total Cost/MT', 'r'], ['Total Cost Value (₹)', 'r']]
    : [['Date'], ['Shift'], ['Machine / Block'], ['Inlet Grade'], ['Finish Size Grade'], ['Finish Size (mm)', 'r'], ['Production (MT)', 'r'], ['WD Repeat Reason'], ['Grand Total Cost/MT', 'r'], ['Total Cost Value (₹)', 'r']];

  const tabs = [['overview', '📊 Overview'], ['daily', '📈 Daily Trend'], ['matrix', '🗓 Month Matrix'], ['records', '📋 Records']];
  if (!isGI) tabs.splice(2, 0, ['umb', '☂ Umbrella']);

  return (
    <div className="pz-root" style={{ '--pz': accent }}>
      <div className="pz-card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pills accent={accent} value={tab} onChange={setTab} items={tabs} />
        <div className="pz-tools">
          {WIRE_FORM_URL && <a className="pz-btn" href={WIRE_FORM_URL} target="_blank" rel="noreferrer">📝 Submit Daily Entry</a>}
          <button type="button" className="pz-btn ghost" onClick={reload}>↻ Refresh</button>
        </div>
      </div>

      <MonthBar months={months} value={cur} onChange={setSel} accent={accent}
        title={isGI ? 'GALVANIZING ✦ PRODUCTION & COSTING DASHBOARD' : 'WIRE (WD) ✦ PRODUCTION & COSTING DASHBOARD'}
        sub={`${daily.length} daily cost-pool rows • data till ${lastDay} • Qty in MT, cost in ₹ / MT & ₹ Lakh`} />

      {tab === 'overview' && (
        <>
          <Strip>📌 {monthLabel(cur).toUpperCase()} — MONTH SNAPSHOT (up to {lastDay})</Strip>
          <KpiGrid>
            <Kpi title={`🏭 ${P} production (MT)`} value={n2(S.prod)} color={accent} sub={`${S.days} producing days`}>
              {hasPrev && <Delta cur={S.prod} prev={Sp.prod} goodUp label={'vs ' + monthLabel(prevMonth(cur))} />}
            </Kpi>
            <Kpi title={`💰 ${P} cost (₹ / MT)`} value={n0(S.per)} color="#ea580c">
              {hasPrev && <Delta cur={S.per} prev={Sp.per} goodUp={false} label={'vs ' + monthLabel(prevMonth(cur))} />}
            </Kpi>
            <Kpi title={`🧾 ${P} total cost (₹ Lakh)`} value={lakh(S.cost)} color="#7c3aed">
              {hasPrev && <Delta cur={S.cost} prev={Sp.cost} goodUp={false} label={'vs ' + monthLabel(prevMonth(cur))} />}
            </Kpi>
            {!isGI && <Kpi title="☂ Umbrella production (MT)" value={n2(uTot)} color="#0d9488" sub={uTot ? `≈ ₹${n0(uCost / uTot)} / MT` : 'no entries'} />}
          </KpiGrid>

          <Card title={`📊 Cost analysis — ${monthLabel(cur)} (₹ / MT, weighted by production)`}>
            <Table rows={[...S.comps, { label: 'TOTAL (= avg ₹/MT)', v: S.per, total: true }]} cols={[
              { h: 'Component', f: (r) => (r.total ? <b>{r.label}</b> : r.label) },
              { h: `${P} ₹/MT`, a: 'r', f: (r) => (r.total ? <b>{n2(r.v)}</b> : n2(r.v)) },
              { h: 'Share', f: (r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: Math.max(2, (r.v / (S.per || 1)) * 140), height: 10, borderRadius: 5, background: accent }} />
                  {S.per ? Math.round((r.v / S.per) * 100) : 0}%
                </div>) }]} />
          </Card>

          <Card title={`📅 ${monthLabel(cur)} vs ${monthLabel(prevMonth(cur))}`}>
            <Table rows={[
              { m: `${P} production (MT)`, a: S.prod, b: Sp.prod, up: true, f: n2 },
              { m: `${P} true ₹ / MT`, a: S.per, b: Sp.per, up: false, f: n2 },
              { m: `${P} total cost (₹ Lakh)`, a: S.cost / 1e5, b: Sp.cost / 1e5, up: false, f: n2 }]} cols={[
              { h: 'Metric', f: (r) => <b>{r.m}</b> }, { h: 'This month', a: 'r', f: (r) => r.f(r.a) },
              { h: 'Last month', a: 'r', f: (r) => (hasPrev ? r.f(r.b) : '-') },
              { h: 'Change', a: 'r', f: (r) => (hasPrev ? <Delta cur={r.a} prev={r.b} goodUp={r.up} label="" /> : '-') }]} />
          </Card>
        </>
      )}

      {tab === 'daily' && (
        <div className="pz-grid2">
          <Card title={`${P} daily production (MT)`}>
            <Bars color={accent} fmt={n2} rows={mine.map((r) => ({ label: shortDay(r._d), value: num(r[`${P} Total Production (MT)`]) || 0 }))} />
          </Card>
          <Card title={`${P} daily grand total cost (₹ / MT)`}>
            <Bars color="#ea580c" fmt={n0} rows={prodDays.map((r) => ({ label: shortDay(r._d), value: num(r[`${P} Grand Total/MT`]) || 0 }))} />
          </Card>
        </div>
      )}

      {tab === 'umb' && !isGI && (
        <Card title={`☂ Umbrella production — ${monthLabel(cur)}`}>
          <KpiGrid>
            <Kpi title="11-Block (MT)" value={n2(u11)} color="#2563eb" />
            <Kpi title="6B1 / 8B (MT)" value={n2(u61)} color="#0d9488" />
            <Kpi title="6B2 (MT)" value={n2(u62)} color="#7c3aed" />
            <Kpi title="Total umbrella (MT)" value={n2(uTot)} color="#ea580c" sub={uTot ? `≈ ₹${n0(uCost / uTot)} / MT weighted` : ''} />
          </KpiGrid>
          <div style={{ height: 12 }} />
          <Bars color="#0d9488" fmt={n2} rows={umbRows.map((r) => ({ label: shortDay(toYMD(r.Date)), value: find(r, 'Total Umbrella Prod') }))} empty="No umbrella entries this month" />
        </Card>
      )}

      {tab === 'matrix' && (
        <Card title="🗓 Month Matrix — WD & GI, all months">
          <Table rows={matrix} rowClass={(r) => (r.k === cur ? 'ok' : '')} cols={[
            { h: 'Month', f: (r) => <b>{monthLabel(r.k)}</b> },
            { h: 'WD prod (MT)', a: 'r', f: (r) => n2(r.wd.prod) }, { h: 'WD ₹/MT', a: 'r', f: (r) => n0(r.wd.per) }, { h: 'WD cost (₹ L)', a: 'r', f: (r) => lakh(r.wd.cost) },
            { h: 'GI prod (MT)', a: 'r', f: (r) => n2(r.gi.prod) }, { h: 'GI ₹/MT', a: 'r', f: (r) => n0(r.gi.per) }, { h: 'GI cost (₹ L)', a: 'r', f: (r) => lakh(r.gi.cost) }]} />
        </Card>
      )}

      {tab === 'records' && (
        <Card title={`📋 ${P} production log — ${monthLabel(cur)} (${logRows.length} entries)`}
          right={<div className="pz-tools"><input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} /></div>}>
          <Table maxRows={300} rows={logRows} empty={data && (data.wdLog || data.giLog) ? 'No entries' : 'Production log not sent by the API'}
            cols={logCols.map(([k, a]) => ({ h: k, a, f: (r) => {
              const v = r[k];
              if (k === 'Date') return toYMD(v);
              return a === 'r' && num(v) !== null ? n2(v) : String(v === undefined ? '' : v);
            } }))} />
        </Card>
      )}
    </div>
  );
}
