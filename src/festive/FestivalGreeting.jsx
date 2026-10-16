import { useState, useEffect } from 'react';
import './Festival.css';

const seenKey = (f) => `festivalSeen:${f.id}:${f.day}`;

// Floating emojis in the popup. Positions are fixed numbers, so nothing jumps on re-draw.
function Particles({ list }) {
  const items = Array.from({ length: 16 }, (_, i) => ({
    left: (i * 37 + 8) % 100,
    delay: (i * 0.7) % 6,
    duration: 7 + (i % 5),
    size: 16 + (i % 4) * 6,
    char: list[i % list.length]
  }));
  return (
    <div className="fest-particles" aria-hidden="true">
      {items.map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left + '%',
            fontSize: p.size + 'px',
            animationDelay: p.delay + 's',
            animationDuration: p.duration + 's'
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
}

// Shows (1) a colourful strip at the top of the page all day and
//       (2) a greeting popup the first time the app is opened that day.
export default function FestivalGreeting({ festival }) {
  const [open, setOpen] = useState(false);
  const [bannerHidden, setBannerHidden] = useState(false);

  const id = festival ? festival.id : '';
  const day = festival ? festival.day : '';
  const preview = festival ? festival.preview : false;

  useEffect(() => {
    if (!id) {
      setOpen(false);
      return;
    }
    setBannerHidden(false);
    if (preview) {
      setOpen(true);
      return;
    }
    let seen = false;
    try {
      seen = localStorage.getItem(`festivalSeen:${id}:${day}`) === '1';
    } catch {
      /* ignore */
    }
    setOpen(!seen);
  }, [id, day, preview]);

  const close = () => {
    setOpen(false);
    if (festival && !festival.preview) {
      try {
        localStorage.setItem(seenKey(festival), '1');
      } catch {
        /* ignore */
      }
    }
  };

  // Esc key closes the popup
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!festival) return null;

  const vars = { '--c1': festival.colors[0], '--c2': festival.colors[1], '--c3': festival.colors[2] };

  return (
    <>
      {!bannerHidden && (
        <div className="fest-banner" style={vars} role="status">
          <span className="fest-banner-icon" aria-hidden="true">
            {festival.icon}
          </span>
          <div className="fest-banner-text">
            <b>
              <span className="fest-bn">{festival.bn}</span> · {festival.en}
            </b>
            <small>{festival.line}</small>
          </div>
          <button type="button" className="fest-banner-close" aria-label="Hide greeting" onClick={() => setBannerHidden(true)}>
            ×
          </button>
        </div>
      )}

      {open && (
        <div className="fest-overlay" role="dialog" aria-modal="true" aria-label={festival.en} onClick={close}>
          <div className="fest-card" style={vars} onClick={(e) => e.stopPropagation()}>
            <div className="fest-hero">
              <Particles list={festival.particles || ['✨']} />
              <div className="fest-icon" aria-hidden="true">
                {festival.icon}
              </div>
              <h2 className="fest-title fest-bn">{festival.bn}</h2>
              <p className="fest-en">{festival.en}</p>
            </div>
            <div className="fest-body">
              <p className="fest-line">{festival.line}</p>
              {festival.lineBn && <p className="fest-line fest-bn">{festival.lineBn}</p>}
              <p className="fest-sign">With warm wishes from Team Ambica-Hind</p>
              <button type="button" className="fest-btn" onClick={close} autoFocus>
                Thank you 🙏
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
