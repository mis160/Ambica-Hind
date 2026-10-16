import { useState, useEffect } from 'react';
import './Backdrop.css';

// All photos in src/assets are picked up automatically by team filename prefix.
const photoModules = import.meta.glob('../assets/team-*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true });
const PHOTOS = Object.values(photoModules).map((m) => m.default);

const hexToRgba = (hex, a) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// Default colour wash: deep navy, blue and teal. Kept consistent like the login page.
const DEFAULT_TINT =
  'linear-gradient(135deg, rgba(8, 15, 40, 0.90) 0%, rgba(30, 58, 138, 0.72) 42%, rgba(13, 148, 136, 0.62) 100%)';

export default function AppBackdrop({ festival }) {
  const count = PHOTOS.length;
  const [index, setIndex] = useState(() => (count ? Math.floor(Math.random() * count) : 0));

  // Next photo every 8 seconds
  useEffect(() => {
    if (count < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 8000);
    return () => clearInterval(timer);
  }, [count]);

  const tint = DEFAULT_TINT;

  // Only the current, previous and next photo are loaded, which saves mobile data
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