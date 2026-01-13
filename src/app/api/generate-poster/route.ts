import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

// Gemini クライアント初期化
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY が設定されていません" },
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

    // Gemini 3 Pro Image 用プロンプト
    const prompt = 
    `あなたは画像編集AIです。以下のタスクを実行してください。

【タスク】
1枚目の画像（ポスター画像）の中央にいる点線のLOVOTを、新しいLOVOTに置き換えた画像を生成してください。

【新しいLOVOTの作り方】
2枚目の画像（ポーズ参照画像）と3枚目の画像（ユーザーのLOVOT）を組み合わせます：

★2枚目の画像から取るもの：
  - ポーズ（右手でハートを持つポーズ、体の向き、腕の角度など）
  - 服のデザイン（色、文字「ひらパー」、ロゴ、絵柄、模様を正確に再現）

★3枚目の画像から取るもの：
  - 体の色、顔の色、服の色、目の色、鼻の色、など全ての色
  - デザイン（色、形、模様）

【重要な指示】
- 1枚目のポスター画像のレイアウト、テキスト、背景、周りのキャラクターはすべてそのまま維持してください
- 中央のLOVOTだけを置き換えてください
- 服に印刷されている「ひらパー」のテキストは2枚目の画像と完全に同じものを描いてください
- 新しいLOVOTのサイズと位置は元のLOVOTと同じにしてください
- 高品質で鮮明な画像を生成してください`;

    // Gemini API 呼び出し（3枚の画像を送信）
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: "image/png",
          data: baseImageBase64,
        },
      },
      {
        inlineData: {
          mimeType: "image/png",
          data: poseImageBase64,
        },
      },
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: lovotImageBase64,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: contents,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "16:9" },
      } as any,
    });

    // レスポンスから画像を抽出
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: "画像生成に失敗しました" },
        { status: 500 }
      );
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "画像データが取得できませんでした" },
        { status: 500 }
      );
    }

    for (const part of parts) {
      if (part.inlineData) {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        return NextResponse.json({
          success: true,
          imageData: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
          model: "gemini-3-pro",
          duration: parseFloat(duration),
        });
      }
    }

    return NextResponse.json(
      { error: "生成された画像が見つかりません" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Gemini API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";

    return NextResponse.json(
      { error: `画像生成に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
