import type { Level, Movement, Phase, Style } from './types';

export interface PhaseInfo {
  key: Phase;
  label: string;
  short: string;
  color: string;
  ratio: number;
  desc: string;
}

export const PHASES: PhaseInfo[] = [
  { key: 'intro', label: '導入', short: '導入', color: '#7E9CB8', ratio: 0.10, desc: 'センタリング・呼吸に意識を向ける＋ビフォー評価' },
  { key: 'warmup', label: 'ウォームアップ', short: 'WU', color: '#D9A44E', ratio: 0.15, desc: '関節を動かし、体温を上げる' },
  { key: 'main', label: 'メイン', short: 'メイン', color: '#5F8466', ratio: 0.33, desc: '目的に直結する可動性・安定性・筋力' },
  { key: 'peak', label: 'ピーク', short: 'ピーク', color: '#CF6B4E', ratio: 0.14, desc: '全身を使い、少し頑張る山場' },
  { key: 'cooldown', label: 'クールダウン', short: 'CD', color: '#9184BC', ratio: 0.12, desc: '心拍を落とし、使った部位を緩める' },
  { key: 'relax', label: 'リラクゼーション', short: 'リラク', color: '#6FA19C', ratio: 0.10, desc: 'シャヴァーサナ等で余韻を味わう' },
  { key: 'closing', label: 'クロージング', short: 'クロ', color: '#B0946C', ratio: 0.06, desc: 'アフター評価・変化を言葉にする' },
];

export const PHASE_MAP = Object.fromEntries(PHASES.map((p) => [p.key, p])) as Record<Phase, PhaseInfo>;
export const PHASE_ORDER: Phase[] = PHASES.map((p) => p.key);
/** AIや手動で項目を置けるフェーズ（クロージングは評価のみ） */
export const ITEM_PHASES: Phase[] = PHASE_ORDER.filter((p) => p !== 'closing');

export const PURPOSES = [
  '腰痛予防', '肩こり解消', '姿勢改善', '股関節の柔軟性',
  '体幹強化', 'リラックス・睡眠の質', 'むくみ・冷え', '全身リフレッシュ',
];

export const STYLE_LABEL: Record<Style, string> = { yoga: 'ヨガ', pilates: 'ピラティス', mix: 'ミックス' };
export const LEVEL_LABEL: Record<Level, string> = { beginner: '初心者', general: '一般', experienced: '経験者' };

export const MOVEMENT_LABEL: Record<Movement, string> = {
  forward: '前屈', backward: '後屈', lateral: '側屈', twist: 'ねじり',
  balance: 'バランス', core: '体幹', strength: '筋力', breath: '呼吸', rest: '休息',
};
export const MOVEMENTS = Object.keys(MOVEMENT_LABEL) as Movement[];

/** 評価1項目あたりの時間 */
export const ASSESSMENT_SEC = 60;
/** アフター評価後に変化を言葉にする時間 */
export const AFTER_TALK_SEC = 60;
/** 1クラスで使う評価の上限 */
export const MAX_ASSESSMENTS = 3;

export const DEFAULT_MODEL = 'claude-sonnet-5-5';
export const MODEL_SUGGESTIONS = ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'];
