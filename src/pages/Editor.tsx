import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { afterAssessmentSec, beforeAssessmentSec, phaseActuals } from '../allocation';
import { generateFullPlan } from '../ai/tasks';
import AiStatus from '../components/AiStatus';
import AlternativeSheet from '../components/editor/AlternativeSheet';
import AllocationSheet from '../components/editor/AllocationSheet';
import AssessmentEditSheet from '../components/editor/AssessmentEditSheet';
import AssessmentPickSheet from '../components/editor/AssessmentPickSheet';
import AssessmentSection from '../components/editor/AssessmentSection';
import ItemCard from '../components/editor/ItemCard';
import ItemEditSheet from '../components/editor/ItemEditSheet';
import TimeHeader from '../components/editor/TimeHeader';
import { useAiTask } from '../components/useAiTask';
import { ITEM_PHASES, PHASES } from '../constants';
import { getClass, listAssessments, putClass } from '../db';
import { CIRCLED, blankItem, removeAssessment, retarget, sortItems } from '../plan';
import type { AssessmentDef, ClassAssessment, ClassItem, ClassPlan, Phase } from '../types';
import { fmtTime, nowIso } from '../util';

type SheetState =
  | { kind: 'item'; item: ClassItem; isNew: boolean }
  | { kind: 'alt'; item: ClassItem }
  | { kind: 'alloc' }
  | { kind: 'assessEdit'; a: ClassAssessment }
  | { kind: 'assessPick'; replacing: ClassAssessment | null }
  | null;

export default function Editor() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const [plan, setPlan] = useState<ClassPlan | null>(null);
  const [library, setLibrary] = useState<AssessmentDef[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState('');
  const gen = useAiTask<ClassPlan>();
  const planRef = useRef<ClassPlan | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const autoStarted = useRef(false);

  const reloadLibrary = useCallback(() => void listAssessments().then(setLibrary), []);

  useEffect(() => {
    if (!id) return;
    void getClass(id).then((p) => {
      if (!p) return nav('/', { replace: true });
      planRef.current = p;
      setPlan(p);
    });
    reloadLibrary();
  }, [id, nav, reloadLibrary]);

  // 変更は少し待ってまとめて保存。画面を離れるときは即保存
  const flush = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    if (planRef.current) void putClass(planRef.current);
  }, []);
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [flush]);

  const update = useCallback((fn: (p: ClassPlan) => ClassPlan) => {
    const cur = planRef.current;
    if (!cur) return;
    const next = { ...fn(cur), updatedAt: nowIso() };
    planRef.current = next;
    setPlan(next);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void putClass(next), 400);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  // ---- おまかせ生成 ----
  const runGenerate = useCallback(async () => {
    const lib = await listAssessments();
    const res = await gen.run((o) => generateFullPlan(planRef.current!, lib, o));
    if (res) {
      update(() => res);
      setExpanded(null);
      showToast('メニューを作成しました');
    }
  }, [gen, update]);

  const askGenerate = () => {
    if (plan && (plan.items.length > 0 || plan.assessments.length > 0)) {
      if (!confirm('今のメニューとセルフ評価を、AIの新しい提案で置き換えます。よろしいですか？')) return;
    }
    void runGenerate();
  };

  useEffect(() => {
    const st = location.state as { autoGenerate?: boolean } | null;
    if (plan && st?.autoGenerate && !autoStarted.current) {
      autoStarted.current = true;
      nav('.', { replace: true, state: null });
      void runGenerate();
    }
  }, [plan, location.state, nav, runGenerate]);

  // ---- 並べ替え ----
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    update((p) => {
      const from = p.items.findIndex((i) => i.id === active.id);
      const to = p.items.findIndex((i) => i.id === over.id);
      if (from < 0 || to < 0 || p.items[from].phase !== p.items[to].phase) return p;
      return { ...p, items: arrayMove(p.items, from, to) };
    });
  };

  /** ↑↓：フェーズの端では隣のフェーズへ移る */
  const moveItem = (itemId: string, dir: -1 | 1) =>
    update((p) => {
      const idx = p.items.findIndex((i) => i.id === itemId);
      const it = p.items[idx];
      const nb = p.items[idx + dir];
      if (nb && nb.phase === it.phase) {
        return { ...p, items: arrayMove(p.items, idx, idx + dir) };
      }
      const pi = ITEM_PHASES.indexOf(it.phase);
      const np = ITEM_PHASES[pi + dir];
      if (!np) return p;
      const items = p.items.map((x) => (x.id === itemId ? { ...x, phase: np } : x));
      return { ...p, items: sortItems(items) };
    });

  const canMove = (it: ClassItem, dir: -1 | 1) => {
    if (!plan) return false;
    const idx = plan.items.findIndex((i) => i.id === it.id);
    const nb = plan.items[idx + dir];
    if (nb && nb.phase === it.phase) return true;
    return !!ITEM_PHASES[ITEM_PHASES.indexOf(it.phase) + dir];
  };

  // ---- 項目の追加・編集・削除・差し替え ----
  const saveItem = (item: ClassItem, isNew: boolean) => {
    update((p) => {
      if (isNew) return { ...p, items: sortItems([...p.items, item]) };
      const items = p.items.map((x) => (x.id === item.id ? item : x));
      return { ...p, items: sortItems(items) };
    });
    setSheet(null);
    setExpanded(item.id);
  };
  const deleteItem = (it: ClassItem) => {
    if (!confirm(`「${it.nameJa}」を削除しますか？`)) return;
    update((p) => ({ ...p, items: p.items.filter((x) => x.id !== it.id) }));
  };
  const replaceItem = (oldId: string, next: ClassItem) => {
    update((p) => ({ ...p, items: p.items.map((x) => (x.id === oldId ? next : x)) }));
    setSheet(null);
    setExpanded(next.id);
    showToast('差し替えました');
  };

  // ---- セルフ評価 ----
  const linkItems = (p: ClassPlan, assessmentId: string, itemIds: string[]): ClassItem[] =>
    p.items.map((it) => {
      const has = it.linkedAssessmentIds.includes(assessmentId);
      const want = itemIds.includes(it.id);
      if (has === want) return it;
      return {
        ...it,
        linkedAssessmentIds: want
          ? [...it.linkedAssessmentIds, assessmentId]
          : it.linkedAssessmentIds.filter((x) => x !== assessmentId),
      };
    });

  const saveAssessment = (a: ClassAssessment, related: string[]) => {
    update((p) => ({
      ...p,
      assessments: p.assessments.map((x) => (x.id === a.id ? a : x)),
      items: linkItems(p, a.id, related),
    }));
    setSheet(null);
  };

  const pickAssessment = (replacing: ClassAssessment | null, a: ClassAssessment, related: string[] | null) => {
    update((p) => {
      if (replacing) {
        const prevRelated = p.items.filter((it) => it.linkedAssessmentIds.includes(replacing.id)).map((it) => it.id);
        const base = removeAssessment(p, replacing.id);
        const idx = p.assessments.findIndex((x) => x.id === replacing.id);
        const assessments = [...base.assessments];
        assessments.splice(idx, 0, a);
        const withA = { ...base, assessments };
        return retarget({ ...withA, items: linkItems(withA, a.id, related ?? prevRelated) });
      }
      const withA = { ...p, assessments: [...p.assessments, a] };
      return retarget({ ...withA, items: linkItems(withA, a.id, related ?? []) });
    });
    setSheet(null);
    showToast(replacing ? '評価を差し替えました' : '評価を追加しました');
  };

  const removeAssess = (a: ClassAssessment) => {
    if (!confirm(`セルフ評価「${a.def.name}」を外しますか？`)) return;
    update((p) => removeAssessment(p, a.id));
  };

  if (!plan) return null;
  const actual = phaseActuals(plan);
  const nA = plan.assessments.length;

  return (
    <div className="page">
      <TimeHeader plan={plan} onOpenAllocation={() => setSheet({ kind: 'alloc' })} />

      {plan.items.length === 0 && plan.assessments.length === 0 && gen.status !== 'running' && (
        <div className="card" style={{ marginTop: 16 }}>
          <p style={{ marginTop: 0 }}>まだメニューがありません。</p>
          <button className="btn primary block" onClick={askGenerate}>
            AIでおまかせ作成
          </button>
          <p className="muted small" style={{ marginBottom: 0 }}>
            各フェーズの「＋ 項目を追加」から手動で作ることもできます。
          </p>
        </div>
      )}

      <AssessmentSection
        plan={plan}
        onEdit={(a) => setSheet({ kind: 'assessEdit', a })}
        onReplace={(a) => setSheet({ kind: 'assessPick', replacing: a })}
        onRemove={removeAssess}
        onAdd={() => setSheet({ kind: 'assessPick', replacing: null })}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        {PHASES.map((ph) => {
          const items = plan.items.filter((i) => i.phase === ph.key);
          const t = plan.phaseTargets[ph.key].sec;
          const off = Math.abs(actual[ph.key] - t) >= 60;
          return (
            <section key={ph.key} className="phase-section">
              <div className="phase-head">
                <span className="phase-dot" style={{ background: ph.color }} />
                <h2>{ph.label}</h2>
                <span className="phase-time">
                  <span className={off ? 'off' : ''}>{fmtTime(actual[ph.key])}</span> / {fmtTime(t)}
                </span>
              </div>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="stack">
                  {items.map((it) => (
                    <ItemCard
                      key={it.id}
                      item={it}
                      plan={plan}
                      expanded={expanded === it.id}
                      onToggle={() => setExpanded(expanded === it.id ? null : it.id)}
                      onEdit={() => setSheet({ kind: 'item', item: it, isNew: false })}
                      onMove={(d) => moveItem(it.id, d)}
                      onAlternative={() => setSheet({ kind: 'alt', item: it })}
                      onDelete={() => deleteItem(it)}
                      canUp={canMove(it, -1)}
                      canDown={canMove(it, 1)}
                    />
                  ))}
                  {ph.key === 'intro' && nA > 0 && (
                    <AssessBlock plan={plan} phase="intro" label="ビフォー評価" sec={beforeAssessmentSec(nA)} />
                  )}
                  {ph.key === 'closing' && nA > 0 && (
                    <AssessBlock plan={plan} phase="closing" label="アフター評価＋変化を言葉にする" sec={afterAssessmentSec(nA)} />
                  )}
                </div>
              </SortableContext>
              {ph.key !== 'closing' && (
                <button className="add-btn" onClick={() => setSheet({ kind: 'item', item: blankItem(ph.key), isNew: true })}>
                  ＋ 項目を追加
                </button>
              )}
            </section>
          );
        })}
      </DndContext>

      <div className="bottom-bar">
        <div className="inner">
          <button className="btn" onClick={() => nav(`/class/${plan.id}/settings`)}>
            基本設定
          </button>
          <button className="btn primary" onClick={askGenerate}>
            {plan.items.length ? 'AIで作り直す' : 'AIでおまかせ作成'}
          </button>
        </div>
      </div>

      <AiStatus task={gen} label="クラス全体のメニューを作成しています（1〜2分かかります）" overlay onRetry={() => void runGenerate()} />

      {sheet?.kind === 'item' && (
        <ItemEditSheet
          plan={plan}
          initial={sheet.item}
          isNew={sheet.isNew}
          onSave={(it) => saveItem(it, sheet.isNew)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'alt' && (
        <AlternativeSheet
          plan={plan}
          target={sheet.item}
          onPick={(c) => replaceItem(sheet.item.id, c)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'alloc' && (
        <AllocationSheet
          plan={plan}
          onChange={(targets) => update((p) => ({ ...p, phaseTargets: targets }))}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'assessEdit' && (
        <AssessmentEditSheet
          plan={plan}
          initial={sheet.a}
          library={library}
          onSave={saveAssessment}
          onLibraryChanged={reloadLibrary}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'assessPick' && (
        <AssessmentPickSheet
          plan={plan}
          library={library}
          replacing={sheet.replacing}
          onPick={(a, rel) => pickAssessment(sheet.replacing, a, rel)}
          onClose={() => setSheet(null)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/** 導入の最後・クロージングに置く評価のカード（評価セットを参照） */
function AssessBlock({ plan, phase, label, sec }: { plan: ClassPlan; phase: Phase; label: string; sec: number }) {
  const color = PHASES.find((p) => p.key === phase)!.color;
  return (
    <a href="#assessments" className="card assess-block" style={{ ['--phase' as string]: color, display: 'block', textDecoration: 'none', color: 'inherit' }}
      onClick={(e) => {
        e.preventDefault();
        document.getElementById('assessments')?.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      <div className="bold">
        {label} <span className="muted small">{fmtTime(sec)}</span>
      </div>
      <div className="small">
        {plan.assessments.map((a, i) => `${CIRCLED[i]} ${a.def.name}`).join('　')}
      </div>
    </a>
  );
}
