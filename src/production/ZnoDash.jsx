import React, { useState } from 'react';
import { Pills, MonthBar, Banner, Kpi, KpiGrid, Card, Strip, Bars, Table, Delta } from './prodShared.jsx';
import { n0, n2, lakh, monthLabel, prevMonth } from './prodUtils.js';

const ACCENT = '#ea580c';
const NEED = 'ZNO dashboard data is not in the feed yet. In the ZNO Apps Script: Deploy → Manage deployments → edit → New version, then press Refresh.';
const NEED_LEDGER = 'The full crucible log needs the updated ApiZnoDash.gs (paste it, then Deploy → Manage deployments → edit → New version).';

const blank = (v) => v === '' || v === null || v === undefined;
const f2 = (v) => (blank(v) ? '-' : typeof v === 'number' ? n2(v) : String(v));
const f0 = (v) => (blank(v) ? '-' : typeof v === 'number' ? n0(v) : String(v));
// recovery / "vs usual" columns can be a fraction (1.12) or a plain number
const pct = (v) => (blank(v) || typeof v !== 'number' ? f2(v) : Math.abs(v) <= 5 ? n2(v * 100) + '%' : n2(v));
const signed = (v) => (blank(v) || typeof v !== 'number' ? '-' : (v > 0 ? '+' : '') + n0(v));
const ymKey = (m) => String(m.date || '').slice(0, 7);
const sum = (rows, k) => rows.reduce((a, r) => a + (typeof r[k] === 'number' ? r[k] : 0), 0);

/* ====================== small SVG charts (no extra library) ====================== */
const niceMax = (v) => {
  if (!(v > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => m <= s) || 10;
  return step * p;
};
const short = (v) => (v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : String(Math.round(v * 10) / 10));

function Legend({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 6, fontSize: 12, color: '#475569' }}>
      {items.map((s) => (
        <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <i style={{ width: 11, height: 11, borderRadius: 2, background: s.color, display: 'inline-block' }} />{s.name}
        </span>
      ))}
    </div>
  );
}

function ColChart({ labels, series, stacked = false, fmt = n0, height = 250 }) {
  const n = labels.length;
  if (!n) return <div className="pz-empty">No data</div>;
  const W = 640, H = height, L = 46, R = 10, T = 10, B = n > 6 ? 54 : 30;
  const tops = labels.map((_, i) => (stacked
    ? series.reduce((a, s) => a + (s.values[i] || 0), 0)
    : Math.max(0, ...series.map((s) => s.values[i] || 0))));
  const max = niceMax(Math.max(...tops));
  const iw = W - L - R, ih = H - T - B, slot = iw / n;
  const y = (v) => T + ih - (v / max) * ih;
  const bw = stacked ? slot * 0.62 : (slot * 0.74) / series.length;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(max * g)} y2={y(max * g)} stroke="#e2e8f0" />
            <text x={L - 6} y={y(max * g) + 4} textAnchor="end" fontSize="10" fill="#64748b">{short(max * g)}</text>
          </g>
        ))}
        {labels.map((lab, i) => {
          const x0 = L + i * slot;
          let acc = 0;
          const bars = series.map((s, k) => {
            const v = s.values[i] || 0;
            const tip = `${lab} · ${s.name}: ${fmt(v)}`;
            if (stacked) {
              const y1 = y(acc + v);
              const h = y(acc) - y1;
              acc += v;
              return <rect key={k} x={x0 + (slot - bw) / 2} y={y1} width={bw} height={Math.max(0, h)} fill={s.color}><title>{tip}</title></rect>;
            }
            return <rect key={k} x={x0 + (slot - bw * series.length) / 2 + k * bw} y={y(v)} width={Math.max(1, bw - 1)} height={Math.max(0, y(0) - y(v))} fill={s.color}><title>{tip}</title></rect>;
          });
          const cx = x0 + slot / 2;
          return (
            <g key={lab + i}>
              {bars}
              <text x={cx} y={H - B + 14} textAnchor={n > 6 ? 'end' : 'middle'} fontSize="10" fill="#475569"
                transform={n > 6 ? `rotate(-35 ${cx} ${H - B + 14})` : undefined}>{lab}</text>
            </g>
          );
        })}
      </svg>
      {series.length > 1 && <Legend items={series} />}
    </div>
  );
}

function LineChart({ labels, values, color, fmt = n2, height = 230 }) {
  const n = labels.length;
  const valid = values.map((v, i) => (v > 0 ? { i, v } : null)).filter(Boolean);
  if (!n || !valid.length) return <div className="pz-empty">No data</div>;
  const W = 640, H = height, L = 46, R = 14, T = 14, B = n > 6 ? 54 : 30;
  const lo0 = Math.min(...valid.map((p) => p.v)), hi0 = Math.max(...valid.map((p) => p.v));
  const pad = (hi0 - lo0) * 0.3 || hi0 * 0.1 || 1;
  const lo = Math.max(0, lo0 - pad), hi = hi0 + pad;
  const iw = W - L - R, ih = H - T - B, slot = iw / n;
  const x = (i) => L + slot * i + slot / 2;
  const y = (v) => T + ih - ((v - lo) / (hi - lo)) * ih;
  const runs = [];
  valid.forEach((p) => {
    const last = runs[runs.length - 1];
    if (last && last[last.length - 1].i === p.i - 1) last.push(p); else runs.push([p]);
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={L} x2={W - R} y1={y(lo + (hi - lo) * g)} y2={y(lo + (hi - lo) * g)} stroke="#e2e8f0" />
          <text x={L - 6} y={y(lo + (hi - lo) * g) + 4} textAnchor="end" fontSize="10" fill="#64748b">{(lo + (hi - lo) * g).toFixed(1)}</text>
        </g>
      ))}
      {runs.map((run, k) => (
        <polyline key={k} fill="none" stroke={color} strokeWidth="3" points={run.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} />
      ))}
      {valid.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r="4.5" fill={color}><title>{`${labels[p.i]}: ${fmt(p.v)}`}</title></circle>)}
      {labels.map((lab, i) => (
        <text key={lab + i} x={x(i)} y={H - B + 14} textAnchor={n > 6 ? 'end' : 'middle'} fontSize="10" fill="#475569"
          transform={n > 6 ? `rotate(-35 ${x(i)} ${H - B + 14})` : undefined}>{lab}</text>
      ))}
    </svg>
  );
}

function Tag({ ok, children }) {
  return (
    <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
      background: ok ? '#c6f6d5' : '#e2e8f0', color: ok ? '#22543d' : '#475569' }}>{children}</span>
  );
}

function FlagTag({ flag }) {
  const s = String(flag || '');
  if (!s) return '-';
  const bad = /EARLY/i.test(s);
  const warn = /TOO LONG|CHECK/i.test(s);
  const bg = bad ? '#fed7d7' : warn ? '#feebc8' : '#c6f6d5';
  const fg = bad ? '#9b2c2c' : warn ? '#9c4221' : '#22543d';
  return <span style={{ padding: '2px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: bg, color: fg, whiteSpace: 'nowrap' }}>{s}</span>;
}

function SelBox({ label, value, onChange, options, all = 'All' }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 700, color: '#334155' }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, background: '#fff', minWidth: 150 }}>
        <option value="">{all}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

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
  const labels = months.map((m) => monthLabel(ymKey(m)));
  const comps = [['⚡ Electricity', M.elec], ['🔥 Furnace oil', M.oil], ['📦 Packing', M.pack], ['🧱 Crucible & refractories', M.crucible], ['👷 Manpower', M.manpower], ['🏢 Other', M.other]];
  const vs = 'vs ' + monthLabel(prevMonth(cur));

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
        <Kpi title="Dross used (KG)" value={n0(M.dross)} color="#b7791f">{P && <Delta cur={M.dross} prev={P.dross} goodUp label={vs} />}</Kpi>
        <Kpi title="Oxide produced (KG)" value={n0(M.oxide)} color="#2f855a">{P && <Delta cur={M.oxide} prev={P.oxide} goodUp label={vs} />}</Kpi>
        <Kpi title="Total cost (₹ Lakh)" value={lakh(M.cost)} color="#c53030">{P && <Delta cur={M.cost} prev={P.cost} goodUp={false} label={vs} />}</Kpi>
        <Kpi title="Net cost ₹ / KG" value={n2(M.net)} color="#6b46c1">{P && <Delta cur={M.net} prev={P.net} goodUp={false} label={vs} />}</Kpi>
      </KpiGrid>

      <Card title={`🗓 Monthly production performance & financial summary — ${fyLabel}`}>
        <Table rows={[...months, { label: 'FY TOTAL', ...tot, net: tot.oxide ? tot.cost / tot.oxide : 0, isTotal: true }]}
          rowClass={(r) => (r.isTotal || ymKey(r) === cur ? 'ok' : '')} cols={[
            { h: 'Month', f: (r) => <b>{r.isTotal ? r.label : monthLabel(ymKey(r))}</b> },
            { h: 'Oxide produced (KG)', a: 'r', f: (r) => n2(r.oxide) },
            { h: 'Total cost (₹)', a: 'r', f: (r) => n2(r.cost) },
            { h: 'Net cost / KG (₹)', a: 'r', f: (r) => n2(r.net) },
            { h: 'Dross (KG)', a: 'r', f: (r) => n0(r.dross) }]} />
      </Card>

      <Strip>📈 PRODUCTION & COST TRENDS — MONTH BY MONTH</Strip>
      <div className="pz-grid2">
        <Card title="Production — dross used vs oxide produced (KG)">
          <ColChart labels={labels} series={[
            { name: 'Dross (KG)', color: '#b7791f', values: months.map((m) => m.dross) },
            { name: 'Oxide (KG)', color: '#2f855a', values: months.map((m) => m.oxide) }]} />
        </Card>
        <Card title="Net cost ₹ per KG of oxide">
          <LineChart labels={labels} values={months.map((m) => m.net)} color="#6b46c1" />
        </Card>
      </div>

      <Strip>🧮 WHAT MAKES UP THE COST — ₹ PER KG OF OXIDE, BY COMPONENT</Strip>
      <Card title="Cost build-up ₹ / KG — electricity, furnace oil, packing, crucible, manpower, other">
        <ColChart stacked fmt={n2} height={300} labels={labels} series={[
          { name: 'Electricity', color: '#2b6cb0', values: months.map((m) => m.elec) },
          { name: 'Furnace oil', color: '#b7791f', values: months.map((m) => m.oil) },
          { name: 'Packing', color: '#2c7a7b', values: months.map((m) => m.pack) },
          { name: 'Crucible & refr.', color: '#c05621', values: months.map((m) => m.crucible) },
          { name: 'Manpower', color: '#6b46c1', values: months.map((m) => m.manpower) },
          { name: 'Other', color: '#718096', values: months.map((m) => m.other) }]} />
      </Card>
      <div className="pz-grid2">
        <Card title={`${monthLabel(cur)} — ₹ per KG by component`}>
          <Bars color={ACCENT} fmt={n2} rows={comps.map(([label, value]) => ({ label, value: value || 0 }))} />
        </Card>
        <Card title="Cost build-up by month (₹ / KG)">
          <Table rows={months} rowClass={(r) => (ymKey(r) === cur ? 'ok' : '')} cols={[
            { h: 'Month', f: (r) => <b>{monthLabel(ymKey(r))}</b> },
            { h: 'Elec', a: 'r', f: (r) => n2(r.elec) }, { h: 'Oil', a: 'r', f: (r) => n2(r.oil) },
            { h: 'Pack', a: 'r', f: (r) => n2(r.pack) }, { h: 'Cruc.', a: 'r', f: (r) => n2(r.crucible) },
            { h: 'Man.', a: 'r', f: (r) => n2(r.manpower) }, { h: 'Other', a: 'r', f: (r) => n2(r.other) },
            { h: 'Net', a: 'r', f: (r) => <b>{n2(r.net)}</b> }]} />
        </Card>
      </div>
    </>
  );
}

/* ====================== CRUCIBLES ====================== */
export function ZnoCrucibleHistory({ dash, loaded, error }) {
  const [view, setView] = useState('last4');
  const [unit, setUnit] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  if (!dash) return <Banner>{error || (loaded ? NEED : 'Loading crucible data...')}</Banner>;

  const furnaces = dash.furnaces || [];
  const life = dash.lifeSummary || [];
  const watch = dash.watch || [];
  const ledger = Array.isArray(dash.ledger) ? dash.ledger : null;
  const events = dash.events || [];
  // hide future FY rows that are still empty, and the sheet's subtotal rows inside the history table
  const fySum = (dash.fySummary || []).filter((r) => /ALL/i.test(String(r.fy)) || Number(r.started) > 0 || Number(r.replaced) > 0);
  const hist = (dash.history || []).filter((r) => !/^(LAST |AVERAGE)/i.test(String(r.id)));
  const unitList = [...new Set([...hist.map((r) => String(r.unit)), ...(ledger || []).map((r) => String(r.unit))])].filter(Boolean);
  const match = (r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q.toLowerCase()));

  const toolbar = (showStatus, showSearch) => (
    <Card>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <SelBox label="🔥 Furnace" value={unit} onChange={setUnit} options={unitList} all="All furnaces" />
        {showStatus && <SelBox label="Status" value={status} onChange={setStatus} options={['RUNNING', 'REPLACED']} />}
        {showSearch && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, fontWeight: 700, color: '#334155', flex: '1 1 200px' }}>
            Search
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="id, remark, date..."
              style={{ padding: '9px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14 }} />
          </label>
        )}
      </div>
    </Card>
  );

  /* ---- last 4 per furnace ---- */
  const groups = unitList.filter((u) => !unit || u === unit)
    .map((u) => ({ u, rows: hist.filter((r) => String(r.unit) === u) })).filter((g) => g.rows.length);

  const groupRows = (rows) => {
    const stopped = rows.filter((r) => !blank(r.stopped) && !/RUNNING/i.test(String(r.stopped)));
    if (!stopped.length) return rows;
    const t = { life: sum(stopped, 'life'), dross: sum(stopped, 'dross'), oxide: sum(stopped, 'oxide'), ash: sum(stopped, 'ash'), foil: sum(stopped, 'foil') };
    const c = stopped.length;
    const rec = t.dross ? t.oxide / t.dross : '';
    const foilMt = t.dross ? (t.foil / t.dross) * 1000 : '';
    return [
      ...rows,
      { id: 'LAST ' + c + ' STOPPED — TOTAL', isTot: true, ...t, recovery: rec, foilPerMt: foilMt },
      { id: 'AVERAGE PER STOPPED CRUCIBLE', isTot: true, life: t.life / c, dross: t.dross / c, oxide: t.oxide / c, ash: t.ash / c, foil: t.foil / c, recovery: rec, foilPerMt: foilMt },
    ];
  };

  /* ---- ledger ---- */
  const logAll = ledger || [];
  const logRows = logAll.filter((r) => (!unit || String(r.unit) === unit) && (!status || String(r.status) === status) && (!q || match(r)));
  const replaced = logAll.filter((r) => String(r.status) === 'REPLACED');
  const avgLife = replaced.length ? sum(replaced, 'days') / replaced.length : 0;
  const totDross = sum(logAll, 'dross');
  const totOxide = sum(logAll, 'oxide');

  const evRows = events.filter((r) => (!unit || String(r.unit) === unit) && (!q || match(r)));

  return (
    <>
      <Pills accent={ACCENT} value={view} onChange={setView}
        items={[['last4', '🔥 Last 4 per Furnace'], ['log', '📜 Crucible Log'], ['perf', '📊 Performance'], ['events', '🧾 Event Log']]} />

      {view === 'last4' && (
        <>
          {toolbar(false, false)}
          {groups.length ? groups.map((g) => (
            <Card key={g.u} title={`🔥 ${g.u} — running now + last 4 stopped crucibles`}>
              <Table rows={groupRows(g.rows)} rowClass={(r) => (r.isTot ? 'ok' : '')} cols={[
                { h: 'Crucible ID', f: (r) => <b>{r.id}</b> },
                { h: 'Started on', f: (r) => (r.isTot ? '' : f2(r.started)) },
                { h: 'Stopped on', f: (r) => (r.isTot ? '' : f2(r.stopped)) },
                { h: 'Life (days)', a: 'r', f: (r) => (r.isTot ? <b>{f2(r.life)}</b> : f0(r.life)) },
                { h: 'Life vs usual', a: 'r', f: (r) => (r.isTot ? '' : pct(r.vsUsual)) },
                { h: 'Dross (KG)', a: 'r', f: (r) => f0(r.dross) }, { h: 'Oxide (KG)', a: 'r', f: (r) => f0(r.oxide) },
                { h: 'Ash (KG)', a: 'r', f: (r) => f0(r.ash) }, { h: 'F.oil (Ltr)', a: 'r', f: (r) => f0(r.foil) },
                { h: 'Recovery', a: 'r', f: (r) => pct(r.recovery) }, { h: 'F.oil / MT', a: 'r', f: (r) => f2(r.foilPerMt) },
                { h: 'Flag', f: (r) => (r.isTot ? '' : <FlagTag flag={r.flag} />) },
                { h: 'Reason / remarks', f: (r) => (r.isTot ? '' : f2(r.remarks)) }]} />
            </Card>
          )) : <Banner>No crucible history found.</Banner>}
        </>
      )}

      {view === 'log' && (!ledger ? <Banner>{NEED_LEDGER}</Banner> : (
        <>
          <KpiGrid>
            <Kpi title="Crucibles logged" value={n0(logAll.length)} color="#2c7a7b" />
            <Kpi title="Crucibles replaced" value={n0(replaced.length)} color="#2b6cb0" />
            <Kpi title="Avg life of replaced (days)" value={n2(avgLife)} color="#6b46c1" />
            <Kpi title="Avg recovery (oxide ÷ dross)" value={totDross ? n2((totOxide / totDross) * 100) + '%' : '-'} color="#b7791f" sub={`total oxide ${n0(totOxide)} KG`} />
          </KpiGrid>
          {toolbar(true, true)}
          <Card title={`📜 Crucible log — life & production (${logRows.length} of ${logAll.length})`}>
            <Table maxRows={300} rows={logRows} empty="No crucibles match" cols={[
              { h: 'Crucible ID', f: (r) => <b>{r.id}</b> }, { h: 'Unit', f: (r) => r.unit },
              { h: 'Installed on', f: (r) => f2(r.installed) }, { h: 'Stopped on', f: (r) => f2(r.stopped) },
              { h: 'Status', f: (r) => <Tag ok={String(r.status) === 'RUNNING'}>{f2(r.status)}</Tag> },
              { h: 'Days in service', a: 'r', f: (r) => f0(r.days) }, { h: 'Prod. days', a: 'r', f: (r) => f0(r.prodDays) },
              { h: 'Dross (KG)', a: 'r', f: (r) => f0(r.dross) }, { h: 'Oxide (KG)', a: 'r', f: (r) => f0(r.oxide) },
              { h: 'Ash (KG)', a: 'r', f: (r) => f0(r.ash) }, { h: 'F.oil (Ltr)', a: 'r', f: (r) => f0(r.foil) },
              { h: 'Recovery', a: 'r', f: (r) => pct(r.recovery) }, { h: 'F.oil / MT', a: 'r', f: (r) => f2(r.oilPerMt) },
              { h: 'Life vs prev (days)', a: 'r', f: (r) => <span style={{ color: r.lifeVsPrev > 0 ? '#16a34a' : r.lifeVsPrev < 0 ? '#dc2626' : undefined, fontWeight: 700 }}>{signed(r.lifeVsPrev)}</span> },
              { h: 'Oxide vs prev (KG)', a: 'r', f: (r) => <span style={{ color: r.oxideVsPrev > 0 ? '#16a34a' : r.oxideVsPrev < 0 ? '#dc2626' : undefined, fontWeight: 700 }}>{signed(r.oxideVsPrev)}</span> },
              { h: 'Remarks', f: (r) => f2(r.remarks) }]} />
          </Card>
        </>
      ))}

      {view === 'perf' && (
        <>
          <Strip>🔥 CRUCIBLE PERFORMANCE — BY FURNACE</Strip>
          <div className="pz-grid2">
            <Card title="Oxide produced by each furnace (KG) — all crucibles on record">
              <ColChart labels={furnaces.map((r) => String(r.unit))} series={[{ name: 'Total oxide (KG)', color: '#c05621', values: furnaces.map((r) => Number(r.totalOxide) || 0) }]} />
            </Card>
            <Card title="Crucible life (days) — average of replaced vs total in service">
              <ColChart labels={furnaces.map((r) => String(r.unit))} series={[
                { name: 'Avg life of replaced (days)', color: '#2c7a7b', values: furnaces.map((r) => Number(r.avgLife) || 0) },
                { name: 'Total days in service', color: '#2b6cb0', values: furnaces.map((r) => Number(r.totalDays) || 0) }]} />
            </Card>
          </div>
          <Card title="🔥 Furnace-wise totals (all crucibles on record)">
            <Table rows={furnaces} empty="No furnace data" cols={[
              { h: 'Furnace', f: (r) => <b>{r.unit}</b> }, { h: 'Total oxide (KG)', a: 'r', f: (r) => f0(r.totalOxide) },
              { h: 'Avg recovery', a: 'r', f: (r) => pct(r.avgRecovery) }, { h: 'Avg life of replaced (days)', a: 'r', f: (r) => f2(r.avgLife) },
              { h: 'Days in service', a: 'r', f: (r) => f0(r.totalDays) }]} />
          </Card>
          <Card title="🧱 Unit-wise crucible life summary">
            <Table rows={life} empty="No summary rows" cols={[
              { h: 'Unit', f: (r) => <b>{r.unit}</b> }, { h: 'Used', a: 'r', f: (r) => f0(r.used) }, { h: 'Replaced', a: 'r', f: (r) => f0(r.replaced) },
              { h: 'Status', f: (r) => f2(r.status) }, { h: 'Avg life (days)', a: 'r', f: (r) => f2(r.avgLife) }, { h: 'Total days', a: 'r', f: (r) => f0(r.totalDays) },
              { h: 'Dross (KG)', a: 'r', f: (r) => f0(r.dross) }, { h: 'Oxide (KG)', a: 'r', f: (r) => f0(r.oxide) }, { h: 'Ash (KG)', a: 'r', f: (r) => f0(r.ash) },
              { h: 'F.oil (Ltr)', a: 'r', f: (r) => f0(r.foil) }, { h: 'Recovery', a: 'r', f: (r) => pct(r.recovery) }]} />
          </Card>
          <Card title="👀 Last 4 stopped — unit-wise watch-list">
            <Table rows={watch} empty="No watch rows" cols={[
              { h: 'Unit', f: (r) => <b>{r.unit}</b> }, { h: 'Counted', a: 'r', f: (r) => f0(r.counted) }, { h: 'Avg life (last 4)', a: 'r', f: (r) => f2(r.avgLife4) },
              { h: 'Shortest', a: 'r', f: (r) => f0(r.shortest) }, { h: 'Longest', a: 'r', f: (r) => f0(r.longest) }, { h: 'Usual', a: 'r', f: (r) => f2(r.usual) },
              { h: 'Early stops', a: 'r', f: (r) => f0(r.early) }, { h: 'Too long', a: 'r', f: (r) => f0(r.tooLong) },
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

      {view === 'events' && (
        <>
          {toolbar(false, true)}
          <Card title={`🧾 Crucible event log (${evRows.length} events)`}>
            <Table rows={evRows} empty="No events" cols={[
              { h: 'When', f: (r) => f2(r.when) }, { h: 'Recorded', f: (r) => f2(r.recorded) }, { h: 'Furnace', f: (r) => <b>{r.unit}</b> },
              { h: 'Crucible ID', f: (r) => f2(r.id) }, { h: 'Event', f: (r) => <Tag ok={/START/i.test(String(r.event))}>{f2(r.event)}</Tag> }, { h: 'Days', a: 'r', f: (r) => f2(r.days) },
              { h: 'Dross (KG)', a: 'r', f: (r) => f0(r.dross) }, { h: 'Oxide (KG)', a: 'r', f: (r) => f0(r.oxide) }, { h: 'Ash (KG)', a: 'r', f: (r) => f0(r.ash) },
              { h: 'F.oil (Ltr)', a: 'r', f: (r) => f0(r.foil) }, { h: 'Recovery', a: 'r', f: (r) => pct(r.recovery) }, { h: 'Remarks', f: (r) => f2(r.remarks) }]} />
          </Card>
        </>
      )}
    </>
  );
}
