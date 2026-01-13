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

    // リクエストボディ取得
    const { lovotImageBase64 } = await request.json();

    if (!lovotImageBase64) {
      return NextResponse.json(
        { error: "Lovot画像が提供されていません" },
        { status: 400 }
      );
    }

    // ベース画像取得
    const baseImageBase64 = getBaseImage();

    // ユーザーのLOVOTデザインを優先するプロンプト
    const prompt = `あなたは画像編集AIです。以下のタスクを実行してください。

【タスク】
1枚目の画像（ポスター画像）の中央にいる点線で描かれたLOVOTを、2枚目の画像のLOVOTで置き換えてください。

【絶対に守ること】
- 1枚目のポスター画像のレイアウト、テキスト、背景、周りのキャラクター、装飾はすべて完全にそのまま維持
- ポスターのデザインは一切変更しない

【LOVOTの描き方 - 優先度順】
1. ユーザーのLOVOTのデザインを最優先で保持：
   - 体の色、顔の色、目のデザイン、目の色
   - ツノ、アクセサリー、羽織、帽子、マフラーなど全ての装飾品
   - 服の色やデザインの雰囲気

2. ポーズは点線のLOVOTに寄せる：
   - 右手でハートを持つポーズを参考にする
   - ただしユーザーのLOVOTの装飾品が邪魔になる場合は、装飾品を優先

3. 服に「ひらパー」のテキストを追加：
   - 服のどこかに「ひらパー」と入れる

【まとめ】
ユーザーのLOVOTの見た目（色、装飾品）を最大限活かしつつ、ハートを持たせて、服にひらパーと書いて、ポスターの中央に配置してください。`;

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
