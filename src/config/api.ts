// API プロバイダー設定

export type ApiProvider = "gemini" | "openrouter" | "flux" | "seedream" | "flux-max" | "gemini-2.5-flash";

export interface ApiConfig {
  provider: ApiProvider;
  endpoint: string;
  name: string;
  description: string;
}

export const API_CONFIGS: Record<ApiProvider, ApiConfig> = {
  gemini: {
    provider: "gemini",
    endpoint: "/api/generate-poster",
    name: "Gemini 3 Pro",
    description: "Google Gemini 3 Pro Image API（推奨）",
  },
  openrouter: {
    provider: "openrouter",
    endpoint: "/api/generate-poster-openrouter",
    name: "OpenRouter Gemini",
    description: "OpenRouter経由でGemini 3 Pro Image",
  },
  flux: {
    provider: "flux",
    endpoint: "/api/generate-poster-flux",
    name: "Flux 2 Klein",
    description: "Flux 2 Klein 4B (OpenRouter) - 高速・高品質合成",
  },
  seedream: {
    provider: "seedream",
    endpoint: "/api/generate-poster-seedream",
    name: "Seedream 4.5",
    description: "Seedream 4.5 (OpenRouter) - 超高品質・最新モデル",
  },
  "flux-max": {
    provider: "flux-max",
    endpoint: "/api/generate-poster-flux-max",
    name: "Flux 2 Max",
    description: "Flux 2 Max (OpenRouter) - Fluxシリーズ最高峰モデル",
  },
  "gemini-2.5-flash": {
    provider: "gemini-2.5-flash",
    endpoint: "/api/generate-poster-gemini-2.5-flash",
    name: "Gemini 2.5 Flash Image",
    description: "Gemini 2.5 Flash Image (OpenRouter) - 次世代高速編集モデル",
  },
};

// =============================================
// ここで使用するAPIを手動で切り替えてください
// =============================================
export const CURRENT_API_PROVIDER: ApiProvider = "openrouter";
// "gemini", "openrouter", "flux", "seedream", "flux-max", "gemini-2.5-flash" を設定

// 現在の設定を取得
export function getCurrentApiConfig(): ApiConfig {
  return API_CONFIGS[CURRENT_API_PROVIDER];
}

// エンドポイントを取得
export function getApiEndpoint(): string {
  return getCurrentApiConfig().endpoint;
}
