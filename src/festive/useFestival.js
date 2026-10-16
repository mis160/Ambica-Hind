import { useState, useEffect } from 'react';
import { getFestivalFor, findFestivalById, todayIST } from './festivals.js';

function compute() {
  // Preview any greeting by adding  ?festival=<id>  to the web address (see festivals.js for the ids)
  try {
    const id = new URLSearchParams(window.location.search).get('festival');
    if (id) {
      const preview = findFestivalById(id);
      if (preview) return { ...preview, preview: true };
    }
  } catch {
    /* ignore */
  }
  return getFestivalFor(todayIST());
}

// Returns today's festival (or null) and re-checks every minute, so it also changes at midnight.
export default function useFestival() {
  const [festival, setFestival] = useState(compute);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = compute();
      setFestival((prev) => {
        if (!prev && !next) return prev;
        if (prev && next && prev.id === next.id && prev.day === next.day) return prev;
        return next;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  return festival;
}
