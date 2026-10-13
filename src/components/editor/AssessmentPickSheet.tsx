import { useState } from 'react';
import { suggestAssessments, type AssessmentCandidate } from '../../ai/tasks';
import { classAssessmentFromDef } from '../../plan';
import type { AssessmentDef, ClassAssessment, ClassPlan } from '../../types';
import AiStatus from '../AiStatus';
import AssessmentDetail from '../AssessmentDetail';
import Sheet from '../Sheet';
import { useAiTask } from '../useAiTask';

interface Props {
  plan: ClassPlan;
  library: AssessmentDef[];
  /** 差し替える評価（追加のときは null） */
  replacing: ClassAssessment | null;
  /** relatedItemIds が null なら、差し替え前の対応づけを引き継ぐ */
  onPick: (a: ClassAssessment, relatedItemIds: string[] | null) => void;
  onClose: () => void;
}

/** 評価の追加・差し替え：ライブラリから選ぶか、AIの候補から選ぶ */
export default function AssessmentPickSheet({ plan, library, replacing, onPick, onClose }: Props) {
  const [tab, setTab] = useState<'library' | 'ai'>('library');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const task = useAiTask<AssessmentCandidate[]>();

  const usedNames = new Set(plan.assessments.filter((a) => a.id !== replacing?.id).map((a) => a.def.name));
  // クラスの目的に合うものを上に
  const score = (d: AssessmentDef) => d.purposeTags.filter((t) => plan.purposes.includes(t)).length;
  const sorted = [...library].sort((a, b) => score(b) - score(a));

  const askAi = () => void task.run((o) => suggestAssessments(plan, library, replacing?.id ?? null, o));

  return (
    <Sheet title={replacing ? `「${replacing.def.name}」を差し替え` : '評価を追加'} onClose={onClose}>
      <div className="tabs">
        <button className={tab === 'library' ? 'on' : ''} onClick={() => setTab('library')}>
          ライブラリから
        </button>
        <button
          className={tab === 'ai' ? 'on' : ''}
          onClick={() => {
            setTab('ai');
            if (task.status === 'idle') askAi();
          }}
        >
          AIの候補
        </button>
      </div>

      {tab === 'library' && (
        <div className="stack">
          {sorted.map((d) => {
            const used = usedNames.has(d.name);
            const open = openKey === d.id;
            return (
              <div key={d.id} className="card">
                <div onClick={() => setOpenKey(open ? null : d.id)} style={{ cursor: 'pointer' }}>
                  <div className="bold">
                    {d.name} {score(d) > 0 && <span className="tag">目的に合う</span>}
                  </div>
                  <div className="meta">
                    <span>{d.position === 'standing' ? '立位' : '座位'}</span>
                    {d.sided && <span>左右比較</span>}
                    <span>{d.purposeTags.join('・')}</span>
                  </div>
                </div>
                {open && <AssessmentDetail def={d} />}
                <div className="spacer" style={{ height: 10 }} />
                <button className="btn block" disabled={used} onClick={() => onPick(classAssessmentFromDef(d), null)}>
                  {used ? '使用中' : 'これを使う'}
                </button>
              </div>
            );
          })}
          <p className="muted small">ライブラリから選んだ場合、アフターの声かけは編集画面で入力できます（AIの候補から選ぶと自動で入ります）。</p>
        </div>
      )}

      {tab === 'ai' && (
        <>
          <AiStatus task={task} label="評価の候補を考えています" />
          {task.status === 'done' && task.result && (
            <div className="stack">
              {task.result.map((c) => {
                const open = openKey === c.assessment.id;
                const relatedNames = plan.items.filter((it) => c.relatedItemIds.includes(it.id)).map((it) => it.nameJa);
                return (
                  <div key={c.assessment.id} className="card">
                    <div onClick={() => setOpenKey(open ? null : c.assessment.id)} style={{ cursor: 'pointer' }}>
                      <div className="bold">
                        {c.assessment.def.name} {!library.some((d) => d.id === c.assessment.def.id) && <span className="tag">新しい評価</span>}
                      </div>
                      <div className="meta">
                        <span>{c.assessment.def.position === 'standing' ? '立位' : '座位'}</span>
                        {relatedNames.length > 0 && <span>効く項目：{relatedNames.join('、')}</span>}
                      </div>
                    </div>
                    {open && <AssessmentDetail def={c.assessment.def} changeCues={c.assessment.changeCues} />}
                    <div className="spacer" style={{ height: 10 }} />
                    <button className="btn primary block" onClick={() => onPick(c.assessment, c.relatedItemIds)}>
                      これを使う
                    </button>
                  </div>
                );
              })}
              <button className="btn ghost" onClick={askAi}>
                ほかの候補を出す
              </button>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
