import { useState, useEffect } from 'react';
import './Festival.css';
import { getTitles, getLines, ROTATE_MS } from './festivals';

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

// Small dots that show which language is on screen
function LangDots({ items, index }) {
  if (items.length < 2) return null;
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', gap: 5, marginLeft: 8, verticalAlign: 'middle' }}>
      {items.map((x, i) => (
        <span
          key={x.lang}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#fff',
            opacity: i === index ? 0.95 : 0.35,
            transition: 'opacity 0.3s'
          }}
        />
      ))}
    </span>
  );
}

// Shows (1) a colourful strip at the top of the page all day and
//       (2) a greeting popup the first time the app is opened that day.
// The title and the quote change language one by one: Bengali → English.
export default function FestivalGreeting({ festival }) {
  const [open, setOpen] = useState(false);
  const [bannerHidden, setBannerHidden] = useState(false);
  const [langIdx, setLangIdx] = useState(0); // which language is showing
  const [visible, setVisible] = useState(true); // used for the fade in / out

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

  // Language rotation: fade out, switch language, fade in
  useEffect(() => {
    if (!id) return undefined;
    setLangIdx(0);
    setVisible(true);
    let swapTimer;
    const timer = setInterval(() => {
      setVisible(false);
      swapTimer = setTimeout(() => {
        setLangIdx((i) => i + 1);
        setVisible(true);
      }, 300);
    }, ROTATE_MS);
    return () => {
      clearInterval(timer);
      clearTimeout(swapTimer);
    };
  }, [id]);

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

  const titles = getTitles(festival); // Bengali, English
  const lines = getLines(festival);   // English, Bengali
  const title = titles[langIdx % titles.length];
  const line = lines[langIdx % lines.length];
  // Title and quote use the same position in the list, so index for dots follows the quote
  const dotIdx = langIdx % lines.length;

  const fade = {
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.3s ease'
  };

  return (
    <>
      {!bannerHidden && (
        <div className="fest-banner" style={vars} role="status">
          <span className="fest-banner-icon" aria-hidden="true">
            {festival.icon}
          </span>
          <div className="fest-banner-text">
            <b style={fade}>
              <span className={title.lang === 'bn' ? 'fest-bn' : undefined} lang={title.lang}>
                {title.text}
              </span>
              <LangDots items={titles} index={langIdx % titles.length} />
            </b>
            <small style={fade} lang={line.lang} className={line.lang === 'bn' ? 'fest-bn' : undefined}>
              {line.text}
            </small>
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
              <h2 className={title.lang === 'bn' ? 'fest-title fest-bn' : 'fest-title'} lang={title.lang} style={fade}>
                {title.text}
              </h2>
              <p className="fest-en" style={{ ...fade, minHeight: '1.4em' }}>
                {title.label}
                <LangDots items={titles} index={langIdx % titles.length} />
              </p>
            </div>
            <div className="fest-body">
              <p
                className={line.lang === 'bn' ? 'fest-line fest-bn' : 'fest-line'}
                lang={line.lang}
                style={{ ...fade, minHeight: '4.5em' }}
              >
                {line.text}
              </p>
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