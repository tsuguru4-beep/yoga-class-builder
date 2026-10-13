import { useEffect, useState } from 'react';
import { suggestAlternatives } from '../../ai/tasks';
import { MOVEMENT_LABEL } from '../../constants';
import type { ClassItem, ClassPlan } from '../../types';
import { fmtTime } from '../../util';
import AiStatus from '../AiStatus';
import Sheet from '../Sheet';
import { useAiTask } from '../useAiTask';
import { intensityDots } from './ItemCard';

interface Props {
  plan: ClassPlan;
  target: ClassItem;
  onPick: (item: ClassItem) => void;
  onClose: () => void;
}

/** 「別の案を出して」：AIの差し替え候補から選ぶ */
export default function AlternativeSheet({ plan, target, onPick, onClose }: Props) {
  const task = useAiTask<ClassItem[]>();
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    void task.run((o) => suggestAlternatives(plan, target, o));
    // 開いたときに一度だけ実行する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Sheet title={`「${target.nameJa}」の別の案`} onClose={onClose}>
      <AiStatus task={task} label="候補を考えています" />
      {task.status === 'done' && task.result && (
        <div className="stack">
          {task.result.map((c, i) => (
            <div key={c.id} className="card">
              <div onClick={() => setOpen(open === i ? null : i)} style={{ cursor: 'pointer' }}>
                <div className="bold">{c.nameJa}</div>
                <div className="item-en">{c.nameEn}</div>
                <div className="item-sub">
                  <span>{c.dosage}</span>
                  <span className="muted small">{fmtTime(c.durationSec)}</span>
                  <span className="dots">{intensityDots(c.intensity)}</span>
                </div>
              </div>
              {open === i && (
                <dl className="item-detail" style={{ padding: 0, borderTop: 'none' }}>
                  <dt>狙い</dt>
                  <dd>{c.aim}</dd>
                  <dt>キュー</dt>
                  <dd className="cue">{c.cue}</dd>
                  <dt>呼吸</dt>
                  <dd>{c.breath}</dd>
                  <dt>難易度の調整</dt>
                  <dd className="mods">
                    <span className="k">やさしく</span>
                    <span>{c.modifications.easy}</span>
                    <span className="k">標準</span>
                    <span>{c.modifications.standard}</span>
                    <span className="k">チャレンジ</span>
                    <span>{c.modifications.challenge}</span>
                  </dd>
                  {c.caution && (
                    <>
                      <dt>注意点</dt>
                      <dd style={{ color: 'var(--warn)' }}>⚠ {c.caution}</dd>
                    </>
                  )}
                  <dt>動き</dt>
                  <dd>{c.movements.map((m) => MOVEMENT_LABEL[m]).join('・')}</dd>
                </dl>
              )}
              <div className="spacer" style={{ height: 10 }} />
              <button className="btn primary block" onClick={() => onPick(c)}>
                これに差し替える
              </button>
            </div>
          ))}
          <button className="btn ghost" onClick={() => void task.retry()}>
            ほかの候補を出す
          </button>
        </div>
      )}
    </Sheet>
  );
}
