import type { SettingsState } from './settingsTypes';

export type SettingsContextValue = {
  settings: SettingsState;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetSettings: () => void;
};
