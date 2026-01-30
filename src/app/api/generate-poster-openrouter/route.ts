import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

// 画像キャッシュ
let baseImageCache: string | null = null;
let poseImageCache: string | null = null;

function getBaseImage(): string {
  if (baseImageCache) return baseImageCache;

  try {
    const imagePath = path.join(process.cwd(), "public", "base-image.png");
    const imageData = fs.readFileSync(imagePath);
    baseImageCache = imageData.toString("base64");
    return baseImageCache;
  } catch (error) {
    console.error("Base image not found:", error);
    throw new Error("ベース画像が見つかりません");
  }
}

function getPoseImage(): string {
  if (poseImageCache) return poseImageCache;

  try {
    const imagePath = path.join(process.cwd(), "public", "pose.png");
    const imageData = fs.readFileSync(imagePath);
    poseImageCache = imageData.toString("base64");
    return poseImageCache;
  } catch (error) {
    console.error("Pose image not found:", error);
    throw new Error("ポーズ画像が見つかりません");
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // APIキーチェック
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY が設定されていません" },
        { status: 500 }
      );
    }

    // リクエストボディ取得
    const { lovotImageBase64 } = await request.json();

    if (!lovotImageBase64) {
      return NextResponse.json(
        { error: "Lovot画像が提供されていません" },
        { status: 400 }
      );
    }

    // 画像取得
    const baseImageBase64 = getBaseImage();
    const poseImageBase64 = getPoseImage();

    // プロンプト（Gemini版と同じ）
    const prompt =
    `あなたは画像編集AIです。以下のタスクを実行してください。

【タスク】
1枚目の画像（ポスター画像）の中央にいる点線のLOVOT（ガイド）を、新しいLOVOTに完全に置き換えた画像を生成してください。点線ガイドは一切残さないでください。

【新しいLOVOTの作り方】
2枚目の画像（ポーズ参照画像）と3枚目の画像（ユーザーのLOVOT）を組み合わせます：

★2枚目の画像から取るもの：
  - ポーズ（ハートを持つポーズ、体の向き、腕の角度など）

★3枚目の画像から取るもの：
  - 体の色、顔の色、服の色、目の色、鼻の色、など全ての色
  - デザイン（色、形、模様）

【重要な指示】
- 1枚目のポスター画像のレイアウト、テキスト、背景、周りのキャラクターはすべてそのまま維持してください
- 1枚目のポスター画像の中央のLOVOTだけを置き換えてください
- 点線の輪郭・ガイド・ハロー・切り抜き跡は完全に消し、周囲の背景となじませてください
- 新しいLOVOTのサイズと位置は元のLOVOTと同じにしてください
- 高品質で鮮明な画像を生成してください`;

    // OpenRouter API 呼び出し（OpenAI互換形式）
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": "HirakataPark LOVOT Photo",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${baseImageBase64}`,
                },
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${poseImageBase64}`,
                },
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${lovotImageBase64}`,
                },
              },
            ],
          },
        ],
        // 画像生成用のパラメータ（modalitiesで画像出力を指定）
        modalities: ["image", "text"],
        // アスペクト比を16:9に固定（Gemini APIと同じ）
        image_config: {
          aspect_ratio: "16:9",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json(
        { error: `OpenRouter API エラー: ${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log("OpenRouter response:", JSON.stringify(data, null, 2).substring(0, 500));

    // レスポンスから画像を抽出
    const message = data.choices?.[0]?.message;

    if (!message) {
      return NextResponse.json(
        { error: "画像生成に失敗しました" },
        { status: 500 }
      );
    }

    // OpenRouterの画像レスポンス形式を処理
    // 画像は message.images フィールドで返される
    let imageData: string;
    let mimeType = "image/png";

    // 新しい形式: message.images から取得
    if (message.images && Array.isArray(message.images) && message.images.length > 0) {
      const imageUrl = message.images[0]?.image_url?.url;
      if (imageUrl?.startsWith("data:image")) {
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          imageData = matches[2];
        } else {
          return NextResponse.json(
            { error: "画像データの形式が不正です" },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "画像URLの形式が不正です" },
          { status: 500 }
        );
      }
    }
    // フォールバック: message.content から取得（旧形式対応）
    else if (message.content) {
      const content = message.content;

      if (typeof content === "string") {
        if (content.startsWith("data:image")) {
          const matches = content.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            imageData = matches[2];
          } else {
            return NextResponse.json(
              { error: "画像データの形式が不正です" },
              { status: 500 }
            );
          }
        } else if (content.match(/^[A-Za-z0-9+/=]+$/)) {
          imageData = content;
        } else {
          console.log("OpenRouter response (text):", content.substring(0, 200));
          return NextResponse.json(
            { error: "テキストレスポンスが返されました。画像生成に失敗した可能性があります。" },
            { status: 400 }
          );
        }
      } else if (Array.isArray(content)) {
        const imageContent = content.find((c: any) => c.type === "image" || c.type === "image_url");
        if (imageContent) {
          const url = imageContent.image_url?.url || imageContent.url;
          if (url?.startsWith("data:image")) {
            const matches = url.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              mimeType = matches[1];
              imageData = matches[2];
            } else {
              return NextResponse.json(
                { error: "画像データの形式が不正です" },
                { status: 500 }
              );
            }
          } else {
            return NextResponse.json(
              { error: "画像URLの形式が不正です" },
              { status: 500 }
            );
          }
        } else {
          return NextResponse.json(
            { error: "生成された画像が見つかりません" },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "予期しないレスポンス形式です" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "レスポンスに画像が含まれていません" },
        { status: 500 }
      );
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      imageData: imageData!,
      mimeType,
      model: "openrouter/gemini-3-pro-image",
      duration: parseFloat(duration),
    });
  } catch (error) {
    console.error("OpenRouter API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";

    return NextResponse.json(
      { error: `画像生成に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
