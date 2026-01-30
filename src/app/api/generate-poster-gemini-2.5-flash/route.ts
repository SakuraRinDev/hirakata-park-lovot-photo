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

        // Gemini 2.5 Flash Image 用のプロンプト
        const prompt =
            `あなたは最先端の画像編集AIです。以下の指示に従って、最高品質の合成画像を生成してください。

【合成の指示】
1枚目の画像（背景ポスター）の中央に描かれた、点線のLOVOTシルエットを新しいLOVOTに置き換えてください。

【新しいLOVOTの構成】
1. ポーズ：2枚目の画像（ポーズ参照画像）に示された「ハートを胸に抱えるポーズ」を忠実に再現してください。
2. 特徴：3枚目の画像（ユーザーのLOVOT）から、体の色、顔の色、服のデザイン、目の色、鼻パーツの形状まで、すべてを正確に引き継いでください。

【制約事項】
- 背景画像（1枚目）の他のLOVOTや背景デザイン、ひらかたパークのロゴなどの要素は一切変えないでください。
- 合成されたLOVOTが、ポスターの雰囲気に馴染むように、周囲のライティングや影の表現を調整してください。
- 最終的な出力は、鮮明で非常に高品質な1枚の画像として生成してください。`;

        // OpenRouter API 呼び出し
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
                "X-Title": "HirakataPark LOVOT Photo Gemini Flash",
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash-image",
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
                modalities: ["image"],
                image_config: {
                    aspect_ratio: "16:9",
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Gemini Flash API error:", errorData);
            return NextResponse.json(
                { error: `Gemini Flash API エラー: ${errorData.error?.message || response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // レスポンスから画像を抽出
        const message = data.choices?.[0]?.message;

        if (!message) {
            return NextResponse.json(
                { error: "画像生成に失敗しました (No message received)" },
                { status: 500 }
            );
        }

        let imageData: string | undefined;
        let mimeType = "image/png";

        // OpenRouter の標準的な画像レスポンス抽出
        if (message.images && Array.isArray(message.images) && message.images.length > 0) {
            const imageUrl = message.images[0]?.image_url?.url;
            if (imageUrl?.startsWith("data:image")) {
                const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                    mimeType = matches[1];
                    imageData = matches[2];
                }
            }
        } else if (message.content) {
            const content = message.content;
            if (typeof content === "string" && content.startsWith("data:image")) {
                const matches = content.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                    mimeType = matches[1];
                    imageData = matches[2];
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
                        }
                    }
                }
            }
        }

        if (!imageData) {
            return NextResponse.json(
                { error: "生成された画像データが見つかりませんでした" },
                { status: 500 }
            );
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        return NextResponse.json({
            success: true,
            imageData: imageData,
            mimeType,
            model: "google/gemini-2.5-flash-image",
            duration: parseFloat(duration),
        });
    } catch (error) {
        console.error("Gemini Flash API unexpected error:", error);
        const errorMessage = error instanceof Error ? error.message : "不明なエラー";
        return NextResponse.json(
            { error: `画像生成中に予期せぬエラーが発生しました: ${errorMessage}` },
            { status: 500 }
        );
    }
}
