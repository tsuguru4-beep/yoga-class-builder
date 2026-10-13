import { computeTargets } from '../allocation';
import { MAX_ASSESSMENTS, MOVEMENTS } from '../constants';
import { sortItems } from '../plan';
import type { AssessmentDef, ClassAssessment, ClassItem, ClassPlan } from '../types';
import { clamp, uid } from '../util';
import { callClaude } from './client';
import { alternativesPrompt, assessmentCandidatesPrompt, fullPlanPrompt } from './prompts';
import {
  AlternativesOutput,
  AssessmentCandidatesOutput,
  FullPlanOutput,
  type AssessmentDraft,
  type AssessmentPick,
  type ItemDraft,
} from './schemas';

type Progress = { signal?: AbortSignal; onProgress?: (chars: number) => void };

export function draftToItem(d: ItemDraft, assessmentIds: string[]): ClassItem {
  return {
    id: uid(),
    phase: d.phase,
    nameJa: d.nameJa,
    nameEn: d.nameEn,
    durationSec: clamp(Math.round(d.durationSec / 5) * 5, 10, 1800),
    dosage: d.dosage,
    aim: d.aim,
    cue: d.cue,
    breath: d.breath,
    modifications: { ...d.modifications },
    caution: d.caution,
    intensity: clamp(Math.round(d.intensity), 1, 5),
    movements: [...new Set(d.movements)].filter((m) => MOVEMENTS.includes(m)),
    sided: d.sided,
    linkedAssessmentIds: [...new Set(d.forAssessments)]
      .map((n) => assessmentIds[n - 1])
      .filter((x): x is string => !!x),
    source: 'ai',
  };
}

function draftToDef(d: AssessmentDraft): AssessmentDef {
  const labels = [...d.ratingLabels, 'かたい', 'ふつう', '軽い'].filter(Boolean);
  return {
    id: uid(),
    name: d.name,
    purposeTags: d.purposeTags,
    position: d.position,
    sided: d.sided,
    howToCue: d.howToCue,
    focusPoints: d.focusPoints,
    stopCue: d.stopCue,
    ratingLabels: d.ratingLabels.length >= 3
      ? [d.ratingLabels[0], d.ratingLabels[1], d.ratingLabels[2]]
      : [labels[0], labels[1], labels[2]],
    builtin: false,
  };
}

/** AIの評価指定をクラス用に変換（ライブラリにないidで内容もなければ捨てる） */
export function pickToAssessment(p: AssessmentPick, lib: AssessmentDef[]): ClassAssessment | null {
  const fromLib = p.libraryId ? lib.find((a) => a.id === p.libraryId) : undefined;
  const def = fromLib ? { ...fromLib } : p.custom ? draftToDef(p.custom) : null;
  if (!def) return null;
  return { id: uid(), def, changeCues: { ...p.changeCues } };
}

/** おまかせ生成：評価と全項目を作り直す */
export async function generateFullPlan(plan: ClassPlan, lib: AssessmentDef[], opts: Progress): Promise<ClassPlan> {
  // 評価の数が決まる前なので、上限の数で導入・クロージングの時間を確保して依頼する
  const asked = { ...plan, phaseTargets: computeTargets(plan.durationMin, MAX_ASSESSMENTS, plan.phaseTargets) };
  const out = await callClaude({ user: fullPlanPrompt(asked, lib), schema: FullPlanOutput, ...opts });

  const picks = out.assessments.slice(0, MAX_ASSESSMENTS).map((p) => pickToAssessment(p, lib));
  // 番号がずれないよう、捨てた評価の位置は空のまま対応表を作る
  const idsByNumber = picks.map((a) => a?.id ?? '');
  const assessments = picks.filter((a): a is ClassAssessment => !!a);
  const items = sortItems(out.items.map((d) => draftToItem(d, idsByNumber)));
  return {
    ...plan,
    assessments,
    items,
    phaseTargets: computeTargets(plan.durationMin, assessments.length, plan.phaseTargets),
  };
}

export async function suggestAlternatives(plan: ClassPlan, target: ClassItem, opts: Progress): Promise<ClassItem[]> {
  const out = await callClaude({ user: alternativesPrompt(plan, target), schema: AlternativesOutput, ...opts });
  const ids = plan.assessments.map((a) => a.id);
  return out.candidates.map((d) => ({ ...draftToItem(d, ids), phase: target.phase }));
}

export interface AssessmentCandidate {
  assessment: ClassAssessment;
  relatedItemIds: string[];
}

export async function suggestAssessments(
  plan: ClassPlan,
  lib: AssessmentDef[],
  replacingId: string | null,
  opts: Progress,
): Promise<AssessmentCandidate[]> {
  const out = await callClaude({
    user: assessmentCandidatesPrompt(plan, lib, replacingId),
    schema: AssessmentCandidatesOutput,
    ...opts,
  });
  const res: AssessmentCandidate[] = [];
  for (const c of out.candidates) {
    const assessment = pickToAssessment(c, lib);
    if (!assessment) continue;
    const relatedItemIds = [...new Set(c.relatedRefs)]
      .map((n) => plan.items[n - 1]?.id)
      .filter((x): x is string => !!x);
    res.push({ assessment, relatedItemIds });
  }
  return res;
}
