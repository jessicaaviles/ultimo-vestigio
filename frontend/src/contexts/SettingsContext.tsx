import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type SettingsState = {
  language: string;
  theme: string;
  textSize: string;
  accessibility: string;
  music: boolean;
  effects: boolean;
  voices: boolean;
  push: boolean;
  invites: boolean;
  updates: boolean;
  weekly: boolean;
};

type SettingsContextValue = {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetSettings: () => void;
};

export const SETTINGS_STORAGE_KEY = 'uv_settings';

export const defaultSettings: SettingsState = {
  language: 'Português (Brasil)',
  theme: 'Escuro',
  textSize: 'Médio',
  accessibility: 'Padrão',
  music: true,
  effects: true,
  voices: true,
  push: true,
  invites: true,
  updates: true,
  weekly: false,
};

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

const normalizeDataValue = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const applySettingsToDocument = (settings: SettingsState) => {
  const root = document.documentElement;
  root.dataset.theme = settings.theme === 'Alto contraste' ? 'alto-contraste' : 'escuro';
  root.dataset.textSize = normalizeDataValue(settings.textSize);
  root.dataset.accessibility = normalizeDataValue(settings.accessibility);
  root.lang = settings.language === 'English' ? 'en' : 'pt-BR';
  root.dataset.audioMusic = settings.music ? 'on' : 'off';
  root.dataset.audioEffects = settings.effects ? 'on' : 'off';
  root.dataset.audioVoices = settings.voices ? 'on' : 'off';
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
    setSettings((current) => ({ ...current, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const value = useMemo(() => ({ settings, updateSetting, resetSettings }), [settings, updateSetting, resetSettings]);

  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
};

export const useSettings = () => useContext(SettingsCtx);
