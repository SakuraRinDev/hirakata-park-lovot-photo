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

        // Flux 2 Klein 用のプロンプト
        // Fluxはテキスト追従性が高いため、より具体的な指示を含めます
        const prompt =
            `あなたは高度な画像編集・合成AIです。以下の指示に従って、最高品質の合成画像を生成してください。

【合成の指示】
1枚目の画像（背景となるポスター）の中央に配置されている「点線のLOVOT」のシルエット部分に、新しいLOVOTを配置してください。

【新しいLOVOTの構成】
- ポーズ：2枚目の画像（ポーズ参照画像）の通り、ハートを抱えたポーズ、正面を向いた角度、腕の形を正確に再現してください。
- 外見・色：3枚目の画像（ユーザーのLOVOT）から、体の色、顔の色、服のデザイン、目の色、鼻の色などのすべての特徴を忠実に引き継いでください。

【品質要件】
- 背景画像（1枚目）の他のキャラクター、テキスト、背景デザインは一切変更しないでください。
- 新しいLOVOTが背景に自然に馴染むよう、ライティングと影を調整してください。
- 出力は鮮明で、ノイズのないフォトリアルな品質にしてください。`;

        // OpenRouter API 呼び出し
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
                "X-Title": "HirakataPark LOVOT Photo Flux",
            },
            body: JSON.stringify({
                model: "black-forest-labs/flux.2-klein-4b",
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
                // Flux 2 Klein の画像生成オプション
                // OpenRouterでの対応状況により調整が必要な場合があります
                modalities: ["image"],
                image_config: {
                    aspect_ratio: "16:9",
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Flux API error:", errorData);
            return NextResponse.json(
                { error: `Flux API エラー: ${errorData.error?.message || response.statusText}` },
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

        // OpenRouter の画像レスポンス形式
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
            // フォールバック
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
            console.log("Flux response full data:", JSON.stringify(data).substring(0, 1000));
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
            model: "black-forest-labs/flux.2-klein-4b",
            duration: parseFloat(duration),
        });
    } catch (error) {
        console.error("Flux API unexpected error:", error);
        const errorMessage = error instanceof Error ? error.message : "不明なエラー";
        return NextResponse.json(
            { error: `画像生成中に予期せぬエラーが発生しました: ${errorMessage}` },
            { status: 500 }
        );
    }
}
