import React, { useMemo, useState } from 'react';
import { Pills, MonthBar, Banner, Kpi, KpiGrid, Card, Strip, Bars, Table, Delta, Chip } from './prodShared.jsx';
import { num, n0, n2, lakh, toYMD, monthLabel, prevMonth, addMonths, shortDay } from './prodUtils.js';
import { WIRE_FORM_URL } from './prodConfig.js';

const COMPS = [
  ['⚡ Electricity', 'Elec Cost/MT'],
  ['🧪 Consumables', 'Consumable Cost/MT'],
  ['👷 Manpower', 'Manpower Cost/MT'],
  ['🔧 Maintenance', 'Maint Cost/MT'],
  ['♻ Waste', 'Waste Cost/MT'],
  ['🏢 Admin', 'Admin Cost/MT'],
  ['🏦 Interest', 'Interest/MT']
];

const BLOCK_ORDER = ['9-BLOCK', '8-BLOCK', '11-BLOCK', '6-BLOCK-1', '6-BLOCK-2', '7-BLOCK', '5-BLOCK (OTO)', '3-BLOCK'];

const STOCK_ITEMS = [
  ['Zinc', 'KG', /^zinc\s*\(/i],
  ['Acid', 'Ltr', /^acid/i],
  ['Fuel Oil', 'Ltr', /^fuel oil/i]
];

const METERS = [
  ['MAINPANEL Units', 'Main panel'],
  ['9-Block Units', '9-Block'],
  ['8-Block Units', '8-Block'],
  ['11-Block Units', '11-Block'],
  ['6-Block-1 Units', '6-Block-1'],
  ['6-Block-2 Units', '6-Block-2'],
  ['7-Block Units', '7-Block'],
  ['5-Block Units', '5-Block'],
  ['3-BLOCK NEW Meter Units', '3-Block (new meter)'],
  ['UTILITY Units', 'Utility'],
  ['GI 1 Units', 'GI 1'],
  ['GI 2 Units', 'GI 2'],
  ['WD LIGHT Units', 'WD light'],
  ['OXIDE Units', 'Oxide']
];

const sum = (rows, f) => rows.reduce((a, r) => a + (f(r) || 0), 0);
const find = (r, start) => {
  const k = Object.keys(r).find((x) => x.startsWith(start));
  return k ? num(r[k]) || 0 : 0;
};

// Production from Production Log + Cost from Daily Cost Pool (matches Sheet Dashboard)
function stats(rows, p, logRows = null) {
  const cost = rows.reduce((a, r) => a + (num(r[`${p} Day Cost (₹)`]) || 0), 0);

  let prod = 0;
  if (logRows && logRows.length) {
    prod = logRows.reduce((a, r) => a + (num(r['Production (MT)']) || 0), 0);
  } else {
    prod = rows.reduce((a, r) => a + (num(r[`${p} Total Production (MT)`]) || 0), 0);
  }

  const per = prod ? cost / prod : 0;

  const comps = COMPS.map(([label, key]) => ({
    label,
    v: prod
      ? rows.reduce((a, r) => a + (num(r[`${p} Total Production (MT)`]) || 0) * (num(r[`${p} ${key}`]) || 0), 0) / prod
      : 0
  }));

  const known = comps.reduce((a, c) => a + c.v, 0);
  comps.push({ label: '📦 Other / zero-production days', v: Math.max(0, per - known) });

  return {
    prod,
    cost,
    per,
    comps,
    days: rows.filter((r) => (num(r[`${p} Total Production (MT)`]) || 0) > 0).length
  };
}

function blockStats(rows, kwhMap) {
  const prod = sum(rows, (r) => num(r['Production (MT)']));
  const w = (key) => (prod ? sum(rows, (r) => (num(r['Production (MT)']) || 0) * find(r, key)) / prod : 0);
  const repeat = sum(rows.filter((r) => num(r['WD Repeat (1/0)']) === 1), (r) => num(r['Production (MT)']));
  const kwh = prod
    ? sum(rows, (r) => (num(r['Production (MT)']) || 0) * (kwhMap[toYMD(r.Date).replace(/-/g, '') + '|' + r.Block] || 0)) / prod
    : 0;

  return {
    prod,
    entries: rows.length,
    repeat,
    normal: prod - repeat,
    kwh,
    elec: w('True Elec'),
    cons: w('True Consumable'),
    man: w('True Manpower'),
    maint: w('True Maintenance'),
    waste: w('True Waste'),
    admin: w('True Admin'),
    int: w('True Interest'),
    excl: w('True Total Cost/MT'),
    value: sum(rows, (r) => find(r, 'True Total Cost Value'))
  };
}

function Sel({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 700, color: '#334155' }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, background: '#fff' }}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export default function WireZone({ unit, data, loading, error, reload }) {
  const isGI = /GI/.test(unit);
  const P = isGI ? 'GI' : 'WD';
  const accent = isGI ? '#0d9488' : '#2563eb';
  const [tab, setTab] = useState('overview');
  const [sel, setSel] = useState('');
  const [q, setQ] = useState('');
  const [fSize, setFSize] = useState('');
  const [fGrade, setFGrade] = useState('');
  const [fBlock, setFBlock] = useState('');

  const daily = useMemo(
    () => ((data && data.daily) || [])
      .map((r) => ({ ...r, _d: toYMD(r.Date) }))
      .filter((r) => r._d)
      .sort((a, b) => a._d.localeCompare(b._d)),
    [data]
  );

  const months = useMemo(() => [...new Set(daily.map((r) => r._d.slice(0, 7)))], [daily]);

  if (error && !daily.length) return <Banner>{error}</Banner>;
  if (!daily.length) return <Banner>{loading ? 'Loading wire costing data...' : 'No daily cost pool rows found.'}</Banner>;

    const cur = months.includes(sel) ? sel : months[months.length - 1];

  // Same "till date" rule as the sheet dashboard (WD Dashboard AE26 / AE33 / AE34):
  // cost window = month start .. MIN(today, month end, last production day in the log)
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const lastLogDay = (arr) =>
    (arr || []).map((r) => toYMD(r.Date)).filter((d) => d && d <= todayIST).reduce((a, d) => (d > a ? d : a), '');
  const lastWdDay = lastLogDay(data && data.wdLog);
  const lastGiDay = lastLogDay(data && data.giLog);
  const endOf = (k, p) => {
    const lastProd = p === 'GI' ? (lastWdDay > lastGiDay ? lastWdDay : lastGiDay) : lastWdDay;
    const monthEnd = k + '-31';
    let e = todayIST < monthEnd ? todayIST : monthEnd;
    if (lastProd && lastProd < e) e = lastProd;
    return e;
  };
  const rowsOf = (k, p = P) => {
    const e = endOf(k, p);
    return daily.filter((r) => r._d.startsWith(k) && r._d <= e);
  };
  const mine = rowsOf(cur);

  // Production Log rows (used for the Production figure), up to today
  const logAll = (data && (isGI ? data.giLog : data.wdLog)) || [];
  const logIn = (k) => logAll.filter((r) => { const d = toYMD(r.Date); return d.startsWith(k) && d <= todayIST; });
  const logRowsForStats = logIn(cur);
  const prevLogRowsForStats = logIn(prevMonth(cur));

  const S = stats(mine, P, logRowsForStats);
  const Sp = stats(rowsOf(prevMonth(cur)), P, prevLogRowsForStats);
  const hasPrev = rowsOf(prevMonth(cur)).length > 0;
  const lastDay = mine.length ? mine[mine.length - 1]._d : '';
  const matrix = months.map((k) => ({
    k,
    wd: stats(rowsOf(k, 'WD'), 'WD'),
    gi: stats(rowsOf(k, 'GI'), 'GI')
  })).reverse();

  const prodDays = mine.filter((r) => (num(r[`${P} Total Production (MT)`]) || 0) > 0);

  const has = (k) => !!data && Array.isArray(data[k]);
  const inMonth = (r) => toYMD(r.Date).startsWith(cur);
  const NeedApi = () => (
    <Banner>
      This section needs the updated ApiWire.gs: paste it in Apps Script, then Deploy → Manage deployments → edit → New version.
    </Banner>
  );

  // ---------- WD block costing ----------
  const kwhMap = (data && data.kwh) || {};
  const costRows = ((data && data.wdCosting) || []).filter(inMonth);
  const byBlock = {};
  costRows.forEach((r) => {
    (byBlock[r.Block] = byBlock[r.Block] || []).push(r);
  });
  const blockNames = [
    ...BLOCK_ORDER.filter((b) => byBlock[b]),
    ...Object.keys(byBlock).filter((b) => !BLOCK_ORDER.includes(b)).sort()
  ];
  const blockRows = blockNames.map((b) => ({ name: b, ...blockStats(byBlock[b], kwhMap) }));
  const BT = blockStats(costRows, kwhMap);
  const sizes = [...new Set(costRows.map((r) => String(r['Finish Size (mm)'])).filter(Boolean))].sort((a, b) => num(a) - num(b));
  const grades = [...new Set(costRows.map((r) => String(r['Finish Size Grade'] || '')).filter(Boolean))].sort();
  const filtered = costRows.filter(
    (r) =>
      (!fSize || String(r['Finish Size (mm)']) === fSize) &&
      (!fGrade || String(r['Finish Size Grade']) === fGrade) &&
      (!fBlock || r.Block === fBlock)
  );
  const FS = blockStats(filtered, kwhMap);

  // ---------- Stock & consumables ----------
  const recv = (data && data.received) || [];
  const giCons = (data && data.giCons) || [];
  const stock = STOCK_ITEMS.map(([name, uom, re]) => {
    const rcv = recv.filter((r) => String(r.Material).trim().toLowerCase() === name.toLowerCase());
    const recIn = (k) => sum(rcv.filter((r) => toYMD(r.Date).startsWith(k)), (r) => find(r, 'Received in Ltr'));
    const usedIn = (k) =>
      sum(
        giCons.filter((r) => toYMD(r.Date).startsWith(k) && re.test(String(r['Item Name']).trim())),
        (r) => find(r, 'Quantity')
      );
    const first = rcv.length ? rcv.map((r) => toYMD(r.Date).slice(0, 7)).sort()[0] : cur;
    let opening = 0;
    if (cur > first) {
      for (let k = first; k < cur; k = addMonths(k, 1)) opening += recIn(k) - usedIn(k);
    }
    const rec = recIn(cur);
    const used = usedIn(cur);
    const entryDays = new Set(giCons.filter((r) => toYMD(r.Date).startsWith(cur)).map((r) => toYMD(r.Date))).size;
    const avg = entryDays ? used / entryDays : 0;
    const current = opening + rec - used;
    return { name, uom, opening, rec, used, current, avg, days: avg > 0 ? current / avg : null };
  });

  const consRows = ((data && (isGI ? data.giCons : data.wdCons)) || []).filter(inMonth);
  const itemMap = {};
  consRows.forEach((r) => {
    const k = String(r['Item Name'] || '').trim();
    if (!k) return;
    const o = itemMap[k] || (itemMap[k] = { name: k, qty: 0, cost: 0 });
    o.qty += find(r, 'Quantity');
    o.cost += find(r, 'Total Cost (');
  });
  const items = Object.values(itemMap).sort((a, b) => b.cost - a.cost);
  const itemsCost = sum(items, (i) => i.cost);

  // ---------- GI day / night ----------
  const dn = ((data && data.giDayNight) || []).filter(inMonth);
  const dnDay = sum(dn, (r) => find(r, 'Day Cost'));
  const dnNight = sum(dn, (r) => find(r, 'Night Cost'));
  const dnTot = dnDay + dnNight;
  const dnByDay = {};
  const dnByItem = {};
  dn.forEach((r) => {
    const d = toYMD(r.Date);
    const a = dnByDay[d] || (dnByDay[d] = { d, day: 0, night: 0 });
    a.day += find(r, 'Day Cost');
    a.night += find(r, 'Night Cost');
    const k = String(r.Item || '').trim();
    const b = dnByItem[k] || (dnByItem[k] = { k, dq: 0, nq: 0, dc: 0, nc: 0 });
    b.dq += find(r, 'Day Qty');
    b.nq += find(r, 'Night Qty');
    b.dc += find(r, 'Day Cost');
    b.nc += find(r, 'Night Cost');
  });
  const dnDays = Object.values(dnByDay).sort((a, b) => b.d.localeCompare(a.d));
  const dnItems = Object.values(dnByItem).sort((a, b) => b.dc + b.nc - (a.dc + a.nc));

  // ---------- Electricity ----------
  const elecRows = ((data && data.electricity) || []).filter((r) => {
    const ck = Object.keys(r).find((x) => x.startsWith('Consumption Date'));
    return toYMD((ck && r[ck]) || r.Date).startsWith(cur);
  });
  const meters = METERS.map(([k, label]) => ({ label, v: sum(elecRows, (r) => num(r[k])) })).filter((m) => m.v > 0);
  const meterTot = sum(meters, (m) => m.v);
  const unitsOf = (r) => num(r[`${P} Total Elec Units`]) || 0;
  const eUnits = sum(mine, unitsOf);
  const eKwh = S.prod ? eUnits / S.prod : 0;

  // Records tab (renamed to avoid clash)
  const recordRows = ((data && (isGI ? data.giLog : data.wdLog)) || [])
    .filter(inMonth)
    .filter((r) => !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q.toLowerCase())))
    .reverse();

  const logCols = isGI
    ? [
        ['Date'],
        ['Shift'],
        ['Pad / Comm'],
        ['Production (MT)', 'r'],
        ['Grand Total Cost/MT', 'r'],
        ['Total Cost Value (₹)', 'r']
      ]
    : [
        ['Date'],
        ['Shift'],
        ['Machine / Block'],
        ['Inlet Grade'],
        ['Finish Size Grade'],
        ['Finish Size (mm)', 'r'],
        ['Production (MT)', 'r'],
        ['WD Repeat Reason'],
        ['Grand Total Cost/MT', 'r'],
        ['Total Cost Value (₹)', 'r']
      ];

  const tabs = isGI
    ? [
        ['overview', '📊 Overview'],
        ['daynight', '🌗 Day/Night Costing'],
        ['stock', '🧪 Consumables & Stock'],
        ['elec', '⚡ Electricity'],
        ['daily', '📈 Daily Trend'],
        ['matrix', '🗓 Month Matrix'],
        ['records', '📋 Records']
      ]
    : [
        ['overview', '📊 Overview'],
        ['blocks', '🏗 Block Costing'],
        ['stock', '🧪 Consumables & Stock'],
        ['elec', '⚡ Electricity'],
        ['daily', '📈 Daily Trend'],
        ['matrix', '🗓 Month Matrix'],
        ['records', '📋 Records']
      ];

  const view = tabs.some((t) => t[0] === tab) ? tab : 'overview';
  const prevLabel = 'vs ' + monthLabel(prevMonth(cur));

  return (
    <div className="pz-root" style={{ '--pz': accent }}>
      <div className="pz-card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pills accent={accent} value={view} onChange={setTab} items={tabs} />
        <div className="pz-tools">
          {WIRE_FORM_URL && (
            <a className="pz-btn" href={WIRE_FORM_URL} target="_blank" rel="noreferrer">
              📝 Submit Daily Entry
            </a>
          )}
          <button type="button" className="pz-btn ghost" onClick={reload}>
            ↻ Refresh
          </button>
        </div>
      </div>

      <MonthBar
        months={months}
        value={cur}
        onChange={setSel}
        accent={accent}
        title={isGI ? 'GALVANIZING ✦ PRODUCTION & COSTING DASHBOARD' : 'WIRE (WD) ✦ PRODUCTION & COSTING DASHBOARD'}
        sub={`${daily.length} daily cost-pool rows • data till ${lastDay} • Qty in MT, cost in ₹ / MT & ₹ Lakh`}
      />

      {view === 'overview' && (
        <>
          <Strip>📌 {monthLabel(cur).toUpperCase()} — MONTH SNAPSHOT (up to {lastDay})</Strip>
          <KpiGrid>
            <Kpi title={`🏭 ${P} production (MT)`} value={n2(S.prod)} color={accent} sub={`${S.days} producing days`}>
              {hasPrev && <Delta cur={S.prod} prev={Sp.prod} goodUp label={prevLabel} />}
            </Kpi>
            <Kpi title={`💰 ${P} cost (₹ / MT)`} value={n0(S.per)} color="#ea580c">
              {hasPrev && <Delta cur={S.per} prev={Sp.per} goodUp={false} label={prevLabel} />}
            </Kpi>
            <Kpi title={`🧾 ${P} total cost (₹ Lakh)`} value={lakh(S.cost)} color="#7c3aed">
              {hasPrev && <Delta cur={S.cost} prev={Sp.cost} goodUp={false} label={prevLabel} />}
            </Kpi>
          </KpiGrid>

          <Card title={`📊 Cost analysis — ${monthLabel(cur)} (₹ / MT, weighted by production)`}>
            <Table
              rows={[...S.comps, { label: 'TOTAL (= avg ₹/MT)', v: S.per, total: true }]}
              cols={[
                { h: 'Component', f: (r) => (r.total ? <b>{r.label}</b> : r.label) },
                { h: `${P} ₹/MT`, a: 'r', f: (r) => (r.total ? <b>{n2(r.v)}</b> : n2(r.v)) },
                {
                  h: 'Share',
                  f: (r) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: Math.max(2, (r.v / (S.per || 1)) * 140),
                          height: 10,
                          borderRadius: 5,
                          background: accent
                        }}
                      />
                      {S.per ? Math.round((r.v / S.per) * 100) : 0}%
                    </div>
                  )
                }
              ]}
            />
          </Card>

          <Card title={`📅 ${monthLabel(cur)} vs ${monthLabel(prevMonth(cur))}`}>
            <Table
              rows={[
                { m: `${P} production (MT)`, a: S.prod, b: Sp.prod, up: true, f: n2 },
                { m: `${P} true ₹ / MT`, a: S.per, b: Sp.per, up: false, f: n2 },
                { m: `${P} total cost (₹ Lakh)`, a: S.cost / 1e5, b: Sp.cost / 1e5, up: false, f: n2 }
              ]}
              cols={[
                { h: 'Metric', f: (r) => <b>{r.m}</b> },
                { h: 'This month', a: 'r', f: (r) => r.f(r.a) },
                { h: 'Last month', a: 'r', f: (r) => (hasPrev ? r.f(r.b) : '-') },
                {
                  h: 'Change',
                  a: 'r',
                  f: (r) => (hasPrev ? <Delta cur={r.a} prev={r.b} goodUp={r.up} label="" /> : '-')
                }
              ]}
            />
          </Card>
        </>
      )}

      {/* ================= WD: BLOCK COSTING ================= */}
      {view === 'blocks' && !isGI && (!has('wdCosting') ? (
        <NeedApi />
      ) : (
        <>
          <Strip>🏗 WD BLOCKS — {monthLabel(cur).toUpperCase()} (up to {lastDay})</Strip>
          <KpiGrid>
            <Kpi title="🏭 WD production (MT)" value={n2(BT.prod)} color={accent} sub={`${BT.entries} entries`} />
            <Kpi title="💰 Cost ₹ / MT (excl. interest)" value={n0(BT.excl)} color="#ea580c" />
            <Kpi title="🏦 Interest ₹ / MT" value={n0(BT.int)} color="#7c3aed" />
            <Kpi
              title="🔁 Repeat / redraw (MT)"
              value={n2(BT.repeat)}
              color="#0d9488"
              sub={BT.prod ? `${n2((BT.repeat / BT.prod) * 100)}% of production` : ''}
            />
          </KpiGrid>

          <Card title="📦 Block breakdown">
            <Table
              rows={[...blockRows, { ...BT, name: 'TOTAL', isTotal: true }]}
              rowClass={(r) => (r.isTotal ? 'ok' : '')}
              cols={[
                { h: 'Block', f: (r) => (r.isTotal ? <b>{r.name}</b> : r.name) },
                { h: 'Prod (MT)', a: 'r', f: (r) => n2(r.prod) },
                { h: 'Cost ₹/MT (excl. interest)', a: 'r', f: (r) => n0(r.excl) },
                { h: 'Total cost ₹ (incl. interest)', a: 'r', f: (r) => n0(r.value) },
                { h: 'Elec ₹/MT', a: 'r', f: (r) => n0(r.elec) },
                { h: 'kWh / MT', a: 'r', f: (r) => n2(r.kwh) }
              ]}
              empty="No block entries this month"
            />
          </Card>

          <Card title="🏭 Production by block (MT)">
            <Bars color={accent} fmt={n2} rows={blockRows.map((b) => ({ label: b.name, value: b.prod }))} empty="No block entries this month" />
          </Card>

          <Card title="🏗 Block cost detail (₹ / MT)">
            <Table
              rows={blockRows}
              cols={[
                { h: 'Block', f: (r) => <b>{r.name}</b> },
                { h: 'Normal (MT)', a: 'r', f: (r) => n2(r.normal) },
                { h: 'Redraw / umbrella (MT)', a: 'r', f: (r) => n2(r.repeat) },
                { h: 'Total (MT)', a: 'r', f: (r) => n2(r.prod) },
                { h: '% repeat', a: 'r', f: (r) => (r.prod ? n2((r.repeat / r.prod) * 100) + '%' : '-') },
                { h: 'Elec', a: 'r', f: (r) => n0(r.elec) },
                { h: 'Consumables', a: 'r', f: (r) => n0(r.cons) },
                { h: 'Manpower', a: 'r', f: (r) => n0(r.man) },
                { h: 'Maint.', a: 'r', f: (r) => n0(r.maint) },
                { h: 'Waste', a: 'r', f: (r) => n0(r.waste) },
                { h: 'Admin + Int.', a: 'r', f: (r) => n0(r.admin + r.int) }
              ]}
              empty="No block entries this month"
            />
          </Card>

          <Card title="🎯 Single wire costing">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 14 }}>
              <Sel label="📏 Finish size (mm)" value={fSize} onChange={setFSize} options={sizes} />
              <Sel label="🏷 Grade" value={fGrade} onChange={setFGrade} options={grades} />
              <Sel label="🏗 Block" value={fBlock} onChange={setFBlock} options={blockNames} />
            </div>
            <KpiGrid>
              <Kpi title="Production (MT)" value={n2(FS.prod)} color={accent} />
              <Kpi title="Cost avg ₹ / MT (excl. interest)" value={n0(FS.excl)} color="#ea580c" />
              <Kpi title="Interest ₹ / MT" value={n0(FS.int)} color="#7c3aed" />
              <Kpi title="Total cost ₹ (incl. interest)" value={n0(FS.value)} color="#0d9488" sub={`${FS.entries} entries`} />
            </KpiGrid>
            <div className="pz-sub" style={{ marginTop: 8 }}>
              Leave size / grade / block on “All” for the full month.
            </div>
          </Card>
        </>
      ))}

      {/* ================= GI: DAY / NIGHT ================= */}
      {view === 'daynight' && isGI && (!has('giDayNight') ? (
        <NeedApi />
      ) : (
        <>
          <Strip>🌗 GI DAY / NIGHT COSTING — {monthLabel(cur).toUpperCase()}</Strip>
          <KpiGrid>
            <Kpi title="☀ Day cost (₹)" value={n0(dnDay)} color="#f59e0b" />
            <Kpi title="🌙 Night cost (₹)" value={n0(dnNight)} color="#2563eb" />
            <Kpi title="🧾 Total (₹)" value={n0(dnTot)} color="#7c3aed" />
            <Kpi title="Night share" value={dnTot ? n2((dnNight / dnTot) * 100) + '%' : '-'} color="#0d9488" />
          </KpiGrid>

          <Card title="📅 Day-wise day vs night cost">
            <Table
              rows={dnDays}
              empty="No day/night entries this month"
              cols={[
                { h: 'Date', f: (r) => r.d },
                { h: 'Day ₹', a: 'r', f: (r) => n0(r.day) },
                { h: 'Night ₹', a: 'r', f: (r) => n0(r.night) },
                { h: 'Total ₹', a: 'r', f: (r) => n0(r.day + r.night) },
                {
                  h: 'Night %',
                  a: 'r',
                  f: (r) => ((r.day + r.night) ? n2((r.night / (r.day + r.night)) * 100) + '%' : '-')
                }
              ]}
            />
          </Card>

          <Card title="🧪 Item-wise day vs night">
            <Table
              rows={dnItems}
              empty="No day/night entries this month"
              cols={[
                { h: 'Item', f: (r) => <b>{r.k}</b> },
                { h: 'Day qty', a: 'r', f: (r) => n2(r.dq) },
                { h: 'Night qty', a: 'r', f: (r) => n2(r.nq) },
                { h: 'Day ₹', a: 'r', f: (r) => n0(r.dc) },
                { h: 'Night ₹', a: 'r', f: (r) => n0(r.nc) },
                { h: 'Total ₹', a: 'r', f: (r) => n0(r.dc + r.nc) }
              ]}
            />
          </Card>
        </>
      ))}

      {/* ================= CONSUMABLES & STOCK ================= */}
      {view === 'stock' && (!(has('received') && has('giCons') && has('wdCons')) ? (
        <NeedApi />
      ) : (
        <>
          <Strip>📦 STOCK (Zinc · Acid · Fuel Oil) — {monthLabel(cur).toUpperCase()}</Strip>
          <Card title="📦 Material stock">
            <Table
              rows={stock}
              cols={[
                { h: 'Material', f: (r) => <b>{r.name}</b> },
                { h: 'Unit', f: (r) => r.uom },
                { h: 'Opening', a: 'r', f: (r) => n2(r.opening) },
                { h: 'Received', a: 'r', f: (r) => n2(r.rec) },
                { h: 'Used (month)', a: 'r', f: (r) => n2(r.used) },
                {
                  h: 'Current stock',
                  a: 'r',
                  f: (r) => <b style={{ color: r.current < 0 ? '#dc2626' : undefined }}>{n2(r.current)}</b>
                },
                { h: 'Avg use / day', a: 'r', f: (r) => n2(r.avg) },
                { h: 'Stock lasts (days)', a: 'r', f: (r) => (r.days === null ? '-' : n2(r.days)) },
                {
                  h: 'Status',
                  f: (r) =>
                    r.current < 0 ? (
                      <Chip ok={false}>Check entries</Chip>
                    ) : r.days !== null && r.days < 3 ? (
                      <Chip ok={false}>Low</Chip>
                    ) : (
                      <Chip ok>OK</Chip>
                    )
                }
              ]}
            />
            <div className="pz-sub" style={{ marginTop: 8 }}>
              Used quantity comes from the GI Consumables Log; received from Received Item Monthly.
            </div>
          </Card>

          <Strip>🧪 {P} CONSUMABLES — {monthLabel(cur).toUpperCase()}</Strip>
          <KpiGrid>
            <Kpi title="Consumables logged (₹)" value={n0(itemsCost)} color={accent} sub={`${items.length} items`} />
            <Kpi title={`In costing (₹ / MT of ${P})`} value={n0(S.comps[1].v)} color="#ea580c" />
          </KpiGrid>
          <Card title={`${P} consumables used — item-wise`}>
            <Table
              rows={items}
              empty="No consumable entries this month"
              cols={[
                { h: 'Item', f: (r) => <b>{r.name}</b> },
                { h: 'Quantity', a: 'r', f: (r) => n2(r.qty) },
                { h: 'Avg rate ₹', a: 'r', f: (r) => (r.qty ? n2(r.cost / r.qty) : '-') },
                { h: 'Cost ₹', a: 'r', f: (r) => n0(r.cost) },
                {
                  h: 'Share',
                  f: (r) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: Math.max(2, (r.cost / (itemsCost || 1)) * 120),
                          height: 10,
                          borderRadius: 5,
                          background: accent
                        }}
                      />
                      {itemsCost ? Math.round((r.cost / itemsCost) * 100) : 0}%
                    </div>
                  )
                }
              ]}
            />
          </Card>
        </>
      ))}

      {/* ================= ELECTRICITY ================= */}
      {view === 'elec' && (
        <>
          <Strip>⚡ {P} ELECTRICITY — {monthLabel(cur).toUpperCase()}</Strip>
          <KpiGrid>
            <Kpi title={`${P} units (kWh)`} value={n0(eUnits)} color={accent} />
            <Kpi title="kWh / MT" value={n2(eKwh)} color="#ea580c" sub={`on ${n2(S.prod)} MT`} />
            <Kpi title="Elec ₹ / MT (costing)" value={n0(S.comps[0].v)} color="#7c3aed" />
          </KpiGrid>
          <div className="pz-grid2">
            <Card title={`${P} daily electricity units (kWh)`}>
              <Bars color={accent} fmt={n0} rows={mine.map((r) => ({ label: shortDay(r._d), value: unitsOf(r) }))} />
            </Card>
            <Card title="🔌 Meter-wise units this month (kWh)">
              {has('electricity') ? (
                <Table
                  rows={meters}
                  empty="No meter readings this month"
                  cols={[
                    { h: 'Meter', f: (r) => r.label },
                    { h: 'Units', a: 'r', f: (r) => n0(r.v) },
                    { h: 'Share', a: 'r', f: (r) => (meterTot ? Math.round((r.v / meterTot) * 100) + '%' : '-') }
                  ]}
                />
              ) : (
                <NeedApi />
              )}
            </Card>
          </div>
        </>
      )}

      {view === 'daily' && (
        <div className="pz-grid2">
          <Card title={`${P} daily production (MT)`}>
            <Bars
              color={accent}
              fmt={n2}
              rows={mine.map((r) => ({ label: shortDay(r._d), value: num(r[`${P} Total Production (MT)`]) || 0 }))}
            />
          </Card>
          <Card title={`${P} daily grand total cost (₹ / MT)`}>
            <Bars
              color="#ea580c"
              fmt={n0}
              rows={prodDays.map((r) => ({ label: shortDay(r._d), value: num(r[`${P} Grand Total/MT`]) || 0 }))}
            />
          </Card>
        </div>
      )}

      {view === 'matrix' && (
        <Card title="🗓 Month Matrix — WD & GI, all months">
          <Table
            rows={matrix}
            rowClass={(r) => (r.k === cur ? 'ok' : '')}
            cols={[
              { h: 'Month', f: (r) => <b>{monthLabel(r.k)}</b> },
              { h: 'WD prod (MT)', a: 'r', f: (r) => n2(r.wd.prod) },
              { h: 'WD ₹/MT', a: 'r', f: (r) => n0(r.wd.per) },
              { h: 'WD cost (₹ L)', a: 'r', f: (r) => lakh(r.wd.cost) },
              { h: 'GI prod (MT)', a: 'r', f: (r) => n2(r.gi.prod) },
              { h: 'GI ₹/MT', a: 'r', f: (r) => n0(r.gi.per) },
              { h: 'GI cost (₹ L)', a: 'r', f: (r) => lakh(r.gi.cost) }
            ]}
          />
        </Card>
      )}

      {view === 'records' && (
        <Card
          title={`📋 ${P} production log — ${monthLabel(cur)} (${recordRows.length} entries)`}
          right={
            <div className="pz-tools">
              <input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          }
        >
          <Table
            maxRows={300}
            rows={recordRows}
            empty={data && (data.wdLog || data.giLog) ? 'No entries' : 'Production log not sent by the API'}
            cols={logCols.map(([k, a]) => ({
              h: k,
              a,
              f: (r) => {
                const v = r[k];
                if (k === 'Date') return toYMD(v);
                return a === 'r' && num(v) !== null ? n2(v) : String(v === undefined ? '' : v);
              }
            }))}
          />
        </Card>
      )}
    </div>
  );
}