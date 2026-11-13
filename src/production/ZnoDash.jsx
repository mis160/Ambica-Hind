import React, { useState } from 'react';
import { Pills, MonthBar, Banner, Kpi, KpiGrid, Card, Strip, Bars, Table, Delta, Chip } from './prodShared.jsx';
import { n0, n2, lakh, monthLabel, prevMonth } from './prodUtils.js';

const ACCENT = '#ea580c';
const NEED = 'ZNO dashboard data is not in the feed yet. In the ZNO Apps Script: Deploy → Manage deployments → edit → New version, then press Refresh.';

const blank = (v) => v === '' || v === null || v === undefined;
const f2 = (v) => (blank(v) ? '-' : typeof v === 'number' ? n2(v) : String(v));
const f0 = (v) => (blank(v) ? '-' : typeof v === 'number' ? n0(v) : String(v));
// recovery columns can be a fraction (0.123) or a plain number
const pct = (v) => (blank(v) || typeof v !== 'number' ? f2(v) : Math.abs(v) <= 5 ? n2(v * 100) + '%' : n2(v));
const ymKey = (m) => String(m.date || '').slice(0, 7);

/* ====================== FY DASHBOARD ====================== */
export function ZnoFyDashboard({ dash, loaded, error }) {
  const [sel, setSel] = useState('');
  if (!dash) return <Banner>{error || (loaded ? NEED : 'Loading ZNO dashboard...')}</Banner>;

  const months = (dash.months || []).filter((m) => ymKey(m));
  const keys = months.map(ymKey);
  const fy = dash.fy || {};
  if (!keys.length) return <Banner>No monthly ZNO figures yet.</Banner>;

  const cur = keys.includes(sel) ? sel : keys[keys.length - 1];
  const M = months.find((m) => ymKey(m) === cur) || {};
  const P = months.find((m) => ymKey(m) === prevMonth(cur));
  const first = keys[0];
  const fyStartYear = Number(first.slice(5, 7)) >= 4 ? Number(first.slice(0, 4)) : Number(first.slice(0, 4)) - 1;
  const fyLabel = 'FY ' + fyStartYear + '-' + String((fyStartYear + 1) % 100).padStart(2, '0');
  const fyNet = fy.oxide ? fy.cost / fy.oxide : 0;
  const fyRec = fy.dross ? fy.oxide / fy.dross : 0;
  const tot = months.reduce((a, m) => ({ dross: a.dross + m.dross, oxide: a.oxide + m.oxide, cost: a.cost + m.cost }), { dross: 0, oxide: 0, cost: 0 });
  const comps = [['⚡ Electricity', M.elec], ['🔥 Furnace oil', M.oil], ['📦 Packing', M.pack], ['🧱 Crucible & refractories', M.crucible], ['👷 Manpower', M.manpower], ['🏢 Other', M.other]];

  return (
    <>
      <Strip>📌 {fyLabel} TOTALS (SINCE APR-{String(fyStartYear % 100).padStart(2, '0')})</Strip>
      <KpiGrid>
        <Kpi title="⛏ Total dross used (KG)" value={n0(fy.dross)} color="#b7791f" />
        <Kpi title="🏭 Total oxide produced (KG)" value={n0(fy.oxide)} color="#2f855a" sub={fy.dross ? `recovery ${n2(fyRec * 100)}%` : ''} />
        <Kpi title="🛢 Furnace oil used (Ltr)" value={n0(fy.oilLtr)} color="#b83280" />
        <Kpi title="💰 Total cost till date (₹ Lakh)" value={lakh(fy.cost)} color="#c53030" sub={fy.oxide ? `avg ₹ ${n2(fyNet)} / KG` : ''} />
      </KpiGrid>

      <MonthBar months={keys} value={cur} onChange={setSel} accent={ACCENT}
        title="ZNO ✦ MONTH VIEW" sub="Pick a month: the cards compare it with the month before" />
      <KpiGrid>
        <Kpi title="Dross used (KG)" value={n0(M.dross)} color="#b7791f">
          {P && <Delta cur={M.dross} prev={P.dross} goodUp label={'vs ' + monthLabel(prevMonth(cur))} />}
        </Kpi>
        <Kpi title="Oxide produced (KG)" value={n0(M.oxide)} color="#2f855a">
          {P && <Delta cur={M.oxide} prev={P.oxide} goodUp label={'vs ' + monthLabel(prevMonth(cur))} />}
        </Kpi>
        <Kpi title="Total cost (₹ Lakh)" value={lakh(M.cost)} color="#c53030">
          {P && <Delta cur={M.cost} prev={P.cost} goodUp={false} label={'vs ' + monthLabel(prevMonth(cur))} />}
        </Kpi>
        <Kpi title="Net cost ₹ / KG" value={n2(M.net)} color="#6b46c1">
          {P && <Delta cur={M.net} prev={P.net} goodUp={false} label={'vs ' + monthLabel(prevMonth(cur))} />}
        </Kpi>
      </KpiGrid>

      <Card title={`🗓 Monthly production & cost — ${fyLabel}`}>
        <Table rows={[...months, { label: 'FY TOTAL', ...tot, net: tot.oxide ? tot.cost / tot.oxide : 0, isTotal: true }]}
          rowClass={(r) => (r.isTotal || ymKey(r) === cur ? 'ok' : '')} cols={[
            { h: 'Month', f: (r) => <b>{r.isTotal ? r.label : monthLabel(ymKey(r))}</b> },
            { h: 'Dross (KG)', a: 'r', f: (r) => n0(r.dross) },
            { h: 'Oxide (KG)', a: 'r', f: (r) => n0(r.oxide) },
            { h: 'Total cost (₹)', a: 'r', f: (r) => n0(r.cost) },
            { h: 'Net ₹ / KG', a: 'r', f: (r) => n2(r.net) }]} />
      </Card>

      <div className="pz-grid2">
        <Card title="🏭 Oxide produced by month (KG)">
          <Bars color="#2f855a" fmt={n0} rows={months.map((m) => ({ label: monthLabel(ymKey(m)), value: m.oxide }))} />
        </Card>
        <Card title="💰 Net cost ₹ / KG by month">
          <Bars color="#6b46c1" fmt={n2} rows={months.map((m) => ({ label: monthLabel(ymKey(m)), value: m.net }))} />
        </Card>
      </div>

      <Card title={`🧮 What makes up the cost — ${monthLabel(cur)} (₹ per KG of oxide)`}>
        <Bars color={ACCENT} fmt={n2} rows={comps.map(([label, value]) => ({ label, value: value || 0 }))} />
      </Card>

      <Card title="🧮 Cost build-up by month (₹ / KG)">
        <Table rows={months} rowClass={(r) => (ymKey(r) === cur ? 'ok' : '')} cols={[
          { h: 'Month', f: (r) => <b>{monthLabel(ymKey(r))}</b> },
          { h: 'Electricity', a: 'r', f: (r) => n2(r.elec) }, { h: 'Furnace oil', a: 'r', f: (r) => n2(r.oil) },
          { h: 'Packing', a: 'r', f: (r) => n2(r.pack) }, { h: 'Crucible', a: 'r', f: (r) => n2(r.crucible) },
          { h: 'Manpower', a: 'r', f: (r) => n2(r.manpower) }, { h: 'Other', a: 'r', f: (r) => n2(r.other) },
          { h: 'Net ₹ / KG', a: 'r', f: (r) => <b>{n2(r.net)}</b> }]} />
      </Card>
    </>
  );
}

/* ====================== CRUCIBLE HISTORY ====================== */
export function ZnoCrucibleHistory({ dash, loaded, error }) {
  const [view, setView] = useState('perf');
  const [unit, setUnit] = useState('');
  const [q, setQ] = useState('');
  if (!dash) return <Banner>{error || (loaded ? NEED : 'Loading crucible data...')}</Banner>;

  const furnaces = dash.furnaces || [];
  const life = dash.lifeSummary || [];
  const watch = dash.watch || [];
  // hide future FY rows that are still empty, and the sheet's subtotal rows inside the history table
  const fySum = (dash.fySummary || []).filter((r) => /ALL/i.test(String(r.fy)) || Number(r.started) > 0 || Number(r.replaced) > 0);
  const hist = (dash.history || []).filter((r) => !/^(LAST |AVERAGE)/i.test(String(r.id)));
  const events = dash.events || [];
  const units = [...new Set(hist.map((r) => String(r.unit)).filter(Boolean))];
  const match = (r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q.toLowerCase()));
  const histRows = hist.filter((r) => (!unit || String(r.unit) === unit) && (!q || match(r)));
  const evRows = events.filter((r) => (!unit || String(r.unit) === unit) && (!q || match(r)));

  const search = (
    <div className="pz-tools">
      <select value={unit} onChange={(e) => setUnit(e.target.value)}>
        <option value="">All furnaces</option>
        {units.map((u) => <option key={u} value={u}>{u}</option>)}
      </select>
      <input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
    </div>
  );

  return (
    <>
      <Pills accent={ACCENT} value={view} onChange={setView}
        items={[['perf', '📊 Performance'], ['hist', '📜 Crucible History'], ['events', '🧾 Event Log']]} />

      {view === 'perf' && (
        <>
          <Card title="🔥 Furnace-wise totals (all crucibles on record)">
            <Table rows={furnaces} empty="No furnace data" cols={[
              { h: 'Furnace', f: (r) => <b>{r.unit}</b> },
              { h: 'Total oxide (KG)', a: 'r', f: (r) => f0(r.totalOxide) },
              { h: 'Avg recovery', a: 'r', f: (r) => pct(r.avgRecovery) },
              { h: 'Avg life of replaced (days)', a: 'r', f: (r) => f2(r.avgLife) },
              { h: 'Days in service', a: 'r', f: (r) => f0(r.totalDays) }]} />
          </Card>
          <div className="pz-grid2">
            <Card title="🏭 Oxide by furnace (KG)">
              <Bars color={ACCENT} fmt={n0} rows={furnaces.map((r) => ({ label: String(r.unit), value: Number(r.totalOxide) || 0 }))} />
            </Card>
            <Card title="⏳ Avg life of replaced crucibles (days)">
              <Bars color="#2c7a7b" fmt={n2} rows={furnaces.map((r) => ({ label: String(r.unit), value: Number(r.avgLife) || 0 }))} />
            </Card>
          </div>
          <Card title="🧱 Unit-wise crucible life summary">
            <Table rows={life} empty="No summary rows" cols={[
              { h: 'Unit', f: (r) => <b>{r.unit}</b> }, { h: 'Used', a: 'r', f: (r) => f0(r.used) }, { h: 'Replaced', a: 'r', f: (r) => f0(r.replaced) },
              { h: 'Status', f: (r) => f2(r.status) }, { h: 'Avg life (days)', a: 'r', f: (r) => f2(r.avgLife) }, { h: 'Total days', a: 'r', f: (r) => f0(r.totalDays) },
              { h: 'Dross (KG)', a: 'r', f: (r) => f0(r.dross) }, { h: 'Oxide (KG)', a: 'r', f: (r) => f0(r.oxide) }, { h: 'Ash (KG)', a: 'r', f: (r) => f0(r.ash) },
              { h: 'F.oil (Ltr)', a: 'r', f: (r) => f0(r.foil) }, { h: 'Recovery', a: 'r', f: (r) => pct(r.recovery) }]} />
          </Card>
          <Card title="👀 Life watch (last 4 replaced crucibles)">
            <Table rows={watch} empty="No watch rows" cols={[
              { h: 'Unit', f: (r) => <b>{r.unit}</b> }, { h: 'Counted', a: 'r', f: (r) => f0(r.counted) }, { h: 'Avg life (last 4)', a: 'r', f: (r) => f2(r.avgLife4) },
              { h: 'Shortest', a: 'r', f: (r) => f0(r.shortest) }, { h: 'Longest', a: 'r', f: (r) => f0(r.longest) }, { h: 'Usual', a: 'r', f: (r) => f2(r.usual) },
              { h: 'Early', a: 'r', f: (r) => f0(r.early) }, { h: 'Too long', a: 'r', f: (r) => f0(r.tooLong) },
              { h: 'Oxide (KG)', a: 'r', f: (r) => f0(r.oxide) }, { h: 'Recovery', a: 'r', f: (r) => pct(r.recovery) }, { h: 'F.oil / MT', a: 'r', f: (r) => f2(r.foilPerMt) }]} />
          </Card>
          <Card title="📅 Financial-year crucible summary">
            <Table rows={fySum} empty="No FY rows" cols={[
              { h: 'FY', f: (r) => <b>{r.fy}</b> }, { h: 'From', f: (r) => f2(r.from) }, { h: 'To', f: (r) => f2(r.to) },
              { h: 'Started', a: 'r', f: (r) => f0(r.started) }, { h: 'Replaced', a: 'r', f: (r) => f0(r.replaced) },
              { h: 'Avg life (days)', a: 'r', f: (r) => f2(r.avgLife) }, { h: 'Oxide of replaced (KG)', a: 'r', f: (r) => f0(r.oxideReplaced) }]} />
          </Card>
        </>
      )}

      {view === 'hist' && (
        <Card title={`📜 Running + last 4 stopped crucibles per furnace (${histRows.length})`} right={search}>
          <Table rows={histRows} empty="No crucible history" cols={[
            { h: 'Furnace', f: (r) => <b>{r.unit}</b> }, { h: 'Crucible ID', f: (r) => f2(r.id) },
            { h: 'Started', f: (r) => f2(r.started) }, { h: 'Stopped', f: (r) => f2(r.stopped) },
            { h: 'Life (days)', a: 'r', f: (r) => f2(r.life) }, { h: 'Life vs usual', a: 'r', f: (r) => pct(r.vsUsual) },
            { h: 'Dross (KG)', a: 'r', f: (r) => f0(r.dross) }, { h: 'Oxide (KG)', a: 'r', f: (r) => f0(r.oxide) },
            { h: 'Ash (KG)', a: 'r', f: (r) => f0(r.ash) }, { h: 'F.oil (Ltr)', a: 'r', f: (r) => f0(r.foil) },
            { h: 'Recovery', a: 'r', f: (r) => pct(r.recovery) }, { h: 'F.oil / MT', a: 'r', f: (r) => f2(r.foilPerMt) },
            { h: 'Flag', f: (r) => (blank(r.flag) ? '-' : <Chip ok={/NORMAL|OK/.test(String(r.flag)) && !/CHECK/.test(String(r.flag))}>{String(r.flag)}</Chip>) }, { h: 'Remarks', f: (r) => f2(r.remarks) }]} />
        </Card>
      )}

      {view === 'events' && (
        <Card title={`🧾 Crucible event log (${evRows.length} events)`} right={search}>
          <Table rows={evRows} empty="No events" cols={[
            { h: 'When', f: (r) => f2(r.when) }, { h: 'Recorded', f: (r) => f2(r.recorded) }, { h: 'Furnace', f: (r) => <b>{r.unit}</b> },
            { h: 'Crucible ID', f: (r) => f2(r.id) }, { h: 'Event', f: (r) => f2(r.event) }, { h: 'Days', a: 'r', f: (r) => f2(r.days) },
            { h: 'Dross (KG)', a: 'r', f: (r) => f0(r.dross) }, { h: 'Oxide (KG)', a: 'r', f: (r) => f0(r.oxide) }, { h: 'Ash (KG)', a: 'r', f: (r) => f0(r.ash) },
            { h: 'F.oil (Ltr)', a: 'r', f: (r) => f0(r.foil) }, { h: 'Recovery', a: 'r', f: (r) => pct(r.recovery) }, { h: 'Remarks', f: (r) => f2(r.remarks) }]} />
        </Card>
      )}
    </>
  );
}
