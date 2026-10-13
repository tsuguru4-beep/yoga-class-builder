import { DEFAULT_MODEL } from './constants';
import type { Settings } from './types';

const KEY = 'ycb-settings';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<Settings>;
      return { apiKey: s.apiKey ?? '', model: s.model || DEFAULT_MODEL };
    }
  } catch {
    /* 読めなければ初期値 */
  }
  return { apiKey: '', model: DEFAULT_MODEL };
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
