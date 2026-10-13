import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LEVEL_LABEL, PURPOSES, STYLE_LABEL } from '../constants';
import { getClass, putClass } from '../db';
import { newPlan, retarget } from '../plan';
import type { ClassPlan, Level, Style } from '../types';
import { nowIso } from '../util';

const DURATION_PRESETS = [30, 45, 60, 75, 90];

/** クラスの基本設定（新規作成と編集の両方） */
export default function ClassForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id;
  const [plan, setPlan] = useState<ClassPlan | null>(() => (isNew ? newPlan() : null));
  const [customPurpose, setCustomPurpose] = useState('');
  const [durationText, setDurationText] = useState(isNew ? '60' : '');

  useEffect(() => {
    if (!id) return;
    void getClass(id).then((p) => {
      if (!p) return nav('/', { replace: true });
      setPlan(p);
      setDurationText(String(p.durationMin));
    });
  }, [id, nav]);

  if (!plan) return null;

  const set = <K extends keyof ClassPlan>(k: K, v: ClassPlan[K]) => setPlan({ ...plan, [k]: v });
  const togglePurpose = (p: string) =>
    set('purposes', plan.purposes.includes(p) ? plan.purposes.filter((x) => x !== p) : [...plan.purposes, p]);
  const addCustom = () => {
    const words = customPurpose
      .split(/[、,]/)
      .map((s) => s.trim())
      .filter((s) => s && !plan.purposes.includes(s));
    if (words.length) set('purposes', [...plan.purposes, ...words]);
    setCustomPurpose('');
  };
  const customPurposes = plan.purposes.filter((p) => !PURPOSES.includes(p));

  const duration = Number(durationText);
  const durationOk = Number.isFinite(duration) && duration >= 10 && duration <= 240;

  const save = async (next: 'ai' | 'manual' | 'back') => {
    if (!durationOk) return;
    const pending = customPurpose.trim() ? [...plan.purposes, customPurpose.trim()] : plan.purposes;
    const saved = retarget({
      ...plan,
      purposes: [...new Set(pending)],
      durationMin: Math.round(duration),
      title: plan.title.trim(),
      updatedAt: nowIso(),
    });
    await putClass(saved);
    if (next === 'back') nav(-1);
    else nav(`/class/${saved.id}`, { replace: true, state: { autoGenerate: next === 'ai' } });
  };

  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="戻る">
          ‹
        </button>
        <h1>{isNew ? '新しいクラス' : '基本設定'}</h1>
      </header>

      <div className="field">
        <label htmlFor="title">タイトル</label>
        <input
          id="title"
          className="input"
          value={plan.title}
          placeholder="例：腰すっきり 朝ヨガ"
          onChange={(e) => set('title', e.target.value)}
        />
      </div>

      <div className="field">
        <span className="label">種別</span>
        <div className="seg">
          {(Object.keys(STYLE_LABEL) as Style[]).map((s) => (
            <button key={s} className={plan.style === s ? 'on' : ''} onClick={() => set('style', s)}>
              {STYLE_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="label">目的（複数選択可）</span>
        <div className="chips">
          {PURPOSES.map((p) => (
            <button key={p} className={`chip ${plan.purposes.includes(p) ? 'on' : ''}`} onClick={() => togglePurpose(p)}>
              {p}
            </button>
          ))}
          {customPurposes.map((p) => (
            <button key={p} className="chip on" onClick={() => togglePurpose(p)}>
              {p} ✕
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            value={customPurpose}
            placeholder="自由入力（例：産後の骨盤ケア）"
            onChange={(e) => setCustomPurpose(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          />
          <button className="btn" onClick={addCustom} disabled={!customPurpose.trim()}>
            追加
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="dur">クラス時間（分）</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            id="dur"
            className="input"
            inputMode="numeric"
            style={{ maxWidth: 110, fontSize: 22, fontWeight: 700, textAlign: 'center' }}
            value={durationText}
            onChange={(e) => setDurationText(e.target.value.replace(/[^\d]/g, ''))}
          />
          <span>分</span>
        </div>
        <div className="chips">
          {DURATION_PRESETS.map((m) => (
            <button key={m} className={`chip ${duration === m ? 'on' : ''}`} onClick={() => setDurationText(String(m))}>
              {m}分
            </button>
          ))}
        </div>
        {!durationOk && <span className="hint" style={{ color: 'var(--danger)' }}>10〜240分で入力してください</span>}
      </div>

      <div className="field">
        <span className="label">レベル</span>
        <div className="seg">
          {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
            <button key={l} className={plan.level === l ? 'on' : ''} onClick={() => set('level', l)}>
              {LEVEL_LABEL[l]}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="note">対象者メモ</label>
        <textarea
          id="note"
          className="textarea"
          value={plan.audienceNote}
          placeholder="例：デスクワーク中心の方が多い。膝に不安がある人が1名。"
          onChange={(e) => set('audienceNote', e.target.value)}
        />
      </div>

      <div className="bottom-bar">
        <div className="inner">
          {isNew ? (
            <>
              <button className="btn" disabled={!durationOk} onClick={() => void save('manual')}>
                手動で作る
              </button>
              <button className="btn primary" disabled={!durationOk} onClick={() => void save('ai')}>
                AIでおまかせ作成
              </button>
            </>
          ) : (
            <button className="btn primary" disabled={!durationOk} onClick={() => void save('back')}>
              保存
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
