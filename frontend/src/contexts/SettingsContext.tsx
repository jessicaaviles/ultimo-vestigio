import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SettingsContextValue } from './settingsContextValue';
import type { SettingsState } from './settingsTypes';
import { SETTINGS_STORAGE_KEY, defaultSettings } from './settingsTypes';
import { applyDocumentLanguage } from '../utils/i18nDom';

const SettingsCtx = createContext<SettingsContextValue>({
  settings: defaultSettings,
  updateSetting: () => {},
  resetSettings: () => {},
});

const readStoredSettings = (): SettingsState => {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
    return {
      ...defaultSettings,
      ...stored,
      music: typeof stored.music === 'number' ? stored.music > 0 : stored.music ?? defaultSettings.music,
      effects: typeof stored.effects === 'number' ? stored.effects > 0 : stored.effects ?? defaultSettings.effects,
      voices: typeof stored.voices === 'number' ? stored.voices > 0 : stored.voices ?? defaultSettings.voices,
    };
  } catch {
    return defaultSettings;
  }
};

const applySettingsToDocument = (settings: SettingsState) => {
  const root = document.documentElement;
  root.dataset.theme = settings.theme === 'Alto contraste' ? 'alto-contraste' : 'escuro';
  root.lang = settings.language === 'English' ? 'en' : 'pt-BR';
  root.dataset.language = settings.language === 'English' ? 'en' : 'pt-br';
  root.dataset.audioMusic = settings.music ? 'on' : 'off';
  root.dataset.audioEffects = settings.effects ? 'on' : 'off';
  root.dataset.audioVoices = settings.voices ? 'on' : 'off';
  applyDocumentLanguage(settings.language);
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsState>(readStoredSettings);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage may be unavailable in private browsing modes.
    }
    applySettingsToDocument(settings);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((current: SettingsState) => ({ ...current, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = useMemo(() => ({ settings, updateSetting, resetSettings }), [settings, updateSetting, resetSettings]);

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
};

export const useSettings = () => useContext(SettingsCtx);
