#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(projectRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env"));

function parseArgs(argv) {
  const args = { _: [] };
  const shortMap = {
    "-i": "input",
    "-o": "output",
    "-b": "base",
    "-s": "pose",
    "-p": "provider",
    "-m": "model",
    "-h": "help",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    if (current.startsWith("--")) {
      const key = current.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("-")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else if (shortMap[current]) {
      const key = shortMap[current];
      const next = argv[i + 1];
      if (!next || next.startsWith("-")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(current);
    }
  }

  return args;
}

function printUsage() {
  const usage = `\nUsage:\n  npm run cli:generate -- --input <lovot.jpg> [options]\n\nOptions:\n  --input,  -i   Lovot image path (required)\n  --output, -o   Output file path or directory\n  --provider,-p  gemini | openrouter (default: gemini)\n  --model,  -m   Model name (optional)\n  --base,   -b   Base poster image path (default: public/base-image.png)\n  --pose,   -s   Pose reference image path (default: public/pose.png)\n  --site-url     OpenRouter referer URL (optional)\n  --help,   -h   Show this help\n\nExamples:\n  npm run cli:generate -- --input ./public/sample-lovot.png\n  npm run cli:generate -- --input ./public/sample-lovot.png --output ./public/generated-images\n  npm run cli:generate -- --input ./public/sample-lovot.png --provider openrouter\n`;
  console.log(usage);
}

function ensureFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function getExtensionFromMime(mimeType) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/png":
    default:
      return "png";
  }
}

function resolveOutputPath(outputArg, mimeType) {
  const defaultDir = path.join(projectRoot, "public", "generated-images");
  const filename = `cli-${Date.now()}.${getExtensionFromMime(mimeType)}`;

  if (!outputArg) {
    return path.join(defaultDir, filename);
  }

  const resolved = path.resolve(process.cwd(), outputArg);
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    return path.join(resolved, filename);
  }

  return resolved;
}

const prompt = `あなたは画像編集AIです。以下のタスクを実行してください。

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

async function generateWithGemini({ baseImageBase64, poseImageBase64, lovotBase64, lovotMimeType, model }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
        mimeType: lovotMimeType,
        data: lovotBase64,
      },
    },
  ];

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "16:9" },
    },
  });

  const candidates = response.candidates || [];
  const parts = candidates[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        imageData: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "image/png",
      };
    }
  }

  throw new Error("No image returned from Gemini");
}

async function generateWithOpenRouter({ baseImageBase64, poseImageBase64, lovotBase64, lovotMimeType, model, siteUrl }) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available in this Node version");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": siteUrl,
      "X-Title": "HirakataPark LOVOT Photo CLI",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/png;base64,${baseImageBase64}` } },
            { type: "image_url", image_url: { url: `data:image/png;base64,${poseImageBase64}` } },
            { type: "image_url", image_url: { url: `data:${lovotMimeType};base64,${lovotBase64}` } },
          ],
        },
      ],
      modalities: ["image", "text"],
      image_config: { aspect_ratio: "16:9" },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || response.statusText);
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message;

  if (!message) {
    throw new Error("No message in OpenRouter response");
  }

  let imageData;
  let mimeType = "image/png";

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
    if (typeof content === "string") {
      if (content.startsWith("data:image")) {
        const matches = content.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          imageData = matches[2];
        }
      } else if (content.match(/^[A-Za-z0-9+/=]+$/)) {
        imageData = content;
      }
    } else if (Array.isArray(content)) {
      const imageContent = content.find((c) => c.type === "image" || c.type === "image_url");
      const url = imageContent?.image_url?.url || imageContent?.url;
      if (url?.startsWith("data:image")) {
        const matches = url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          imageData = matches[2];
        }
      }
    }
  }

  if (!imageData) {
    throw new Error("No image returned from OpenRouter");
  }

  return { imageData, mimeType };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const inputArg = args.input || args._[0];
  if (!inputArg) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const inputPath = path.resolve(process.cwd(), inputArg);
  const basePath = path.resolve(process.cwd(), args.base || path.join(projectRoot, "public", "base-image.png"));
  const posePath = path.resolve(process.cwd(), args.pose || path.join(projectRoot, "public", "pose.png"));
  const provider = String(args.provider || "gemini").toLowerCase();
  const model = args.model || (provider === "openrouter" ? "google/gemini-3-pro-image-preview" : "gemini-3-pro-image-preview");
  const siteUrl = args["site-url"] || process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  ensureFileExists(inputPath, "Input image");
  ensureFileExists(basePath, "Base image");
  ensureFileExists(posePath, "Pose image");

  const lovotBase64 = fs.readFileSync(inputPath).toString("base64");
  const baseImageBase64 = fs.readFileSync(basePath).toString("base64");
  const poseImageBase64 = fs.readFileSync(posePath).toString("base64");
  const lovotMimeType = getMimeType(inputPath);

  const startedAt = Date.now();
  console.log(`CLI generate started (provider=${provider}, model=${model})`);

  let result;
  if (provider === "openrouter") {
    result = await generateWithOpenRouter({
      baseImageBase64,
      poseImageBase64,
      lovotBase64,
      lovotMimeType,
      model,
      siteUrl,
    });
  } else if (provider === "gemini") {
    result = await generateWithGemini({
      baseImageBase64,
      poseImageBase64,
      lovotBase64,
      lovotMimeType,
      model,
    });
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const outputPath = resolveOutputPath(args.output, result.mimeType);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(result.imageData, "base64"));

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log(`Saved: ${outputPath}`);
  console.log(`Done in ${elapsedSec}s`);
}

main().catch((error) => {
  console.error("CLI generate failed:", error.message || error);
  process.exitCode = 1;
});
