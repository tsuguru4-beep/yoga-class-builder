import { useCallback, useEffect, useRef, useState } from 'react';
import { AiError } from '../ai/client';

export interface AiOpts {
  signal: AbortSignal;
  onProgress: (chars: number) => void;
}

export interface AiTask<T> {
  status: 'idle' | 'running' | 'error' | 'done';
  error: AiError | null;
  chars: number;
  startedAt: number;
  result: T | null;
  run: (fn: (o: AiOpts) => Promise<T>) => Promise<T | null>;
  retry: () => Promise<T | null>;
  cancel: () => void;
  reset: () => void;
}

/** AI呼び出しの実行状態（進行中・エラー・再試行）をまとめて扱う */
export function useAiTask<T>(): AiTask<T> {
  const [status, setStatus] = useState<AiTask<T>['status']>('idle');
  const [error, setError] = useState<AiError | null>(null);
  const [chars, setChars] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [result, setResult] = useState<T | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastFn = useRef<((o: AiOpts) => Promise<T>) | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(async (fn: (o: AiOpts) => Promise<T>) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    lastFn.current = fn;
    setStatus('running');
    setError(null);
    setChars(0);
    setResult(null);
    setStartedAt(Date.now());
    try {
      const r = await fn({ signal: ac.signal, onProgress: setChars });
      if (ac.signal.aborted) return null;
      setResult(r);
      setStatus('done');
      return r;
    } catch (e) {
      if (ac.signal.aborted) {
        setStatus('idle');
        return null;
      }
      setError(e instanceof AiError ? e : new AiError('api', String(e)));
      setStatus('error');
      return null;
    }
  }, []);

  const retry = useCallback(() => (lastFn.current ? run(lastFn.current) : Promise.resolve(null)), [run]);
  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStatus('idle');
  }, []);
  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  return { status, error, chars, startedAt, result, run, retry, cancel, reset };
}
