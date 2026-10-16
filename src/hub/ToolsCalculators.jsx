import { useState } from 'react';
import './Hub.css';
import { quantityAmount, gst, wireWeight, zincConsumption, recovery, margin } from './calcMath.js';

// ---------- small helpers ----------
const num = (v) => {
  if (v === '' || v === null || v === undefined) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const fmt = (n, d = 2) =>
  Number.isFinite(n) ? n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: d }) : '—';
const money = (n) =>
  Number.isFinite(n) ? '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

function Field({ label, value, onChange, suffix, placeholder }) {
  return (
    <label className="tool-field">
      <span>{label}</span>
      <div className="tool-input">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          value={value}
          placeholder={placeholder || '0'}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <em>{suffix}</em>}
      </div>
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="tool-field">
      <span>{label}</span>
      <div className="tool-input">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function Result({ label, value, strong }) {
  return (
    <div className={'tool-result' + (strong ? ' is-strong' : '')}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Panel({ title, note, inputs, results }) {
  return (
    <div>
      <h3 className="tool-title">{title}</h3>
      <div className="tool-panel">
        <div className="tool-inputs">{inputs}</div>
        <div className="tool-results">{results}</div>
      </div>
      {note && <p className="tool-note">{note}</p>}
    </div>
  );
}

// ---------- the calculators ----------
function QuantityAmountCalc() {
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('KG');
  const [rate, setRate] = useState('');
  const r = quantityAmount(num(qty), unit, num(rate));
  return (
    <Panel
      title="Quantity & amount"
      note="Enter a quantity in KG or MT and a rate per KG to get the invoice amount."
      inputs={
        <>
          <Field label="Quantity" value={qty} onChange={setQty} />
          <SelectField
            label="Unit"
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'KG', label: 'KG' },
              { value: 'MT', label: 'MT (tonnes)' }
            ]}
          />
          <Field label="Rate" value={rate} onChange={setRate} suffix="₹ per KG" />
        </>
      }
      results={
        <>
          <Result label="Quantity in KG" value={fmt(r.kg, 3)} />
          <Result label="Quantity in MT" value={fmt(r.mt, 3)} />
          <Result label="Amount" value={money(r.amount)} strong />
          <Result label="Amount in Lakh" value={Number.isFinite(r.lakh) ? '₹' + fmt(r.lakh, 2) + ' L' : '—'} />
        </>
      }
    />
  );
}

function GstCalc() {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('18');
  const [mode, setMode] = useState('add');
  const r = gst(num(amount), num(rate), mode);
  return (
    <Panel
      title="GST calculator"
      note="Within the state the tax splits into CGST + SGST. For other states the full amount is IGST."
      inputs={
        <>
          <Field label={mode === 'add' ? 'Amount (without GST)' : 'Amount (including GST)'} value={amount} onChange={setAmount} suffix="₹" />
          <SelectField
            label="GST rate"
            value={rate}
            onChange={setRate}
            options={[
              { value: '0', label: '0%' },
              { value: '5', label: '5%' },
              { value: '12', label: '12%' },
              { value: '18', label: '18%' },
              { value: '28', label: '28%' }
            ]}
          />
          <SelectField
            label="What do you want?"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'add', label: 'Add GST to the amount' },
              { value: 'remove', label: 'Take GST out of the amount' }
            ]}
          />
        </>
      }
      results={
        <>
          <Result label="Taxable value" value={money(r.base)} />
          <Result label="CGST" value={money(r.half)} />
          <Result label="SGST" value={money(r.half)} />
          <Result label="Total GST (IGST)" value={money(r.tax)} />
          <Result label="Total amount" value={money(r.total)} strong />
        </>
      }
    />
  );
}

function WireWeightCalc() {
  const [dia, setDia] = useState('');
  const [len, setLen] = useState('');
  const r = wireWeight(num(dia), num(len));
  return (
    <Panel
      title="Wire weight"
      note="For plain steel wire, density 7.85 g/cm³. Weight per metre is about 0.00617 × diameter² (mm)."
      inputs={
        <>
          <Field label="Wire diameter" value={dia} onChange={setDia} suffix="mm" />
          <Field label="Length (optional)" value={len} onChange={setLen} suffix="metres" />
        </>
      }
      results={
        <>
          <Result label="Weight per metre" value={Number.isFinite(r.perMetre) ? fmt(r.perMetre, 4) + ' kg' : '—'} />
          <Result label="Weight per 1000 m" value={Number.isFinite(r.per1000m) ? fmt(r.per1000m, 2) + ' kg' : '—'} />
          <Result label="Metres in 1 MT" value={Number.isFinite(r.metresPerMT) ? fmt(r.metresPerMT, 0) + ' m' : '—'} />
          <Result label="Weight for the length" value={Number.isFinite(r.forLength) ? fmt(r.forLength, 2) + ' kg' : '—'} strong />
        </>
      }
    />
  );
}

function ZincCalc() {
  const [dia, setDia] = useState('');
  const [gsm, setGsm] = useState('');
  const [prod, setProd] = useState('');
  const [loss, setLoss] = useState('0');
  const r = zincConsumption(num(dia), num(gsm), num(prod), num(loss));
  return (
    <Panel
      title="Zinc needed for GI wire"
      note="An estimate from wire size and coating weight. Real use is higher because of dross, ash and wiping loss, so add your own loss %."
      inputs={
        <>
          <Field label="Wire diameter" value={dia} onChange={setDia} suffix="mm" />
          <Field label="Coating weight" value={gsm} onChange={setGsm} suffix="g/m² (GSM)" />
          <Field label="Wire production (optional)" value={prod} onChange={setProd} suffix="MT" />
          <Field label="Process loss" value={loss} onChange={setLoss} suffix="%" />
        </>
      }
      results={
        <>
          <Result label="Wire surface area" value={Number.isFinite(r.areaPerTonne) ? fmt(r.areaPerTonne, 1) + ' m² per MT' : '—'} />
          <Result label="Zinc on the wire" value={Number.isFinite(r.theoretical) ? fmt(r.theoretical, 2) + ' kg per MT' : '—'} />
          <Result label="Zinc including loss" value={Number.isFinite(r.withLoss) ? fmt(r.withLoss, 2) + ' kg per MT' : '—'} strong />
          <Result label="Zinc for the production" value={Number.isFinite(r.total) ? fmt(r.total, 1) + ' kg' : '—'} />
        </>
      }
    />
  );
}

function RecoveryCalc() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [cost, setCost] = useState('');
  const r = recovery(num(input), num(output), num(cost));
  return (
    <Panel
      title="Recovery % & cost per KG"
      note="Works for oxide from dross, or any process: recovery = output ÷ input × 100."
      inputs={
        <>
          <Field label="Input quantity (e.g. dross)" value={input} onChange={setInput} suffix="KG" />
          <Field label="Output quantity (e.g. oxide)" value={output} onChange={setOutput} suffix="KG" />
          <Field label="Total cost (optional)" value={cost} onChange={setCost} suffix="₹" />
        </>
      }
      results={
        <>
          <Result label="Recovery" value={Number.isFinite(r.recoveryPct) ? fmt(r.recoveryPct, 2) + ' %' : '—'} strong />
          <Result label="Quantity lost" value={Number.isFinite(r.lossKg) ? fmt(r.lossKg, 2) + ' kg' : '—'} />
          <Result label="Cost per KG of output" value={money(r.costPerKg)} />
        </>
      }
    />
  );
}

function MarginCalc() {
  const [cost, setCost] = useState('');
  const [sell, setSell] = useState('');
  const [qty, setQty] = useState('');
  const [target, setTarget] = useState('');
  const r = margin(num(cost), num(sell), num(qty), num(target));
  return (
    <Panel
      title="Margin & selling rate"
      note="Margin is profit as a share of the selling price. Markup is profit as a share of cost. Fill 'Margin wanted' to find the rate to quote."
      inputs={
        <>
          <Field label="Cost rate" value={cost} onChange={setCost} suffix="₹ per KG" />
          <Field label="Selling rate" value={sell} onChange={setSell} suffix="₹ per KG" />
          <Field label="Quantity (optional)" value={qty} onChange={setQty} suffix="KG" />
          <Field label="Margin wanted (optional)" value={target} onChange={setTarget} suffix="%" />
        </>
      }
      results={
        <>
          <Result label="Profit per KG" value={money(r.profitPerKg)} strong />
          <Result label="Margin on selling price" value={Number.isFinite(r.marginPct) ? fmt(r.marginPct, 2) + ' %' : '—'} />
          <Result label="Markup on cost" value={Number.isFinite(r.markupPct) ? fmt(r.markupPct, 2) + ' %' : '—'} />
          <Result label="Total profit" value={money(r.totalProfit)} />
          <Result label="Rate to quote for wanted margin" value={money(r.requiredRate)} />
        </>
      }
    />
  );
}

const TOOLS = [
  { id: 'qty', label: '⚖️ Quantity & amount', Component: QuantityAmountCalc },
  { id: 'gst', label: '🧾 GST', Component: GstCalc },
  { id: 'wire', label: '🔩 Wire weight', Component: WireWeightCalc },
  { id: 'zinc', label: '🧪 Zinc for GI wire', Component: ZincCalc },
  { id: 'recovery', label: '♻️ Recovery & cost', Component: RecoveryCalc },
  { id: 'margin', label: '📈 Margin & rate', Component: MarginCalc }
];

export default function ToolsCalculators() {
  const [active, setActive] = useState('qty');
  const current = TOOLS.find((t) => t.id === active) || TOOLS[0];
  const Current = current.Component;

  return (
    <div className="hub-root">
      <section className="hub-card">
        <div className="hub-card-head">
          <h3>🧰 Tools &amp; calculators</h3>
        </div>
        <div className="tool-tabs" role="tablist">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === active}
              className={'tool-tab' + (t.id === active ? ' is-active' : '')}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Current />
      </section>
    </div>
  );
}
