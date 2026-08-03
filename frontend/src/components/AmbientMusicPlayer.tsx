import React, { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

const NORMAL_VOLUME = 0.14;
const DUCKED_VOLUME = 0.055;
const SPEECH_DUCKED_VOLUME = 0.03;
const FADE_DURATION_MS = 420;

const isRoomFlow = (pathname: string) => /^\/room\/[^/]+/.test(pathname);
const isDeepInvestigationFlow = (pathname: string) => /^\/room\/[^/]+\/(game|briefing|lobby)/.test(pathname);

const AmbientMusicPlayer: React.FC = () => {
  const { settings } = useSettings();
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const targetVolumeRef = useRef<number>(NORMAL_VOLUME);
  const fadeTimerRef = useRef<number | null>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const playAttemptRef = useRef<Promise<void> | null>(null);

  const clearTimers = useCallback(() => {
    if (fadeTimerRef.current) {
      window.cancelAnimationFrame(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    if (pauseTimerRef.current) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio('/audio/ultimo-vestigio.mp3');
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const fadeTo = useCallback((targetVolume: number) => {
    const audio = ensureAudio();
    targetVolumeRef.current = targetVolume;
    clearTimers();

    if (Math.abs(audio.volume - targetVolume) < 0.01) {
      audio.volume = targetVolume;
      if (targetVolume === 0 && !audio.paused) {
        audio.pause();
      }
      return;
    }

    const startVolume = audio.volume;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / FADE_DURATION_MS);
      audio.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress < 1) {
        fadeTimerRef.current = window.requestAnimationFrame(tick);
        return;
      }

      fadeTimerRef.current = null;
      if (targetVolume === 0 && !audio.paused) {
        pauseTimerRef.current = window.setTimeout(() => {
          audio.pause();
          pauseTimerRef.current = null;
        }, 40);
      }
    };

    fadeTimerRef.current = window.requestAnimationFrame(tick);
  }, [clearTimers, ensureAudio]);

  const calculateRouteVolume = useCallback(() => {
    if (isDeepInvestigationFlow(location.pathname)) return DUCKED_VOLUME;
    if (isRoomFlow(location.pathname)) return DUCKED_VOLUME + 0.01;
    return NORMAL_VOLUME;
  }, [location.pathname]);

  const tryPlay = useCallback(async () => {
    const audio = ensureAudio();
    if (!settings.music) return;

    try {
      if (audio.paused) {
        const attempt = audio.play();
        playAttemptRef.current = attempt;
        await attempt;
      }
      fadeTo(calculateRouteVolume());
    } catch {
      // Autoplay pode ser bloqueado até a primeira interação do usuário.
    } finally {
      if (playAttemptRef.current) {
        playAttemptRef.current = null;
      }
    }
  }, [calculateRouteVolume, ensureAudio, fadeTo, settings.music]);

  useEffect(() => {
    if (!settings.music) {
      fadeTo(0);
      return;
    }

    void tryPlay();
    return () => {
      clearTimers();
    };
  }, [clearTimers, ensureAudio, fadeTo, settings.music, tryPlay]);

  useEffect(() => {
    if (!settings.music) return;
    fadeTo(calculateRouteVolume());
  }, [calculateRouteVolume, fadeTo, settings.music]);

  useEffect(() => {
    const resumeOnGesture = () => {
      if (!settings.music) return;
      void tryPlay();
    };

    const resumeOnVisible = () => {
      if (!settings.music || document.visibilityState !== 'visible') return;
      void tryPlay();
    };

    document.addEventListener('pointerdown', resumeOnGesture, { passive: true });
    document.addEventListener('touchstart', resumeOnGesture, { passive: true });
    document.addEventListener('keydown', resumeOnGesture);
    document.addEventListener('visibilitychange', resumeOnVisible);
    window.addEventListener('focus', resumeOnVisible);

    return () => {
      document.removeEventListener('pointerdown', resumeOnGesture);
      document.removeEventListener('touchstart', resumeOnGesture);
      document.removeEventListener('keydown', resumeOnGesture);
      document.removeEventListener('visibilitychange', resumeOnVisible);
      window.removeEventListener('focus', resumeOnVisible);
    };
  }, [settings.music, tryPlay]);

  useEffect(() => {
    const audio = ensureAudio();
    audio.muted = !settings.music;
    return () => {
      clearTimers();
    };
  }, [clearTimers, ensureAudio, settings.music]);

  useEffect(() => {
    const onSpeechStart = () => {
      if (!settings.music) return;
      fadeTo(Math.min(targetVolumeRef.current, SPEECH_DUCKED_VOLUME));
    };

    const onSpeechEnd = () => {
      if (!settings.music) return;
      fadeTo(calculateRouteVolume());
    };

    window.addEventListener('ultimo-vestigio:master-speech-start', onSpeechStart);
    window.addEventListener('ultimo-vestigio:master-speech-end', onSpeechEnd);

    return () => {
      window.removeEventListener('ultimo-vestigio:master-speech-start', onSpeechStart);
      window.removeEventListener('ultimo-vestigio:master-speech-end', onSpeechEnd);
    };
  }, [calculateRouteVolume, fadeTo, settings.music]);

  return null;
};

export default AmbientMusicPlayer;
