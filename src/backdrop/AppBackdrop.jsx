import { useState, useEffect } from 'react';
import './Backdrop.css';

// All photos in src/assets/photos are picked up automatically.
const photoModules = import.meta.glob('../assets/photos/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true });
const PHOTOS = Object.values(photoModules).map((m) => m.default);

// Neutral shading only (black, no colour). Higher number = darker edges.
// Set all three to 0 for completely plain pictures.
const SHADE_TOP = 0.28;
const SHADE_MIDDLE = 0.08;
const SHADE_BOTTOM = 0.34;

const SHADE = `linear-gradient(180deg, rgba(0, 0, 0, ${SHADE_TOP}) 0%, rgba(0, 0, 0, ${SHADE_MIDDLE}) 45%, rgba(0, 0, 0, ${SHADE_BOTTOM}) 100%)`;

export default function AppBackdrop() {
  const count = PHOTOS.length;
  const [index, setIndex] = useState(() => (count ? Math.floor(Math.random() * count) : 0));

  // Next photo every 8 seconds
  useEffect(() => {
    if (count < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 8000);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

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
      <div className="bd-tint" style={{ background: SHADE }} />
    </div>
  );
}