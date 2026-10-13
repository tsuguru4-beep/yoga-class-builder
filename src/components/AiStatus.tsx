import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AiTask } from './useAiTask';

interface Props<T> {
  task: AiTask<T>;
  label: string;
  /** true なら画面全体を覆う（おまかせ生成など） */
  overlay?: boolean;
  onRetry?: () => void;
}

/** 実行中の表示と、エラー時の再試行ボタン */
export default function AiStatus<T>({ task, label, overlay, onRetry }: Props<T>) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (task.status !== 'running') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [task.status]);

  if (task.status !== 'running' && task.status !== 'error') return null;

  const elapsed = Math.max(0, Math.floor((now - task.startedAt) / 1000));
  const body =
    task.status === 'running' ? (
      <>
        <div className="spinner" />
        <div className="bold">{label}</div>
        <div className="muted small">
          {elapsed}秒経過{task.chars > 0 ? `・受信中 ${task.chars.toLocaleString()}字` : '・考え中…'}
        </div>
        <div className="spacer" />
        <button className="btn small" onClick={task.cancel}>
          中止
        </button>
      </>
    ) : (
      <>
        <div className="error-box">
          <div className="bold">うまくいきませんでした</div>
          <div className="small">{task.error?.message}</div>
        </div>
        <div className="spacer" />
        <div className="btn-row">
          {task.error?.kind === 'nokey' || task.error?.kind === 'auth' || task.error?.kind === 'model' ? (
            <Link className="btn primary" to="/settings">
              設定を開く
            </Link>
          ) : (
            <button className="btn primary" onClick={onRetry ?? (() => void task.retry())}>
              再試行
            </button>
          )}
          <button className="btn" onClick={task.reset}>
            閉じる
          </button>
        </div>
      </>
    );

  if (overlay) {
    return (
      <div className="ai-overlay">
        <div className="ai-box">{body}</div>
      </div>
    );
  }
  return <div className="ai-inline">{body}</div>;
}
