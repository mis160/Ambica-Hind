import React, { useMemo, useState } from 'react';
import SalesDashboard from './SalesDashboard.jsx';
import { dateText, num } from './salesUtils.js';

const card = { background: 'rgba(255, 255, 255, 0.95)', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };

const rs = (v) => '₹' + num(v);

// Columns of the "Records" view
const PAN_COLS = [
  { h: 'Date', get: (r) => dateText(r._d), raw: (r) => dateText(r._d) },
  { h: 'Customer Name', get: (r) => r.customer, bold: true },
  { h: 'Business Category', get: (r) => r.category || '' },
  { h: 'Material', get: (r) => r.material || '' },
  { h: 'Rate (₹/KG)', get: (r) => rs(r.rate), raw: (r) => Number(r.rate) || 0, num: true },
  { h: 'Qty (KGS)', get: (r) => num(r._kg, 2), raw: (r) => r._kg, num: true },
  { h: 'Billing Unit', get: (r) => r.billingUnit || '' },
  { h: 'Total Value (₹)', get: (r) => rs(r._val), raw: (r) => r._val, num: true, bold: true },
  { h: 'Location', get: (r) => r.location || '' }
];

const RAIPUR_COLS = [
  { h: 'Date', get: (r) => dateText(r._d), raw: (r) => dateText(r._d) },
  { h: 'Dept', multiOnly: true, get: (r) => (r._s === 'zn' ? 'ZN' : 'PB') },
  { h: 'Customer Name', get: (r) => r.customer, bold: true },
  { h: 'Product', get: (r) => r.product || '' },
  { h: 'Rate (₹/KG)', get: (r) => rs(r.rate), raw: (r) => Number(r.rate) || 0, num: true },
  { h: 'Qty (KGS)', get: (r) => num(r._kg, 2), raw: (r) => r._kg, num: true },
  { h: 'Total Value (₹)', get: (r) => rs(r._val), raw: (r) => r._val, num: true, bold: true }
];

export default function SalesZone({
  zone, accent, formUrl, formOnly, loaded, error,
  panRows, znRows, pbRows
}) {
  const [mode, setMode] = useState('dash'); // 'dash' | 'form'

  const streams = useMemo(() => {
    if (zone === 'panIndia') {
      return [{
        id: 'zn', label: 'Zinc', short: '', color: '#16a34a', rows: panRows,
        dims: [
          { label: 'Material Wise', short: 'Material', icon: '⚙', field: 'material' },
          { label: 'Location Wise', short: 'Location', icon: '📍', field: 'location', fallback: 'Kolkata' },
          { label: 'Billing Unit Wise', short: 'Billing Unit', icon: '🏢', field: 'billingUnit' },
          { label: 'Business Category', short: 'Business Category', icon: '🗂', field: 'category', fallback: 'UNCATEGORISED' }
        ]
      }];
    }
    const productDim = [{ label: 'Product Wise', short: 'Product', icon: '⚙', field: 'product', fallback: 'OTHER / NOT IN MASTER' }];
    return [
      { id: 'zn', label: 'ZN (Zinc)', short: 'ZN', color: '#ea580c', rows: znRows, dims: productDim },
      { id: 'pb', label: 'PB (Lead)', short: 'PB', color: '#7c3aed', rows: pbRows, dims: productDim }
    ];
  }, [zone, panRows, znRows, pbRows]);

  const isPan = zone === 'panIndia';
  const title = isPan ? 'PAN INDIA ✦ ZINC SALES DASHBOARD' : 'HIND RAIPUR ✦ ZN & PB SALES DASHBOARD';
  const subtitle = isPan ? '📍 Kolkata Zone' : '📍 Raipur Zone';
  const formTitle = isPan ? 'PAN India' : 'Raipur';

  const FormCard = (
    <section style={{ ...card, padding: '30px', textAlign: 'center' }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '18px' }}>📝 {formTitle} Despatch Submission Form</h3>
      <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
        Google Apps Script forms open securely in a dedicated browser tab.
      </p>
      <a
        href={formUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: accent, color: '#fff', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}
      >
        Open {formTitle} Form in New Tab ↗
      </a>
    </section>
  );

  // Restricted accounts (piyali / zincoxide / mkt) only get the form
  if (formOnly) return FormCard;

  const modeBtn = (key, label) => ({
    onClick: () => setMode(key),
    style: {
      padding: '9px 18px', borderRadius: '999px', border: `1px solid ${accent}`, cursor: 'pointer', fontWeight: 700, fontSize: '13px',
      background: mode === key ? accent : 'rgba(255,255,255,0.95)', color: mode === key ? '#fff' : accent,
      boxShadow: mode === key ? '0 3px 8px rgba(0,0,0,0.25)' : 'none'
    },
    children: label
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button {...modeBtn('dash', '📊 Sales Dashboard')} />
        <button {...modeBtn('form', '📝 Submit Despatch Form')} />
      </div>

      {mode === 'form' ? FormCard : (
        <SalesDashboard
          title={title}
          subtitle={subtitle}
          accent={accent}
          streams={streams}
          recordCols={isPan ? PAN_COLS : RAIPUR_COLS}
          loaded={loaded}
          error={error}
        />
      )}
    </div>
  );
}
