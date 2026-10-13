import { useNavigate } from 'react-router-dom';
import { beforeAssessmentSec, phaseActuals, totalSec } from '../../allocation';
import { PHASE_MAP, PHASES } from '../../constants';
import type { ClassPlan } from '../../types';
import { fmtDiff, fmtTime } from '../../util';

interface Props {
  plan: ClassPlan;
  onOpenAllocation: () => void;
}

/** 合計時間・目標との差・フェーズ配分・強度カーブを常に表示する */
export default function TimeHeader({ plan, onOpenAllocation }: Props) {
  const nav = useNavigate();
  const actual = phaseActuals(plan);
  const total = totalSec(plan);
  const target = plan.durationMin * 60;
  const diff = total - target;
  const level = Math.abs(diff) < 60 ? 'ok' : Math.abs(diff) < 180 ? 'mid' : 'bad';

  return (
    <div className="time-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button className="icon-btn" onClick={() => nav('/')} aria-label="一覧へ戻る">
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {plan.title || '無題のクラス'}
          </div>
          <div className="time-row">
            <span className="time-total">{fmtTime(total)}</span>
            <span className="time-target">/ {fmtTime(target)}</span>
            <span className={`diff ${level}`}>{fmtDiff(diff)}</span>
          </div>
        </div>
        <button className="icon-btn" onClick={() => nav(`/class/${plan.id}/settings`)} aria-label="基本設定">
          ✎
        </button>
      </div>

      <button className="phase-bar" onClick={onOpenAllocation} aria-label="フェーズの時間配分を調整">
        {PHASES.map((p) => {
          const t = plan.phaseTargets[p.key].sec;
          const a = actual[p.key];
          const off = Math.abs(a - t) >= 60;
          return (
            <div key={p.key} className="phase-seg" style={{ flex: `${Math.max(t, 60)} 1 0`, background: p.color }}>
              <span className="l">{p.short}</span>
              <span className={`v ${off ? 'off' : ''}`}>{Math.round(a / 60)}</span>
            </div>
          );
        })}
      </button>
      <IntensityCurve plan={plan} />
    </div>
  );
}

/** 時間軸に沿った強度の山（ピークで最大になっているかを見る） */
function IntensityCurve({ plan }: { plan: ClassPlan }) {
  const W = 300;
  const H = 34;
  const total = Math.max(totalSec(plan), 1);
  const segs: { x: number; w: number; y: number; color: string }[] = [];
  let t = 0;
  // ビフォー評価は導入の最後（センタリングの後）に入る
  let preAdded = false;
  for (const it of plan.items) {
    if (!preAdded && it.phase !== 'intro') {
      t += beforeAssessmentSec(plan.assessments.length);
      preAdded = true;
    }
    segs.push({
      x: (t / total) * W,
      w: (it.durationSec / total) * W,
      y: H - (it.intensity / 5) * (H - 4),
      color: PHASE_MAP[it.phase].color,
    });
    t += it.durationSec;
  }
  if (segs.length === 0) return null;
  return (
    <svg className="curve" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="強度カーブ">
      <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="var(--line)" strokeWidth="1" />
      {segs.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={Math.max(s.w - 0.6, 0.6)} height={H - s.y} fill={s.color} opacity="0.75" />
      ))}
    </svg>
  );
}
