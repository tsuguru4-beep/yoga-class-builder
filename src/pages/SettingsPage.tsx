import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { testConnection } from '../ai/client';
import { DEFAULT_MODEL, MODEL_SUGGESTIONS } from '../constants';
import { exportAll, importAll } from '../db';
import { loadSettings, saveSettings } from '../settings';

/** iPhoneのホーム画面アプリでも保存できるよう、共有シートが使えればそれを使う */
async function saveFile(name: string, text: string) {
  const file = new File([text], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function SettingsPage() {
  const nav = useNavigate();
  const initial = loadSettings();
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState(initial.model);
  const [showKey, setShowKey] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [withParticipants, setWithParticipants] = useState(false);
  const [ioMsg, setIoMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const persist = (k: string, m: string) => saveSettings({ apiKey: k.trim(), model: m.trim() || DEFAULT_MODEL });

  const test = async () => {
    persist(apiKey, model);
    setTesting(true);
    setTestMsg(null);
    try {
      const r = await testConnection();
      setTestMsg({ ok: true, text: `接続できました：${r}` });
    } catch (e) {
      setTestMsg({ ok: false, text: (e as Error).message });
    } finally {
      setTesting(false);
    }
  };

  const doExport = async () => {
    const data = await exportAll(withParticipants);
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    await saveFile(`class-builder-backup-${stamp}.json`, JSON.stringify(data, null, 2));
    setIoMsg(`${data.classes.length}件のクラスを書き出しました。`);
  };

  const doImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const replace = confirm(
        '読み込み方法を選んでください。\n\nOK：今のデータをすべて消して置き換える\nキャンセル：今のデータに追加する（同じクラスは上書き）',
      );
      if (replace && !confirm('本当に今のデータをすべて置き換えますか？')) return;
      const r = await importAll(data, replace ? 'replace' : 'merge');
      setIoMsg(`${r.classes}件のクラスと${r.assessments}件の評価項目を読み込みました。`);
    } catch (e) {
      setIoMsg(`読み込めませんでした：${(e as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={() => nav(-1)} aria-label="戻る">
          ‹
        </button>
        <h1>設定</h1>
      </header>

      <div className="section-title">AI（Claude）</div>
      <div className="card">
        <div className="field">
          <label htmlFor="key">APIキー</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="key"
              className="input"
              type={showKey ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              placeholder="sk-ant-..."
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={() => persist(apiKey, model)}
            />
            <button className="btn" onClick={() => setShowKey(!showKey)}>
              {showKey ? '隠す' : '表示'}
            </button>
          </div>
          <span className="hint">この端末のブラウザ内にだけ保存されます。バックアップには含まれません。</span>
        </div>
        <div className="field">
          <label htmlFor="model">モデル名</label>
          <input
            id="model"
            className="input"
            list="models"
            autoCapitalize="off"
            spellCheck={false}
            value={model}
            onChange={(e) => setModel(e.target.value)}
            onBlur={() => persist(apiKey, model)}
          />
          <datalist id="models">
            {MODEL_SUGGESTIONS.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <span className="hint">初期値：{DEFAULT_MODEL}</span>
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={() => void test()} disabled={testing || !apiKey.trim()}>
            {testing ? '確認中…' : '保存して接続テスト'}
          </button>
        </div>
        {testMsg && (
          <p className="small" style={{ color: testMsg.ok ? 'var(--ok)' : 'var(--danger)' }}>
            {testMsg.text}
          </p>
        )}
      </div>

      <div className="section-title">セルフ評価</div>
      <Link to="/library" className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <div className="bold">評価ライブラリ ›</div>
        <div className="muted small">評価項目の確認・追加・編集</div>
      </Link>

      <div className="section-title">バックアップ</div>
      <div className="card">
        <label className="check-row">
          <input type="checkbox" checked={withParticipants} onChange={(e) => setWithParticipants(e.target.checked)} />
          <span>参加者ごとの記録も含める</span>
        </label>
        <div className="btn-row">
          <button className="btn" onClick={() => void doExport()}>
            JSONで書き出す
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            JSONを読み込む
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => e.target.files?.[0] && void doImport(e.target.files[0])}
        />
        {ioMsg && <p className="small">{ioMsg}</p>}
      </div>
      <p className="muted tiny center" style={{ marginTop: 24 }}>
        クラスビルダー v{__APP_VERSION__}
      </p>
    </div>
  );
}
