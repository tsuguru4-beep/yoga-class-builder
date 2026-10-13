import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MOVEMENT_LABEL, PHASE_MAP } from '../../constants';
import { CIRCLED } from '../../plan';
import type { ClassItem, ClassPlan } from '../../types';
import { fmtTime } from '../../util';

interface Props {
  item: ClassItem;
  plan: ClassPlan;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onMove: (dir: -1 | 1) => void;
  onAlternative: () => void;
  onDelete: () => void;
  canUp: boolean;
  canDown: boolean;
}

export function intensityDots(n: number) {
  return '●'.repeat(n) + '○'.repeat(5 - n);
}

export default function ItemCard(p: Props) {
  const { item, plan } = p;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const color = PHASE_MAP[item.phase].color;
  const nums = item.linkedAssessmentIds
    .map((id) => plan.assessments.findIndex((a) => a.id === id))
    .filter((i) => i >= 0)
    .sort();

  return (
    <div
      ref={setNodeRef}
      className={`card item-card ${isDragging ? 'dragging' : ''}`}
      style={{
        ['--phase' as string]: color,
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
      }}
    >
      <div className="item-main">
        <button className="drag-handle" aria-label="ドラッグで並べ替え" {...attributes} {...listeners}>
          ⋮⋮
        </button>
        <button className="item-body" onClick={p.onToggle} aria-expanded={p.expanded}>
          <div className="item-name">{item.nameJa || '（名前なし）'}</div>
          {item.nameEn && <div className="item-en">{item.nameEn}</div>}
          <div className="item-sub">
            <span>{item.dosage || fmtTime(item.durationSec)}</span>
            <span className="muted small">{fmtTime(item.durationSec)}</span>
            <span className="dots" aria-label={`強度${item.intensity}`}>
              {intensityDots(item.intensity)}
            </span>
            {nums.map((i) => (
              <span key={i} className="badge-num" title="対応するセルフ評価">
                {CIRCLED[i]}
              </span>
            ))}
          </div>
        </button>
      </div>

      {p.expanded && (
        <div className="item-detail">
          <dl style={{ margin: 0 }}>
            {item.aim && (
              <>
                <dt>狙い</dt>
                <dd>{item.aim}</dd>
              </>
            )}
            {item.cue && (
              <>
                <dt>キュー</dt>
                <dd className="cue">{item.cue}</dd>
              </>
            )}
            {item.breath && (
              <>
                <dt>呼吸</dt>
                <dd>{item.breath}</dd>
              </>
            )}
            {(item.modifications.easy || item.modifications.standard || item.modifications.challenge) && (
              <>
                <dt>難易度の調整</dt>
                <dd className="mods">
                  <span className="k">やさしく</span>
                  <span>{item.modifications.easy}</span>
                  <span className="k">標準</span>
                  <span>{item.modifications.standard}</span>
                  <span className="k">チャレンジ</span>
                  <span>{item.modifications.challenge}</span>
                </dd>
              </>
            )}
            {item.caution && (
              <>
                <dt>注意点</dt>
                <dd style={{ color: 'var(--warn)' }}>⚠ {item.caution}</dd>
              </>
            )}
            {(item.movements.length > 0 || item.sided) && (
              <>
                <dt>動き</dt>
                <dd className="chips" style={{ gap: 6 }}>
                  {item.movements.map((m) => (
                    <span key={m} className="tag">
                      {MOVEMENT_LABEL[m]}
                    </span>
                  ))}
                  {item.sided && <span className="tag">左右別</span>}
                </dd>
              </>
            )}
          </dl>
          <div className="item-actions">
            <button className="btn small" onClick={() => p.onMove(-1)} disabled={!p.canUp} aria-label="上へ">
              ↑
            </button>
            <button className="btn small" onClick={() => p.onMove(1)} disabled={!p.canDown} aria-label="下へ">
              ↓
            </button>
            <button className="btn small" onClick={p.onEdit}>
              編集
            </button>
            <button className="btn small" onClick={p.onAlternative}>
              別の案
            </button>
            <button className="btn small danger" onClick={p.onDelete}>
              削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
