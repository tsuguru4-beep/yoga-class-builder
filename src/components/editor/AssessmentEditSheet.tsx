import { useState } from 'react';
import { PHASE_MAP } from '../../constants';
import { putAssessment } from '../../db';
import type { AssessmentDef, ClassAssessment, ClassPlan } from '../../types';
import AssessmentDefForm from '../AssessmentDefForm';
import Sheet from '../Sheet';

interface Props {
  plan: ClassPlan;
  initial: ClassAssessment;
  library: AssessmentDef[];
  onSave: (a: ClassAssessment, relatedItemIds: string[]) => void;
  onLibraryChanged: () => void;
  onClose: () => void;
}

/** クラス内のセルフ評価を編集（内容・アフターの声かけ・効く項目） */
export default function AssessmentEditSheet({ plan, initial, library, onSave, onLibraryChanged, onClose }: Props) {
  const [a, setA] = useState<ClassAssessment>(initial);
  const [related, setRelated] = useState<string[]>(
    plan.items.filter((it) => it.linkedAssessmentIds.includes(initial.id)).map((it) => it.id),
  );
  const [msg, setMsg] = useState('');
  const inLibrary = library.some((d) => d.id === a.def.id);

  const setCue = (k: keyof ClassAssessment['changeCues'], v: string) =>
    setA({ ...a, changeCues: { ...a.changeCues, [k]: v } });
  const toggle = (id: string) => setRelated((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  const saveToLibrary = async () => {
    if (inLibrary && !confirm('ライブラリの同じ評価をこの内容で上書きします。よろしいですか？')) return;
    await putAssessment({ ...a.def, name: a.def.name.trim() });
    setMsg(inLibrary ? 'ライブラリを更新しました' : 'ライブラリに追加しました');
    onLibraryChanged();
  };

  return (
    <Sheet
      title="セルフ評価を編集"
      onClose={onClose}
      footer={
        <button className="btn primary block" disabled={!a.def.name.trim()} onClick={() => onSave(a, related)}>
          保存
        </button>
      }
    >
      <AssessmentDefForm value={a.def} onChange={(def) => setA({ ...a, def })} />

      <div className="section-title" style={{ marginTop: 4 }}>アフターで変化を伝える声かけ</div>
      <div className="field">
        <label>軽くなった・変化を感じた</label>
        <textarea className="textarea" value={a.changeCues.improved} onChange={(e) => setCue('improved', e.target.value)} />
      </div>
      <div className="field">
        <label>変化が小さかった</label>
        <textarea className="textarea" value={a.changeCues.subtle} onChange={(e) => setCue('subtle', e.target.value)} />
      </div>
      <div className="field">
        <label>かたくなった・違和感が出た</label>
        <textarea className="textarea" value={a.changeCues.harder} onChange={(e) => setCue('harder', e.target.value)} />
      </div>

      <div className="section-title">この評価の変化に効く項目</div>
      {plan.items.length === 0 && <p className="muted small">まだ項目がありません。</p>}
      {plan.items.map((it) => (
        <label key={it.id} className="check-row">
          <input type="checkbox" checked={related.includes(it.id)} onChange={() => toggle(it.id)} />
          <span className="phase-dot" style={{ background: PHASE_MAP[it.phase].color }} />
          <span>{it.nameJa}</span>
        </label>
      ))}

      <div className="spacer" />
      <button className="btn block" onClick={() => void saveToLibrary()} disabled={!a.def.name.trim()}>
        {inLibrary ? 'この内容をライブラリにも反映' : 'ライブラリに追加'}
      </button>
      {msg && <p className="small center" style={{ color: 'var(--ok)' }}>{msg}</p>}
    </Sheet>
  );
}
