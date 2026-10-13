import { AFTER_TALK_SEC, ASSESSMENT_SEC, PHASES } from './constants';
import type { ClassPlan, Phase, PhaseTarget } from './types';

export const beforeAssessmentSec = (n: number) => n * ASSESSMENT_SEC;
export const afterAssessmentSec = (n: number) => (n > 0 ? n * ASSESSMENT_SEC + AFTER_TALK_SEC : 0);

/** 導入・クロージングの最低時間（評価の数×1分＋1分） */
function minSec(phase: Phase, nAssess: number): number {
  if (phase === 'intro') return Math.max(120, beforeAssessmentSec(nAssess) + 60);
  if (phase === 'closing') return nAssess > 0 ? afterAssessmentSec(nAssess) : 60;
  return 60;
}

/**
 * クラス時間を比率で按分する（1分単位）。
 * 手動で固定したフェーズはそのまま残し、残りを他のフェーズで分け直す。端数はメインで吸収。
 */
export function computeTargets(
  durationMin: number,
  nAssess: number,
  prev?: Record<Phase, PhaseTarget>,
): Record<Phase, PhaseTarget> {
  const total = Math.max(1, Math.round(durationMin)) * 60;
  const result = {} as Record<Phase, PhaseTarget>;
  const locked = PHASES.filter((p) => prev?.[p.key]?.locked);
  const free = PHASES.filter((p) => !prev?.[p.key]?.locked);
  let remain = total;
  for (const p of locked) {
    result[p.key] = { sec: prev![p.key].sec, locked: true };
    remain -= prev![p.key].sec;
  }
  const ratioSum = free.reduce((s, p) => s + p.ratio, 0) || 1;
  let used = 0;
  for (const p of free) {
    const sec = Math.max(minSec(p.key, nAssess), Math.round((remain * p.ratio) / ratioSum / 60) * 60);
    result[p.key] = { sec, locked: false };
    used += sec;
  }
  // 端数をメイン（固定されていればいちばん長い自由フェーズ）で調整
  const diff = remain - used;
  if (diff !== 0 && free.length > 0) {
    const sink =
      free.find((p) => p.key === 'main') ??
      free.reduce((a, b) => (result[a.key].sec >= result[b.key].sec ? a : b));
    result[sink.key].sec = Math.max(60, result[sink.key].sec + diff);
  }
  return result;
}

/** フェーズごとの実際の時間（評価の時間を含む） */
export function phaseActuals(plan: ClassPlan): Record<Phase, number> {
  const res = Object.fromEntries(PHASES.map((p) => [p.key, 0])) as Record<Phase, number>;
  for (const it of plan.items) res[it.phase] += it.durationSec;
  const n = plan.assessments.length;
  res.intro += beforeAssessmentSec(n);
  res.closing += afterAssessmentSec(n);
  return res;
}

export function totalSec(plan: ClassPlan): number {
  return Object.values(phaseActuals(plan)).reduce((a, b) => a + b, 0);
}

export function targetTotalSec(plan: ClassPlan): number {
  return plan.durationMin * 60;
}
