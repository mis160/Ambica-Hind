import { useState, useEffect } from 'react';
import './Backdrop.css';

// All photos in src/assets/photos are picked up automatically.
const photoModules = import.meta.glob('../assets/photos/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true });
const PHOTOS = Object.values(photoModules).map((m) => m.default);

// ===== ADJUST HERE =====
// Opacity of the colour wash (0 = no colour, 1 = solid colour).
// Left, middle, right of the diagonal gradient. Lower = clearer photos.
const FESTIVAL_STRENGTH = [0.32, 0.18, 0.1];
const DEFAULT_STRENGTH = [0.5, 0.3, 0.2];
// =======================

const hexToRgba = (hex, a) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const DEFAULT_COLORS = ['#080f28', '#1e3a8a', '#0d9488'];

const makeTint = (colors, s) =>
  `linear-gradient(135deg, ${hexToRgba(colors[0], s[0])} 0%, ${hexToRgba(colors[1], s[1])} 48%, ${hexToRgba(colors[2], s[2])} 100%)`;

export default function AppBackdrop({ festival }) {
  const count = PHOTOS.length;
  const [index, setIndex] = useState(() => (count ? Math.floor(Math.random() * count) : 0));

  // Next photo every 8 seconds
  useEffect(() => {
    if (count < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 8000);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  const c = festival && festival.colors;
  const tint =
    c && c.length >= 3
      ? makeTint(c, FESTIVAL_STRENGTH)
      : makeTint(DEFAULT_COLORS, DEFAULT_STRENGTH);

  // Only the current, previous and next photo are loaded (saves mobile data)
  const loaded = new Set([index, (index - 1 + count) % count, (index + 1) % count]);

  return (
    <div className="bd-wrap" aria-hidden="true">
      {PHOTOS.map((src, i) => (
        <img
          key={src}
          src={loaded.has(i) ? src : undefined}
          alt=""
          decoding="async"
          className={'bd-photo' + (i === index ? ' is-on' : '')}
        />
      ))}
      <div className="bd-tint" style={{ background: tint }} />
    </div>
  );
}