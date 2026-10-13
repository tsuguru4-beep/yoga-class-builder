import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { totalSec } from '../allocation';
import { LEVEL_LABEL, PURPOSES, STYLE_LABEL } from '../constants';
import { deleteClass, listClasses, putClass } from '../db';
import { duplicatePlan } from '../plan';
import { loadSettings } from '../settings';
import type { ClassPlan } from '../types';
import { fmtDate, fmtMin } from '../util';

export default function Home() {
  const nav = useNavigate();
  const [classes, setClasses] = useState<ClassPlan[] | null>(null);
  const [q, setQ] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const hasKey = loadSettings().apiKey !== '';

  const reload = () => listClasses().then(setClasses);
  useEffect(() => {
    void reload();
  }, []);

  // プリセット＋実際に使われている自由入力の目的
  const allTags = useMemo(() => {
    const used = new Set(classes?.flatMap((c) => c.purposes) ?? []);
    return [...PURPOSES.filter((p) => used.has(p)), ...[...used].filter((p) => !PURPOSES.includes(p))];
  }, [classes]);

  const filtered = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return (classes ?? []).filter((c) => {
      if (tags.length && !tags.some((t) => c.purposes.includes(t))) return false;
      if (!words.length) return true;
      const hay = [c.title, c.audienceNote, ...c.purposes, ...c.items.map((i) => `${i.nameJa} ${i.nameEn}`)]
        .join(' ')
        .toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [classes, q, tags]);

  const toggleTag = (t: string) => setTags((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

  const duplicate = async (c: ClassPlan) => {
    const copy = duplicatePlan(c);
    await putClass(copy);
    setMenuId(null);
    nav(`/class/${copy.id}`);
  };
  const remove = async (c: ClassPlan) => {
    if (!confirm(`「${c.title || '無題のクラス'}」を削除します。元に戻せません。よろしいですか？`)) return;
    await deleteClass(c.id);
    setMenuId(null);
    void reload();
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>クラスビルダー</h1>
        <Link className="icon-btn" to="/settings" aria-label="設定">
          ⚙
        </Link>
      </header>

      {!hasKey && (
        <Link to="/settings" className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: 12, borderLeft: '5px solid var(--warn)' }}>
          <div className="bold">AIを使うにはAPIキーの設定が必要です ›</div>
          <div className="muted small">この端末ではまだ設定されていません。⚙ 設定から入力してください。</div>
        </Link>
      )}
      <input
        className="input"
        type="search"
        placeholder="タイトル・ポーズ名・メモで検索"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {allTags.length > 0 && (
        <div className="chips scroll" style={{ marginTop: 10 }}>
          {allTags.map((t) => (
            <button key={t} className={`chip ${tags.includes(t) ? 'on' : ''}`} onClick={() => toggleTag(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="spacer" />
      {classes === null ? null : classes.length === 0 ? (
        <div className="empty">
          <p>まだクラスがありません。</p>
          <p>右下の「＋ 新しいクラス」から作ってみましょう。</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">条件に合うクラスがありません。</div>
      ) : (
        <div className="stack">
          {filtered.map((c) => (
            <div key={c.id} className="card class-card" onClick={() => nav(`/class/${c.id}`)}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{c.title || '無題のクラス'}</h3>
                  <div className="meta">
                    <span>{STYLE_LABEL[c.style]}</span>
                    <span>{LEVEL_LABEL[c.level]}</span>
                    <span>
                      {c.durationMin}分（{c.items.length ? `組んだ合計 ${fmtMin(totalSec(c))}` : '未作成'}）
                    </span>
                    <span>{fmtDate(c.updatedAt)}更新</span>
                  </div>
                </div>
                <button
                  className="icon-btn"
                  aria-label="メニュー"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuId(menuId === c.id ? null : c.id);
                  }}
                >
                  ⋯
                </button>
              </div>
              {c.purposes.length > 0 && (
                <div className="chips" style={{ marginTop: 8, gap: 6 }}>
                  {c.purposes.map((p) => (
                    <span key={p} className="tag">
                      {p}
                    </span>
                  ))}
                </div>
              )}
              {menuId === c.id && (
                <div className="btn-row" style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn small" onClick={() => void duplicate(c)}>
                    複製
                  </button>
                  <button className="btn small danger" onClick={() => void remove(c)}>
                    削除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => nav('/new')}>
        ＋ 新しいクラス
      </button>
    </div>
  );
}
