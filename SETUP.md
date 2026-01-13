# セットアップガイド

このガイドでは、ひらかたパーク Lovot フォト合成アプリを起動するための手順を説明します。

## 📋 事前準備

### 1. Gemini API キーの取得

1. [Google AI Studio](https://aistudio.google.com/app/apikey) にアクセス
2. Googleアカウントでサインイン
3. 「Create API Key」ボタンをクリック
4. 表示されたAPIキーをコピー（後で使用します）

### 2. ベース画像の準備

合成用のベース画像（Lovot集合写真など）を用意してください。

**推奨仕様:**
- 形式: JPEG
- ファイル名: `base-image.jpg`
- サイズ: 1920x1440px 以下
- 内容: Lovotを自然に配置できる構図

## 🚀 セットアップ手順

### Step 1: 依存関係のインストール

プロジェクトディレクトリで以下のコマンドを実行:

```bash
cd /Users/ts/Projects/HirakataPark/hirakata-park-lovot
npm install
```

### Step 2: 環境変数の設定

1. `.env.local` ファイルを作成:

```bash
cp .env.local.example .env.local
```

2. `.env.local` をエディタで開き、Gemini APIキーを設定:

```env
GEMINI_API_KEY=あなたのAPIキーをここに貼り付け
```

### Step 3: ベース画像の配置

用意したベース画像を `public` ディレクトリに配置:

```bash
# 画像ファイルを public/base-image.jpg として配置
cp /path/to/your/image.jpg public/base-image.jpg
```

### Step 4: 開発サーバーの起動

```bash
npm run dev
```

サーバーが起動したら、ブラウザで以下にアクセス:

```
http://localhost:3000
```

## ✅ 動作確認

1. ページが正しく表示されることを確認
2. 「カメラを起動」ボタンが表示されることを確認
3. カメラ許可を求められたら「許可」をクリック

## 🧪 テスト撮影

1. カメラが起動したら、Lovotまたはテスト用のオブジェクトを撮影
2. プレビューが表示されることを確認
3. 「合成する！」ボタンをクリック
4. 10〜20秒待つと、合成された画像が表示されます

## 🚢 本番環境へのデプロイ (Vercel)

### Step 1: Gitリポジトリを作成

```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 2: GitHubにプッシュ

1. GitHubで新しいリポジトリを作成
2. リモートリポジトリを追加してプッシュ:

```bash
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
git branch -M main
git push -u origin main
```

### Step 3: Vercelにデプロイ

1. [Vercel](https://vercel.com) にアクセスしてサインイン
2. 「Add New Project」をクリック
3. GitHubリポジトリを選択
4. 環境変数を設定:
   - `GEMINI_API_KEY`: 取得したGemini APIキー
5. 「Deploy」をクリック

### Step 4: ベース画像のアップロード

Vercelにデプロイ後、`public/base-image.jpg` がリポジトリに含まれていることを確認してください。

## ⚠️ トラブルシューティング

### カメラが起動しない

- HTTPSまたはlocalhostでアクセスしていることを確認
- ブラウザのカメラ権限を確認
- 別のアプリがカメラを使用していないか確認

### API エラーが発生する

- `.env.local` にAPIキーが正しく設定されているか確認
- Gemini APIキーが有効か確認
- API使用量が上限に達していないか確認

### ベース画像が読み込めない

- `public/base-image.jpg` が存在するか確認
- ファイル名が正確に `base-image.jpg` であることを確認
- 画像ファイルが破損していないか確認

### ビルドエラー

```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

## 📞 サポート

問題が解決しない場合は、プロジェクトのREADME.mdを参照するか、開発チームに問い合わせてください。

---

セットアップが完了したら、楽しいLovotフォト合成をお楽しみください！ 🤖✨
