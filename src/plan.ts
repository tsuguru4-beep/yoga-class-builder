import { computeTargets } from './allocation';
import { MAX_ASSESSMENTS, PHASE_ORDER } from './constants';
import type { AssessmentDef, ClassAssessment, ClassItem, ClassPlan, Phase } from './types';
import { nowIso, uid } from './util';

export function newPlan(): ClassPlan {
  const now = nowIso();
  return {
    id: uid(),
    title: '',
    style: 'yoga',
    purposes: [],
    durationMin: 60,
    level: 'general',
    audienceNote: '',
    phaseTargets: computeTargets(60, 2),
    assessments: [],
    items: [],
    sessions: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** 評価の数が未定のとき（AI生成前）の按分用 */
export function assessCountForTargets(plan: ClassPlan): number {
  return plan.assessments.length || Math.min(2, MAX_ASSESSMENTS);
}

export function retarget(plan: ClassPlan): ClassPlan {
  return { ...plan, phaseTargets: computeTargets(plan.durationMin, assessCountForTargets(plan), plan.phaseTargets) };
}

/** フェーズ順に並べ直す（同じフェーズ内の順序は保つ） */
export function sortItems(items: ClassItem[]): ClassItem[] {
  return items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => PHASE_ORDER.indexOf(a.it.phase) - PHASE_ORDER.indexOf(b.it.phase) || a.i - b.i)
    .map((x) => x.it);
}

export function itemsOfPhase(plan: ClassPlan, phase: Phase): ClassItem[] {
  return plan.items.filter((i) => i.phase === phase);
}

export function duplicatePlan(src: ClassPlan): ClassPlan {
  const now = nowIso();
  const idMap = new Map<string, string>();
  const assessments = src.assessments.map((a) => {
    const id = uid();
    idMap.set(a.id, id);
    return { ...a, id };
  });
  return {
    ...src,
    id: uid(),
    title: `${src.title}（コピー）`,
    assessments,
    items: src.items.map((it) => ({
      ...it,
      id: uid(),
      linkedAssessmentIds: it.linkedAssessmentIds.map((x) => idMap.get(x)).filter((x): x is string => !!x),
    })),
    sessions: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function blankItem(phase: Phase): ClassItem {
  return {
    id: uid(),
    phase,
    nameJa: '',
    nameEn: '',
    durationSec: 60,
    dosage: '',
    aim: '',
    cue: '',
    breath: '',
    modifications: { easy: '', standard: '', challenge: '' },
    caution: '',
    intensity: 2,
    movements: [],
    sided: false,
    linkedAssessmentIds: [],
    source: 'manual',
  };
}

export function blankAssessmentDef(): AssessmentDef {
  return {
    id: uid(),
    name: '',
    purposeTags: [],
    position: 'standing',
    sided: false,
    howToCue: '',
    focusPoints: '',
    stopCue: '',
    ratingLabels: ['かたい', 'ふつう', '軽い'],
    builtin: false,
  };
}

export function classAssessmentFromDef(def: AssessmentDef): ClassAssessment {
  return { id: uid(), def: { ...def }, changeCues: { improved: '', subtle: '', harder: '' } };
}

/** 評価を外したとき、項目側の対応づけも消す */
export function removeAssessment(plan: ClassPlan, assessmentId: string): ClassPlan {
  return retarget({
    ...plan,
    assessments: plan.assessments.filter((a) => a.id !== assessmentId),
    items: plan.items.map((it) => ({
      ...it,
      linkedAssessmentIds: it.linkedAssessmentIds.filter((x) => x !== assessmentId),
    })),
  });
}

export function assessmentNumber(plan: ClassPlan, assessmentId: string): number {
  return plan.assessments.findIndex((a) => a.id === assessmentId) + 1;
}

export const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥'];
