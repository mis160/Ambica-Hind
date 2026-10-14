import { useState, useEffect, useMemo } from 'react';
import './LoginScreen.css';

const BASE = import.meta.env.BASE_URL;

export default function LoginScreen({
  slides = [],
  timeStr,
  dateStr,
  emailInput,
  setEmailInput,
  password,
  setPassword,
  error,
  onSubmit
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [index, setIndex] = useState(0);

  // Photos: port-bg first, then the Plant photos from src/assets, then plant-bg.
  // These two files live in the "public" folder.
  const allSlides = useMemo(
    () => [
      { url: `${BASE}port-bg.jpg` },
      ...slides,
      { url: `${BASE}plant-bg.png` }
    ],
    [slides]
  );

  // Change photo every 5 seconds
  useEffect(() => {
    if (allSlides.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % allSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [allSlides.length]);

  return (
    <div className="lg-page">
      {/* Background: company photos, slow zoom + crossfade */}
      <div className="lg-bg" aria-hidden="true">
        {allSlides.map((slide, i) => (
          <img
            key={i}
            src={slide.url}
            alt=""
            className={'lg-slide' + (i === index ? ' is-active' : '')}
          />
        ))}
      </div>
      <div className="lg-shade" aria-hidden="true" />

      <main className="lg-layout">
        <section className="lg-hero">
          <img className="lg-logo" src={`${BASE}logo.png`} alt="Ambica-Hind" />
          <h1>Production, despatch, sales and HR in one place.</h1>
          <p className="lg-sub">Enterprise Resource &amp; Operations Suite</p>

          <div className="lg-clock">
            <span className="lg-live-dot" aria-hidden="true" />
            <span className="lg-time">{timeStr || '--:--:--'}</span>
            <span className="lg-date">{dateStr}</span>
          </div>
        </section>

        <form className="lg-card" onSubmit={onSubmit}>
          <h2>Sign in</h2>
          <p className="lg-card-sub">Use your Ambica-Hind work email ID.</p>

          {error && (
            <p className="lg-error" role="alert">
              {error}
            </p>
          )}

          <label htmlFor="lg-email">Work email ID</label>
          <input
            id="lg-email"
            type="text"
            autoComplete="username"
            placeholder="e.g. hr@ambahind.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />

          <label htmlFor="lg-pass">Password</label>
          <div className="lg-pass-wrap">
            <input
              id="lg-pass"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="lg-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <button type="submit" className="lg-submit">
            Sign in
          </button>
        </form>
      </main>
    </div>
  );
}
