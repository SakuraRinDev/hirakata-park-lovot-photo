import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

export async function POST(request: NextRequest) {
  try {
    const { imageData, filename } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: "画像データがありません" },
        { status: 400 }
      );
    }

    // 保存先ディレクトリ
    const saveDir = path.join(process.cwd(), "public", "generated-images");

    // ディレクトリがなければ作成
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    // ファイル名を生成（指定があればそれを使用）
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const finalFilename = filename || `lovot_${timestamp}.png`;
    const filePath = path.join(saveDir, finalFilename);

    // Base64をバッファに変換して保存
    const buffer = Buffer.from(imageData, "base64");
    fs.writeFileSync(filePath, buffer);

    console.log(`Image saved: ${filePath}`);

    return NextResponse.json({
      success: true,
      filename: finalFilename,
      path: `/generated-images/${finalFilename}`,
    });
  } catch (error) {
    console.error("Save image error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";

    return NextResponse.json(
      { error: `画像保存に失敗しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
