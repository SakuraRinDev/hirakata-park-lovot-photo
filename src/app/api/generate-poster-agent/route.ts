import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

// Gemini クライアント初期化
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ベース画像キャッシュ
let baseImageCache: string | null = null;

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

    // リクエストボディ取得（生成済みのLOVOT画像を受け取る）
    const { generatedLovotImageBase64 } = await request.json();

    if (!generatedLovotImageBase64) {
      return NextResponse.json(
        { error: "生成済みLovot画像が提供されていません" },
        { status: 400 }
      );
    }

    // ベース画像取得
    const baseImageBase64 = getBaseImage();

    // Gemini 3 Pro Image 用プロンプト（シンプルな合成指示）
    const prompt = `あなたは画像編集AIです。以下のタスクを実行してください。

【タスク】
1枚目の画像（ポスター画像）の中央にいる点線で描かれたLOVOTを、2枚目の画像のLOVOTに置き換えてください。

【重要な指示】
- 1枚目のポスター画像のレイアウト、テキスト、背景、周りのキャラクターはすべてそのまま維持してください
- 中央の点線LOVOTの位置に、2枚目のLOVOTをそのまま配置してください
- 2枚目のLOVOTの見た目（ポーズ、服、色、目）は一切変更しないでください
- サイズは元の点線LOVOTと同じくらいに調整してください
- 高品質で鮮明な画像を生成してください`;

    // Gemini API 呼び出し（2枚の画像を送信）
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
          data: generatedLovotImageBase64,
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
      { error: `ポスター合成に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
