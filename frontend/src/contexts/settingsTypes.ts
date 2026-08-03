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
