export type Phase = 'intro' | 'warmup' | 'main' | 'peak' | 'cooldown' | 'relax' | 'closing';
export type Style = 'yoga' | 'pilates' | 'mix';
export type Level = 'beginner' | 'general' | 'experienced';
export type Movement =
  | 'forward' | 'backward' | 'lateral' | 'twist'
  | 'balance' | 'core' | 'strength' | 'breath' | 'rest';

export interface Modifications {
  easy: string;
  standard: string;
  challenge: string;
}

export interface ClassItem {
  id: string;
  phase: Phase;
  nameJa: string;
  nameEn: string;
  /** 合計時間の計算用（回数指定のものは目安の秒数） */
  durationSec: number;
  /** 表示用：「左右各5呼吸」「8回×2セット」など */
  dosage: string;
  aim: string;
  cue: string;
  breath: string;
  modifications: Modifications;
  caution: string;
  intensity: number; // 1〜5
  movements: Movement[];
  sided: boolean;
  /** この項目が変化に効くセルフ評価（ClassAssessment.id） */
  linkedAssessmentIds: string[];
  source: 'ai' | 'manual';
}

export interface AssessmentDef {
  id: string;
  name: string;
  purposeTags: string[];
  position: 'standing' | 'sitting';
  sided: boolean;
  howToCue: string;
  focusPoints: string;
  stopCue: string;
  ratingLabels: [string, string, string];
  builtin: boolean;
}

export interface ChangeCues {
  improved: string;
  subtle: string;
  harder: string;
}

/** クラスで使うセルフ評価（ライブラリの写しを持つ） */
export interface ClassAssessment {
  id: string;
  def: AssessmentDef;
  changeCues: ChangeCues;
}

export interface PhaseTarget {
  sec: number;
  locked: boolean;
}

export interface AssessmentRecord {
  assessmentName: string;
  timing: 'before' | 'after';
  tally: [number, number, number];
  asymmetry: number;
  participants?: { participantId: string; rating: 0 | 1 | 2; asymmetry: boolean }[];
}

export interface Session {
  id: string;
  date: string;
  reaction: string;
  nextTime: string;
  records: AssessmentRecord[];
}

export interface ClassPlan {
  id: string;
  title: string;
  style: Style;
  purposes: string[];
  durationMin: number;
  level: Level;
  audienceNote: string;
  phaseTargets: Record<Phase, PhaseTarget>;
  assessments: ClassAssessment[];
  items: ClassItem[];
  sessions: Session[];
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  apiKey: string;
  model: string;
}
