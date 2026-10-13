# クラスビルダー

ヨガ・ピラティスのクラスメニューを組み立てる、自分専用のスマホ向けWebアプリ（PWA）です。

- 公開URL：https://tsuguru4-beep.github.io/yoga-class-builder/
- データはスマホのブラウザ内（IndexedDB）にだけ保存されます。機種変更や念のためのバックアップは、設定画面の「JSONで書き出す」を使ってください。
- AIの提案には Anthropic API（Claude）を使います。APIキーは設定画面で入力し、その端末にだけ保存されます。

## できること（MVP）

- クラスの基本設定（タイトル・種別・目的・時間・レベル・対象者メモ）
- AIのおまかせ作成：セルフ評価2〜3項目と、導入〜リラクゼーションの全項目
- 編集：並べ替え（⋮⋮をドラッグ、または↑↓）、削除、手動追加、内容の直接編集、項目ごとの「別の案」
- 上部に合計時間・目標との差・フェーズ配分・強度カーブを常に表示。配分バーをタップすると手動で調整できる
- セルフ評価：ライブラリから選ぶ／AIの候補から選ぶ、効く項目の対応づけ、アフターの声かけ
- 評価ライブラリ（初期13項目、追加・編集可）
- クラスの一覧・検索・目的タグで絞り込み・複製
- JSONでのバックアップ書き出し・読み込み

## 開発（このPC）

Node.js はポータブル版を `C:\Users\owner\nodejs` に置き、ユーザーの PATH に登録しています。

```powershell
cd D:\AI\yoga-class-builder
npm install        # 初回のみ
npm run dev        # http://localhost:5173/yoga-class-builder/
npm run build      # dist\ に本番用ファイルを作る
```

## スマホでの確認方法

### A. 同じWi-Fiでその場で確認（開発中）

1. PC で `npm run dev -- --host` を実行します。
2. 表示される `Network: http://192.168.x.x:5173/yoga-class-builder/` を、スマホのブラウザで開きます。
   - Windows のファイアウォールの確認が出たら「許可」してください。
3. 画面の操作、AI作成、保存は確認できます。
   - http のため「ホーム画面に追加」してもオフラインでは動きません。PWAとしての確認は B で行います。

### B. 公開版で確認（PWAとして）

1. https://tsuguru4-beep.github.io/yoga-class-builder/ を開きます。
2. ホーム画面に追加します。
   - iPhone（Safari）：共有ボタン →「ホーム画面に追加」
   - Android（Chrome）：︙メニュー →「ホーム画面に追加」または「アプリをインストール」
3. ホーム画面のアイコンから起動し、設定画面でAPIキーを入力して「保存して接続テスト」を押します。
4. 更新を公開したあとは、アプリを一度閉じて開き直すと新しい版になります（反映されないときはもう一度開き直してください）。

## 公開手順（GitHub Pages）

初回だけ、次の手順でリポジトリを作ります。

```powershell
cd D:\AI\yoga-class-builder
git init -b main
git add -A
git commit -m "クラスビルダー MVP"
gh repo create tsuguru4-beep/yoga-class-builder --public --source . --push
gh api -X POST repos/tsuguru4-beep/yoga-class-builder/pages -f build_type=workflow
```

最後のコマンドで、Pages の公開方法が「GitHub Actions」になります。GitHub の画面で設定する場合は、Settings → Pages → Build and deployment の Source で「GitHub Actions」を選んでください。

2回目以降は、変更を commit して `git push` するだけです。GitHub Actions（`.github/workflows/deploy.yml`）が自動でビルドし、1〜2分で公開版に反映されます。進み具合はリポジトリの Actions タブで確認できます。

APIキーはリポジトリにもバックアップにも含まれないので、public リポジトリで問題ありません。

## 構成メモ

- Vite + React + TypeScript、vite-plugin-pwa（キャッシュ名の接頭辞は `yoga-class`。同じ github.io の他アプリと混ざらないようにしている）
- ルーティングは HashRouter（GitHub Pages で再読み込みしても404にならない）
- AI呼び出し：`src/ai/`。公式SDKを `dangerouslyAllowBrowser: true` で使用（`anthropic-dangerous-direct-browser-access` ヘッダーが付く）。返答は structured outputs（JSON Schema）で受け取り、アプリ側でも Zod で検証。対応モデルではサーバー側フォールバック（`fallbacks: "default"`）を有効にしている
- システムプロンプト：`src/ai/prompts.ts`
- 評価ライブラリの初期データ：`src/seedAssessments.ts`
- アイコン：`npm run icons` で `public/` の PNG を作り直せる
