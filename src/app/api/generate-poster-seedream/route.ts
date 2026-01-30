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

        // Seedream 4.5 用のプロンプト
        const prompt =
            `あなたは世界最高峰の画像合成AIです。以下の指示に従って、非常に自然で魅力的なポスター画像を生成してください。

【合成の指示】
1枚目の画像（背景ポスター）の中央にある、点線で描かれたLOVOTのシルエットを、新しいLOVOTに置き換えてください。

【新しいLOVOTの構成要素】
1. ポーズ：2枚目の画像（ポーズ参照画像）に示された「ハートを大切に抱えるポーズ」を完璧に再現してください。体の傾きや手の位置、視線などもこの画像に準拠します。
2. 外見：3枚目の画像（ユーザーのLOVOT）から、すべてのビジュアル特徴（体の色、顔の色、服の質感とデザイン、目や鼻の色と形状）を正確に抽出して適用してください。

【クリエイティブガイドライン】
- 1枚目の背景画像に含まれる他のキャラクター（LOVOTたち）、テキスト、ひらかたパークのロゴ、背景要素はすべて改変せず、そのまま維持してください。
- 新しく合成されたLOVOTが、あたかもその場所で撮影されたかのように、周囲と調和したライティング（光の当たり方）と影（接地部分など）を表現してください。
- 最終的な出力は、プロ仕様のデジタル写真のような鮮明さと美しさを備えている必要があります。`;

        // OpenRouter API 呼び出し
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
                "X-Title": "HirakataPark LOVOT Photo Seedream",
            },
            body: JSON.stringify({
                model: "bytedance-seed/seedream-4.5",
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
            console.error("Seedream API error:", errorData);
            return NextResponse.json(
                { error: `Seedream API エラー: ${errorData.error?.message || response.statusText}` },
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

        // 画像抽出ロジック
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
            model: "bytedance-seed/seedream-4.5",
            duration: parseFloat(duration),
        });
    } catch (error) {
        console.error("Seedream API unexpected error:", error);
        const errorMessage = error instanceof Error ? error.message : "不明なエラー";
        return NextResponse.json(
            { error: `画像生成中に予期せぬエラーが発生しました: ${errorMessage}` },
            { status: 500 }
        );
    }
}
