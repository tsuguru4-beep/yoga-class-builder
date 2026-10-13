import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AssessmentDefForm from '../components/AssessmentDefForm';
import AssessmentDetail from '../components/AssessmentDetail';
import Sheet from '../components/Sheet';
import { PURPOSES } from '../constants';
import { deleteAssessment, listAssessments, putAssessment, restoreSeedAssessments } from '../db';
import { blankAssessmentDef } from '../plan';
import type { AssessmentDef } from '../types';

/** セルフ評価ライブラリの一覧・編集 */
export default function Library() {
  const nav = useNavigate();
  const [list, setList] = useState<AssessmentDef[]>([]);
  const [tag, setTag] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AssessmentDef | null>(null);

  const reload = () => listAssessments().then(setList);
  useEffect(() => {
    void reload();
  }, []);

  const tags = useMemo(() => {
    const used = new Set(list.flatMap((a) => a.purposeTags));
    return [...PURPOSES.filter((p) => used.has(p)), ...[...used].filter((p) => !PURPOSES.includes(p))];
  }, [list]);
  const shown = tag ? list.filter((a) => a.purposeTags.includes(tag)) : list;

  const save = async () => {
    if (!editing || !editing.name.trim()) return;
    await putAssessment({ ...editing, name: editing.name.trim() });
    setEditing(null);
    void reload();
  };
  const remove = async (a: AssessmentDef) => {
    if (!confirm(`「${a.name}」をライブラリから削除しますか？（作成済みのクラスには影響しません）`)) return;
    await deleteAssessment(a.id);
    void reload();
  };
  const restore = async () => {
    if (!confirm('初期データの評価項目を元の内容に戻します。自分で追加した項目はそのまま残ります。')) return;
    await restoreSeedAssessments();
    void reload();
  };

  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="戻る">
          ‹
        </button>
        <h1>評価ライブラリ</h1>
      </header>

      <div className="chips scroll">
        <button className={`chip ${tag === null ? 'on' : ''}`} onClick={() => setTag(null)}>
          すべて
        </button>
        {tags.map((t) => (
          <button key={t} className={`chip ${tag === t ? 'on' : ''}`} onClick={() => setTag(tag === t ? null : t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="spacer" />

      <div className="stack">
        {shown.map((a) => (
          <div key={a.id} className="card">
            <div onClick={() => setOpenId(openId === a.id ? null : a.id)} style={{ cursor: 'pointer' }}>
              <div className="bold">{a.name}</div>
              <div className="meta">
                <span>{a.position === 'standing' ? '立位' : '座位'}</span>
                {a.sided && <span>左右比較</span>}
                <span>{a.purposeTags.join('・')}</span>
              </div>
            </div>
            {openId === a.id && (
              <>
                <AssessmentDetail def={a} />
                <div className="btn-row" style={{ marginTop: 12 }}>
                  <button className="btn small" onClick={() => setEditing({ ...a })}>
                    編集
                  </button>
                  <button className="btn small danger" onClick={() => void remove(a)}>
                    削除
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="spacer" />
      <button className="btn ghost block" onClick={() => void restore()}>
        初期データを元に戻す
      </button>

      <button className="fab" onClick={() => setEditing(blankAssessmentDef())}>
        ＋ 評価を追加
      </button>

      {editing && (
        <Sheet
          title={list.some((a) => a.id === editing.id) ? '評価を編集' : '評価を追加'}
          onClose={() => setEditing(null)}
          footer={
            <button className="btn primary block" disabled={!editing.name.trim()} onClick={() => void save()}>
              保存
            </button>
          }
        >
          <AssessmentDefForm value={editing} onChange={setEditing} />
        </Sheet>
      )}
    </div>
  );
}
