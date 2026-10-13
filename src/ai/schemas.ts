import * as z from 'zod/v4';

// structured outputs に渡すスキーマ。description はAIへのフィールド説明を兼ねる。

const ItemPhase = z.enum(['intro', 'warmup', 'main', 'peak', 'cooldown', 'relax']);
const Movement = z.enum(['forward', 'backward', 'lateral', 'twist', 'balance', 'core', 'strength', 'breath', 'rest']);

export const ItemDraft = z.object({
  phase: ItemPhase.describe('この項目のフェーズ'),
  nameJa: z.string().describe('和名（例：猫と牛のポーズ）'),
  nameEn: z.string().describe('英名またはサンスクリット名（例：Cat-Cow / Marjaryasana-Bitilasana）'),
  durationSec: z.number().int().describe('移行や説明を含めた現実的な所要秒数'),
  dosage: z.string().describe('時間・回数・呼吸数の表示（例：左右各5呼吸、8回×2セット、90秒）'),
  aim: z.string().describe('狙い。クラスの目的とどう関係するかを1文で'),
  cue: z.string().describe('そのまま読み上げられる自然な話し言葉の声かけ。2〜3文'),
  breath: z.string().describe('呼吸の指示。動きのどこで吸ってどこで吐くか'),
  modifications: z
    .object({
      easy: z.string().describe('やさしく：痛みや不安がある人向けの代替'),
      standard: z.string().describe('標準'),
      challenge: z.string().describe('チャレンジ：余裕がある人向け'),
    })
    .describe('難易度別の調整例'),
  caution: z.string().describe('注意点を1行。特になければ空文字'),
  intensity: z.number().int().describe('強度 1（とても楽）〜5（かなり頑張る）'),
  movements: z.array(Movement).describe('含まれる動きの分類（複数可）'),
  sided: z.boolean().describe('左右を分けて行う項目なら true'),
  forAssessments: z
    .array(z.number().int())
    .describe('この項目が変化に効くセルフ評価の番号（1始まり）。なければ空配列'),
});
export type ItemDraft = z.infer<typeof ItemDraft>;

export const AssessmentDraft = z.object({
  name: z.string().describe('評価の名前'),
  purposeTags: z.array(z.string()).describe('関係する目的タグ'),
  position: z.enum(['standing', 'sitting']).describe('立位か座位か'),
  sided: z.boolean().describe('左右で比べる評価なら true'),
  howToCue: z.string().describe('やり方の誘導。そのまま読み上げられる日本語で'),
  focusPoints: z.string().describe('感じてほしいポイント（つっぱる場所、左右差、動きやすさなど）'),
  stopCue: z.string().describe('痛みが出たときの中止・調整の声かけ'),
  ratingLabels: z.array(z.string()).describe('感覚の3段階のラベル。悪い→良いの順に3つ（例：かたい、ふつう、軽い）'),
});
export type AssessmentDraft = z.infer<typeof AssessmentDraft>;

export const ChangeCues = z.object({
  improved: z.string().describe('軽くなった・変化を感じた人が多いときの声かけ'),
  subtle: z.string().describe('変化が小さかったときの声かけ。否定せず、気づけたことを肯定する'),
  harder: z.string().describe('かたくなった・違和感が出た人がいるときの声かけ。安心させ、無理を勧めない'),
});

export const AssessmentPick = z.object({
  libraryId: z.string().nullable().describe('ライブラリの評価を使うならそのid。新しく作るなら null'),
  custom: AssessmentDraft.nullable().describe('libraryId が null のときだけ新しい評価の内容。それ以外は null'),
  changeCues: ChangeCues.describe('アフター評価で変化を伝える声かけ（3パターン）'),
});
export type AssessmentPick = z.infer<typeof AssessmentPick>;

export const FullPlanOutput = z.object({
  assessments: z.array(AssessmentPick).describe('セルフ評価 2〜3項目'),
  items: z.array(ItemDraft).describe('クラスの項目。フェーズ順に並べる'),
});
export type FullPlanOutput = z.infer<typeof FullPlanOutput>;

export const AlternativesOutput = z.object({
  candidates: z.array(ItemDraft).describe('差し替え候補 3つ'),
});
export type AlternativesOutput = z.infer<typeof AlternativesOutput>;

export const AssessmentCandidatesOutput = z.object({
  candidates: z
    .array(
      AssessmentPick.extend({
        relatedRefs: z.array(z.number().int()).describe('この評価の変化に効く、今のメニューの項目番号'),
      }),
    )
    .describe('評価の候補 3つ'),
});
export type AssessmentCandidatesOutput = z.infer<typeof AssessmentCandidatesOutput>;
