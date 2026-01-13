"use client";

export type AIModel =
  | "flux-2-max"
  | "riverflow-v2-max"
  | "gemini-3-pro"
  | "gpt-5-image"
  | "seedream-4.5";

interface ModelInfo {
  id: AIModel;
  name: string;
  description: string;
  speed: "fast" | "medium" | "slow";
  quality: "ultra" | "high" | "medium";
  emoji: string;
  version?: string;
}

const models: ModelInfo[] = [
  {
    id: "flux-2-max",
    name: "FLUX.2 Max",
    description: "Black Forest Labs - 最高性能、Web文脈対応",
    speed: "medium",
    quality: "ultra",
    emoji: "👑",
    version: "2.0 Max",
  },
  {
    id: "riverflow-v2-max",
    name: "Riverflow V2 Max",
    description: "Sourceful - #1画像編集、商用向け高精度",
    speed: "medium",
    quality: "ultra",
    emoji: "🌊",
    version: "V2 Max",
  },
  {
    id: "gemini-3-pro",
    name: "Gemini 3 Pro Image",
    description: "Google直接API - 会話型編集、4K対応",
    speed: "fast",
    quality: "high",
    emoji: "🔷",
    version: "3 Pro",
  },
  {
    id: "gpt-5-image",
    name: "GPT-5 Image",
    description: "OpenAI - 最新、マルチステップ生成",
    speed: "fast",
    quality: "high",
    emoji: "🎨",
    version: "5.0",
  },
  {
    id: "seedream-4.5",
    name: "Seedream 4.5",
    description: "ByteDance - 高速生成、多言語対応",
    speed: "fast",
    quality: "high",
    emoji: "🌱",
    version: "4.5",
  },
];

interface ModelSelectorProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
}: ModelSelectorProps) {
  const handleModelChange = (model: AIModel) => {
    onModelChange(model);
  };

  const getSpeedBadge = (speed: "fast" | "medium" | "slow") => {
    const badges = {
      fast: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      slow: "bg-red-100 text-red-700",
    };
    const labels = {
      fast: "高速",
      medium: "中速",
      slow: "低速",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${badges[speed]}`}>
        {labels[speed]}
      </span>
    );
  };

  return (
    <div className="bg-white border-2 border-hirakata-primary rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🤖</span>
        <h3 className="font-bold text-gray-800">AIモデル選択</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => handleModelChange(model.id)}
            className={`p-3 rounded-lg border-2 text-left transition ${
              selectedModel === model.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{model.emoji}</span>
                  <span className="font-semibold text-sm">{model.name}</span>
                  {selectedModel === model.id && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-2">{model.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {getSpeedBadge(model.speed)}
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    model.quality === "ultra"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
                      : model.quality === "high"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {model.quality === "ultra" ? "最高品質" : model.quality === "high" ? "高品質" : "中品質"}
                  </span>
                  {model.version && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                      v{model.version}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
        💡 ヒント: 各モデルで同じ画像を試して、結果を比較できます
      </div>
    </div>
  );
}
