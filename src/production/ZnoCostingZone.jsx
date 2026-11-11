import React, { useMemo, useState } from 'react';
import { Pills, MonthBar, Banner, Kpi, KpiGrid, Card, Strip, Bars, Table, Delta } from './prodShared.jsx';
import { num, n0, n2, lakh, monthOf, monthLabel, prevMonth, fyStart } from './prodUtils.js';

const ACCENT = '#ea580c';

export default function ZnoCostingZone({ crucibles = [], monthly = [], loaded, error }) {
  const [tab, setTab] = useState('overview');
  const [sel, setSel] = useState('');

  const rows = useMemo(() => (monthly || [])
    .map((r) => ({ key: monthOf(r.month), dross: num(r.dross) || 0, oxide: num(r.oxide) || 0, cost: num(r.totalCost) || 0 }))
    .filter((r) => r.key)
    .sort((a, b) => a.key.localeCompare(b.key)), [monthly]);

  const months = rows.map((r) => r.key);
  const cur = months.includes(sel) ? sel : months[months.length - 1] || '';
  const row = rows.find((r) => r.key === cur);
  const prev = rows.find((r) => r.key === prevMonth(cur || '2000-01'));
  const fy = rows.filter((r) => r.key >= fyStart(cur || '2000-04') && r.key <= cur);
  const fyT = fy.reduce((a, r) => ({ dross: a.dross + r.dross, oxide: a.oxide + r.oxide, cost: a.cost + r.cost }), { dross: 0, oxide: 0, cost: 0 });
  const cpk = (r) => (r && r.oxide ? r.cost / r.oxide : 0);

  if (error && !rows.length) return <Banner>{error}</Banner>;
  if (!rows.length) return <Banner>{loaded ? 'No ZNO costing months found yet.' : 'Loading ZNO costing data...'}</Banner>;

  const last12 = rows.slice(-12);
  return (
    <div className="pz-root" style={{ '--pz': ACCENT }}>
      <Pills accent={ACCENT} value={tab} onChange={setTab}
        items={[['overview', '📊 Overview'], ['trend', '📈 Trend'], ['matrix', '🗓 Month Matrix'], ['crucible', '🔥 Crucibles']]} />

      {tab !== 'crucible' && (
        <MonthBar months={months} value={cur} onChange={setSel} accent={ACCENT}
          title="ZINC OXIDE ✦ COSTING DASHBOARD"
          sub={`P5 + P7 furnaces • ${rows.length} months loaded • Qty in MT, cost in ₹ Lakh`} />
      )}

      {tab === 'overview' && row && (
        <>
          <Strip>📌 {monthLabel(cur).toUpperCase()} — MONTH SNAPSHOT</Strip>
          <KpiGrid>
            <Kpi title="📦 Oxide produced (MT)" value={n2(row.oxide / 1000)} color="#16a34a">
              <Delta cur={row.oxide} prev={prev && prev.oxide} goodUp label={'vs ' + monthLabel(prevMonth(cur))} />
            </Kpi>
            <Kpi title="🧱 Zinc dross used (MT)" value={n2(row.dross / 1000)} color="#0d9488">
              <Delta cur={row.dross} prev={prev && prev.dross} goodUp label={'vs ' + monthLabel(prevMonth(cur))} />
            </Kpi>
            <Kpi title="💰 Total cost (₹ Lakh)" value={lakh(row.cost)} color="#2563eb">
              <Delta cur={row.cost} prev={prev && prev.cost} goodUp={false} label={'vs ' + monthLabel(prevMonth(cur))} />
            </Kpi>
            <Kpi title="⚖ Cost / kg (₹)" value={n2(cpk(row))} color="#ea580c">
              <Delta cur={cpk(row)} prev={cpk(prev)} goodUp={false} label={'vs ' + monthLabel(prevMonth(cur))} />
            </Kpi>
            <Kpi title="🔁 Oxide per kg dross" value={row.dross ? n2(row.oxide / row.dross) : '-'} color="#7c3aed" sub="yield ratio" />
          </KpiGrid>

          <Strip>📈 FY TILL DATE ({monthLabel(fyStart(cur))} → {monthLabel(cur)})</Strip>
          <KpiGrid>
            <Kpi title="Oxide (MT)" value={n2(fyT.oxide / 1000)} color="#16a34a" />
            <Kpi title="Dross (MT)" value={n2(fyT.dross / 1000)} color="#0d9488" />
            <Kpi title="Total cost (₹ Lakh)" value={lakh(fyT.cost)} color="#2563eb" />
            <Kpi title="Avg cost / kg (₹)" value={fyT.oxide ? n2(fyT.cost / fyT.oxide) : '-'} color="#ea580c" />
          </KpiGrid>

          <div className="pz-grid2">
            <Card title="Oxide produced by month (MT)">
              <Bars rows={last12.map((r) => ({ label: monthLabel(r.key), value: r.oxide / 1000, color: r.key === cur ? '#ea580c' : '#fdba74' }))} fmt={n2} />
            </Card>
            <Card title="Cost per kg by month (₹)">
              <Bars rows={last12.map((r) => ({ label: monthLabel(r.key), value: cpk(r), color: r.key === cur ? '#2563eb' : '#93c5fd' }))} fmt={n2} />
            </Card>
          </div>
        </>
      )}

      {tab === 'trend' && (
        <div className="pz-grid2">
          <Card title="Zinc dross used (MT)"><Bars color="#0d9488" rows={rows.map((r) => ({ label: monthLabel(r.key), value: r.dross / 1000 }))} fmt={n2} /></Card>
          <Card title="Total cost (₹ Lakh)"><Bars color="#2563eb" rows={rows.map((r) => ({ label: monthLabel(r.key), value: r.cost / 1e5 }))} fmt={n2} /></Card>
        </div>
      )}

      {tab === 'matrix' && (
        <Card title="🗓 Month Matrix — all months">
          <Table rows={[...rows].reverse()} rowClass={(r) => (r.key === cur ? 'ok' : '')} cols={[
            { h: 'Month', f: (r) => <b>{monthLabel(r.key)}</b> },
            { h: 'Dross (KG)', a: 'r', f: (r) => n0(r.dross) },
            { h: 'Oxide (KG)', a: 'r', f: (r) => n0(r.oxide) },
            { h: 'Oxide / Dross', a: 'r', f: (r) => (r.dross ? n2(r.oxide / r.dross) : '-') },
            { h: 'Total Cost (₹)', a: 'r', f: (r) => '₹' + n0(r.cost) },
            { h: 'Cost / KG (₹)', a: 'r', f: (r) => <b>{n2(cpk(r))}</b> },
          ]} />
        </Card>
      )}

      {tab === 'crucible' && (
        <Card title="🔥 Crucible Life & History Tracker (live)">
          <Table rows={crucibles || []} empty={loaded ? 'No crucible records' : 'Loading...'} cols={[
            { h: 'Unit', f: (r) => <b>{r.unit}</b> },
            { h: 'Status', f: (r) => <b style={{ color: String(r.status || '').includes('RUNNING') ? '#16a34a' : '#dc2626' }}>{r.status || '—'}</b> },
            { h: 'Active Crucible ID', f: (r) => r.crucibleId || '—' },
            { h: 'Running Since', f: (r) => r.runningSince || '—' },
            { h: 'Days in Service', a: 'r', f: (r) => r.daysInService || '—' },
            { h: 'Oxide to Date (KG)', a: 'r', f: (r) => (r.oxideToDate ? n0(r.oxideToDate) : '—') },
            { h: 'Recovery %', a: 'r', f: (r) => (r.recovery ? (Number(r.recovery) * 100).toFixed(1) + '%' : '—') },
          ]} />
        </Card>
      )}
    </div>
  );
}
