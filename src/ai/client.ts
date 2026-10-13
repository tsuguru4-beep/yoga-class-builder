import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type * as z from 'zod/v4';
import { loadSettings } from '../settings';
import { SYSTEM_PROMPT } from './prompts';

export type AiErrorKind =
  | 'nokey' | 'auth' | 'model' | 'rate' | 'overloaded' | 'network'
  | 'refusal' | 'truncated' | 'parse' | 'aborted' | 'api';

export class AiError extends Error {
  kind: AiErrorKind;
  constructor(kind: AiErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

/** サーバー側フォールバック（"default"）に対応しているモデル */
const FALLBACK_MODELS = new Set(['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-fable-5']);
/** effort を指定できる世代のモデル */
const supportsEffort = (model: string) => /^claude-(opus|sonnet|fable|haiku)-5/.test(model);

export interface CallOptions<T> {
  user: string;
  schema: z.ZodType<T>;
  signal?: AbortSignal;
  onProgress?: (chars: number) => void;
}

export async function callClaude<T>({ user, schema, signal, onProgress }: CallOptions<T>): Promise<T> {
  const { apiKey, model } = loadSettings();
  if (!apiKey) throw new AiError('nokey', 'APIキーが設定されていません。設定画面で入力してください。');

  // dangerouslyAllowBrowser を付けると anthropic-dangerous-direct-browser-access ヘッダーが送られる
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
  const useFallback = FALLBACK_MODELS.has(model);
  // スキーマだけ渡し、SDKの自動解析は使わない（壊れた返答を下で分かりやすいエラーにするため）
  const { type, schema: jsonSchema } = zodOutputFormat(schema);

  let text: string;
  try {
    const stream = client.beta.messages.stream(
      {
        model,
        max_tokens: 32000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: user }],
        output_config: {
          ...(supportsEffort(model) ? { effort: 'medium' as const } : {}),
          format: { type, schema: jsonSchema },
        },
        ...(useFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      },
      { signal },
    );
    let chars = 0;
    stream.on('text', (t) => {
      chars += t.length;
      onProgress?.(chars);
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') {
      throw new AiError('refusal', 'AIがこの依頼への回答を控えました。目的や対象者メモの表現を変えて試してください。');
    }
    if (msg.stop_reason === 'max_tokens') {
      throw new AiError('truncated', '返答が長すぎて途中で切れました。もう一度試してください。');
    }
    text = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  } catch (e) {
    throw toAiError(e);
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AiError('parse', 'AIの返答をJSONとして読み取れませんでした。');
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new AiError('parse', 'AIの返答の形式が想定と違いました。');
  }
  return parsed.data;
}

function toAiError(e: unknown): AiError {
  if (e instanceof AiError) return e;
  if (e instanceof Anthropic.APIUserAbortError) return new AiError('aborted', '中止しました。');
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
    return new AiError('auth', 'APIキーが正しくないか、権限がありません。設定画面で確認してください。');
  }
  if (e instanceof Anthropic.NotFoundError) {
    return new AiError('model', 'モデルが見つかりません。設定画面のモデル名を確認してください。');
  }
  if (e instanceof Anthropic.RateLimitError) {
    return new AiError('rate', '利用回数の上限に達しました。少し時間をおいて再試行してください。');
  }
  if (e instanceof Anthropic.APIConnectionError) {
    return new AiError('network', '通信できませんでした。電波の状態を確認して再試行してください。');
  }
  if (e instanceof Anthropic.APIError) {
    if (e.status === 529 || e.status === 503) {
      return new AiError('overloaded', 'AIが混み合っています。少し待ってから再試行してください。');
    }
    return new AiError('api', `AIの呼び出しでエラーが発生しました（${e.status ?? '不明'}）：${e.message}`);
  }
  return new AiError('api', `予期しないエラー：${e instanceof Error ? e.message : String(e)}`);
}

/** 設定画面の「接続テスト」用 */
export async function testConnection(): Promise<string> {
  const { apiKey, model } = loadSettings();
  if (!apiKey) throw new AiError('nokey', 'APIキーが設定されていません。');
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 0 });
  try {
    const msg = await client.messages.create({
      model,
      max_tokens: 64,
      messages: [{ role: 'user', content: '「接続OK」とだけ返してください。' }],
      ...(supportsEffort(model) ? { output_config: { effort: 'low' as const } } : {}),
    });
    return msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('') || '（応答あり）';
  } catch (e) {
    throw toAiError(e);
  }
}
