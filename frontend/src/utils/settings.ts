export type ThemeMode = 'light' | 'dark';
export type DensityMode = 'comfortable' | 'compact';

export const SETTINGS_KEY = 'tarazu_settings';

export interface AppSettings {
  theme: ThemeMode;
  density: DensityMode;
  defaultPage: string;
  defaultCurrency: 'INR';
  riskAlerts: boolean;
  complianceAlerts: boolean;
  recommendationAlerts: boolean;
  userName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  density: 'comfortable',
  defaultPage: 'dashboard',
  defaultCurrency: 'INR',
  riskAlerts: true,
  complianceAlerts: true,
  recommendationAlerts: true,
  userName: '',
};

export const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (s: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
};
