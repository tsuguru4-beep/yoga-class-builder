import { useState } from 'react';
import { MAX_ASSESSMENTS, PHASE_MAP } from '../../constants';
import { CIRCLED } from '../../plan';
import type { ClassAssessment, ClassPlan } from '../../types';
import AssessmentDetail from '../AssessmentDetail';

interface Props {
  plan: ClassPlan;
  onEdit: (a: ClassAssessment) => void;
  onReplace: (a: ClassAssessment) => void;
  onRemove: (a: ClassAssessment) => void;
  onAdd: () => void;
}

/** エディタ最上部の「セルフ評価」セクション */
export default function AssessmentSection({ plan, onEdit, onReplace, onRemove, onAdd }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="assessments" className="phase-section">
      <div className="phase-head">
        <h2>セルフ評価（ビフォー／アフター）</h2>
        <span className="phase-time">{plan.assessments.length}項目</span>
      </div>
      {plan.assessments.length === 0 && (
        <p className="muted small" style={{ marginTop: 0 }}>
          まだ評価がありません。AIでおまかせ作成すると、目的に合う評価が2〜3項目選ばれます。
        </p>
      )}
      <div className="stack">
        {plan.assessments.map((a, i) => {
          const related = plan.items.filter((it) => it.linkedAssessmentIds.includes(a.id));
          const coreRelated = related.some((it) => it.phase === 'main' || it.phase === 'peak');
          const open = openId === a.id;
          return (
            <div key={a.id} className="card">
              <div onClick={() => setOpenId(open ? null : a.id)} style={{ cursor: 'pointer' }}>
                <div className="bold">
                  <span className="badge-num">{CIRCLED[i]}</span> {a.def.name}
                </div>
                <div className="meta">
                  <span>{a.def.position === 'standing' ? '立位' : '座位'}</span>
                  {a.def.sided && <span>左右比較</span>}
                  <span>効く項目 {related.length}</span>
                  {!coreRelated && <span className="tag warn">メイン・ピークに対応なし</span>}
                </div>
              </div>
              {open && (
                <>
                  <AssessmentDetail def={a.def} changeCues={a.changeCues} />
                  <div className="item-detail" style={{ padding: 0, borderTop: 'none' }}>
                    <dt>この評価の変化に効く項目</dt>
                    <dd>
                      {related.length === 0 ? (
                        <span className="muted">なし（編集から選べます）</span>
                      ) : (
                        related.map((it) => (
                          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="phase-dot" style={{ background: PHASE_MAP[it.phase].color }} />
                            {it.nameJa}
                          </div>
                        ))
                      )}
                    </dd>
                  </div>
                  <div className="item-actions">
                    <button className="btn small" onClick={() => onEdit(a)}>
                      編集
                    </button>
                    <button className="btn small" onClick={() => onReplace(a)}>
                      差し替え
                    </button>
                    <button className="btn small danger" onClick={() => onRemove(a)}>
                      外す
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {plan.assessments.length < MAX_ASSESSMENTS && (
        <button className="add-btn" onClick={onAdd}>
          ＋ 評価を追加
        </button>
      )}
    </section>
  );
}
