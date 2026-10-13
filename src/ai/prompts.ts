import { LEVEL_LABEL, MOVEMENT_LABEL, PHASES, STYLE_LABEL } from '../constants';
import type { AssessmentDef, ClassItem, ClassPlan } from '../types';

export const SYSTEM_PROMPT = `あなたは、理学療法士が指導する少人数（最大6名）のヨガ・ピラティスクラスの構成を手伝うアシスタントです。

# 参加者
- 40〜50代の女性が中心で、運動習慣が浅い人も含まれます。
- 腰・膝・肩・首に不安を抱えている人がいる前提で考えてください。

# クラスの設計思想
クラスが終わったとき、参加者が「心地よい疲労感・満足感・爽快感」を感じられることを最優先にします。
クラスは次のフェーズで構成します。
1. 導入（intro）：センタリング。呼吸と体の感覚に意識を向ける。導入の最後にビフォーのセルフ評価を行う（アプリ側で用意するので、評価そのものは項目にしない）
2. ウォームアップ（warmup）：関節を大きく動かし、体温を上げる
3. メイン（main）：目的に直結する可動性・安定性・筋力の要素
4. ピーク（peak）：全身を使い、少し頑張る山場。適度な疲労感をここでつくる
5. クールダウン（cooldown）：心拍を落とし、使った部位をゆるめる
6. リラクゼーション（relax）：シャヴァーサナなどで余韻を味わう
7. クロージング（closing）：アフターのセルフ評価を行い、変化を言葉にする（アプリ側で用意するので、項目は作らない）

# 安全性
- 痛みを避けることを優先します。腰の過伸展、膝への強いねじり、首への荷重など、痛みが出やすい動きには必ず「やさしく」の代替案を書いてください。
- ただし、痛みを避けるだけで終わらせず、「動けた」「気持ちよかった」と実感できる強度と流れにしてください。
- intensity（1〜5）は、ウォームアップから徐々に上げてピークで最大にし、その後は下げていきます。
- 前屈・後屈・側屈・ねじりが偏らないようにし、左右を分ける動きは左右とも行う前提にします。

# キュー（声かけ）
- 指導者がそのまま読み上げられる、自然な話し言葉の日本語で2〜3文にしてください。
- 専門用語や解剖学用語は避けてください。
- 「〜を感じてみましょう」のように、体の感覚に意識が向く言葉を使ってください。
- 呼吸の指示は「〜で吸って、〜で吐きます」と、動きのどこで吸ってどこで吐くかを具体的に書いてください。

# セルフ評価
- クラスの最初（導入）と最後（クロージング）に、同じセルフ評価を2〜3項目行います。
- 評価は「できる・できない」の判定ではなく、参加者が自分の体に気づくためのものです。数値ではなく、つっぱり感、左右差、動きやすさといった感覚で比べるよう促してください。
- 各評価は1項目1分以内、器具不要で、立位または座位で安全に行えるものにします。バランスを見る評価は、壁や椅子のそばで行う前提にしてください。
- ビフォー評価で意識した部位が、メインとピークでしっかり動き、アフターで変化を感じられるように、評価とメニューを対応させて組んでください。
- 変化を伝える声かけは、変化が小さかった人や違和感が出た人も否定せず、気づけたこと自体を肯定する言葉にしてください。

# 時間
- durationSec は、移行や説明の時間も含めた現実的な秒数にしてください。
- 指定されたフェーズごとの目標時間に、項目の合計が近くなるようにしてください。

# 出力
- 指定されたJSONスキーマのみで返答してください。前置き、説明、マークダウンは禁止です。`;

export function settingsBlock(plan: ClassPlan): string {
  return `# クラスの基本設定
- タイトル: ${plan.title || '（未設定）'}
- 種別: ${STYLE_LABEL[plan.style]}
- 目的: ${plan.purposes.join('、') || '（未設定）'}
- クラス時間: ${plan.durationMin}分
- レベル: ${LEVEL_LABEL[plan.level]}
- 対象者メモ: ${plan.audienceNote || '（なし）'}`;
}

export function phaseTargetsBlock(plan: ClassPlan, nAssessNote: string): string {
  const lines = PHASES.map((p) => {
    const sec = plan.phaseTargets[p.key].sec;
    if (p.key === 'closing') return `- closing（${p.label}）: ${sec}秒 … 項目は作らない（アフター評価と振り返りの時間）`;
    if (p.key === 'intro') return `- intro（${p.label}）: ${sec}秒 … ${nAssessNote}`;
    return `- ${p.key}（${p.label}）: ${sec}秒`;
  });
  return `# フェーズごとの目標時間\n${lines.join('\n')}`;
}

function itemLine(it: ClassItem, ref: number, plan: ClassPlan): string {
  const mv = it.movements.map((m) => MOVEMENT_LABEL[m]).join('・') || 'なし';
  const links = it.linkedAssessmentIds
    .map((id) => plan.assessments.findIndex((a) => a.id === id) + 1)
    .filter((n) => n > 0);
  return `[${ref}] ${it.phase} / ${it.nameJa}（${it.nameEn}） / ${it.durationSec}秒 / 強度${it.intensity} / 動き:${mv} / ${it.sided ? '左右別' : '左右なし'}${links.length ? ` / 対応する評価:${links.join(',')}` : ''}`;
}

export function itemsBlock(plan: ClassPlan): string {
  if (plan.items.length === 0) return '# 今のメニュー\n（まだ項目はありません）';
  return `# 今のメニュー（[番号] フェーズ / 名前 / 時間 / 強度 / 動き / 左右 / 対応する評価）\n${plan.items
    .map((it, i) => itemLine(it, i + 1, plan))
    .join('\n')}`;
}

export function assessmentsBlock(plan: ClassPlan): string {
  if (plan.assessments.length === 0) return '# セルフ評価\n（まだ選ばれていません）';
  return `# セルフ評価（番号. 名前 / 姿勢 / 見るポイント）\n${plan.assessments
    .map((a, i) => `${i + 1}. ${a.def.name} / ${a.def.position === 'standing' ? '立位' : '座位'} / ${a.def.focusPoints}`)
    .join('\n')}`;
}

export function libraryBlock(lib: AssessmentDef[]): string {
  return `# セルフ評価ライブラリ（id / 名前 / 姿勢 / 目的タグ）\n${lib
    .map((a) => `- ${a.id} / ${a.name} / ${a.position === 'standing' ? '立位' : '座位'} / ${a.purposeTags.join('、')}`)
    .join('\n')}`;
}

export function fullPlanPrompt(plan: ClassPlan, lib: AssessmentDef[]): string {
  return `${settingsBlock(plan)}

${phaseTargetsBlock(plan, '項目の合計は「この秒数 − 評価の数×60秒」にする（ビフォー評価の時間はアプリ側で確保する）')}

${libraryBlock(lib)}

# 依頼
上の設定で、クラス全体のメニューを作成してください。
1. 目的に合うセルフ評価を2〜3項目選んでください。ライブラリに合うものがあれば libraryId にそのidを入れて custom は null に、なければ libraryId を null にして custom に新しい評価を書いてください。
2. intro から relax までの項目を、フェーズ順に作ってください（closing の項目は作らない）。
3. 各項目の forAssessments には、その項目が変化に効く評価の番号（assessments 配列の1始まりの番号）を入れてください。どの評価にも、メインかピークで対応する項目が少なくとも1つあるようにしてください。
4. 各評価の changeCues には、アフター評価で使う声かけを3パターン書いてください。`;
}

export function alternativesPrompt(plan: ClassPlan, target: ClassItem): string {
  const ref = plan.items.findIndex((i) => i.id === target.id) + 1;
  return `${settingsBlock(plan)}

${assessmentsBlock(plan)}

${itemsBlock(plan)}

# 依頼
[${ref}]「${target.nameJa}」の差し替え候補を3つ出してください。
- フェーズは ${target.phase}、時間は ${target.durationSec}秒前後にしてください。
- 前後の項目とのつながりが自然になるようにしてください。
- 3つはそれぞれ切り口を変え、今の項目とも重複しないようにしてください。
- forAssessments には、上のセルフ評価の番号を使ってください。`;
}

export function assessmentCandidatesPrompt(
  plan: ClassPlan,
  lib: AssessmentDef[],
  replacingId: string | null,
): string {
  const replacing = plan.assessments.find((a) => a.id === replacingId);
  const others = plan.assessments.filter((a) => a.id !== replacingId).map((a) => a.def.name);
  return `${settingsBlock(plan)}

${assessmentsBlock(plan)}

${itemsBlock(plan)}

${libraryBlock(lib)}

# 依頼
${replacing ? `セルフ評価「${replacing.def.name}」の差し替え候補` : 'セルフ評価に追加する候補'}を3つ出してください。
- ${others.length ? `すでに使っている評価（${others.join('、')}）とは重ならないものにしてください。` : 'クラスの目的に合うものにしてください。'}
- ライブラリに合うものがあれば libraryId を使い、なければ新しい評価を custom に書いてください。
- relatedRefs には、その評価の変化に効く今のメニューの項目番号を入れてください。
- changeCues には、アフター評価で使う声かけを3パターン書いてください。`;
}
