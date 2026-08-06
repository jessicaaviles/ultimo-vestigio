import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const STARTUP_SPLASH_MIN_VISIBLE_MS = 850;
const STARTUP_SPLASH_FADE_MS = 260;
const STARTUP_SPLASH_MAX_VISIBLE_MS = 3000;

const StartupSplash: React.FC = () => {
  const location = useLocation();
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(false);
  const mountedAtRef = useRef<number>(window.performance.now());
  const exitTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const isHomeRoute = useMemo(() => location.pathname === '/', [location.pathname]);

  const clearTimers = () => {
    if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    exitTimerRef.current = null;
    hideTimerRef.current = null;
  };

  const scheduleExit = (delayMs: number) => {
    clearTimers();
    exitTimerRef.current = window.setTimeout(() => setExiting(true), delayMs);
    hideTimerRef.current = window.setTimeout(() => setHidden(true), delayMs + STARTUP_SPLASH_FADE_MS);
  };

  useEffect(() => {
    const finishSplash = () => {
      const elapsed = window.performance.now() - mountedAtRef.current;
      scheduleExit(Math.max(0, STARTUP_SPLASH_MIN_VISIBLE_MS - elapsed));
    };

    const hardTimeout = window.setTimeout(() => {
      scheduleExit(0);
    }, STARTUP_SPLASH_MAX_VISIBLE_MS);

    window.addEventListener(
      isHomeRoute ? 'ultimo-vestigio:home-ready' : 'ultimo-vestigio:app-ready',
      finishSplash as EventListener,
    );
    scheduleExit(STARTUP_SPLASH_MIN_VISIBLE_MS);

    return () => {
      clearTimers();
      window.clearTimeout(hardTimeout);
      window.removeEventListener('ultimo-vestigio:home-ready', finishSplash as EventListener);
      window.removeEventListener('ultimo-vestigio:app-ready', finishSplash as EventListener);
    };
  }, [isHomeRoute]);

  if (hidden) return null;

  return (
    <div className={`startup-splash${exiting ? ' is-exiting' : ''}`} aria-label="Carregando Último Vestígio">
      <div className="startup-splash__backdrop" />
      <div className="startup-splash__content">
        <div className="startup-splash__logo-wrap">
          <img
            className="startup-splash__logo"
            src="/logo-sem-fundo.png"
            alt="Último Vestígio"
            draggable={false}
          />
        </div>

        <div className="startup-splash__pulse" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default StartupSplash;
