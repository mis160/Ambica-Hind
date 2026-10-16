import { useState, useEffect, useCallback } from 'react';
import './Hub.css';
import { fetchHub, postHub, hubConnected, isSafeUrl } from './hubApi.js';

const NOTICE_CATEGORIES = ['General', 'Urgent', 'Holiday', 'Safety', 'Production', 'HR', 'Accounts', 'Sales'];
const NOTICE_EDITORS = ['Admin', 'HR']; // who sees the "Post a notice" button
const RATE_EDITORS = ['Admin', 'Accounts']; // who sees the "Update rates" button
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_MATERIALS = ['Zinc', 'Zinc Oxide', 'Lead (PB)', 'GI Wire', 'Wire Rod'];

// "2026-10-15" or "2026-10-15T10:42:00"  ->  "15 Oct 2026"
function fmtDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  if (!m) return s || '';
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}
function fmtDateTime(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || '');
  if (!m) return fmtDate(s);
  return `${fmtDate(s)}, ${m[4]}:${m[5]}`;
}
const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const fmtRate = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
};

function buildRateRows(rates) {
  if (rates && rates.length) {
    return rates.map((r) => ({ material: r.material, rate: String(r.rate), unit: r.unit || '₹/KG' }));
  }
  return DEFAULT_MATERIALS.map((m) => ({ material: m, rate: '', unit: '₹/KG' }));
}

export default function HubHome({ userRole, userEmail }) {
  const connected = hubConnected();
  const canPostNotice = NOTICE_EDITORS.includes(userRole);
  const canEditRates = RATE_EDITORS.includes(userRole);

  const [data, setData] = useState({ notices: [], rates: [], links: [] });
  const [loading, setLoading] = useState(connected);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  // Editor passcode is only kept for this browser tab, never in the app code
  const [passcode, setPasscode] = useState(() => {
    try {
      return sessionStorage.getItem('hubPasscode') || '';
    } catch {
      return '';
    }
  });
  const rememberPasscode = (code) => {
    try {
      sessionStorage.setItem('hubPasscode', code);
    } catch {
      /* ignore */
    }
  };

  // Notice form
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [nTitle, setNTitle] = useState('');
  const [nMessage, setNMessage] = useState('');
  const [nCategory, setNCategory] = useState('General');
  const [nPinned, setNPinned] = useState(false);
  const [nExpires, setNExpires] = useState('');
  const [nBusy, setNBusy] = useState(false);
  const [nError, setNError] = useState('');

  // Rate form
  const [showRateForm, setShowRateForm] = useState(false);
  const [rateRows, setRateRows] = useState([]);
  const [rBusy, setRBusy] = useState(false);
  const [rError, setRError] = useState('');

  const load = useCallback(
    async (silent) => {
      if (!connected) return;
      if (!silent) setLoading(true);
      try {
        const d = await fetchHub();
        setData(d);
        setError('');
        setUpdatedAt(
          new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date())
        );
      } catch (err) {
        setError('Could not load the latest notices and rates (' + (err && err.message ? err.message : err) + ').');
      } finally {
        setLoading(false);
      }
    },
    [connected]
  );

  // Load now, then refresh every minute while the page is open
  useEffect(() => {
    if (!connected) return undefined;
    load(false);
    const timer = setInterval(() => {
      if (!document.hidden) load(true);
    }, 60000);
    return () => clearInterval(timer);
  }, [connected, load]);

  const submitNotice = async (e) => {
    e.preventDefault();
    setNError('');
    if (!nTitle.trim()) {
      setNError('Please enter a title.');
      return;
    }
    if (!passcode) {
      setNError('Please enter the editor passcode.');
      return;
    }
    setNBusy(true);
    try {
      await postHub({
        action: 'addNotice',
        passcode,
        title: nTitle.trim(),
        message: nMessage.trim(),
        category: nCategory,
        pinned: nPinned,
        expiresOn: nExpires,
        postedBy: userEmail
      });
      rememberPasscode(passcode);
      setNTitle('');
      setNMessage('');
      setNCategory('General');
      setNPinned(false);
      setNExpires('');
      setShowNoticeForm(false);
      await load(true);
    } catch (err) {
      setNError(err && err.message ? err.message : 'Could not post the notice.');
    } finally {
      setNBusy(false);
    }
  };

  const removeNotice = async (id) => {
    if (!window.confirm('Remove this notice from the board?')) return;
    let code = passcode;
    if (!code) {
      code = window.prompt('Enter the editor passcode') || '';
      if (!code) return;
    }
    try {
      await postHub({ action: 'deleteNotice', passcode: code, id });
      setPasscode(code);
      rememberPasscode(code);
      await load(true);
    } catch (err) {
      window.alert(err && err.message ? err.message : 'Could not remove the notice.');
    }
  };

  const openRateForm = () => {
    setRateRows(buildRateRows(data.rates));
    setRError('');
    setShowRateForm(true);
  };
  const updateRateRow = (i, field, value) => {
    setRateRows((rows) => rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  };
  const addRateRow = () => setRateRows((rows) => [...rows, { material: '', rate: '', unit: '₹/KG' }]);
  const removeRateRow = (i) => setRateRows((rows) => rows.filter((_, idx) => idx !== i));

  const submitRates = async (e) => {
    e.preventDefault();
    setRError('');
    const filled = rateRows.filter((r) => r.material.trim() && String(r.rate).trim() !== '');
    if (!filled.length) {
      setRError('Please enter at least one rate.');
      return;
    }
    for (const r of filled) {
      const v = Number(r.rate);
      if (!Number.isFinite(v) || v <= 0) {
        setRError('Please check the rate for "' + r.material.trim() + '".');
        return;
      }
    }
    if (!passcode) {
      setRError('Please enter the editor passcode.');
      return;
    }
    setRBusy(true);
    try {
      await postHub({
        action: 'saveRates',
        passcode,
        date: todayIST(),
        updatedBy: userEmail,
        rates: filled.map((r) => ({ material: r.material.trim(), rate: Number(r.rate), unit: r.unit.trim() || '₹/KG' }))
      });
      rememberPasscode(passcode);
      setShowRateForm(false);
      await load(true);
    } catch (err) {
      setRError(err && err.message ? err.message : 'Could not save the rates.');
    } finally {
      setRBusy(false);
    }
  };

  // ---------- not connected yet ----------
  if (!connected) {
    return (
      <div className="hub-root">
        <section className="hub-card">
          <div className="hub-card-head">
            <h3>🏠 Home</h3>
          </div>
          <p className="hub-empty">
            The notice board, daily rates and quick links are not connected yet. Your administrator needs to paste the
            Hub web app URL into <code>src/hub/hubConfig.js</code>. The Tools page works already.
          </p>
        </section>
      </div>
    );
  }

  const latestRateDate = data.rates.reduce((best, r) => (r.date && r.date > best ? r.date : best), '');
  const links = data.links.filter((l) => isSafeUrl(l.url));

  return (
    <div className="hub-root">
      <div className="hub-toolbar">
        <h2>🏠 Home</h2>
        <div className="hub-toolbar-right">
          {updatedAt && <span className="hub-updated">Updated {updatedAt}</span>}
          <button type="button" className="hub-btn secondary" onClick={() => load(false)} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="hub-alert">{error}</div>}

      <div className="hub-grid">
        {/* ---------- NOTICE BOARD ---------- */}
        <section className="hub-card">
          <div className="hub-card-head">
            <h3>📢 Notice board</h3>
            {canPostNotice && (
              <button type="button" className="hub-btn" onClick={() => setShowNoticeForm((v) => !v)}>
                {showNoticeForm ? 'Close' : '+ Post a notice'}
              </button>
            )}
          </div>

          {showNoticeForm && canPostNotice && (
            <form className="hub-form" onSubmit={submitNotice}>
              <label>
                Title
                <input type="text" value={nTitle} maxLength={120} onChange={(e) => setNTitle(e.target.value)} placeholder="e.g. Plant shutdown on Sunday" />
              </label>
              <label>
                Message (optional)
                <textarea rows={3} value={nMessage} maxLength={1500} onChange={(e) => setNMessage(e.target.value)} placeholder="Details for everyone" />
              </label>
              <div className="hub-form-row">
                <label>
                  Category
                  <select value={nCategory} onChange={(e) => setNCategory(e.target.value)}>
                    {NOTICE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Hide after (optional)
                  <input type="date" value={nExpires} onChange={(e) => setNExpires(e.target.value)} />
                </label>
              </div>
              <label className="hub-check">
                <input type="checkbox" checked={nPinned} onChange={(e) => setNPinned(e.target.checked)} />
                Pin to the top
              </label>
              <label>
                Editor passcode
                <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} autoComplete="off" placeholder="Ask your administrator" />
              </label>
              {nError && <div className="hub-alert">{nError}</div>}
              <button type="submit" className="hub-btn" disabled={nBusy}>
                {nBusy ? 'Posting…' : 'Post notice'}
              </button>
            </form>
          )}

          {loading && !data.notices.length ? (
            <p className="hub-empty">Loading notices…</p>
          ) : data.notices.length ? (
            <ul className="hub-notices">
              {data.notices.map((n) => (
                <li key={n.id} className={'hub-notice' + (n.pinned ? ' is-pinned' : '') + (n.category === 'Urgent' ? ' is-urgent' : '')}>
                  <div className="hub-notice-head">
                    <span className="hub-pill">{n.category}</span>
                    {n.pinned && <span className="hub-pin">📌 Pinned</span>}
                    {canPostNotice && (
                      <button type="button" className="hub-link-btn" onClick={() => removeNotice(n.id)}>
                        Remove
                      </button>
                    )}
                  </div>
                  <h4>{n.title}</h4>
                  {n.message && <p>{n.message}</p>}
                  <div className="hub-meta">
                    {fmtDateTime(n.timestamp)}
                    {n.postedBy ? ' · ' + n.postedBy : ''}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hub-empty">No notices right now.</p>
          )}
        </section>

        {/* ---------- DAILY RATES ---------- */}
        <section className="hub-card">
          <div className="hub-card-head">
            <h3>💹 Daily rates</h3>
            {canEditRates && (
              <button type="button" className="hub-btn" onClick={() => (showRateForm ? setShowRateForm(false) : openRateForm())}>
                {showRateForm ? 'Close' : 'Update rates'}
              </button>
            )}
          </div>

          {showRateForm && canEditRates && (
            <form className="hub-form" onSubmit={submitRates}>
              <div className="hub-rate-rows">
                {rateRows.map((r, i) => (
                  <div className="hub-rate-row" key={i}>
                    <input type="text" value={r.material} onChange={(e) => updateRateRow(i, 'material', e.target.value)} placeholder="Material" aria-label="Material" />
                    <input type="number" inputMode="decimal" step="any" min="0" value={r.rate} onChange={(e) => updateRateRow(i, 'rate', e.target.value)} placeholder="Rate" aria-label="Rate" />
                    <input type="text" value={r.unit} onChange={(e) => updateRateRow(i, 'unit', e.target.value)} placeholder="Unit" aria-label="Unit" />
                    <button type="button" className="hub-link-btn" onClick={() => removeRateRow(i)} aria-label="Remove this row">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="hub-btn secondary" onClick={addRateRow}>
                + Add a material
              </button>
              <label>
                Editor passcode
                <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} autoComplete="off" placeholder="Ask your administrator" />
              </label>
              {rError && <div className="hub-alert">{rError}</div>}
              <button type="submit" className="hub-btn" disabled={rBusy}>
                {rBusy ? 'Saving…' : "Save today's rates"}
              </button>
            </form>
          )}

          {loading && !data.rates.length ? (
            <p className="hub-empty">Loading rates…</p>
          ) : data.rates.length ? (
            <>
              <div className="hub-table-wrap">
                <table className="hub-table">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th className="r">Rate</th>
                      <th className="r">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rates.map((r) => {
                      const hasPrev = r.prevRate !== null && r.prevRate !== undefined;
                      const delta = hasPrev ? Number(r.rate) - Number(r.prevRate) : 0;
                      let change = <span className="hub-flat">–</span>;
                      if (hasPrev && delta > 0) change = <span className="hub-up">▲ {fmtRate(delta)}</span>;
                      if (hasPrev && delta < 0) change = <span className="hub-down">▼ {fmtRate(Math.abs(delta))}</span>;
                      return (
                        <tr key={r.material}>
                          <td>{r.material}</td>
                          <td className="r">
                            <b>{fmtRate(r.rate)}</b> <small>{r.unit}</small>
                          </td>
                          <td className="r">{change}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="hub-meta">As of {fmtDate(latestRateDate)}</div>
            </>
          ) : (
            <p className="hub-empty">No rates have been entered yet.</p>
          )}
        </section>
      </div>

      {/* ---------- QUICK LINKS ---------- */}
      <section className="hub-card">
        <div className="hub-card-head">
          <h3>🔗 Quick links &amp; documents</h3>
        </div>
        {links.length ? (
          <div className="hub-links">
            {links.map((l, i) => (
              <a key={l.title + i} className="hub-link" href={l.url} target="_blank" rel="noopener noreferrer">
                <span className="hub-link-icon">{l.icon || '🔗'}</span>
                <span>
                  <b>{l.title}</b>
                  <small>{l.category}</small>
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="hub-empty">No links yet. Add them in the Links tab of the Hub sheet.</p>
        )}
      </section>
    </div>
  );
}
