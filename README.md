# ひらかたパーク Lovot フォト合成アプリ

ひらかたパークでの1週間限定イベント用ウェブアプリ。Lovotの写真をベース画像と自然に合成します。

## 🚀 技術スタック

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **AI画像生成**: Gemini 3 Pro Image（デフォルト）
- **デバッグモード**: OpenRouter経由で複数AIモデル対応
- **Vercel** (デプロイ)

## 📋 必要な準備

### 1. Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey)にアクセス
2. 「Create API Key」をクリック
3. APIキーをコピー

### 2. ベース画像の準備

`public/base-image.jpg` に合成用のベース画像（Lovot集合写真など）を配置してください。

推奨仕様:
- 形式: JPEG
- サイズ: 1920x1440px 以下
- 背景: Lovotを配置できるスペースがある構図

## 🔧 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成:

```bash
cp .env.local.example .env.local
```

`.env.local` にGemini APIキーを設定:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 📱 使い方

1. **カメラ起動**: 「カメラを起動」ボタンをタップ
2. **Lovot撮影**: Lovotをフレームに入れて撮影ボタンをタップ
3. **プレビュー確認**: 撮影した写真を確認
4. **合成開始**: 「合成する！」ボタンで画像生成（10〜20秒）
5. **共有・保存**: 完成した写真をダウンロードまたはSNSでシェア

## 🎨 カスタマイズ

### カラーテーマ

`src/app/globals.css` で定義されています:

```css
--hirakata-primary: #E60012;    /* ひらかたパーク赤 */
--hirakata-secondary: #FFD700;  /* ゴールドアクセント */
--hirakata-dark: #1A1A1A;
--hirakata-light: #FFF9F0;
```

### Gemini プロンプト

`src/app/api/generate/route.ts` の50行目付近で編集できます。

## 🚢 デプロイ (Vercel)

### 1. GitHubにプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Vercelにデプロイ

1. [Vercel](https://vercel.com)にログイン
2. 「Import Project」からリポジトリを選択
3. 環境変数 `GEMINI_API_KEY` を設定
4. Deploy

### 3. カスタムドメイン設定

Vercelダッシュボードから「Settings > Domains」でドメインを追加できます。

## 📂 プロジェクト構造

```
hirakata-park-lovot/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # レイアウト
│   │   ├── page.tsx                # メインページ
│   │   ├── globals.css             # グローバルスタイル
│   │   └── api/generate/route.ts   # Gemini APIエンドポイント
│   ├── components/
│   │   ├── CameraCapture.tsx       # カメラ撮影
│   │   ├── ImagePreview.tsx        # プレビュー表示
│   │   ├── GeneratingOverlay.tsx   # ローディング
│   │   ├── ResultDisplay.tsx       # 結果表示
│   │   ├── ShareButtons.tsx        # SNSシェア
│   │   └── DownloadButton.tsx      # ダウンロード
│   └── lib/
│       └── imageUtils.ts           # 画像処理ユーティリティ
├── public/
│   └── base-image.jpg              # ベース画像（要配置）
└── .env.local                      # 環境変数（要作成）
```

## ⚠️ 注意事項

- Gemini 3 Pro Image APIは現在プレビュー版です
- APIレート制限に注意してください
- 本番環境では適切なエラーハンドリングとレート制限を実装してください
- カメラ機能はHTTPS環境が必要です（localhostは除く）

## 🔒 セキュリティ

- `.env.local` は `.gitignore` に含まれています（コミットされません）
- APIキーは絶対にフロントエンドに露出させないでください
- 本番環境では適切な認証・認可を実装してください

## 🐛 デバッグモード

開発者向けの強力なデバッグ機能が搭載されています。

### 有効化方法

URLに `?debug=true` を追加してアクセス：

```
http://localhost:3000?debug=true
```

### デバッグモードの機能

#### 1. デバッグパネル（右下に表示）
- 📸 画像情報（撮影、リサイズ、生成画像のサイズ・解像度）
- ⚡ API情報（処理時間、ステータス）
- 📋 リアルタイムログ（Info/Success/Warning/Error）

#### 2. AIモデル選択機能
複数のAI画像生成モデルを切り替えて比較できます：

| モデル | 提供元 | 特徴 |
|--------|--------|------|
| Gemini 3 Pro Image 🔷 | Google | デフォルト、高品質 |
| Flux Dev ⚡ | Black Forest Labs | バランス型 |
| Flux Pro 💎 | Black Forest Labs | 最高品質 |
| DALL-E 3 🎨 | OpenAI | クリエイティブ |
| Stable Diffusion XL 🚀 | Stability AI | 高速 |
| Qwen VL Max 👁️ | Alibaba | ビジョン特化 |

### セットアップ

OpenRouter APIキー（Gemini以外のモデルを使う場合）：

```bash
OPENROUTER_API_KEY=your_key_here
```

詳細は [DEBUG_MODE.md](./DEBUG_MODE.md) を参照してください。

## 🧪 CLIデバッグモード（推奨）

ブラウザを使わずにCLIだけで合成を実行できます。**デバッグ時は基本こちらを使用**してください。

```bash
# 例: Lovot画像を指定して生成
npm run cli:generate -- --input ./public/sample-lovot.png

# 例: 出力先を指定
npm run cli:generate -- --input ./public/sample-lovot.png --output ./public/generated-images

# 例: OpenRouter経由で実行
npm run cli:generate -- --input ./public/sample-lovot.png --provider openrouter
```

補足:
- 画像の長辺は **512px前後** にしておくとUIと同条件になります
- `.env.local` の `GEMINI_API_KEY` / `OPENROUTER_API_KEY` を読み込みます

## 📝 ライセンス

このプロジェクトは教育・イベント目的で作成されています。

---

**開発者向けメモ**: デプロイ前に必ず `public/base-image.jpg` を配置し、`.env.local` にAPIキーを設定してください。
