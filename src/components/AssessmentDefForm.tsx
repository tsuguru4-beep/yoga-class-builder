import { useState } from 'react';
import { PURPOSES } from '../constants';
import type { AssessmentDef } from '../types';

interface Props {
  value: AssessmentDef;
  onChange: (v: AssessmentDef) => void;
}

/** 評価項目の内容を編集するフォーム（ライブラリとクラスで共用） */
export default function AssessmentDefForm({ value: v, onChange }: Props) {
  const [tagText, setTagText] = useState('');
  const set = <K extends keyof AssessmentDef>(k: K, val: AssessmentDef[K]) => onChange({ ...v, [k]: val });
  const toggleTag = (t: string) =>
    set('purposeTags', v.purposeTags.includes(t) ? v.purposeTags.filter((x) => x !== t) : [...v.purposeTags, t]);
  const extraTags = v.purposeTags.filter((t) => !PURPOSES.includes(t));

  return (
    <>
      <div className="field">
        <label>名前</label>
        <input className="input" value={v.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="field">
        <span className="label">姿勢</span>
        <div className="seg">
          <button className={v.position === 'standing' ? 'on' : ''} onClick={() => set('position', 'standing')}>
            立位
          </button>
          <button className={v.position === 'sitting' ? 'on' : ''} onClick={() => set('position', 'sitting')}>
            座位
          </button>
        </div>
      </div>
      <label className="check-row">
        <input type="checkbox" checked={v.sided} onChange={(e) => set('sided', e.target.checked)} />
        <span>左右で比べる</span>
      </label>
      <div className="field">
        <label>やり方（読み上げ用）</label>
        <textarea className="textarea" value={v.howToCue} onChange={(e) => set('howToCue', e.target.value)} />
      </div>
      <div className="field">
        <label>感じてほしいポイント</label>
        <textarea className="textarea" value={v.focusPoints} onChange={(e) => set('focusPoints', e.target.value)} />
      </div>
      <div className="field">
        <label>痛みが出たときの声かけ</label>
        <textarea className="textarea" value={v.stopCue} onChange={(e) => set('stopCue', e.target.value)} />
      </div>
      <div className="field">
        <span className="label">感覚の3段階（悪い → 良い）</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {v.ratingLabels.map((l, i) => (
            <input
              key={i}
              className="input"
              value={l}
              onChange={(e) => {
                const next = [...v.ratingLabels] as AssessmentDef['ratingLabels'];
                next[i] = e.target.value;
                set('ratingLabels', next);
              }}
            />
          ))}
        </div>
      </div>
      <div className="field">
        <span className="label">目的タグ</span>
        <div className="chips">
          {[...PURPOSES, ...extraTags].map((t) => (
            <button key={t} className={`chip ${v.purposeTags.includes(t) ? 'on' : ''}`} onClick={() => toggleTag(t)}>
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" value={tagText} placeholder="タグを追加" onChange={(e) => setTagText(e.target.value)} />
          <button
            className="btn"
            disabled={!tagText.trim()}
            onClick={() => {
              if (!v.purposeTags.includes(tagText.trim())) set('purposeTags', [...v.purposeTags, tagText.trim()]);
              setTagText('');
            }}
          >
            追加
          </button>
        </div>
      </div>
    </>
  );
}
