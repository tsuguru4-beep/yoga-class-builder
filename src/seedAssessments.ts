import type { AssessmentDef } from './types';

const STD: [string, string, string] = ['かたい', 'ふつう', '軽い'];

/** 評価ライブラリの初期データ */
export const SEED_ASSESSMENTS: AssessmentDef[] = [
  {
    id: 'seed-forward-bend',
    name: '立位前屈',
    purposeTags: ['腰痛予防', '股関節の柔軟性', '全身リフレッシュ'],
    position: 'standing',
    sided: false,
    howToCue:
      '足を腰幅に開いて立ちます。膝は軽くゆるめたままで大丈夫です。息を吐きながら、頭の重さにまかせて、背中を上からゆっくり丸めていきましょう。手が自然に届くところで止めて、2呼吸ほど味わったら、ゆっくり起き上がります。',
    focusPoints: '太ももの裏や腰のどこがつっぱるか。手がどのあたりまで届いたか。起き上がるときの腰の重さ。',
    stopCue:
      '腰やお尻に痛みやしびれが出たら、そこで止めて膝を深く曲げましょう。手を太ももに置いたままでも十分です。起き上がるときは、ふらつかないようにゆっくりと。',
    ratingLabels: STD,
    builtin: true,
  },
  {
    id: 'seed-side-bend',
    name: '左右の側屈',
    purposeTags: ['腰痛予防', '肩こり解消', '全身リフレッシュ'],
    position: 'standing',
    sided: true,
    howToCue:
      '足を腰幅に開いて立ち、両手は体の横に下ろします。右手を太ももの外側に沿わせながら、上半身を真横に倒していきます。体が前や後ろに傾かないように、気持ちよいところで止めて1呼吸。戻ったら、反対側も同じように倒してみましょう。',
    focusPoints: '左右どちらが倒しやすいか。わき腹や腰のどこが伸びるか。手が届いた位置の左右差。',
    stopCue: '腰に痛みが出たら、倒す角度を小さくするか、反対の手を腰に当てて支えましょう。',
    ratingLabels: STD,
    builtin: true,
  },
  {
    id: 'seed-trunk-rotation',
    name: '体幹の回旋',
    purposeTags: ['腰痛予防', '姿勢改善'],
    position: 'sitting',
    sided: true,
    howToCue:
      'あぐらか椅子に座り、背すじを軽く伸ばします。胸の前で腕を組み、骨盤は正面に向けたまま、おへそから上をゆっくり右へ回します。どこまで後ろが見えるか景色を覚えたら正面に戻り、左へも回してみましょう。',
    focusPoints: '左右どちらが回りやすいか。背中やわき腹のつっぱり。見える景色の違い。',
    stopCue: '腰や背中に痛みが出たら、回す幅を半分にして、目線だけで後ろをのぞくようにしましょう。',
    ratingLabels: STD,
    builtin: true,
  },
  {
    id: 'seed-arm-raise',
    name: '腕のバンザイ',
    purposeTags: ['肩こり解消', '姿勢改善', '全身リフレッシュ'],
    position: 'standing',
    sided: true,
    howToCue:
      '足を腰幅に開いて立ちます。手のひらを向かい合わせにして、両腕を前からゆっくり上げていきましょう。腰を反らさずに、腕がどこまで耳に近づくか確かめます。',
    focusPoints: '腕が耳の横まで上がるか。肩や脇のつまり感。左右の腕の上がり方の違い。',
    stopCue: '肩に痛みやひっかかりがあれば、その手前で止めましょう。肘を曲げたままでもかまいません。',
    ratingLabels: ['重い', 'ふつう', '軽い'],
    builtin: true,
  },
  {
    id: 'seed-hands-behind',
    name: '背中で手を組む',
    purposeTags: ['肩こり解消', '姿勢改善'],
    position: 'standing',
    sided: false,
    howToCue:
      '立ったまま、両手を背中に回して、お尻の後ろで指を組みます。肘を軽く伸ばして、胸を開きながら、組んだ手を後ろへ少し引いてみましょう。',
    focusPoints: '胸の前や肩の前の張り。肩甲骨が寄る感じ。手が楽に組めるかどうか。',
    stopCue:
      '手が組めなければ、服の裾をつまむか、両手をお尻に添えるだけで大丈夫です。肩の前に痛みが出たら、引くのをやめましょう。',
    ratingLabels: STD,
    builtin: true,
  },
  {
    id: 'seed-neck-rotation',
    name: '首の回旋の左右差',
    purposeTags: ['肩こり解消'],
    position: 'sitting',
    sided: true,
    howToCue:
      '楽に座り、肩の力を抜きます。あごを軽く引いたまま、ゆっくり右を向いて、どこまで後ろが見えるか景色を覚えておきましょう。正面に戻ったら、左へも向いてみます。',
    focusPoints: '左右どちらが向きやすいか。首すじや肩のどこが張るか。',
    stopCue:
      'めまいやしびれ、痛みが出たら、すぐ正面に戻って目を閉じ、呼吸を整えましょう。小さな動きで十分です。',
    ratingLabels: STD,
    builtin: true,
  },
  {
    id: 'seed-wall-stand',
    name: '壁立ち',
    purposeTags: ['姿勢改善'],
    position: 'standing',
    sided: false,
    howToCue:
      '壁を背にして、かかとを壁につけて立ちます。後頭部、肩甲骨、お尻、かかとが、壁にどのくらい触れているか感じてみましょう。腰と壁のすき間に手を入れて、すき間の大きさも確かめます。',
    focusPoints: '4か所のうち触れにくいところ。腰のすき間の大きさ。頑張らないと付かない場所。',
    stopCue:
      '後頭部を無理に壁に付けようとして、あごが上がったり腰が反ったりしないようにしましょう。つらければ付かないままで大丈夫です。',
    ratingLabels: ['頑張らないと付かない', 'ふつう', '楽に付く'],
    builtin: true,
  },
  {
    id: 'seed-butterfly-knees',
    name: 'あぐらでの膝の高さ',
    purposeTags: ['股関節の柔軟性'],
    position: 'sitting',
    sided: true,
    howToCue:
      '床にあぐらで座り、両手を後ろについて楽にします。左右の膝の高さを見比べて、脚のつけ根がどんな感じか確かめてみましょう。',
    focusPoints: '膝が床からどのくらい浮くか。左右の高さの違い。つけ根や内ももの張り。',
    stopCue:
      '膝や股関節に痛みがあれば、お尻の下にたたんだ服やクッションを敷くか、脚を伸ばして座りましょう。',
    ratingLabels: STD,
    builtin: true,
  },
  {
    id: 'seed-single-leg',
    name: '片脚立ちの安定感',
    purposeTags: ['股関節の柔軟性', '体幹強化'],
    position: 'standing',
    sided: true,
    howToCue:
      '壁や椅子のそばに立ち、すぐつかまれるようにしておきます。足元から少し先の床を見て、片足をそっと浮かせ、10秒ほど立ってみましょう。反対の足も同じように。',
    focusPoints: 'ぐらつきの大きさ。足裏のどこに体重がのっているか。左右どちらが立ちやすいか。',
    stopCue:
      'ふらついたら、迷わず壁や椅子に手をついてください。足を浮かせるのは、つま先が床から離れる程度でも十分です。',
    ratingLabels: ['ぐらつく', 'ふつう', '安定'],
    builtin: true,
  },
  {
    id: 'seed-breath',
    name: '呼吸の入りやすさ',
    purposeTags: ['リラックス・睡眠の質', '全身リフレッシュ'],
    position: 'sitting',
    sided: false,
    howToCue:
      '楽に座り、片手を胸に、もう片方の手をお腹に当てます。目を閉じられる人は閉じて、いつもの呼吸を3回。どちらの手がよく動くか、息がどこまで入ってくるか感じてみましょう。',
    focusPoints: '胸とお腹のどちらが動くか。吸いやすさ、吐ききりやすさ。肩の力み。',
    stopCue:
      '深く吸おうとして苦しくなったら、呼吸はいつも通りに戻しましょう。気分が悪くなったら目を開けてください。',
    ratingLabels: ['浅い', 'ふつう', '深い'],
    builtin: true,
  },
  {
    id: 'seed-toes-warmth',
    name: '足先の温かさ・軽さ',
    purposeTags: ['むくみ・冷え'],
    position: 'sitting',
    sided: true,
    howToCue:
      '座ったまま、足先に手を当てるか、足の指を軽くグーパーしてみます。足先の温かさと、指の動かしやすさを感じてみましょう。',
    focusPoints: '足先の冷たさ。指の開きやすさ。足全体の重だるさの左右差。',
    stopCue: '足がつりそうになったら、指を動かすのをやめて、足首をゆっくり手前に引きましょう。',
    ratingLabels: ['冷たい・重い', 'ふつう', '温かい・軽い'],
    builtin: true,
  },
  {
    id: 'seed-heel-raise',
    name: 'つま先立ちの軽さ',
    purposeTags: ['むくみ・冷え', '全身リフレッシュ'],
    position: 'standing',
    sided: false,
    howToCue:
      '壁や椅子に軽く手を添えて立ちます。かかとをゆっくり上げて、ゆっくり下ろす動きを5回。ふくらはぎの使いやすさと、かかとの上げやすさを感じてみましょう。',
    focusPoints: 'ふくらはぎの重さ。かかとが上がる高さ。ぐらつき。',
    stopCue:
      'ふくらはぎがつりそう、または痛いときは、回数を減らすか、かかとを少し浮かせるだけにしましょう。',
    ratingLabels: ['重い', 'ふつう', '軽い'],
    builtin: true,
  },
  {
    id: 'seed-pelvis-sit',
    name: '座って骨盤を起こしたときの楽さ',
    purposeTags: ['体幹強化', '姿勢改善', '腰痛予防'],
    position: 'sitting',
    sided: false,
    howToCue:
      '椅子の前のほうか床に座り、まずは楽に背中を丸めます。次に、お尻の下の骨で床を押すように骨盤を起こして、背すじを伸ばしてみましょう。その姿勢のまま3呼吸。',
    focusPoints: '起こした姿勢を保つのが楽か。お腹や背中のどこに力が入るか。腰の張り。',
    stopCue: '腰に痛みが出たら、反らしすぎていないか確かめて、少しだけ丸めた楽な位置で止めましょう。',
    ratingLabels: ['つらい', 'ふつう', '楽'],
    builtin: true,
  },
];
