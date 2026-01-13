// =====================================
// LEGACY CODE - OpenRouter API 関連
// 現在は使用していません
// =====================================

import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

// サポートされているモデル（2026年最新版 - 厳選5モデル）
export type AIModel =
  | "flux-2-max"
  | "riverflow-v2-max"
  | "gemini-3-pro"
  | "gpt-5-image"
  | "seedream-4.5";

interface GenerateRequest {
  lovotImageBase64: string;
  model?: AIModel;
}

// ベース画像キャッシュ
let baseImageCache: string | null = null;

function getBaseImage(): string {
  if (baseImageCache) return baseImageCache;

  try {
    const imagePath = path.join(process.cwd(), "public", "base-image.jpg");
    const imageData = fs.readFileSync(imagePath);
    baseImageCache = imageData.toString("base64");
    return baseImageCache;
  } catch (error) {
    console.error("Base image not found:", error);
    throw new Error("ベース画像が見つかりません");
  }
}

// Gemini API呼び出し
async function generateWithGemini(
  baseImage: string,
  lovotImage: string
): Promise<string> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const prompt = `
  # LOVOT Hirakata Park Poster Maker (Strict Masking & Texture Mapping) v4.0
metadata:
  name: "LOVOTひらパーポスターメーカー SEASON 2（ポーズ凍結・部位別マッピング版）v4.0"
  description: "元ポスターの幾何学的構造（ポーズ・輪郭）を完全に凍結し、ユーザー入力LOVOTの『顔・体・服』のテクスチャを、対応する領域に精密にマッピング"

input_contract:
  required_inputs:
    - "user_lovot_image: 外見テクスチャのソース。ここから『顔の色』『体の色』『服』『目』の情報を部位ごとに抽出する。"
  knowledge_assets:
    - base-image.jpg: 形状と構図のマスターデータ。この画像の『中央LOVOTのシルエット（マスク）』は変更禁止領域とする。"

output_spec:
  aspect_ratio: "16:9"
  must:
    - "全体のレイアウト、背景、ロゴ、他キャラクターはbase-image.jpgとピクセル単位で一致させる（変更不可）。"
    - "中央LOVOTのポーズ（斜めの角度、手足の位置、サイズ）はbase-image.jpgの輪郭線から逸脱しない。"
    - "中央LOVOTの色分け（顔の色 vs 体の色）は、user_lovot_imageの配色を正確に再現する。"
  must_not:
    - "LOVOTのポーズや角度を変える（直立化、サイズ変更は厳禁）。"
    - "ユーザー画像の色分けを間違える（例：顔の色を体と同じにする等の混同）。"

# ★戦略変更：生成ではなく「領域ごとの塗り替え」を行う
editing_strategy_policy:
  mode: "Region-Based Texture Swapping (部位別テクスチャ置換)"

  # 1. 形状の固定（ポーズロック）
  geometry_lock:
    reference: "base-image.jpg"
    instruction: "元画像の中央LOVOTの『輪郭（シルエット）』を固定マスクとして扱う。このマスクの外側にはみ出したり、内側が欠けたりしてはならない。ポーズの変更は物理的に不可能とする。"

  # 2. 外見の抽出と適用（アナトミー・マッピング）
  appearance_mapping:
    source: "user_lovot_image"
    target_regions:
      - region: "Face (顔)"
        action: "ユーザー画像の『顔の肌色・質感』を抽出し、元画像の顔エリアに適用。"
      - region: "Body/Base (胴体・頭部)"
        action: "ユーザー画像の『ベースの体色（茶色/こげ茶等）』を抽出し、元画像の胴体・頭部エリアに適用。顔の色と混同しないこと。"
      - region: "Eyes (目)"
        action: "ユーザー画像の『目の色・デザイン』を適用。"
      - region: "Clothes/Accessories (服・装飾)"
        action: "ユーザー画像の衣装を、元画像の体の曲面に合わせてラッピング（変形貼り付け）する。"

system_instructions: |
  あなたは、既存のポスター画像を「編集」して、主役のLOVOTだけを差し替える高度な画像処理AIです。
  新規生成ではなく、既存画像の特定エリアの「塗り替え」を行います。

  以下の手順を厳密に実行してください。

  Phase 1: 領域固定（マスク作成）
  1. base-image.jpg（元ポスター）を読み込む。
  2. 背景、ロゴ、周囲のキャラクター、右手の赤いハートを「保護領域」としてロックする。これらは1ピクセルも変更してはならない。
  3. 中央のLOVOTの「輪郭」を特定し、これを「描画許可領域」とする。この輪郭の形状（斜めの傾き、ポーズ）は絶対に変更しない。

  Phase 2: 素材分析（ユーザー画像の解剖）
  1. user_lovot_image を分析し、以下の「部位ごとの色情報」を正確に分離する。
      - 【A: 顔の色】（例：薄い肌色、茶色など）
      - 【B: 体の色】（例：こげ茶、黒、ベージュなど）
      - 【C: 服・アクセ】
  2. ここで「顔」と「体」の色が異なる場合、そのコントラストを強く認識する。

  Phase 3: テクスチャマッピング（差し替え実行）
  1. Phase 1で固定した「描画許可領域（元画像のポーズ）」の中に、Phase 2で抽出した素材を流し込む。
  2. 【重要】マッピング規則：
      - 元画像の「顔」の位置には、【A: 顔の色】を塗る。
      - 元画像の「体」の位置には、【B: 体の色】を塗る。
      - 元画像の「服」の位置には、【C: 服・アクセ】を変形して合わせる。
  3. ユーザーのLOVOTが着ている服のデザインを、元画像のLOVOTの体の傾き（斜め）に合わせて自然に合成する。

  Phase 4: 16:9 アウトペイント
  1. 編集後の画像を、左右に拡張して16:9のアスペクト比にする。
  2. 拡張部分は空や背景の続きを描き足し、違和感をなくす。

  Phase 5: 最終確認（QC）
  - ポーズは元画像の通り「斜め」か？（直立していないか？）
  - 顔の色と体の色は、ユーザー画像の通り正しく分かれているか？
  - 元画像の背景やロゴが崩れていないか？

constraints:
  - "ポーズ・形状は base-image.jpgに完全準拠"
  - "配色は user_lovot_image に完全準拠"
  - "顔と体の色の違いを正確に表現すること"`;

  const contents = [
    { text: prompt },
    { inlineData: { mimeType: "image/jpeg", data: baseImage } },
    { inlineData: { mimeType: "image/jpeg", data: lovotImage } },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: contents,
    config: { responseModalities: ["IMAGE"] },
  });

  const parts = response.candidates?.[0]?.content?.parts;
  if (!parts) throw new Error("画像データが取得できませんでした");

  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  throw new Error("生成された画像が見つかりません");
}

// OpenRouter API呼び出し（画像生成モデル用）
async function generateWithOpenRouter(
  baseImage: string,
  lovotImage: string,
  model: AIModel
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY が設定されていません");
  }

  // モデルIDのマッピング（2026年最新版）
  const modelMap: Record<string, string> = {
    "flux-2-max": "black-forest-labs/flux.2-max",
    "riverflow-v2-max": "sourceful/riverflow-v2-max-preview",
    "gemini-3-pro": "google/gemini-3-pro-image-preview",
    "gpt-5-image": "openai/gpt-5-image",
    "seedream-4.5": "bytedance-seed/seedream-4.5",
  };

  const modelId = modelMap[model] || modelMap["flux-2-max"];

  const prompt = ` # LOVOT Hirakata Park Poster Maker (Strict Masking & Texture Mapping) v4.0
metadata:
  name: "LOVOTひらパーポスターメーカー SEASON 2（ポーズ凍結・部位別マッピング版）v4.0"
  description: "元ポスターの幾何学的構造（ポーズ・輪郭）を完全に凍結し、ユーザー入力LOVOTの『顔・体・服』のテクスチャを、対応する領域に精密にマッピングする画像編集Gem。"
  version: "4.0.0"

input_contract:
  required_inputs:
    - "user_lovot_image: 外見テクスチャのソース。ここから『顔の色』『体の色』『服』『目』の情報を部位ごとに抽出する。"
  knowledge_assets:
    - base-image.jpg: 形状と構図のマスターデータ。この画像の『中央LOVOTのシルエット（マスク）』は変更禁止領域とする。"

output_spec:
  aspect_ratio: "16:9"
  must:
    - "全体のレイアウト、背景、ロゴ、他キャラクターはbase-image.jpgとピクセル単位で一致させる（変更不可）。"
    - "中央LOVOTのポーズ（斜めの角度、手足の位置、サイズ）はbase-image.jpgの輪郭線から逸脱しない。"
    - "中央LOVOTの色分け（顔の色 vs 体の色）は、user_lovot_imageの配色を正確に再現する。"
  must_not:
    - "LOVOTのポーズや角度を変える（直立化、サイズ変更は厳禁）。"
    - "ユーザー画像の色分けを間違える（例：顔の色を体と同じにする等の混同）。"

# ★戦略変更：生成ではなく「領域ごとの塗り替え」を行う
editing_strategy_policy:
  mode: "Region-Based Texture Swapping (部位別テクスチャ置換)"

  # 1. 形状の固定（ポーズロック）
  geometry_lock:
    reference: "base-image.jpg"
    instruction: "元画像の中央LOVOTの『輪郭（シルエット）』を固定マスクとして扱う。このマスクの外側にはみ出したり、内側が欠けたりしてはならない。ポーズの変更は物理的に不可能とする。"

  # 2. 外見の抽出と適用（アナトミー・マッピング）
  appearance_mapping:
    source: "user_lovot_image"
    target_regions:
      - region: "Face (顔)"
        action: "ユーザー画像の『顔の肌色・質感』を抽出し、元画像の顔エリアに適用。"
      - region: "Body/Base (胴体・頭部)"
        action: "ユーザー画像の『ベースの体色（茶色/こげ茶等）』を抽出し、元画像の胴体・頭部エリアに適用。顔の色と混同しないこと。"
      - region: "Eyes (目)"
        action: "ユーザー画像の『目の色・デザイン』を適用。"
      - region: "Clothes/Accessories (服・装飾)"
        action: "ユーザー画像の衣装を、元画像の体の曲面に合わせてラッピング（変形貼り付け）する。"

system_instructions: |
  あなたは、既存のポスター画像を「編集」して、主役のLOVOTだけを差し替える高度な画像処理AIです。
  新規生成ではなく、既存画像の特定エリアの「塗り替え」を行います。

  以下の手順を厳密に実行してください。

  Phase 1: 領域固定（マスク作成）
  1. base-image.jpg（元ポスター）を読み込む。
  2. 背景、ロゴ、周囲のキャラクター、右手の赤いハートを「保護領域」としてロックする。これらは1ピクセルも変更してはならない。
  3. 中央のLOVOTの「輪郭」を特定し、これを「描画許可領域」とする。この輪郭の形状（斜めの傾き、ポーズ）は絶対に変更しない。

  Phase 2: 素材分析（ユーザー画像の解剖）
  1. user_lovot_image を分析し、以下の「部位ごとの色情報」を正確に分離する。
      - 【A: 顔の色】（例：薄い肌色、茶色など）
      - 【B: 体の色】（例：こげ茶、黒、ベージュなど）
      - 【C: 服・アクセ】
  2. ここで「顔」と「体」の色が異なる場合、そのコントラストを強く認識する。

  Phase 3: テクスチャマッピング（差し替え実行）
  1. Phase 1で固定した「描画許可領域（元画像のポーズ）」の中に、Phase 2で抽出した素材を流し込む。
  2. 【重要】マッピング規則：
      - 元画像の「顔」の位置には、【A: 顔の色】を塗る。
      - 元画像の「体」の位置には、【B: 体の色】を塗る。
      - 元画像の「服」の位置には、【C: 服・アクセ】を変形して合わせる。
  3. ユーザーのLOVOTが着ている服のデザインを、元画像のLOVOTの体の傾き（斜め）に合わせて自然に合成する。

  Phase 4: 16:9 アウトペイント
  1. 編集後の画像を、左右に拡張して16:9のアスペクト比にする。
  2. 拡張部分は空や背景の続きを描き足し、違和感をなくす。

  Phase 5: 最終確認（QC）
  - ポーズは元画像の通り「斜め」か？（直立していないか？）
  - 顔の色と体の色は、ユーザー画像の通り正しく分かれているか？
  - 元画像の背景やロゴが崩れていないか？

constraints:
  - "ポーズ・形状は base-image.jpgに完全準拠"
  - "配色は user_lovot_image に完全準拠"
  - "顔と体の色の違いを正確に表現すること"`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Hirakata Park Lovot Photo",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      modalities: ["image", "text"],
      size: "1792x1024",
      provider: {
        sort: "throughput",
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${baseImage}` },
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${lovotImage}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let error;
    try {
      error = JSON.parse(errorText);
    } catch {
      error = { message: errorText };
    }
    console.error("OpenRouter API error:", {
      status: response.status,
      statusText: response.statusText,
      error,
      modelId,
    });
    throw new Error(
      `OpenRouter API エラー (${response.status}): ${
        error.error?.message || error.message || errorText || "不明なエラー"
      }`
    );
  }

  const data = await response.json();
  console.log("[DEBUG] OpenRouter response:", JSON.stringify(data).substring(0, 500));

  const images = data.choices?.[0]?.message?.images;
  if (images && images.length > 0) {
    const imageData = images[0]?.image_url?.url;
    if (imageData) {
      if (imageData.startsWith("data:")) {
        return imageData.replace(/^data:image\/\w+;base64,/, "");
      }
      if (imageData.startsWith("http")) {
        const imgResponse = await fetch(imageData);
        const buffer = await imgResponse.arrayBuffer();
        return Buffer.from(buffer).toString("base64");
      }
      return imageData;
    }
  }

  const content = data.choices?.[0]?.message?.content;
  if (content && typeof content === "string" && content.length > 0) {
    if (content.startsWith("http")) {
      const imgResponse = await fetch(content);
      const buffer = await imgResponse.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    }
    if (content.startsWith("data:")) {
      return content.replace(/^data:image\/\w+;base64,/, "");
    }
  }

  console.error("[DEBUG] Full response:", JSON.stringify(data, null, 2));
  throw new Error(`画像データが取得できませんでした。Response: ${JSON.stringify(data).substring(0, 300)}`);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { lovotImageBase64, model = "flux-2-max" } = (await request.json()) as GenerateRequest;

    console.log(`[DEBUG] Model selected: ${model}`);
    console.log(`[DEBUG] Request received at ${new Date().toISOString()}`);

    if (!lovotImageBase64) {
      return NextResponse.json(
        { error: "Lovot画像が提供されていません" },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY が設定されていません" },
        { status: 500 }
      );
    }

    const baseImageBase64 = getBaseImage();
    console.log(`[DEBUG] Base image loaded (${baseImageBase64.length} bytes)`);

    let imageData: string;

    if (model === "gemini-3-pro") {
      console.log(`[DEBUG] Calling Gemini API directly...`);
      if (!process.env.GEMINI_API_KEY) {
        return NextResponse.json(
          { error: "GEMINI_API_KEY が設定されていません" },
          { status: 500 }
        );
      }
      imageData = await generateWithGemini(baseImageBase64, lovotImageBase64);
    } else {
      console.log(`[DEBUG] Calling OpenRouter API with model: ${model}...`);
      imageData = await generateWithOpenRouter(baseImageBase64, lovotImageBase64, model);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`[DEBUG] Generation completed in ${duration}s`);

    return NextResponse.json({
      success: true,
      imageData,
      mimeType: "image/png",
      model,
      duration: parseFloat(duration),
    });
  } catch (error) {
    console.error("Generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";

    return NextResponse.json(
      { error: `画像生成に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
