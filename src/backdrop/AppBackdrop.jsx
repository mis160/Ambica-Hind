import { useState, useEffect } from 'react';
import './Backdrop.css';

// All photos in src/assets/photos are picked up automatically.
// To add a photo: copy it into that folder. To remove one: delete it from the folder.
const photoModules = import.meta.glob('../assets/photos/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true });
const PHOTOS = Object.values(photoModules).map((m) => m.default);

const hexToRgba = (hex, a) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

// Default colour wash: deep navy, blue and teal. On a festival day it turns into the festival's colours.
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

  const tint = festival
    ? `linear-gradient(135deg, ${hexToRgba(festival.colors[0], 0.9)} 0%, ${hexToRgba(festival.colors[1], 0.72)} 48%, ${hexToRgba(festival.colors[2], 0.62)} 100%)`
    : DEFAULT_TINT;

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
