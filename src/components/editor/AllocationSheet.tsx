import { computeTargets, phaseActuals } from '../../allocation';
import { PHASES } from '../../constants';
import { assessCountForTargets } from '../../plan';
import type { ClassPlan, Phase } from '../../types';
import { fmtTime } from '../../util';
import Sheet from '../Sheet';

interface Props {
  plan: ClassPlan;
  onChange: (targets: ClassPlan['phaseTargets']) => void;
  onClose: () => void;
}

/** フェーズごとの目標時間を手動で調整する（変えたフェーズは固定🔒） */
export default function AllocationSheet({ plan, onChange, onClose }: Props) {
  const actual = phaseActuals(plan);
  const n = assessCountForTargets(plan);
  const anyLocked = PHASES.some((p) => plan.phaseTargets[p.key].locked);
  const sum = PHASES.reduce((s, p) => s + plan.phaseTargets[p.key].sec, 0);

  const step = (phase: Phase, delta: number) => {
    const cur = plan.phaseTargets[phase];
    const next = { ...plan.phaseTargets, [phase]: { sec: Math.max(60, cur.sec + delta * 60), locked: true } };
    onChange(computeTargets(plan.durationMin, n, next));
  };
  const unlock = (phase: Phase) => {
    const next = { ...plan.phaseTargets, [phase]: { ...plan.phaseTargets[phase], locked: false } };
    onChange(computeTargets(plan.durationMin, n, next));
  };
  const resetAll = () => onChange(computeTargets(plan.durationMin, n));

  return (
    <Sheet
      title="フェーズの時間配分"
      onClose={onClose}
      footer={
        <div className="btn-row">
          <button className="btn" disabled={!anyLocked} onClick={resetAll}>
            自動に戻す
          </button>
          <button className="btn primary" onClick={onClose}>
            閉じる
          </button>
        </div>
      }
    >
      <p className="muted small" style={{ marginTop: 0 }}>
        ＋−で変えたフェーズは🔒で固定され、残りの時間をほかのフェーズで自動的に分け直します。右の数字は今組んでいる実際の時間です。
      </p>
      {PHASES.map((p) => {
        const t = plan.phaseTargets[p.key];
        return (
          <div key={p.key} className="alloc-row">
            <span className="phase-dot" style={{ background: p.color }} />
            <div className="name">
              {p.label}
              {t.locked && (
                <button className="btn ghost small" style={{ minHeight: 32, padding: '0 6px' }} onClick={() => unlock(p.key)}>
                  🔒解除
                </button>
              )}
              <div className="muted tiny">実際 {fmtTime(actual[p.key])}</div>
            </div>
            <div className="stepper">
              <button onClick={() => step(p.key, -1)} aria-label={`${p.label}を1分減らす`}>
                −
              </button>
              <span className="val">{t.sec / 60}分</span>
              <button onClick={() => step(p.key, 1)} aria-label={`${p.label}を1分増やす`}>
                ＋
              </button>
            </div>
          </div>
        );
      })}
      {sum !== plan.durationMin * 60 && (
        <p className="small" style={{ color: 'var(--warn)' }}>
          固定した時間の合計がクラス時間（{plan.durationMin}分）と合いません（現在 {sum / 60}分）。
        </p>
      )}
    </Sheet>
  );
}
