# デバッグモード機能ガイド（2026年最新版）

このアプリには開発者向けの強力なデバッグモードが搭載されています。

## 🐛 デバッグモードの有効化

URLに `?debug=true` パラメータを追加してアクセスします：

```
http://localhost:3000?debug=true
```

または本番環境：

```
https://your-domain.com?debug=true
```

## 🧪 CLIデバッグモード（推奨）

ブラウザ不要でCLIだけで合成できるモードです。**デバッグ時は基本こちらを使用**してください。

```bash
# 例: Lovot画像を指定して生成
npm run cli:generate -- --input ./public/sample-lovot.png

# 例: テスト用Lovot画像で生成
npm run cli:generate -- --input ./public/test-lovot.png

# 例: 出力先を指定
npm run cli:generate -- --input ./public/sample-lovot.png --output ./public/generated-images

# 例: OpenRouter経由で実行
npm run cli:generate -- --input ./public/sample-lovot.png --provider openrouter
```

補足:
- 画像の長辺は **512px前後** にしておくとUIと同条件になります
- `.env.local` の `GEMINI_API_KEY` / `OPENROUTER_API_KEY` を読み込みます

## 📊 デバッグパネルの機能

デバッグモードを有効にすると、画面右下にデバッグパネルが表示されます。

### ⏱ 10分待機のスキップ

テスト時は以下のいずれかで待機をスキップできます：

- `?debug=true` を付けてアクセス（デバッグモード時は自動でスキップ）
- `NEXT_PUBLIC_SKIP_IDLE_WAIT=1` を `.env` / `.env.local` に設定

### 表示される情報

#### 1. 画像情報
- **撮影画像**: サイズ（バイト）、解像度（幅x高さ）
- **リサイズ後**: 最適化後のサイズと解像度
- **生成画像**: AI生成後の画像情報

#### 2. API情報
- **リクエスト送信時刻**: APIリクエストを送った時間
- **レスポンス受信時刻**: 結果を受け取った時間
- **処理時間**: 合計の処理時間（秒）
- **ステータス**: HTTPステータスコード
- **使用モデル**: 選択されたAIモデル

#### 3. ログ
- **Info** ℹ️: 情報ログ（青色）
- **Success** ✅: 成功ログ（緑色）
- **Warning** ⚠️: 警告ログ（オレンジ色）
- **Error** ❌: エラーログ（赤色）

最新10件のログが表示され、「クリア」ボタンでログをリセットできます。

## 🤖 AIモデル選択機能（2026年厳選版）

デバッグモード限定で、**最新の4つのトップAIモデル**を選択・比較できます。

### サポートされているモデル

| モデル | 提供元 | 速度 | 品質 | 特徴 |
|--------|--------|------|------|------|
| **FLUX.2 Max** 👑 | Black Forest Labs | 中速 | 最高 | 最高性能、Web文脈対応 |
| **Riverflow V2 Max** 🌊 | Sourceful | 中速 | 最高 | #1画像編集、商用向け高精度 |
| **Gemini 3 Pro Image** 🔷 | Google | 高速 | 高 | 会話型編集、4K対応 |
| **GPT-5 Image** 🎨 | OpenAI | 高速 | 高 | 最新、マルチステップ生成 |

### モデルの詳細

#### 1. FLUX.2 Max（デフォルト）
- **Black Forest Labs**の最新フラッグシップモデル
- 32Bパラメータ、Mistral-3ベース
- 物理法則理解、JSON/HEXカラー対応
- 4MP解像度対応
- **OpenRouter ID:** `black-forest-labs/flux.2-max`

#### 2. Riverflow V2 Max
- **Sourceful**の統合型モデル
- Artificial Analysis 画像編集ランキング #1
- 商用作品向け高精度制御
- 光の反射・テクスチャ精度が特徴
- **OpenRouter ID:** `sourceful/riverflow-v2-max-preview`
- **価格:** $0.075/画像

#### 3. Gemini 3 Pro Image
- **Google**の会話型画像生成モデル
- マルチターン編集対応
- 2K/4K出力対応
- ストーリーテリングに強い
- **OpenRouter ID:** `google/gemini-3-pro-image-preview`

#### 4. GPT-5 Image
- **OpenAI**の最新画像生成モデル
- マルチステップ生成フロー対応
- 高速生成（前世代の4倍）
- テキストレンダリング精度向上
- **OpenRouter ID:** `openai/gpt-5-image`

## ⚙️ セットアップ

### OpenRouter API キー（必須）

全てのモデルはOpenRouter経由でアクセスします。

1. [OpenRouter](https://openrouter.ai/) でアカウント作成
2. [API Keys](https://openrouter.ai/keys) でキーを生成
3. `.env` または `.env.local` に追加：

```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### サーバーを再起動

環境変数を変更したら、開発サーバーを再起動：

```bash
npm run dev
```

## 🧪 使用例

### 基本的な使い方

1. ブラウザで `http://localhost:3000?debug=true` を開く
2. デバッグパネルが右下に表示されることを確認
3. 通常通り写真を撮影
4. プレビュー画面で4つのAIモデルから選択
5. 「合成する！」をクリック
6. デバッグパネルで処理状況をリアルタイム確認

### モデル比較テスト

```
1. Lovotを撮影
2. FLUX.2 Maxで合成 → 結果を保存
3. 「もう一度作る」→ 同じLovotを撮影
4. Riverflow V2 Maxを選択して合成 → 結果を保存
5. Gemini 3 Proでも試す
6. 3つの結果を比較して最適なモデルを選択
```

## 📋 デバッグログの例

```
✅ 写真を撮影しました
ℹ️  撮影画像の情報 { size: 524288, dimensions: { width: 1280, height: 960 } }
ℹ️  画像をリサイズ中...
✅ リサイズ完了 { size: 204800, dimensions: { width: 1024, height: 768 } }
ℹ️  APIリクエストを送信中... (モデル: flux-2-max)
✅ 画像生成完了 (14.32秒)
```

## 🔍 トラブルシューティング

### デバッグパネルが表示されない

- URLに `?debug=true` が含まれているか確認
- ブラウザのキャッシュをクリアして再読み込み
- JavaScriptエラーがないかコンソールを確認

### APIエラーが発生する

- `.env` に `OPENROUTER_API_KEY` が設定されているか確認
- APIキーが有効か確認（OpenRouterダッシュボード）
- クレジット残高を確認
- サーバーを再起動したか確認

### エラーが発生する

- デバッグパネルのログを確認
- ブラウザのコンソールを確認（F12キー）
- サーバーのログを確認

## 💡 開発者向けTips

### カスタムログの追加

`src/lib/debug.ts` を使って、独自のログを追加できます：

```typescript
import { debug } from "@/lib/debug";

debug.info("情報メッセージ", { data: "追加データ" });
debug.success("成功メッセージ");
debug.warning("警告メッセージ");
debug.error("エラーメッセージ", error);
```

### デバッグモードの判定

```typescript
if (debug.isEnabled()) {
  // デバッグモード時のみ実行される処理
}
```

## 🚀 本番環境での注意

**重要**: 本番環境でデバッグモードを使用する場合：

1. APIキーが漏洩しないよう注意
2. ユーザーにURLパラメータを公開しない
3. 必要に応じてIP制限やパスワード保護を実装
4. デバッグログに個人情報を含めない
5. OpenRouterのコスト管理に注意

## 📚 参考リソース

### モデル詳細
- [FLUX.2 - Black Forest Labs](https://bfl.ai/blog/flux-2)
- [Riverflow V2 - Sourceful](https://openrouter.ai/sourceful/riverflow-v2-max-preview)
- [Gemini 3 Pro Image - Google](https://ai.google.dev/gemini-api/docs/image-generation)
- [GPT-5 Image - OpenAI](https://openrouter.ai/openai/gpt-5-image)

### OpenRouter
- [公式ドキュメント](https://openrouter.ai/docs)
- [画像生成ガイド](https://openrouter.ai/docs/guides/overview/multimodal/image-generation)
- [モデル一覧](https://openrouter.ai/models)

---

デバッグモードを活用して、最新のAIモデルで最高品質の画像合成をお楽しみください！ 🎉
