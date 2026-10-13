/** http（同一Wi-Fiでの確認時）でも動くID生成 */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto && window.isSecureContext) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function fmtTime(sec: number): string {
  const s = Math.round(Math.abs(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${sec < 0 ? '−' : ''}${m}:${String(r).padStart(2, '0')}`;
}

export function fmtDiff(sec: number): string {
  if (Math.abs(sec) < 30) return '±0';
  return (sec > 0 ? '+' : '') + fmtTime(sec);
}

export function fmtMin(sec: number): string {
  const m = Math.round((sec / 60) * 10) / 10;
  return `${m}分`;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
