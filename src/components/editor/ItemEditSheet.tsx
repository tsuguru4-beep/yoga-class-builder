import { useState } from 'react';
import { ITEM_PHASES, MOVEMENT_LABEL, MOVEMENTS, PHASE_MAP } from '../../constants';
import { CIRCLED } from '../../plan';
import type { ClassItem, ClassPlan, Movement } from '../../types';
import Sheet from '../Sheet';

interface Props {
  plan: ClassPlan;
  initial: ClassItem;
  isNew: boolean;
  onSave: (item: ClassItem) => void;
  onClose: () => void;
}

/** 項目の内容を直接編集する */
export default function ItemEditSheet({ plan, initial, isNew, onSave, onClose }: Props) {
  const [it, setIt] = useState<ClassItem>(initial);
  const [min, setMin] = useState(String(Math.floor(initial.durationSec / 60)));
  const [sec, setSec] = useState(String(initial.durationSec % 60));
  const set = <K extends keyof ClassItem>(k: K, v: ClassItem[K]) => setIt({ ...it, [k]: v });
  const setMod = (k: keyof ClassItem['modifications'], v: string) =>
    setIt({ ...it, modifications: { ...it.modifications, [k]: v } });
  const toggleMove = (m: Movement) =>
    set('movements', it.movements.includes(m) ? it.movements.filter((x) => x !== m) : [...it.movements, m]);
  const toggleLink = (id: string) =>
    set(
      'linkedAssessmentIds',
      it.linkedAssessmentIds.includes(id) ? it.linkedAssessmentIds.filter((x) => x !== id) : [...it.linkedAssessmentIds, id],
    );

  const durationSec = (Number(min) || 0) * 60 + (Number(sec) || 0);
  const valid = it.nameJa.trim() !== '' && durationSec > 0;

  return (
    <Sheet
      title={isNew ? '項目を追加' : '項目を編集'}
      onClose={onClose}
      footer={
        <button
          className="btn primary block"
          disabled={!valid}
          onClick={() => onSave({ ...it, nameJa: it.nameJa.trim(), durationSec })}
        >
          {isNew ? '追加' : '保存'}
        </button>
      }
    >
      <div className="field">
        <label>フェーズ</label>
        <select className="select" value={it.phase} onChange={(e) => set('phase', e.target.value as ClassItem['phase'])}>
          {ITEM_PHASES.map((p) => (
            <option key={p} value={p}>
              {PHASE_MAP[p].label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>和名</label>
        <input className="input" value={it.nameJa} onChange={(e) => set('nameJa', e.target.value)} />
      </div>
      <div className="field">
        <label>英名・サンスクリット名</label>
        <input className="input" value={it.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
      </div>
      <div className="field">
        <span className="label">時間（合計の計算に使う目安）</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="input" inputMode="numeric" style={{ width: 80, textAlign: 'center' }} value={min}
            onChange={(e) => setMin(e.target.value.replace(/[^\d]/g, ''))} />
          <span>分</span>
          <input className="input" inputMode="numeric" style={{ width: 80, textAlign: 'center' }} value={sec}
            onChange={(e) => setSec(e.target.value.replace(/[^\d]/g, ''))} />
          <span>秒</span>
        </div>
      </div>
      <div className="field">
        <label>回数・呼吸数の表示</label>
        <input className="input" value={it.dosage} placeholder="例：左右各5呼吸" onChange={(e) => set('dosage', e.target.value)} />
      </div>
      <div className="field">
        <label>狙い</label>
        <textarea className="textarea" style={{ minHeight: 64 }} value={it.aim} onChange={(e) => set('aim', e.target.value)} />
      </div>
      <div className="field">
        <label>キュー（声かけ）</label>
        <textarea className="textarea" value={it.cue} onChange={(e) => set('cue', e.target.value)} />
      </div>
      <div className="field">
        <label>呼吸の指示</label>
        <textarea className="textarea" style={{ minHeight: 64 }} value={it.breath} onChange={(e) => set('breath', e.target.value)} />
      </div>
      <div className="field">
        <label>やさしく</label>
        <textarea className="textarea" style={{ minHeight: 64 }} value={it.modifications.easy} onChange={(e) => setMod('easy', e.target.value)} />
      </div>
      <div className="field">
        <label>標準</label>
        <textarea className="textarea" style={{ minHeight: 64 }} value={it.modifications.standard} onChange={(e) => setMod('standard', e.target.value)} />
      </div>
      <div className="field">
        <label>チャレンジ</label>
        <textarea className="textarea" style={{ minHeight: 64 }} value={it.modifications.challenge} onChange={(e) => setMod('challenge', e.target.value)} />
      </div>
      <div className="field">
        <label>注意点（空欄なら表示しない）</label>
        <input className="input" value={it.caution} onChange={(e) => set('caution', e.target.value)} />
      </div>
      <div className="field">
        <span className="label">強度</span>
        <div className="seg">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className={it.intensity === n ? 'on' : ''} onClick={() => set('intensity', n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="label">動きの分類</span>
        <div className="chips">
          {MOVEMENTS.map((m) => (
            <button key={m} className={`chip ${it.movements.includes(m) ? 'on' : ''}`} onClick={() => toggleMove(m)}>
              {MOVEMENT_LABEL[m]}
            </button>
          ))}
        </div>
      </div>
      <label className="check-row">
        <input type="checkbox" checked={it.sided} onChange={(e) => set('sided', e.target.checked)} />
        <span>左右を分けて行う</span>
      </label>
      {plan.assessments.length > 0 && (
        <div className="field">
          <span className="label">変化に効くセルフ評価</span>
          <div className="chips">
            {plan.assessments.map((a, i) => (
              <button
                key={a.id}
                className={`chip ${it.linkedAssessmentIds.includes(a.id) ? 'on' : ''}`}
                onClick={() => toggleLink(a.id)}
              >
                {CIRCLED[i]} {a.def.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}
