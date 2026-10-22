import { useState, useEffect } from 'react';
import './Hub.css';
import { fetchHub, hubConnected, isSafeUrl } from './hubApi.js';

// "Zinc Oxide (ZNO)" -> "ZNO",  "Wire Plant (WD)" -> "WD",  "Galvanizing (GI)" -> "GI"
const unitTag = (unit) => {
  const m = /\(([^)]+)\)/.exec(unit || '');
  return m ? m[1].trim().toUpperCase() : '';
};

// Forms and links for the unit picked in the Production tab.
// They come from the Links tab of the Hub sheet (Category = ZNO, WD, GI, or Production for all three).
export default function ProductionLinks({ unit }) {
  const connected = hubConnected();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(connected);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!connected) return undefined;
    let alive = true;
    const load = async () => {
      try {
        const data = await fetchHub();
        if (alive) {
          setLinks(data.links);
          setError('');
        }
      } catch (err) {
        if (alive) setError('Could not load the forms list (' + (err && err.message ? err.message : err) + ').');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, 300000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [connected]);

  if (!connected) return null;

  const tag = unitTag(unit);
  const mine = links
    .filter((l) => isSafeUrl(l.url))
    .filter((l) => {
      const c = String(l.category || '').trim().toUpperCase();
      return c === tag || c === 'PRODUCTION';
    });

  return (
    <section className="hub-card" style={{ borderTop: '5px solid #ea580c', marginBottom: '20px', textAlign: 'left' }}>
      <div className="hub-card-head">
        <h3>📝 Forms &amp; links — {unit}</h3>
      </div>

      {error && <div className="hub-alert">{error}</div>}

      {loading && !mine.length ? (
        <p className="hub-empty">Loading forms…</p>
      ) : mine.length ? (
        <div className="hub-links">
          {mine.map((l, i) => (
            <a key={l.title + i} className="hub-link" href={l.url} target="_blank" rel="noopener noreferrer">
              <span className="hub-link-icon">{l.icon || '📝'}</span>
              <span>
                <b>{l.title}</b>
                <small>{String(l.category).toUpperCase() === 'PRODUCTION' ? 'All units' : l.category}</small>
              </span>
            </a>
          ))}
        </div>
      ) : (
        <p className="hub-empty">
          No forms added for {tag || 'this unit'} yet. Add a row in the <b>Links</b> tab of the Hub sheet with Category <b>{tag || 'Production'}</b>.
        </p>
      )}
    </section>
  );
}
